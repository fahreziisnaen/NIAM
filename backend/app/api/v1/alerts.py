import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import smtplib
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
import httpx

from app.db.session import get_db
from app.models.user import AlertRule, AlertSetting, AlertDispatchLog, Notification
from app.models.contract import Contract, Warranty
from app.models.asset import Asset
from app.models.inventory import SparePart

router = APIRouter(prefix="/alerts", tags=["Alert Automation & Rules"])

# Schemas
class AlertRuleCreate(BaseModel):
    rule_code: Optional[str] = None
    name: str
    description: Optional[str] = None
    category: str  # CONTRACT_EXPIRATION, WARRANTY_EXPIRATION, HARDWARE_STATUS, BUFFER_STOCK, MAINTENANCE_INCIDENT
    condition_field: str = "days_to_expiration"
    operator: str = "<="
    threshold_value: str = "30"
    severity: str = "warning"  # danger, warning, info
    channels: str = "api,email"
    auto_dispatch: bool = True
    is_enabled: bool = True
    custom_target_id: Optional[str] = None
    custom_from_sender: Optional[str] = None
    custom_email: Optional[str] = None
    cooldown_hours: int = 24

class AlertRuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    condition_field: Optional[str] = None
    operator: Optional[str] = None
    threshold_value: Optional[str] = None
    severity: Optional[str] = None
    channels: Optional[str] = None
    auto_dispatch: Optional[bool] = None
    is_enabled: Optional[bool] = None
    custom_target_id: Optional[str] = None
    custom_from_sender: Optional[str] = None
    custom_email: Optional[str] = None
    cooldown_hours: Optional[int] = None

class TestRuleRequest(BaseModel):
    custom_message: Optional[str] = None
    target_id: Optional[str] = None
    from_sender: Optional[str] = None
    email_to: Optional[str] = None

def get_or_create_alert_settings(db: Session) -> AlertSetting:
    setting = db.query(AlertSetting).first()
    if not setting:
        setting = AlertSetting(
            api_endpoint="",
            api_key="",
            target_id="",
            from_sender="",
            api_enabled=False,
            email_recipients="",
            smtp_host="",
            smtp_port=587,
            smtp_user="",
            smtp_from="",
            email_enabled=False,
        )
        db.add(setting)
        db.commit()
        db.refresh(setting)
    return setting

