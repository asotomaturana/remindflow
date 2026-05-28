# H08-TC05 — Mensaje que falla 1 vez y luego funciona queda en sent
**Date:** 28 May 2026
**Executed by:** Alejandro Soto Maturana
**Result:** BLOCKED

## Reason
This test case requires controlling a failure on the first attempt
and a success on the second attempt. This requires temporarily
breaking and restoring credentials in a controlled environment —
not safe to execute in production.

## When to execute
Set up a local environment. Break credentials before first retry,
restore them before second retry. Verify:
- retryCount: 1
- status: sent
- lastError: contains previous error message

## Risk assessment
Low — same as H08-TC04. Schema fields verified through TC01-TC03.