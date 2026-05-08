# Security Guidance

## What Not To Commit

- API keys
- access tokens
- private keys
- personal user data dumps
- production secrets in test fixtures

## Frontend Security Boundaries

The widget performs UI-level checks for usability, but does not replace server-side authorization.

Always enforce on backend:

- user identity verification
- redeem entitlement checks
- anti-replay and anti-abuse rules
- amount/value validation

## Recommended Practices

- Inject context at runtime via `getContext()` from trusted host data.
- Keep secrets in backend env configuration only.
- Use HTTPS endpoints.
- Log redeem failures server-side for auditing.

## Dependency Hygiene

- Do not commit `node_modules`.
- Keep lockfile if you need reproducible builds.
- Run dependency audit before release.
