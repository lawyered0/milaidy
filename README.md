# Milaidy — Personal AI Assistant

**Milaidy** is a _personal AI assistant_ you run on your own devices, built on [ElizaOS](https://github.com/elizaos).
The Gateway is the control plane that manages sessions, tools, and events. It connects to messaging platforms, companion apps, and a WebChat UI.

If you want a personal, single-user assistant that feels local, fast, and always-on, this is it.

## Install

Runtime: **Node >= 22**. Works with npm or bun.

### One-line install (recommended)

macOS / Linux / WSL:

```bash
curl -fsSL https://milady-ai.github.io/install.sh | bash
```

Windows (PowerShell):

```powershell
irm https://milady-ai.github.io/install.ps1 | iex
```

The installer checks for Node.js, installs it if needed, then installs milaidy globally and runs initial setup.

### Manual install

```bash
npm install -g milaidy
# or
npx milaidy
# or
bunx milaidy
```

Then run setup:

```bash
milaidy setup
```

## Quick start

```bash
milaidy onboard --install-daemon

milaidy gateway --port 18789 --verbose

# Send a message
milaidy message send --to +1234567890 --message "Hello from Milaidy"

# Talk to the assistant
milaidy agent --message "Ship checklist" --thinking high
```

Upgrading? Run `milaidy doctor` after updating.

## Models

**Subscriptions (OAuth):**

- **[Anthropic](https://www.anthropic.com/)** (Claude Pro/Max)
- **[OpenAI](https://openai.com/)** (ChatGPT/Codex)

Any model is supported, but **Anthropic Pro/Max (100/200) + Opus 4.5** is recommended for long-context strength and better prompt-injection resistance.

## From source (development)

Prefer `pnpm` for builds from source. Bun is optional for running TypeScript directly.

```bash
git clone https://github.com/milady-ai/milaidy.git
cd milaidy

pnpm install
pnpm ui:build   # auto-installs UI deps on first run
pnpm build

pnpm milaidy onboard --install-daemon

# Dev loop (auto-reload on TS changes)
pnpm gateway:watch
```

`pnpm milaidy ...` runs TypeScript directly (via `tsx`). `pnpm build` produces `dist/` for running via Node / the packaged `milaidy` binary.

## Configuration

Minimal `~/.milaidy/milaidy.json`:

```json5
{
  agent: {
    model: "anthropic/claude-opus-4-5",
  },
}
```

## Agent workspace + skills

- Workspace root: `~/.milaidy/workspace` (configurable via `agents.defaults.workspace`).
- Injected prompt files: `AGENTS.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`.
- Skills: `~/.milaidy/workspace/skills/<skill>/SKILL.md`.

## Security model

- **Default:** tools run on the host for the **main** session, so the agent has full access when it's just you.
- **Group/channel safety:** set `agents.defaults.sandbox.mode: "non-main"` to run non-main sessions inside per-session Docker sandboxes.

## Chat commands

- `/status` — session status (model + tokens, cost)
- `/new` or `/reset` — reset the session
- `/compact` — compact session context (summary)
- `/think <level>` — off|minimal|low|medium|high|xhigh
- `/verbose on|off`
- `/usage off|tokens|full` — per-response usage footer
- `/restart` — restart the gateway

## License

MIT