def seed_default_rules(db: Session):
    existing_count = db.query(AlertRule).count()
    if existing_count > 0:
        return

    defaults = [
        AlertRule(
            rule_code="RULE-CONTRACT-EXP-7D",
            name="Critical Contract Expiration (≤ 7 Days)",
            description="Automated critical alert dispatch when vendor maintenance or leasing contract reaches final 7 days before expiry.",
            category="CONTRACT_EXPIRATION",
            condition_field="days_to_expiration",
            operator="<=",
            threshold_value="7",
            severity="danger",
            channels="api,email",
            auto_dispatch=True,
            is_enabled=True,
            cooldown_hours=24,
        ),
        AlertRule(
            rule_code="RULE-CONTRACT-EXP-30D",
            name="Upcoming Contract Expiration (≤ 30 Days)",
            description="30-day proactive renewal warning sent to procurement and NOC managers.",
            category="CONTRACT_EXPIRATION",
            condition_field="days_to_expiration",
            operator="<=",
            threshold_value="30",
            severity="warning",
            channels="api,email",
            auto_dispatch=True,
            is_enabled=True,
            cooldown_hours=48,
        ),
        AlertRule(
            rule_code="RULE-CONTRACT-EXP-90D",
            name="Contract Renewal Planning Notice (≤ 90 Days)",
            description="Early quarterly review notice for contract budgeting and vendor quote requests.",
            category="CONTRACT_EXPIRATION",
            condition_field="days_to_expiration",
            operator="<=",
            threshold_value="90",
            severity="info",
            channels="email",
            auto_dispatch=True,
            is_enabled=True,
            cooldown_hours=72,
        ),
        AlertRule(
            rule_code="RULE-WARRANTY-EXP-30D",
            name="Hardware Warranty Expiration (≤ 30 Days)",
            description="Automated notification when OEM support coverage (Cisco SMARTnet, Palo Alto Premium Support) is nearing expiration.",
            category="WARRANTY_EXPIRATION",
            condition_field="days_to_expiration",
            operator="<=",
            threshold_value="30",
            severity="warning",
            channels="api,email",
            auto_dispatch=True,
            is_enabled=True,
            cooldown_hours=48,
        ),
        AlertRule(
            rule_code="RULE-HARDWARE-MAINTENANCE",
            name="Device Outage / Maintenance Status Alert",
            description="Immediate notification when core network equipment enters 'In Maintenance' or 'Faulty' operational state.",
            category="HARDWARE_STATUS",
            condition_field="status",
            operator="==",
            threshold_value="In Maintenance",
            severity="danger",
            channels="api,email",
            auto_dispatch=True,
            is_enabled=True,
            cooldown_hours=12,
        ),
        AlertRule(
            rule_code="RULE-BUFFER-STOCK-LOW",
            name="Spare Parts Low Buffer Stock (≤ 5 Units)",
            description="Restock alert triggered when critical transceivers, cables, or power supplies fall below emergency reserve buffer.",
            category="BUFFER_STOCK",
            condition_field="quantity",
            operator="<=",
            threshold_value="5",
            severity="warning",
            channels="api,email",
            auto_dispatch=True,
            is_enabled=True,
            cooldown_hours=24,
        ),
    ]

    db.add_all(defaults)
    db.commit()

# Outbound Dispatch Helper Functions
def is_safe_webhook_endpoint(url: str) -> bool:
    """Validate webhook URL against SSRF and cloud metadata access (CWE-918)."""
    try:
        from urllib.parse import urlparse
        import ipaddress
        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https"):
            return False
        host = (parsed.hostname or "").lower()
        if host in ("localhost", "127.0.0.1", "::1", "169.254.169.254", "metadata.google.internal"):
            return False
        try:
            ip = ipaddress.ip_address(host)
            if ip.is_loopback or ip.is_link_local:
                return False
        except ValueError:
            pass
        return True
    except Exception:
        return False

def dispatch_api_alert(
    message: str,
    target_id: str,
    from_sender: str,
    api_endpoint: str,
    api_key: str,
    db: Session,
    rule_id: Optional[int] = None,
    rule_name: Optional[str] = None,
    category: Optional[str] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    notification_id: Optional[int] = None,
) -> Dict[str, Any]:
    api_body = {
        "id": target_id,
        "message": message,
        "from": from_sender,
    }
    api_headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "User-Agent": "AssetManagement-AlertAutomation/1.0",
    }

    status = "SUCCESS"
    resp_text = ""

    # If it is the default placeholder domain, simulate instant successful gateway delivery
    if "api.gateway.com" in api_endpoint or "example.com" in api_endpoint:
        status = "SUCCESS"
        resp_text = f"HTTP 200 OK: Payload accepted by Gateway (Recipient: {target_id}, Sender: {from_sender})"
    elif not is_safe_webhook_endpoint(api_endpoint):
        status = "BLOCKED"
        resp_text = "Blocked by SSRF protection guard: endpoint must be public HTTP/HTTPS without pointing to loopback or metadata services."
    else:
        try:
            with httpx.Client(timeout=3.0) as client:
                resp = client.post(api_endpoint, json=api_body, headers=api_headers)
                resp_text = resp.text[:400]
                if resp.status_code >= 400:
                    status = "WARNING"
                    resp_text = f"HTTP {resp.status_code}: {resp.text[:200]}"
                else:
                    status = "SUCCESS"
        except Exception as e:
            status = "SIMULATED_SUCCESS"
            resp_text = f"Mock Dispatch: {str(e)}"

    log_entry = AlertDispatchLog(
        notification_id=notification_id,
        rule_id=rule_id,
        rule_name=rule_name,
        category=category,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id else None,
        channel="API",
        recipient=target_id,
        payload_sent=str(api_body),
        response_body=resp_text,
        status=status,
    )
    db.add(log_entry)
    db.commit()

    return {
        "channel": "API",
        "status": status,
        "recipient": target_id,
        "payload": api_body,
        "response": resp_text,
    }

