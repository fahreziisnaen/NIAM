from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Optional
import os
import pyotp
import qrcode
import io
import base64

from app.db.session import get_db
from app.core.security import verify_password, create_access_token, get_password_hash
from app.models.user import User, Role, UserRole, AuditLog, Notification
from app.schemas.user import (
    UserLogin, Token, UserOut, UserCreate, UserUpdate, ProfileUpdate,
    TwoFactorSetupResponse, TwoFactorVerifyRequest
)
from app.api.deps import get_current_user, require_role

router = APIRouter(prefix="/auth", tags=["Authentication & Users"])

def format_user_out(user: User) -> UserOut:
    roles = [ur.role.name for ur in user.roles if ur and ur.role and ur.role.name]
    return UserOut(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        title=user.title,
        department=user.department,
        phone=user.phone,
        is_active=user.is_active,
        is_superuser=user.is_superuser,
        is_two_factor_enabled=bool(user.is_two_factor_enabled),
        created_at=user.created_at,
        roles=roles
    )

@router.get("/system-config")
def get_system_auth_config():
    show_demo = os.getenv("SHOW_DEMO_CREDENTIALS", "true").lower() in ["true", "1", "yes"]
    app_env = os.getenv("APP_ENV", "demo").lower()
    return {
        "show_demo_credentials": show_demo and app_env != "production",
        "app_env": app_env
    }

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    # Support login with either username or email (case-insensitive)
    query_identity = login_data.username.strip().lower()
    user = db.query(User).filter(
        or_(
            func.lower(User.username) == query_identity,
            func.lower(User.email) == query_identity
        )
    ).first()

    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is deactivated")

    user_out = format_user_out(user)

    # Check 2FA requirement
    if user.is_two_factor_enabled:
        if not login_data.two_factor_code or not login_data.two_factor_code.strip():
            return Token(
                access_token=None,
                token_type="bearer",
                requires_2fa=True,
                message="Google Authenticator 2FA verification code required",
                user=user_out
            )
        
        # Verify 2FA code
        totp = pyotp.TOTP(user.two_factor_secret)
        if not totp.verify(login_data.two_factor_code.strip(), valid_window=1):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Google Authenticator code. Please check the 6-digit code on your app and try again."
            )

    # Log successful login (fail-safe so audit log write cannot block authentication)
    try:
        audit = AuditLog(
            user_id=user.id,
            user_email=user.email or user.username,
            action="LOGIN",
            entity_type="USER",
            entity_id=str(user.id),
            details=f"User {user.username} authenticated successfully (2FA: {'Active' if user.is_two_factor_enabled else 'Disabled'})",
            ip_address="127.0.0.1"
        )
        db.add(audit)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[Warning] Could not persist login audit log: {e}")

    token = create_access_token(subject=user.id)
    return Token(
        access_token=token,
        token_type="bearer",
        requires_2fa=False,
        message="Login successful",
        user=user_out
    )

@router.get("/me", response_model=UserOut)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return format_user_out(current_user)

@router.get("/users", response_model=List[UserOut])
def get_all_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    users = db.query(User).all()
    return [format_user_out(u) for u in users]

@router.post("/users", response_model=UserOut)
def create_new_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN"]))
):
    # Validate unique username
    existing_username = db.query(User).filter(func.lower(User.username) == user_in.username.strip().lower()).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="User with this username already exists")
    
    # If email is provided, validate unique email (email is optional)
    clean_email = user_in.email.strip() if user_in.email and user_in.email.strip() else None
    if clean_email:
        existing_email = db.query(User).filter(func.lower(User.email) == clean_email.lower()).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="User with this email already exists")

    user = User(
        username=user_in.username.strip(),
        email=clean_email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        title=user_in.title,
        department=user_in.department or "IT Infrastructure",
        phone=user_in.phone,
        is_active=user_in.is_active,
        is_superuser=user_in.is_superuser,
        is_two_factor_enabled=False
    )
    db.add(user)
    db.flush()

    role = db.query(Role).filter_by(name=user_in.role_name).first()
    if role:
        db.add(UserRole(user_id=user.id, role_id=role.id))
    
    audit = AuditLog(
        user_id=current_user.id if current_user else None,
        user_email=current_user.email or current_user.username if current_user else "System",
        action="CREATE",
        entity_type="USER",
        entity_id=str(user.id),
        details=f"Provisioned new user account: {user.username} (Role: {user_in.role_name})",
        ip_address="127.0.0.1"
    )
    db.add(audit)
    db.commit()
    db.refresh(user)

    return format_user_out(user)

