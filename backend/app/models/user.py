import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.session import Base

class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False, index=True)  # SUPER_ADMIN, NETWORK_ADMIN, ASSET_MANAGER, CONTRACT_MANAGER, VIEWER
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    users = relationship("UserRole", back_populates="role")

class Permission(Base):
    __tablename__ = "permissions"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    module = Column(String(50), nullable=False)
    description = Column(String(255), nullable=True)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=True, index=True)  # Optional as requested
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    title = Column(String(100), nullable=True)
    department = Column(String(100), default="IT Infrastructure")
    phone = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    
    # 2FA with Google Authenticator (TOTP)
    two_factor_secret = Column(String(64), nullable=True)
    is_two_factor_enabled = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    roles = relationship("UserRole", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")

class UserRole(Base):
    __tablename__ = "user_roles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False)

    user = relationship("User", back_populates="roles")
    role = relationship("Role", back_populates="users")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    user_email = Column(String(255), nullable=True)
    action = Column(String(50), nullable=False)  # CREATE, UPDATE, DELETE, EXPORT, LOGIN
    entity_type = Column(String(50), nullable=False)  # ASSET, CONTRACT, VENDOR, LOCATION, etc.
    entity_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    category = Column(String(50), default="Alert")  # Contract Expiration, Warranty Expiration, Maintenance, Stock
    severity = Column(String(20), default="info")  # info, warning, danger, success
    is_read = Column(Boolean, default=False)
    link_url = Column(String(255), nullable=True)
    reference_id = Column(String(100), nullable=True)
    reference_type = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    user = relationship("User", back_populates="notifications")

class AlertSetting(Base):
    __tablename__ = "alert_settings"
    id = Column(Integer, primary_key=True, index=True)
    # API Webhook Settings (as requested by user)
    # Header: Bearer API_KEY_ANDA
    # Body: {"id": "628123456789", "message": "...", "from": "respon"}
    api_endpoint = Column(String(500), default="https://api.gateway.com/send")
    api_key = Column(String(500), default="API_KEY_ANDA")
    target_id = Column(String(100), default="628123456789")
    from_sender = Column(String(100), default="respon")
    api_enabled = Column(Boolean, default=True)

    # Email Settings
    email_recipients = Column(String(500), default="noc@phillip.com.hk")
    smtp_host = Column(String(255), default="smtp.phillip.com.hk")
    smtp_port = Column(Integer, default=587)
    smtp_user = Column(String(255), default="noc-alerts@phillip.com.hk")
    smtp_password = Column(String(255), nullable=True)
    smtp_from = Column(String(255), default="noc-alerts@phillip.com.hk")
    email_enabled = Column(Boolean, default=True)

    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class AlertRule(Base):
    __tablename__ = "alert_rules"
    id = Column(Integer, primary_key=True, index=True)
    rule_code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=False)  # CONTRACT_EXPIRATION, WARRANTY_EXPIRATION, HARDWARE_STATUS, BUFFER_STOCK, MAINTENANCE_INCIDENT
    condition_field = Column(String(100), nullable=False, default="days_to_expiration")  # days_to_expiration, status, quantity
    operator = Column(String(20), default="<=")  # <=, ==, >=, !=, in
    threshold_value = Column(String(100), nullable=False)  # "7", "30", "90", "In Maintenance", "5"
    severity = Column(String(20), default="warning")  # danger, warning, info
    channels = Column(String(100), default="api,email")  # comma-separated: api, email
    auto_dispatch = Column(Boolean, default=True)  # True = automatically trigger outbound webhook & email
    is_enabled = Column(Boolean, default=True)
    custom_target_id = Column(String(100), nullable=True)  # overrides target_id e.g. "628123456789"
    custom_from_sender = Column(String(100), nullable=True)  # overrides from e.g. "respon"
    custom_email = Column(String(255), nullable=True)  # overrides email recipients
    cooldown_hours = Column(Integer, default=24)
    last_evaluated_at = Column(DateTime, nullable=True)
    last_triggered_at = Column(DateTime, nullable=True)
    trigger_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class AlertDispatchLog(Base):
    __tablename__ = "alert_dispatch_logs"
    id = Column(Integer, primary_key=True, index=True)
    notification_id = Column(Integer, nullable=True)
    rule_id = Column(Integer, nullable=True)
    rule_name = Column(String(255), nullable=True)
    category = Column(String(50), nullable=True)
    entity_type = Column(String(50), nullable=True)  # CONTRACT, ASSET, WARRANTY, SPARE_PART
    entity_id = Column(String(100), nullable=True)
    channel = Column(String(50), nullable=False)  # API, EMAIL
    recipient = Column(String(255), nullable=False)
    payload_sent = Column(Text, nullable=True)
    response_body = Column(Text, nullable=True)
    status = Column(String(50), nullable=False)  # SUCCESS, FAILED
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)


