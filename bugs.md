# Milaidy Bug Ledger

Canonical tracker for security and reliability findings.

## Handled

### Bug #001

**Bug ID**: BUG-2026-001  
**Severity**: Critical  
**Component**: API / WebSocket upgrade auth  
**Platform**: All  
**Description**: Unauthenticated `/ws` upgrades bypassed API token and origin checks.  
**Steps to Reproduce**:
1. Set `MILAIDY_API_TOKEN`.
2. Attempt a WebSocket upgrade to `/ws` without a valid bearer token.
3. Observe unauthorized upgrade acceptance (pre-fix).
**Expected**: Unauthorized or disallowed-origin upgrade attempts are rejected.  
**Actual**: Upgrade path accepted connections without enforcing auth/origin boundary.  
**Fix Reference**: PR #171  
**Commit Reference**: a6300ad  
**Status**: Handled

### Bug #002

**Bug ID**: BUG-2026-002  
**Severity**: High  
**Component**: Runtime / Optional plugin enablement (`@elizaos/plugin-pdf`)  
**Platform**: All  
**Description**: Vulnerable PDF dependency chain (`pdfjs-dist`, advisory `GHSA-wgrm-67xf-hhpq`) was enableable via optional plugin flow.  
**Steps to Reproduce**:
1. Run `bun audit`.
2. Observe vulnerable chain includes `@elizaos/plugin-pdf -> pdfjs-dist`.
3. Enable optional PDF plugin path (pre-fix).
**Expected**: Known-vulnerable plugin path is blocked until dependency chain is remediated.  
**Actual**: Plugin could be enabled/loaded despite known high-severity advisory.  
**Fix Reference**: PR #174  
**Commit Reference**: 2ed3455  
**Status**: Handled

### Bug #003

**Bug ID**: BUG-2026-003  
**Severity**: High  
**Component**: Wallet / Private key export API  
**Platform**: All  
**Description**: `POST /api/wallet/export` exposed raw private keys with only `{ "confirm": true }` as gating.  
**Steps to Reproduce**:
1. Call `POST /api/wallet/export` with `{ "confirm": true }`.
2. Observe private keys returned when API auth is satisfied (pre-fix).
**Expected**: Export requires explicit step-up secret in addition to confirmation.  
**Actual**: Single in-band confirmation value was sufficient.  
**Fix Reference**: PR #176  
**Commit Reference**: 47da826, b405331  
**Status**: Handled

## Open

### Bug #004

**Bug ID**: BUG-2026-004  
**Severity**: High  
**Component**: API / Plugin config env mutation  
**Platform**: All  
**Description**: `PUT /api/plugins/:id` applies `body.config` entries directly into `process.env` without restricting keys to plugin-defined params. `validatePluginConfig()` checks required params but does not reject unexpected keys (`_configKeys` is unused).  
**Evidence Commands**:
1. `nl -ba src/api/server.ts | sed -n '2990,3034p'`
2. `nl -ba src/api/plugin-validation.ts | sed -n '82,155p'`
3. `rg -n "PUT /api/plugins/:id|body.config|process.env\\[key\\] = value|validatePluginConfig\\(" src/api/server.ts src/api/plugin-validation.ts`
**Why this matters**: An attacker with API access can set sensitive runtime env vars outside intended plugin scope (for example step-up tokens), weakening auth boundaries and enabling secret/behavior manipulation.  
**Initial Mitigation Note**: Enforce strict allowlist (`plugin.parameters[].key` only), reject unknown keys with `422`, and apply blocked-key filtering before any env mutation.  
**Next Action**: Patch `PUT /api/plugins/:id` to validate allowed keys and add regression tests proving unknown/sensitive keys are rejected.  
**Status**: Open
