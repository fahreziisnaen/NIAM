from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: Optional[str] = None  # Optional as requested
    full_name: str
    title: Optional[str] = None
    department: Optional[str] = "IT Infrastructure"
    phone: Optional[str] = None
    is_active: Optional[bool] = True
    is_superuser: Optional[bool] = False
    is_two_factor_enabled: Optional[bool] = False

class UserLogin(BaseModel):
    username: str  # Can be username or email
    password: str
    two_factor_code: Optional[str] = None  # 6-digit TOTP from Google Authenticator

class UserCreate(UserBase):
    password: str
    role_name: Optional[str] = "VIEWER"

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    title: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None
    role_name: Optional[str] = None
    password: Optional[str] = None
    reset_2fa: Optional[bool] = None

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    title: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None

class UserOut(UserBase):
    id: int
    created_at: Optional[datetime] = None
    roles: List[str] = []

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: Optional[str] = None
    token_type: Optional[str] = "bearer"
    requires_2fa: bool = False
    user: Optional[UserOut] = None
    message: Optional[str] = None

class TwoFactorSetupResponse(BaseModel):
    secret: str
    otpauth_url: str
    qr_code_base64: str
    manual_entry_key: str

class TwoFactorVerifyRequest(BaseModel):
    code: str
    secret: Optional[str] = None

Token.model_rebuild()
