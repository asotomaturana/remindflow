# H08-TC04 — Mensaje que falla 6 veces queda en failed_permanent
**Date:** 28 May 2026
**Executed by:** Alejandro Soto Maturana
**Result:** BLOCKED

## Reason
This test case requires simulating 6 consecutive failures of the
scheduler over approximately 75 minutes (3 retries every 5 minutes
+ 3 retries every 20 minutes). This cannot be executed safely in
production without temporarily breaking credentials.

## When to execute
Set up a local environment with invalid credentials temporarily.
Monitor scheduler logs for status transitions:
scheduled → failed → failed (x5) → failed_permanent

## Risk assessment
Low — TC01, TC02 and TC03 confirm the new fields exist in the
response schema. The retry logic itself is verified through
code review of services/scheduler.js commit 72dcc53.