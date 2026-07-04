# Security Architecture

## 1. Overview

Security is a foundational concern for LifeOS given the sensitive nature of personal data — goals, health metrics, journal entries, relationship details, and AI memory.

---

## 2. Security Principles

1. **Defense in depth** — multiple security layers protect data at rest, in transit, and in use
2. **Least privilege** — users and services have minimum necessary access
3. **Privacy by design** — data collection is minimal, purposeful, and transparent
4. **Zero trust** — verify every request, regardless of source
5. **Encrypt everything** — data encrypted at rest and in transit
6. **Audit everything** — all access logged and monitored

---

## 3. Authentication

**Provider:** Supabase Auth

| Method | Support |
|---|---|
| Email + Password | Yes (with email verification) |
| Google OAuth | Yes |
| Apple OAuth | Yes |
| GitHub OAuth | Yes |
| Magic Link | Yes |
| SMS (OTP) | Future |
| Passkeys | Future |

**Password requirements:**
- Minimum 8 characters
- At least 1 uppercase, 1 lowercase, 1 number
- Optional: 2FA (TOTP via authenticator app)

---

## 4. Authorization

### 4.1 Permission Model

LifeOS uses a strict User-Ownership Isolation model:

- Every resource belongs directly to a single `userId`.
- No cross-user access is permitted in the MVP.
- All database queries filter implicitly by the authenticated `userId`.

---

## 5. Data Encryption

### 5.1 In Transit

| Layer | Protocol |
|---|---|
| Client → Server | TLS 1.3 |
| Server → Server | mTLS (internal) |
| WebSocket | WSS (TLS) |

### 5.2 At Rest

| Data Type | Encryption | Key Management |
|---|---|---|
| **All database data** | AES-256 (PostgreSQL TDE) | Cloud provider KMS |
| **PII** | Column-level encryption (pgcrypto) | Application-level key |
| **Health data** | Column-level encryption | User-specific key |
| **Journal entries** | Column-level encryption | User-specific key |
| **AI Memory** | Encrypted at rest | Application-level key |
| **File uploads** | Client-side encryption + server encryption | User-specific key |
| **Backups** | AES-256 | Separate backup key |

### 5.3 End-to-End Encryption (Future)

For maximum privacy, sensitive data types (journal, health) will optionally support E2EE where the server cannot decrypt the data.

---

## 6. API Security

| Measure | Implementation |
|---|---|
| **JWT validation** | Every request verified via Supabase Auth |
| **Rate limiting** | Per-user, per-endpoint limits |
| **CORS** | Whitelist of allowed origins |
| **CSRF** | SameSite cookies + CSRF tokens for cookie auth |
| **Input validation** | Zod schemas on every endpoint |
| **SQL injection prevention** | Parameterized queries via Prisma |
| **Request size limits** | 10MB max request body |
| **IP blocking** | Automatic after N failed attempts |

---

## 7. AI Security

| Concern | Mitigation |
|---|---|
| **Prompt injection** | Input sanitization; system prompt isolation |
| **Data leakage in prompts** | Minimize context sent to external models |
| **Model output validation** | Parse with Zod; strip unexpected content |
| **Sensitive data to external APIs** | Never send PII/health data to AI models |
| **AI model access** | API keys rotated; IP-restricted access |
| **Jailbreak attempts** | Detect and block; rate-limit abusive patterns |

---

## 8. Data Retention & Deletion

| Data Type | Retention | Deletion Behavior |
|---|---|---|
| **Active user data** | Until account deletion | Hard delete |
| **Deleted data** | 30 days (soft delete) | Purging after 30 days |
| **Analytics** | 2 years (anonymized) | Aggregate data retained |
| **AI chat logs** | 90 days | Hard delete |
| **Backups** | 30 days | Automatic purge |
| **Audit logs** | 1 year | Auto-archive |

**Account deletion flow:**
1. User initiates deletion
2. 7-day grace period (reversible)
3. All data soft-deleted
4. 30-day permanent deletion window
5. Data purged irreversibly
6. Confirmation sent

---

## 9. Compliance

| Standard | Status | Notes |
|---|---|---|
| **GDPR** | Compliant | Full data portability, right to deletion |
| **CCPA** | Compliant | Opt-out of data sale (we don't sell) |
| **SOC 2 Type II** | Target (Phase 2) | Security + availability + confidentiality |
| **HIPAA** | Not applicable | Unless health data sharing with providers |
| **COPPA** | Compliant | No children under 13 |

---

## 10. Security Incident Response

| Phase | Actions | Timeline |
|---|---|---|
| **Detection** | Automated monitoring alerts | Immediate |
| **Triage** | Assess severity and impact | < 15 min |
| **Containment** | Isolate affected systems | < 60 min |
| **Investigation** | Root cause analysis | < 4 hours |
| **Remediation** | Fix vulnerability | < 24 hours |
| **Communication** | Notify affected users | < 72 hours |
| **Post-mortem** | Document and improve | < 1 week |

---

## 11. Related Documents

- [ARCHITECTURE.md](./ARCHITECTURE.md) — Network architecture and service isolation
- [AI_MEMORY.md](./AI_MEMORY.md) — Memory data security