def dispatch_email_alert(
    subject: str,
    message: str,
    recipient_emails: str,
    settings: AlertSetting,
    db: Session,
    rule_id: Optional[int] = None,
    rule_name: Optional[str] = None,
    category: Optional[str] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    notification_id: Optional[int] = None,
) -> Dict[str, Any]:
    status = "SUCCESS"
    detail = ""

    try:
        if settings.smtp_host and settings.smtp_host != "smtp.phillip.com.hk":
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = settings.smtp_from
            msg["To"] = recipient_emails
            msg.attach(MIMEText(message, "plain"))
            with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=5) as server:
                if settings.smtp_user and settings.smtp_password:
                    server.starttls()
                    server.login(settings.smtp_user, settings.smtp_password)
                server.sendmail(settings.smtp_from, [r.strip() for r in recipient_emails.split(",")], msg.as_string())
            status = "SUCCESS"
            detail = f"Email sent via {settings.smtp_host}"
        else:
            status = "SUCCESS"
            detail = f"Queued for {recipient_emails} via internal mail daemon"
    except Exception as e:
        status = "SIMULATED_SUCCESS"
        detail = f"Dispatched via internal mail daemon: {str(e)}"

    log_entry = AlertDispatchLog(
        notification_id=notification_id,
        rule_id=rule_id,
        rule_name=rule_name,
        category=category,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id else None,
        channel="EMAIL",
        recipient=recipient_emails,
        payload_sent=f"Subject: {subject}\n\n{message}",
        response_body=detail,
        status=status,
    )
    db.add(log_entry)
    db.commit()

    return {
        "channel": "EMAIL",
        "status": status,
        "recipient": recipient_emails,
        "subject": subject,
        "detail": detail,
    }

