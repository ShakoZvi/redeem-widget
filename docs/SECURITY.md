# Security Guidance

The redeem widget runs in the browser. Its primary job is UX: collecting user intent and reflecting backend state. Everything that matters for security must be enforced on the server.

This document spells out the boundary and lists practical recommendations for host projects.

---

## Security boundary

| Layer | Trusted? | Responsibility |
| ----- | -------- | -------------- |
| Backend (`redeem_bank.php`, `user_redeem.php`, custom APIs) | Yes | Authentication, authorization, redeem eligibility, value validation, audit logging. |
| Widget UI | No | Visual filtering, button state, modal UX. **Cannot** be the source of truth. |
| Host page | Partially | Provides user/session metadata that is already trusted by the backend (e.g. `data-user-hash` derived server-side). |

**Anything a client can change should be revalidated server-side.** Treat the widget as a hostile environment; assume any field can be tampered with.

---

## What never belongs in the repo (or git history)

- API keys, OAuth client secrets, signing keys
- Production user data dumps, even anonymized
- Backend-private tokens, even as defaults
- `.env*` files, except `.env.example`
- Hardcoded internal hostnames or VPN URLs

The package itself ships no such data. Host projects should keep:

- `.gitignore` entries for `node_modules`, build artifacts, secrets
- a separate secrets manager (Vault, AWS SM, etc.) for production credentials

---

## What MUST be enforced server-side

For every redeem request, the backend must independently verify:

1. **Identity** — session/cookie or hashed token. Do not trust `user_id` posted by the client.
2. **Eligibility** — user actually owns this freespin/prize.
3. **Amount/value** — `amount`, `prize_type_id`, and any monetary fields match server records.
4. **State** — game is not already redeemed, not expired, not blocked.
5. **Anti-replay** — reject duplicate requests within a time window.
6. **Rate limiting** — per-user and per-IP throttles.
7. **Audit logging** — record every redeem attempt with outcome.

The widget's `rules` config (`requireEligibleFrsp`, `minAmountToEnable`, `requireAffordableBalance`) is **UX only**. It hides obviously-unredeemable items to reduce noise; it never blocks an authenticated request from reaching the backend.

---

## Recommended host-side practices

### Context injection

Use `getContext()` to source identity from trusted runtime values:

```ts
getContext: () => ({
  user_id: document.body.dataset.userId,
  userHash: document.body.dataset.userHash,
}),
```

These attributes should themselves be rendered by the backend, so the value reflects whatever the server already trusts to receive on subsequent requests.

### CSRF

If your endpoints require a CSRF token, inject it into `getContext()`:

```ts
getContext: () => ({
  user_id: document.body.dataset.userId,
  csrf: document.querySelector('meta[name="csrf-token"]').content,
}),
```

Validate on the backend on every `redeem` call.

### Transport hardening

- Always serve endpoints over HTTPS.
- Reject non-POST methods on redeem endpoints.
- Set strict `SameSite=Lax` (or `Strict`) on session cookies.
- Disable `Access-Control-Allow-Origin: *` for redeem endpoints; use an allowlist.
- Set short cookie/token expirations and refresh server-side.

### Content Security Policy

The widget injects HTML into the DOM at runtime. If you use a strict CSP, allow:

- inline styles only if you set `style-src 'self' 'unsafe-inline'` *(or* refactor the package to ship hashed styles externally)*.
- avoid `'unsafe-eval'` — the package does not need it.

A typical CSP for hosts:

```text
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
connect-src 'self' https://api.example.com;
```

### Logging

Server-side:

- Log every redeem attempt with userId, prize_type_id, source IP, and outcome.
- Alert on spikes in failures or `redeem_status: false`.

Client-side:

- Avoid logging sensitive data in `hooks.onRedeemError` to consoles in production.

---

## Dependency hygiene

- Keep `package-lock.json` committed for reproducible builds.
- Run `npm audit` regularly; treat high/critical advisories as release blockers.
- Pin the widget version (a git ref or tag) so updates are intentional.

```json
{
  "dependencies": {
    "@redeem/widget": "git+https://github.com/ShakoZvi/redeem-widget.git#v0.2.0"
  }
}
```

---

## Auditing the package source

The package contains:

- pure TypeScript modules (no eval, no Function constructor)
- DOM rendering via plain `innerHTML` templating from sanitized config strings
- network calls only via `transport` (host-controlled)
- no third-party runtime dependencies in the build artifact

When upgrading:

1. Diff `dist/redeem-widget.umd.js` and `dist/redeem-widget.css`.
2. Diff `src/` for any new fetch/eval sites.
3. Verify the postinstall script still only copies `dist/*` files.

---

## Reporting security issues

If you discover a vulnerability in the widget:

1. Do not open a public issue.
2. Contact the maintainer privately via the repository owner.
3. Provide reproduction steps and impact analysis.

Fixes will be released as patch versions and tagged accordingly.
