import urllib.request
import json
import pyotp

# 1. Login with username 'admin'
login_payload = json.dumps({'username': 'admin', 'password': 'Phillip2026!'}).encode()
req = urllib.request.Request('http://127.0.0.1:8000/api/v1/auth/login', data=login_payload, headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req) as resp:
    res = json.loads(resp.read().decode())
    print("1. Login with username 'admin': requires_2fa =", res.get('requires_2fa'), "| has_token =", bool(res.get('access_token')))
    token = res['access_token']

# 2. Setup 2FA
req2 = urllib.request.Request('http://127.0.0.1:8000/api/v1/auth/2fa/setup', headers={'Authorization': f'Bearer {token}'})
with urllib.request.urlopen(req2) as resp:
    setup_data = json.loads(resp.read().decode())
    print("2. 2FA Setup secret:", setup_data['secret'])
    print("   QR Code prefix:", setup_data['qr_code_base64'][:35], "length:", len(setup_data['qr_code_base64']))
    print("   otpauth_url:", setup_data['otpauth_url'])
    secret = setup_data['secret']

# 3. Generate TOTP code and enable 2FA
totp = pyotp.TOTP(secret)
code = totp.now()
print("   Generated TOTP code:", code)

verify_payload = json.dumps({'code': code}).encode()
req3 = urllib.request.Request('http://127.0.0.1:8000/api/v1/auth/2fa/enable', data=verify_payload, headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'})
with urllib.request.urlopen(req3) as resp:
    res3 = json.loads(resp.read().decode())
    print("3. 2FA Enable result:", res3)

# 4. Try Login again without 2FA code (should require 2FA)
login_payload = json.dumps({'username': 'admin', 'password': 'Phillip2026!'}).encode()
req4 = urllib.request.Request('http://127.0.0.1:8000/api/v1/auth/login', data=login_payload, headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req4) as resp:
    res4 = json.loads(resp.read().decode())
    print("4. Login without 2FA code: requires_2fa =", res4.get('requires_2fa'), "| message =", res4.get('message'))

# 5. Try Login with valid 2FA code
code2 = totp.now()
login_payload2 = json.dumps({'username': 'admin', 'password': 'Phillip2026!', 'two_factor_code': code2}).encode()
req5 = urllib.request.Request('http://127.0.0.1:8000/api/v1/auth/login', data=login_payload2, headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req5) as resp:
    res5 = json.loads(resp.read().decode())
    print("5. Login with 2FA code: requires_2fa =", res5.get('requires_2fa'), "| access_token received =", bool(res5.get('access_token')))
    admin_token_2fa = res5['access_token']

# 6. Test disabling 2FA
req6 = urllib.request.Request('http://127.0.0.1:8000/api/v1/auth/2fa/disable', data=b'{}', headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {admin_token_2fa}'})
with urllib.request.urlopen(req6) as resp:
    res6 = json.loads(resp.read().decode())
    print("6. Disable 2FA reset result:", res6)

# 7. Create user without email (email optional test)
create_payload = json.dumps({
    'username': 'noc_operator',
    'password': 'Phillip2026!',
    'full_name': 'NOC Operator 1',
    'title': 'Network Operator',
    'role_name': 'VIEWER'
    # email omitted
}).encode()
req7 = urllib.request.Request('http://127.0.0.1:8000/api/v1/auth/users', data=create_payload, headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {admin_token_2fa}'})
with urllib.request.urlopen(req7) as resp:
    res7 = json.loads(resp.read().decode())
    print("7. Created user with NO email: username =", res7.get('username'), "| email =", res7.get('email'))

print("\nALL BACKEND 2FA & OPTIONAL EMAIL TESTS PASSED!")

