# Disabled Plugins — Re-enable When Fixed

## Re-enabled on 2026-02-07

All 5 plugins that were disabled on 2026-02-06 have been **re-enabled**. They are now
published to npm with the `next` dist-tag and proper `dist/` contents.

| Plugin | npm Status | Action Taken |
|--------|-----------|--------------|
| `@elizaos/plugin-cli` | `2.0.0-alpha.3` (next) | Re-added to deps, CORE_PLUGINS, plugins-cli registry |
| `@elizaos/plugin-cron` | `2.0.0-alpha.3` (next) | Re-added to deps, CORE_PLUGINS, plugins-cli registry, FEATURE_PLUGINS |
| `@elizaos/plugin-local-embedding` | `2.0.0-alpha.3` (next) | Re-added to deps, CORE_PLUGINS |
| `@elizaos/plugin-trust` | `2.0.0-alpha.3` (next) | Re-added to deps, CORE_PLUGINS |
| `@elizaos/plugin-computeruse` | `2.0.0-alpha.4` (next) | Re-added to deps, CORE_PLUGINS |

---

## Remaining overrides

### `@elizaos/plugin-cli` override (kept)

`@elizaos/plugin-cli` is a transitive dependency of `@elizaos/plugin-browser` and
`@elizaos/plugin-acp` (published with `"@elizaos/plugin-cli": "2.0.0-alpha.3"`).
The override ensures all transitive references resolve to the `next` tag:

```json
"@elizaos/plugin-cli": "next"
```

### `@elizaos/computeruse` override (new)

`@elizaos/computeruse` is an optional peer dependency of `@elizaos/plugin-computeruse`.
It's a native Rust addon (napi-rs) that hasn't been published to npm yet. Since
`plugin-computeruse` works in MCP mode without it, we redirect the unresolvable
peer dep to `@elizaos/core` so the resolver is satisfied:

```json
"@elizaos/computeruse": "npm:@elizaos/core@next"
```

Remove this override once `@elizaos/computeruse` is published to npm.

---

## Added on 2026-02-07

### `@elizaos/plugin-plugin-manager`

Added to `CORE_PLUGINS` and `package.json` dependencies. This plugin provides:
- Dynamic plugin discovery from the **next@registry** branch
- Runtime plugin installation (npm or git clone to `~/.milaidy/plugins/installed/`)
- Plugin search, load, unload, and clone actions
- Registry browsing via agent actions and API endpoints

New API endpoints:
- `GET  /api/registry/plugins`      — browse all plugins
- `GET  /api/registry/plugins/:name` — plugin details
- `GET  /api/registry/search?q=...`  — search
- `POST /api/registry/refresh`       — force registry cache refresh
- `POST /api/plugins/install`        — install from registry + restart
- `POST /api/plugins/uninstall`      — uninstall + restart
- `GET  /api/plugins/installed`      — list user-installed plugins

New CLI commands:
- `milaidy plugins list [-q <query>]` — browse / search
- `milaidy plugins search <query>`    — search
- `milaidy plugins info <name>`       — detailed info
- `milaidy plugins install <name>`    — install
- `milaidy plugins uninstall <name>`  — uninstall
- `milaidy plugins installed`         — list installed
- `milaidy plugins refresh`           — refresh cache

---

## Still disabled (other reasons — not in original list)

These plugins remain commented out in `CORE_PLUGINS` for reasons unrelated to npm resolution:

| Plugin | Reason |
|--------|--------|
| `@elizaos/plugin-form` | Published without `dist/` — npm package is empty |
| `@elizaos/plugin-browser` | Stale `workspace:*` dep on `@elizaos/plugin-cli` causes missing export |
| `@elizaos/plugin-code` | Spec name mismatch (`coderStatusProvider` vs `CODER_STATUS`) in published package |
| `@elizaos/plugin-goals` | `actions.json` has placeholder data — missing CANCEL_GOAL, CREATE_GOAL, etc. |
| `@elizaos/plugin-scheduling` | Published without `dist/` — npm package is empty |
| `@elizaos/plugin-vision` | `@tensorflow/tfjs-node` native addon fails to build on macOS |
