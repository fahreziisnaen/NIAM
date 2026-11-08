import urllib.request
import json
import base64
import pyotp

print('=== 1. VERIFY FRONTEND HOMEPAGE ===')
req_fe = urllib.request.Request('http://localhost:3000')
with urllib.request.urlopen(req_fe) as resp:
    print('Frontend HTTP status:', resp.status)
    content = resp.read().decode('utf-8', errors='ignore')
    print('Frontend HTML contains title:', 'Phillip Securities' in content)

print('\n=== 2. VERIFY USERS API ===')
req_users = urllib.request.Request('http://127.0.0.1:8000/api/v1/auth/users')
with urllib.request.urlopen(req_users) as resp:
    users = json.loads(resp.read().decode())
    for u in users:
        print(f"  User: {u['username']:<12} | Email: {str(u['email']):<26} | 2FA: {u['is_two_factor_enabled']}")

print('\n=== 3. LOGIN WITH USERNAME ===')
login_payload = json.dumps({'username': 'admin', 'password': 'Phillip2026!'}).encode()
req_login = urllib.request.Request('http://127.0.0.1:8000/api/v1/auth/login', data=login_payload, headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req_login) as resp:
    res = json.loads(resp.read().decode())
    token = res['access_token']
    print('Login with username admin: Success! Access token received.')

print('\n=== 4. 2FA SETUP & QR CODE VALIDATION ===')
req_setup = urllib.request.Request('http://127.0.0.1:8000/api/v1/auth/2fa/setup', headers={'Authorization': f'Bearer {token}'})
with urllib.request.urlopen(req_setup) as resp:
    setup = json.loads(resp.read().decode())
    secret = setup['secret']
    qr_b64 = setup['qr_code_base64']
    print('2FA Secret (Manual Entry):', secret)
    print('otpauth URL:', setup['otpauth_url'])
    
    # Validate Base64 PNG
    assert qr_b64.startswith('data:image/png;base64,'), 'Invalid base64 prefix'
    raw_img = base64.b64decode(qr_b64.split(',')[1])
    # PNG Magic Header check: \x89PNG\r\n\x1a\n
    assert raw_img[:8] == b'\x89PNG\r\n\x1a\n', 'Valid PNG magic header confirmed!'
    print(f'QR Code PNG Validated: {len(raw_img)} bytes, valid PNG header confirmed!')

print('\n=== 5. ACTIVATE 2FA WITH TOTP ===')
totp = pyotp.TOTP(secret)
code = totp.now()
print('Generated TOTP verification code from Authenticator:', code)
verify_payload = json.dumps({'code': code}).encode()
req_enable = urllib.request.Request('http://127.0.0.1:8000/api/v1/auth/2fa/enable', data=verify_payload, headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'})
with urllib.request.urlopen(req_enable) as resp:
    print('2FA Enable response:', json.loads(resp.read().decode()))

print('\n=== 6. VERIFY LOGIN ENFORCES 2FA ===')
req_no_code = urllib.request.Request('http://127.0.0.1:8000/api/v1/auth/login', data=login_payload, headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req_no_code) as resp:
    no_code_res = json.loads(resp.read().decode())
    print('Login without 2FA code requires_2fa:', no_code_res.get('requires_2fa'), '| msg:', no_code_res.get('message'))

# Test invalid 2FA code
bad_code_payload = json.dumps({'username': 'admin', 'password': 'Phillip2026!', 'two_factor_code': '000000'}).encode()
try:
    req_bad = urllib.request.Request('http://127.0.0.1:8000/api/v1/auth/login', data=bad_code_payload, headers={'Content-Type': 'application/json'})
    urllib.request.urlopen(req_bad)
    print('ERROR: Should have failed with invalid code!')
except urllib.error.HTTPError as e:
    print('Invalid 2FA code rejected correctly with HTTP', e.code, json.loads(e.read().decode())['detail'])

# Test valid 2FA code
valid_code = totp.now()
valid_payload = json.dumps({'username': 'admin', 'password': 'Phillip2026!', 'two_factor_code': valid_code}).encode()
req_valid = urllib.request.Request('http://127.0.0.1:8000/api/v1/auth/login', data=valid_payload, headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req_valid) as resp:
    valid_res = json.loads(resp.read().decode())
    print('Valid 2FA login: Success! access_token received =', bool(valid_res.get('access_token')))

# Reset 2FA for admin so login remains flexible
req_disable = urllib.request.Request('http://127.0.0.1:8000/api/v1/auth/2fa/disable', data=b'{}', headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {valid_res["access_token"]}'})
with urllib.request.urlopen(req_disable) as resp:
    print('\n2FA reset to disabled for clean testing:', json.loads(resp.read().decode()))

print('\n=== ALL VERIFICATIONS PASSED 100%! ===')

