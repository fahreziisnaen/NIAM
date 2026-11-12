#!/usr/bin/env python3
import sys
import os
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.user import User

def reset_user_2fa(username: str = "admin"):
    db: Session = SessionLocal()
    try:
        user = db.query(User).filter_by(username=username).first()
        if not user:
            print(f"[ERROR] User '{username}' not found in database.")
            sys.exit(1)
        
        user.is_two_factor_enabled = False
        user.two_factor_secret = None
        db.commit()
        print(f"[SUCCESS] 2FA has been successfully RESET for user '{username}'.")
        print(f"You can now log in using just your username and password, then re-enable 2FA cleanly.")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to reset 2FA for '{username}': {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "admin"
    reset_user_2fa(target)