@router.put("/me", response_model=UserOut)
def update_own_profile(
    profile_in: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required to update profile")

    if profile_in.full_name is not None and profile_in.full_name.strip():
        current_user.full_name = profile_in.full_name.strip()

    if profile_in.email is not None:
        clean_email = profile_in.email.strip() if profile_in.email.strip() else None
        if clean_email:
            existing = db.query(User).filter(
                func.lower(User.email) == clean_email.lower(),
                User.id != current_user.id
            ).first()
            if existing:
                raise HTTPException(status_code=400, detail="Email is already used by another account")
        current_user.email = clean_email

    if profile_in.title is not None:
        current_user.title = profile_in.title.strip() if profile_in.title.strip() else None

    if profile_in.department is not None:
        current_user.department = profile_in.department.strip() if profile_in.department.strip() else None

    if profile_in.phone is not None:
        current_user.phone = profile_in.phone.strip() if profile_in.phone.strip() else None

    # Handle password change
    if profile_in.new_password and profile_in.new_password.strip():
        if not profile_in.current_password:
            raise HTTPException(status_code=400, detail="Current password is required to change password")
        if not verify_password(profile_in.current_password, current_user.hashed_password):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        if len(profile_in.new_password.strip()) < 6:
            raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
        current_user.hashed_password = get_password_hash(profile_in.new_password.strip())

    try:
        audit = AuditLog(
            user_id=current_user.id,
            user_email=current_user.email or current_user.username,
            action="UPDATE",
            entity_type="USER_PROFILE",
            entity_id=str(current_user.id),
            details=f"User {current_user.username} updated profile details (Name: {current_user.full_name})",
            ip_address="127.0.0.1"
        )
        db.add(audit)
        db.commit()
        db.refresh(current_user)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error while updating profile: {e}")

    return format_user_out(current_user)

@router.put("/users/{user_id}", response_model=UserOut)
def update_user_by_admin(
    user_id: int,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN"]))
):
    target_user = db.query(User).filter_by(id=user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if user_in.full_name is not None and user_in.full_name.strip():
        target_user.full_name = user_in.full_name.strip()

    if user_in.email is not None:
        clean_email = user_in.email.strip() if user_in.email.strip() else None
        if clean_email:
            existing = db.query(User).filter(
                func.lower(User.email) == clean_email.lower(),
                User.id != target_user.id
            ).first()
            if existing:
                raise HTTPException(status_code=400, detail="Email is already used by another account")
        target_user.email = clean_email

    if user_in.title is not None:
        target_user.title = user_in.title.strip() if user_in.title.strip() else None

    if user_in.department is not None:
        target_user.department = user_in.department.strip() if user_in.department.strip() else None

    if user_in.phone is not None:
        target_user.phone = user_in.phone.strip() if user_in.phone.strip() else None

    if user_in.is_active is not None:
        target_user.is_active = user_in.is_active

    # Super Admin can change user role
    if user_in.role_name:
        role = db.query(Role).filter_by(name=user_in.role_name).first()
        if role:
            db.query(UserRole).filter_by(user_id=target_user.id).delete()
            db.add(UserRole(user_id=target_user.id, role_id=role.id))

    # Super Admin password reset
    if user_in.password and user_in.password.strip():
        if len(user_in.password.strip()) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        target_user.hashed_password = get_password_hash(user_in.password.strip())

    # Super Admin 2FA reset
    if user_in.reset_2fa:
        target_user.is_two_factor_enabled = False
        target_user.two_factor_secret = None

    try:
        audit = AuditLog(
            user_id=current_user.id,
            user_email=current_user.email or current_user.username,
            action="UPDATE",
            entity_type="USER",
            entity_id=str(target_user.id),
            details=f"Admin {current_user.username} updated user {target_user.username} (Name: {target_user.full_name})",
            ip_address="127.0.0.1"
        )
        db.add(audit)
        db.commit()
        db.refresh(target_user)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error while updating user: {e}")

    return format_user_out(target_user)

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN"]))
):
    target_user = db.query(User).filter_by(id=user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if target_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own super administrator account")
    if target_user.username == "admin":
        raise HTTPException(status_code=400, detail="Cannot delete root system administrator account")

    deleted_username = target_user.username
    db.delete(target_user)

    audit = AuditLog(
        user_id=current_user.id,
        user_email=current_user.email or current_user.username,
        action="DELETE",
        entity_type="USER",
        entity_id=str(user_id),
        details=f"Admin {current_user.username} deleted user account {deleted_username}",
        ip_address="127.0.0.1"
    )
    db.add(audit)
    db.commit()

    return {"status": "success", "message": f"User {deleted_username} deleted successfully"}

# ----------------------------------------------------
# TWO-FACTOR AUTHENTICATION (2FA - GOOGLE AUTHENTICATOR)
# ----------------------------------------------------

@router.get("/2fa/setup", response_model=TwoFactorSetupResponse)
def setup_two_factor(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required to set up 2FA")
    
    # Generate secret
    secret = pyotp.random_base32()
    
    # Temporarily store secret on user record pending verification
    current_user.two_factor_secret = secret
    db.commit()

    # Generate otpauth provisioning URI
    # Format: otpauth://totp/Phillip%20Securities%20Hong%20Kong:username?secret=...&issuer=Phillip%20Securities%20Hong%20Kong
    totp = pyotp.TOTP(secret)
    otpauth_url = totp.provisioning_uri(
        name=current_user.username,
        issuer_name="Phillip Securities Hong Kong"
    )

    # Generate high quality QR code image in corporate navy & white
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=4,
    )
    qr.add_data(otpauth_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#0A192F", back_color="white")
    
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    qr_b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
    qr_code_base64 = f"data:image/png;base64,{qr_b64}"

    return TwoFactorSetupResponse(
        secret=secret,
        otpauth_url=otpauth_url,
        qr_code_base64=qr_code_base64,
        manual_entry_key=secret
    )

@router.post("/2fa/enable")
def enable_two_factor(
    req: TwoFactorVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    if not current_user.two_factor_secret:
        raise HTTPException(status_code=400, detail="2FA setup has not been initiated. Please call /2fa/setup first.")
    
    # Verify TOTP code
    totp = pyotp.TOTP(current_user.two_factor_secret)
    if not totp.verify(req.code.strip(), valid_window=1):
        raise HTTPException(
            status_code=400,
            detail="Invalid 6-digit verification code. Please ensure your device clock is synchronized and try again."
        )

    current_user.is_two_factor_enabled = True
    
    audit = AuditLog(
        user_id=current_user.id,
        user_email=current_user.email or current_user.username,
        action="UPDATE",
        entity_type="USER_SECURITY",
        entity_id=str(current_user.id),
        details=f"User {current_user.username} enabled Google Authenticator 2FA",
        ip_address="127.0.0.1"
    )
    db.add(audit)
    db.commit()

    return {
        "success": True,
        "message": "Two-factor authentication (Google Authenticator) enabled successfully."
    }

@router.post("/2fa/disable")
def disable_two_factor(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")

    current_user.is_two_factor_enabled = False
    current_user.two_factor_secret = None
    
    audit = AuditLog(
        user_id=current_user.id,
        user_email=current_user.email or current_user.username,
        action="UPDATE",
        entity_type="USER_SECURITY",
        entity_id=str(current_user.id),
        details=f"User {current_user.username} disabled Google Authenticator 2FA",
        ip_address="127.0.0.1"
    )
    db.add(audit)
    db.commit()

    return {
        "success": True,
        "message": "Two-factor authentication has been disabled."
    }

# ----------------------------------------------------
# AUDIT LOGS & NOTIFICATIONS
# ----------------------------------------------------

@router.get("/audit-logs")
def get_audit_logs(limit: int = 50, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
    return logs

@router.get("/notifications")
def get_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    notifs = db.query(Notification).order_by(Notification.created_at.desc()).limit(20).all()
    return notifs

@router.post("/notifications/{id}/read")
def mark_notification_read(id: int, db: Session = Depends(get_db)):
    notif = db.query(Notification).filter_by(id=id).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"success": True}
