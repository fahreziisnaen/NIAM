import sqlite3

conn = sqlite3.connect('phillip_assets.db')
cur = conn.cursor()

cur.execute("PRAGMA foreign_keys = OFF;")
cur.execute("DROP TABLE IF EXISTS users_new;")
cur.execute("""
CREATE TABLE users_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    title VARCHAR(100),
    department VARCHAR(100) DEFAULT 'IT Infrastructure',
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT 1,
    is_superuser BOOLEAN DEFAULT 0,
    two_factor_secret VARCHAR(64),
    is_two_factor_enabled BOOLEAN DEFAULT 0,
    created_at DATETIME,
    updated_at DATETIME
);
""")

cur.execute("""
INSERT INTO users_new (id, username, email, hashed_password, full_name, title, department, phone, is_active, is_superuser, two_factor_secret, is_two_factor_enabled, created_at, updated_at)
SELECT id, username, email, hashed_password, full_name, title, department, phone, is_active, is_superuser, two_factor_secret, is_two_factor_enabled, created_at, updated_at FROM users;
""")

cur.execute("DROP TABLE users;")
cur.execute("ALTER TABLE users_new RENAME TO users;")
cur.execute("PRAGMA foreign_keys = ON;")
conn.commit()

cur.execute("PRAGMA table_info(users)")
print("New users schema:")
for col in cur.fetchall():
    print(" ", col)

cur.execute("SELECT id, username, email, full_name, is_two_factor_enabled FROM users")
print("Migrated records:")
for u in cur.fetchall():
    print(" ", u)

conn.close()
print("Recreation successful!")