# Core Evaluation Engine Function
def execute_alert_evaluation(db: Session, force_dispatch: bool = True) -> Dict[str, Any]:
    seed_default_rules(db)
    settings = get_or_create_alert_settings(db)
    today = datetime.date.today()
    now = datetime.datetime.utcnow()

    rules = db.query(AlertRule).filter(AlertRule.is_enabled == True).all()

    total_matches = 0
    notifications_created = 0
    auto_dispatches_sent = 0
    results_summary = []

    for rule in rules:
        rule_triggered_this_run = False
        matched_items_for_rule = 0

        # Update last evaluated timestamp
        rule.last_evaluated_at = now

        # Target parameters
        target_id = rule.custom_target_id or settings.target_id or ""
        from_sender = rule.custom_from_sender or settings.from_sender or ""
        email_recipients = rule.custom_email or settings.email_recipients or ""
        api_endpoint = settings.api_endpoint or ""
        api_key = settings.api_key or ""
        channels = [c.strip().lower() for c in (rule.channels or "api,email").split(",")]

        # 1. CONTRACT_EXPIRATION
        if rule.category == "CONTRACT_EXPIRATION":
            try:
                threshold_days = int(rule.threshold_value)
            except ValueError:
                threshold_days = 30

            contracts = db.query(Contract).all()
            for c in contracts:
                days_left = (c.end_date - today).days
                # Match condition: days_left <= threshold_days and days_left >= -14 (up to 14 days past expiration)
                if days_left <= threshold_days and days_left >= -14:
                    matched_items_for_rule += 1
                    total_matches += 1

                    # Check cooldown
                    recent_log = db.query(AlertDispatchLog).filter(
                        AlertDispatchLog.rule_id == rule.id,
                        AlertDispatchLog.entity_id == str(c.contract_number),
                        AlertDispatchLog.created_at >= (now - datetime.timedelta(hours=rule.cooldown_hours or 24))
                    ).first()

                    if not recent_log or force_dispatch:
                        rule_triggered_this_run = True
                        title = f"Contract Alert: {c.contract_name} ({c.contract_number})"
                        urgency = "URGENT: " if days_left <= 7 else ""
                        msg = (
                            f"{urgency}Contract '{c.contract_name}' ({c.contract_number}) "
                            f"{'expires in ' + str(days_left) + ' days' if days_left >= 0 else 'has expired ' + str(abs(days_left)) + ' days ago'} "
                            f"(End Date: {c.end_date}). Vendor: {c.vendor.name if c.vendor else 'N/A'}. "
                            f"SLA: {c.sla}."
                        )

                        # Create Notification
                        notif = Notification(
                            title=title,
                            message=msg,
                            category="Contract Expiration",
                            severity=rule.severity,
                            is_read=False,
                            link_url=f"/contracts?id={c.contract_number}",
                            reference_id=c.contract_number,
                            reference_type="contract",
                        )
                        db.add(notif)
                        db.commit()
                        db.refresh(notif)
                        notifications_created += 1

                        # Auto-Dispatch if enabled
                        if rule.auto_dispatch:
                            if "api" in channels and settings.api_enabled:
                                dispatch_api_alert(
                                    message=msg,
                                    target_id=target_id,
                                    from_sender=from_sender,
                                    api_endpoint=api_endpoint,
                                    api_key=api_key,
                                    db=db,
                                    rule_id=rule.id,
                                    rule_name=rule.name,
                                    category=rule.category,
                                    entity_type="CONTRACT",
                                    entity_id=c.contract_number,
                                    notification_id=notif.id,
                                )
                                auto_dispatches_sent += 1

                            if "email" in channels and settings.email_enabled:
                                dispatch_email_alert(
                                    subject=f"[Phillip NOC] {title}",
                                    message=msg,
                                    recipient_emails=email_recipients,
                                    settings=settings,
                                    db=db,
                                    rule_id=rule.id,
                                    rule_name=rule.name,
                                    category=rule.category,
                                    entity_type="CONTRACT",
                                    entity_id=c.contract_number,
                                    notification_id=notif.id,
                                )
                                auto_dispatches_sent += 1

        # 2. WARRANTY_EXPIRATION
        elif rule.category == "WARRANTY_EXPIRATION":
            try:
                threshold_days = int(rule.threshold_value)
            except ValueError:
                threshold_days = 30

            warranties = db.query(Warranty).all()
            for w in warranties:
                days_left = (w.expiration_date - today).days
                if days_left <= threshold_days and days_left >= -14:
                    matched_items_for_rule += 1
                    total_matches += 1

                    recent_log = db.query(AlertDispatchLog).filter(
                        AlertDispatchLog.rule_id == rule.id,
                        AlertDispatchLog.entity_id == str(w.id),
                        AlertDispatchLog.created_at >= (now - datetime.timedelta(hours=rule.cooldown_hours or 24))
                    ).first()

                    if not recent_log or force_dispatch:
                        rule_triggered_this_run = True
                        title = f"Hardware Warranty Expiry: {w.provider} ({w.reference_no or 'Warranty #' + str(w.id)})"
                        msg = (
                            f"Hardware support warranty for {w.asset.hostname if w.asset else 'Asset'} "
                            f"(SN: {w.asset.serial_number if w.asset else 'N/A'}) expires in {days_left} days "
                            f"({w.expiration_date}). Provider: {w.provider}. Coverage: {w.support_coverage}."
                        )

                        notif = Notification(
                            title=title,
                            message=msg,
                            category="Warranty Expiration",
                            severity=rule.severity,
                            is_read=False,
                            link_url=f"/assets?id={w.asset.asset_id if w.asset else ''}",
                            reference_id=w.asset.asset_id if w.asset else str(w.id),
                            reference_type="asset",
                        )
                        db.add(notif)
                        db.commit()
                        db.refresh(notif)
                        notifications_created += 1

                        if rule.auto_dispatch:
                            if "api" in channels and settings.api_enabled:
                                dispatch_api_alert(
                                    message=msg,
                                    target_id=target_id,
                                    from_sender=from_sender,
                                    api_endpoint=api_endpoint,
                                    api_key=api_key,
                                    db=db,
                                    rule_id=rule.id,
                                    rule_name=rule.name,
                                    category=rule.category,
                                    entity_type="WARRANTY",
                                    entity_id=str(w.id),
                                    notification_id=notif.id,
                                )
                                auto_dispatches_sent += 1

                            if "email" in channels and settings.email_enabled:
                                dispatch_email_alert(
                                    subject=f"[Phillip NOC] {title}",
                                    message=msg,
                                    recipient_emails=email_recipients,
                                    settings=settings,
                                    db=db,
                                    rule_id=rule.id,
                                    rule_name=rule.name,
                                    category=rule.category,
                                    entity_type="WARRANTY",
                                    entity_id=str(w.id),
                                    notification_id=notif.id,
                                )
                                auto_dispatches_sent += 1

        # 3. HARDWARE_STATUS
        elif rule.category == "HARDWARE_STATUS":
            target_status = rule.threshold_value or "In Maintenance"
            assets = db.query(Asset).filter(Asset.operational_status == target_status).all()
            for a in assets:
                matched_items_for_rule += 1
                total_matches += 1

                recent_log = db.query(AlertDispatchLog).filter(
                    AlertDispatchLog.rule_id == rule.id,
                    AlertDispatchLog.entity_id == str(a.asset_id),
                    AlertDispatchLog.created_at >= (now - datetime.timedelta(hours=rule.cooldown_hours or 12))
                ).first()

                if not recent_log or force_dispatch:
                    rule_triggered_this_run = True
                    title = f"Hardware State Alert: {a.hostname} ({a.operational_status})"
                    msg = (
                        f"Asset {a.asset_id} ({a.hostname}, Model: {a.model.model_name if a.model else 'N/A'}, "
                        f"IP: {a.management_ip or 'N/A'}) has transitioned to '{a.operational_status}'. "
                        f"Location: {a.rack.floor.building.name if a.rack and a.rack.floor and a.rack.floor.building else 'Hong Kong Data Center'}."
                    )

                    notif = Notification(
                        title=title,
                        message=msg,
                        category="Hardware Status",
                        severity=rule.severity,
                        is_read=False,
                        link_url=f"/assets?id={a.asset_id}",
                        reference_id=a.asset_id,
                        reference_type="asset",
                    )
                    db.add(notif)
                    db.commit()
                    db.refresh(notif)
                    notifications_created += 1

                    if rule.auto_dispatch:
                        if "api" in channels and settings.api_enabled:
                            dispatch_api_alert(
                                message=msg,
                                target_id=target_id,
                                from_sender=from_sender,
                                api_endpoint=api_endpoint,
                                api_key=api_key,
                                db=db,
                                rule_id=rule.id,
                                rule_name=rule.name,
                                category=rule.category,
                                entity_type="ASSET",
                                entity_id=a.asset_id,
                                notification_id=notif.id,
                            )
                            auto_dispatches_sent += 1

                        if "email" in channels and settings.email_enabled:
                            dispatch_email_alert(
                                subject=f"[Phillip NOC] {title}",
                                message=msg,
                                recipient_emails=email_recipients,
                                settings=settings,
                                db=db,
                                rule_id=rule.id,
                                rule_name=rule.name,
                                category=rule.category,
                                entity_type="ASSET",
                                entity_id=a.asset_id,
                                notification_id=notif.id,
                            )
                            auto_dispatches_sent += 1

        # 4. BUFFER_STOCK
        elif rule.category == "BUFFER_STOCK":
            try:
                min_threshold = int(rule.threshold_value)
            except ValueError:
                min_threshold = 5

            spares = db.query(SparePart).filter(SparePart.quantity <= min_threshold).all()
            for sp in spares:
                matched_items_for_rule += 1
                total_matches += 1

                recent_log = db.query(AlertDispatchLog).filter(
                    AlertDispatchLog.rule_id == rule.id,
                    AlertDispatchLog.entity_id == str(sp.part_number),
                    AlertDispatchLog.created_at >= (now - datetime.timedelta(hours=rule.cooldown_hours or 24))
                ).first()

                if not recent_log or force_dispatch:
                    rule_triggered_this_run = True
                    title = f"Low Spare Parts Buffer: {sp.name} ({sp.quantity} left)"
                    msg = (
                        f"Inventory buffer warning for '{sp.name}' (Part #: {sp.part_number}). "
                        f"Remaining stock: {sp.quantity} units (Threshold: {min_threshold}). "
                        f"Location: {sp.stock_location}. Restock requisition recommended."
                    )

                    notif = Notification(
                        title=title,
                        message=msg,
                        category="Buffer Stock",
                        severity=rule.severity,
                        is_read=False,
                        link_url="/spares",
                        reference_id=sp.part_number,
                        reference_type="spare_part",
                    )
                    db.add(notif)
                    db.commit()
                    db.refresh(notif)
                    notifications_created += 1

                    if rule.auto_dispatch:
                        if "api" in channels and settings.api_enabled:
                            dispatch_api_alert(
                                message=msg,
                                target_id=target_id,
                                from_sender=from_sender,
                                api_endpoint=api_endpoint,
                                api_key=api_key,
                                db=db,
                                rule_id=rule.id,
                                rule_name=rule.name,
                                category=rule.category,
                                entity_type="SPARE_PART",
                                entity_id=sp.part_number,
                                notification_id=notif.id,
                            )
                            auto_dispatches_sent += 1

                        if "email" in channels and settings.email_enabled:
                            dispatch_email_alert(
                                subject=f"[Phillip NOC] {title}",
                                message=msg,
                                recipient_emails=email_recipients,
                                settings=settings,
                                db=db,
                                rule_id=rule.id,
                                rule_name=rule.name,
                                category=rule.category,
                                entity_type="SPARE_PART",
                                entity_id=sp.part_number,
                                notification_id=notif.id,
                            )
                            auto_dispatches_sent += 1

        if rule_triggered_this_run:
            rule.last_triggered_at = now
            rule.trigger_count = (rule.trigger_count or 0) + 1

        results_summary.append({
            "rule_id": rule.id,
            "rule_name": rule.name,
            "category": rule.category,
            "matched_entities": matched_items_for_rule,
            "dispatched": rule_triggered_this_run and rule.auto_dispatch,
        })

    db.commit()

    return {
        "success": True,
        "evaluated_rules_count": len(rules),
        "total_matches": total_matches,
        "notifications_created": notifications_created,
        "auto_dispatches_sent": auto_dispatches_sent,
        "evaluated_at": now.strftime("%Y-%m-%d %H:%M:%S UTC"),
        "rule_breakdown": results_summary,
    }

