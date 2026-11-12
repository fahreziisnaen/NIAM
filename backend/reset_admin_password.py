#!/usr/bin/env python3
"""
CLI Utility to reset or update administrator password in production.

Usage:
  # Inside host machine:
  docker exec -it phillip_backend python reset_admin_password.py "MyNewStrongPassword123!"

  # Or interactively:
  docker exec -it phillip_backend python reset_admin_password.py
"""

import sys
import getpass
from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

def main():
    username = "admin"
    if len(sys.argv) > 1 and sys.argv[1].startswith("--user="):
        username = sys.argv[1].split("=")[1].strip()
        new_pwd = sys.argv[2] if len(sys.argv) > 2 else None
    elif len(sys.argv) > 1 and not sys.argv[1].startswith("-"):
        new_pwd = sys.argv[1].strip()
    else:
        new_pwd = None

    if not new_pwd:
        print(f"=== Reset Password for User [{username}] ===")
        try:
            new_pwd = getpass.getpass("Enter new password (min 6 characters): ")
            confirm = getpass.getpass("Confirm new password: ")
            if new_pwd != confirm:
                print("Error: Passwords do not match. Aborted.")
                sys.exit(1)
        except (KeyboardInterrupt, EOFError):
            print("\nAborted.")
            sys.exit(1)

    if len(new_pwd) < 6:
        print("Error: Password must be at least 6 characters long.")
        sys.exit(1)

    db = SessionLocal()
    try:
        user = db.query(User).filter_by(username=username).first()
        if not user:
            print(f"Error: User with username '{username}' not found in database.")
            sys.exit(1)

        user.hashed_password = get_password_hash(new_pwd)
        db.commit()
        print(f"[SUCCESS] Password for user '{username}' has been successfully updated in database!")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to update password: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main()

