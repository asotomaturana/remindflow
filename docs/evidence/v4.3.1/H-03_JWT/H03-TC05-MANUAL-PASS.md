# H03-TC05 — Manual verification jwt.io
**Date:** 15 May 2026
**Executed by:** Alejandro Soto Maturana
**Result:** PASS

## Verified
- iat: 1778898784 — 10 digits confirmed (seconds, not milliseconds) ✅
- exp: 1778927584 — 10 digits confirmed ✅
- exp - iat = 28800 — exactly 8 hours ✅
- username and role present in payload ✅
- Token structure: Valid JWT ✅

## Note on signature
jwt.io shows "Invalid Signature" because the JWT_SECRET was not provided
to the debugger. This is expected — the secret must never be shared.
The token structure and claims are correct.

## Screenshots
- H03-TC05-01-token-postman.png
- H03-TC05-02-payload-decoded.png