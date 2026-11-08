from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Optional
import pyotp
import qrcode
import io
import base64

from app.db.session import get_db
from app.core.security import verify_password, create_access_token, get_password_hash
from app.models.user import User, Role, UserRole, AuditLog, Notification
from app.schemas.user import (
    UserLogin, Token, UserOut, UserCreate, UserUpdate,
    TwoFactorSetupResponse, TwoFactorVerifyRequest
)
from app.api.deps import get_current_user, require_role

router = APIRouter(prefix="/auth", tags=["Authentication & Users"])

def format_user_out(user: User) -> UserOut:
    roles = [ur.role.name for ur in user.roles]
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

    # Log successful login
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