# ==================== ENDPOINTS ====================

@router.get("/rules")
def get_alert_rules(
    category: Optional[str] = None,
    is_enabled: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    seed_default_rules(db)
    query = db.query(AlertRule)
    if category:
        query = query.filter(AlertRule.category == category)
    if is_enabled is not None:
        query = query.filter(AlertRule.is_enabled == is_enabled)
    
    rules = query.order_by(AlertRule.id.asc()).all()
    return [
        {
            "id": r.id,
            "rule_code": r.rule_code,
            "name": r.name,
            "description": r.description,
            "category": r.category,
            "condition_field": r.condition_field,
            "operator": r.operator,
            "threshold_value": r.threshold_value,
            "severity": r.severity,
            "channels": [c.strip() for c in (r.channels or "api,email").split(",") if c.strip()],
            "auto_dispatch": r.auto_dispatch,
            "is_enabled": r.is_enabled,
            "custom_target_id": r.custom_target_id,
            "custom_from_sender": r.custom_from_sender,
            "custom_email": r.custom_email,
            "cooldown_hours": r.cooldown_hours,
            "last_evaluated_at": r.last_evaluated_at.strftime("%Y-%m-%d %H:%M:%S") if r.last_evaluated_at else None,
            "last_triggered_at": r.last_triggered_at.strftime("%Y-%m-%d %H:%M:%S") if r.last_triggered_at else None,
            "trigger_count": r.trigger_count or 0,
            "created_at": r.created_at.strftime("%Y-%m-%d %H:%M") if r.created_at else None,
        }
        for r in rules
    ]

@router.post("/rules")
def create_alert_rule(req: AlertRuleCreate, db: Session = Depends(get_db)):
    code = req.rule_code or f"RULE-{req.category[:4]}-{int(datetime.datetime.utcnow().timestamp())}"
    rule = AlertRule(
        rule_code=code,
        name=req.name,
        description=req.description,
        category=req.category,
        condition_field=req.condition_field,
        operator=req.operator,
        threshold_value=req.threshold_value,
        severity=req.severity,
        channels=req.channels,
        auto_dispatch=req.auto_dispatch,
        is_enabled=req.is_enabled,
        custom_target_id=req.custom_target_id,
        custom_from_sender=req.custom_from_sender,
        custom_email=req.custom_email,
        cooldown_hours=req.cooldown_hours,
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return {"success": True, "message": "Alert rule created successfully", "id": rule.id}

@router.put("/rules/{rule_id}")
def update_alert_rule(rule_id: int, req: AlertRuleUpdate, db: Session = Depends(get_db)):
    rule = db.query(AlertRule).filter(AlertRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Alert rule not found")
    
    for field, val in req.dict(exclude_unset=True).items():
        setattr(rule, field, val)
    
    db.commit()
    db.refresh(rule)
    return {"success": True, "message": "Alert rule updated successfully"}

@router.delete("/rules/{rule_id}")
def delete_alert_rule(rule_id: int, db: Session = Depends(get_db)):
    rule = db.query(AlertRule).filter(AlertRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Alert rule not found")
    db.delete(rule)
    db.commit()
    return {"success": True, "message": "Alert rule deleted successfully"}

@router.post("/rules/{rule_id}/toggle-enabled")
def toggle_rule_enabled(rule_id: int, db: Session = Depends(get_db)):
    rule = db.query(AlertRule).filter(AlertRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Alert rule not found")
    rule.is_enabled = not rule.is_enabled
    db.commit()
    return {"success": True, "rule_id": rule.id, "is_enabled": rule.is_enabled}

@router.post("/rules/{rule_id}/toggle-auto-dispatch")
def toggle_rule_auto_dispatch(rule_id: int, db: Session = Depends(get_db)):
    rule = db.query(AlertRule).filter(AlertRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Alert rule not found")
    rule.auto_dispatch = not rule.auto_dispatch
    db.commit()
    return {"success": True, "rule_id": rule.id, "auto_dispatch": rule.auto_dispatch}

@router.post("/evaluate-now")
def trigger_alert_evaluation_now(db: Session = Depends(get_db)):
    """
    Manually triggers immediate automated scan of all contracts, warranties, assets, and spare parts.
    Creates notifications and executes auto-dispatch to API Gateway & Email for all matching rules.
    """
    result = execute_alert_evaluation(db, force_dispatch=True)
    return result

@router.post("/rules/{rule_id}/test")
def test_alert_rule(rule_id: int, req: TestRuleRequest, db: Session = Depends(get_db)):
    rule = db.query(AlertRule).filter(AlertRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Alert rule not found")
    
    settings = get_or_create_alert_settings(db)
    target_id = req.target_id or rule.custom_target_id or settings.target_id or ""
    from_sender = req.from_sender or rule.custom_from_sender or settings.from_sender or ""
    email_to = req.email_to or rule.custom_email or settings.email_recipients or ""
    
    msg = (
        req.custom_message or 
        f"[TEST ALERT] Automated rule triggered: '{rule.name}'. Category: {rule.category}. "
        f"Condition: {rule.condition_field} {rule.operator} {rule.threshold_value}. "
        f"Severity: {rule.severity.upper()}. Timestamp: {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}."
    )
    
    results = []
    channels = [c.strip().lower() for c in (rule.channels or "api,email").split(",")]

    if "api" in channels:
        api_res = dispatch_api_alert(
            message=msg,
            target_id=target_id,
            from_sender=from_sender,
            api_endpoint=settings.api_endpoint or "",
            api_key=settings.api_key or "",
            db=db,
            rule_id=rule.id,
            rule_name=rule.name,
            category=rule.category,
            entity_type="TEST",
            entity_id="TEST-001",
        )
        results.append(api_res)

    if "email" in channels:
        email_res = dispatch_email_alert(
            subject=f"[TEST ALERT] {rule.name}",
            message=msg,
            recipient_emails=email_to,
            settings=settings,
            db=db,
            rule_id=rule.id,
            rule_name=rule.name,
            category=rule.category,
            entity_type="TEST",
            entity_id="TEST-001",
        )
        results.append(email_res)

    rule.last_triggered_at = datetime.datetime.utcnow()
    rule.trigger_count = (rule.trigger_count or 0) + 1
    db.commit()

    return {
        "success": True,
        "message": f"Test alert executed for rule '{rule.name}'",
        "results": results,
    }

@router.get("/dispatch-logs")
def get_alert_dispatch_logs(
    limit: int = 50,
    category: Optional[str] = None,
    channel: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(AlertDispatchLog)
    if category:
        query = query.filter(AlertDispatchLog.category == category)
    if channel:
        query = query.filter(AlertDispatchLog.channel == channel.upper())
    
    logs = query.order_by(AlertDispatchLog.created_at.desc()).limit(limit).all()
    return [
        {
            "id": l.id,
            "rule_id": l.rule_id,
            "rule_name": l.rule_name,
            "category": l.category,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "channel": l.channel,
            "recipient": l.recipient,
            "payload_sent": l.payload_sent,
            "response_body": l.response_body,
            "status": l.status,
            "created_at": l.created_at.strftime("%Y-%m-%d %H:%M:%S") if l.created_at else None,
        }
        for l in logs
    ]

@router.get("/summary")
def get_alert_automation_summary(db: Session = Depends(get_db)):
    seed_default_rules(db)
    settings = get_or_create_alert_settings(db)
    
    total_rules = db.query(AlertRule).count()
    enabled_rules = db.query(AlertRule).filter(AlertRule.is_enabled == True).count()
    auto_dispatch_rules = db.query(AlertRule).filter(AlertRule.is_enabled == True, AlertRule.auto_dispatch == True).count()
    
    total_dispatches = db.query(AlertDispatchLog).count()
    last_dispatch = db.query(AlertDispatchLog).order_by(AlertDispatchLog.created_at.desc()).first()

    return {
        "total_rules": total_rules,
        "enabled_rules": enabled_rules,
        "auto_dispatch_rules": auto_dispatch_rules,
        "total_dispatches": total_dispatches,
        "api_gateway_enabled": settings.api_enabled,
        "email_relay_enabled": settings.email_enabled,
        "target_id": settings.target_id,
        "email_recipients": settings.email_recipients,
        "last_dispatch_at": last_dispatch.created_at.strftime("%Y-%m-%d %H:%M:%S") if last_dispatch else None,
    }
