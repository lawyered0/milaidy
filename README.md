# Milaidy

> *your schizo AI waifu that actually respects your privacy*

**Milaidy** is a personal AI assistant that runs on YOUR machine. Not some glowie datacenter. Not the cloud. YOUR computer. Built on [ElizaOS](https://github.com/elizaos) because we're not reinventing the wheel, we're making it based.

manages your sessions, tools, and vibes through a Gateway control plane. Connects to Telegram, Discord, whatever normie platform you use. Has a cute WebChat UI too.

tl;dr: local AI gf that's actually fast and doesn't phone home

## Downloads (touch grass edition)

### Desktop App

Grab the latest from **[Releases](https://github.com/milady-ai/milaidy/releases/latest)**:

| Platform | Link | Notes |
|---|---|---|
| macOS (Apple Silicon) | [`Milaidy-arm64.dmg`](https://github.com/milady-ai/milaidy/releases/latest) | for your overpriced rectangle |
| macOS (Intel) | [`Milaidy-x64.dmg`](https://github.com/milady-ai/milaidy/releases/latest) | boomer mac |
| Windows | [`Milaidy-Setup.exe`](https://github.com/milady-ai/milaidy/releases/latest) | for the gamer anons |
| Linux | [`Milaidy.AppImage`](https://github.com/milady-ai/milaidy/releases/latest) / [`.deb`](https://github.com/milady-ai/milaidy/releases/latest) | I use arch btw |

macOS builds are signed and notarized. No scary Gatekeeper warnings. We're legit frfr.

### Verify checksums (for the paranoid kings)

Every release has `SHA256SUMS.txt`. Trust but verify:

```bash
# macOS / Linux
cd ~/Downloads
curl -fsSLO https://github.com/milady-ai/milaidy/releases/latest/download/SHA256SUMS.txt
shasum -a 256 --check --ignore-missing SHA256SUMS.txt
```

```powershell
# Windows (PowerShell)
cd ~\Downloads
Invoke-WebRequest -Uri "https://github.com/milady-ai/milaidy/releases/latest/download/SHA256SUMS.txt" -OutFile SHA256SUMS.txt
Get-FileHash .\Milaidy-Setup.exe -Algorithm SHA256
Get-Content .\SHA256SUMS.txt
# compare manually, you're smart enough
```

## Quick Start (literally 1 command)

```bash
npx milaidy
```

First run walks you through:
1. **Name your agent** (or get a random one if you're indecisive)
2. **Pick a personality** (tsundere? helpful? unhinged?)
3. **Connect a brain** (API key or local model)

Dashboard spawns at `http://localhost:18789`. Go say hi.

## Install

**Node >= 22** required. npm or bun, we don't judge.

### One-liner (recommended)

macOS / Linux / WSL:
```bash
curl -fsSL https://milady-ai.github.io/milaidy/install.sh | bash
```

Windows (PowerShell):
```powershell
irm https://milady-ai.github.io/milaidy/install.ps1 | iex
```

Checks for Node, installs if missing, sets everything up. Easy mode.

### Manual (for control freaks)

```bash
npm install -g milaidy
milaidy start
```

### npx (commitment issues)

```bash
npx milaidy
# or
bunx milaidy
```

## Commands

```bash
milaidy start          # wake her up
milaidy setup          # first-time setup / refresh workspace
milaidy dashboard      # open the pretty UI
milaidy configure      # config wizard
milaidy config get <key>  # peek at config values
milaidy models         # what brains are available
milaidy plugins list   # list plugins
milaidy --help         # help I'm lost
```

After updating, run `milaidy setup` to refresh. She likes a clean house.

### Ports

- **Gateway**: `http://localhost:18789` (the brain)
- **Dashboard**: `http://localhost:2138` (the face)

Override if you're special:
```bash
export MILAIDY_GATEWAY_PORT=19000
export MILAIDY_PORT=3000
```

## Models (pick your fighter)

Choose during onboarding or configure later. Multiple options because freedom.

**Cloud (requires API key, costs money):**

| Provider | Env Variable | Vibe |
|---|---|---|
| [Anthropic](https://www.anthropic.com/) | `ANTHROPIC_API_KEY` | **Recommended** — Claude is cracked |
| [OpenAI](https://openai.com/) | `OPENAI_API_KEY` | GPT-4o, o1, the classics |
| [OpenRouter](https://openrouter.ai/) | `OPENROUTER_API_KEY` | 100+ models, one API |
| [Google Gemini](https://ai.google.dev/) | `GOOGLE_API_KEY` | big brain energy |
| [xAI](https://x.ai/) | `XAI_API_KEY` | Grok-2, based and Elon-pilled |
| [Groq](https://groq.com/) | `GROQ_API_KEY` | fast af boi |
| [DeepSeek](https://deepseek.com/) | `DEEPSEEK_API_KEY` | chinese reasoning arc |

**Local (free, no API key, no data leaving your machine):**

| Provider | Setup |
|---|---|
| [Ollama](https://ollama.ai/) | Install Ollama, select during onboarding. Full schizo mode. |

**Hot take:** Anthropic Pro/Max subscription + Opus 4.5 = god tier. Long context, resists jailbreaks, actually smart.

## Wallets (we're so back)

First-class EVM and Solana support. Wallets auto-generate on first run. Private keys stay LOCAL. We're not FTX.

### Auto-generated

Fresh keypairs for EVM (Ethereum/Base/Arbitrum/etc) and Solana. Keys stored in your config, never leaves your machine. Pinky promise.

### Bring your own keys

Set in `~/.milaidy/milaidy.json` or env vars:

```bash
# EVM (Ethereum, Base, Arbitrum, etc.)
export EVM_PRIVATE_KEY="0x..."

# Solana
export SOLANA_PRIVATE_KEY="..."  # base58
```

### Check your bags

For token balances and NFT viewing:

```bash
export ALCHEMY_API_KEY="..."   # EVM chains
export HELIUS_API_KEY="..."    # Solana
```

Or configure in dashboard. She'll show you your portfolio.

### Supported chains

- **EVM:** Ethereum, Base, Arbitrum, Optimism, Polygon
- **Solana:** Mainnet (SPL tokens + NFTs)

## Configuration

Config lives at `~/.milaidy/milaidy.json`

Minimal:
```json5
{
  agent: {
    model: "anthropic/claude-opus-4-5",
  },
}
```

Secrets go in `~/.milaidy/.env` or the config's `env` section:
```json5
{
  env: {
    ANTHROPIC_API_KEY: "sk-ant-...",
  },
}
```

## Workspace & Skills

- **Workspace:** `~/.milaidy/workspace`
- **Prompt files:** `AGENTS.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`
- **Skills:** `~/.milaidy/workspace/skills/<skill>/SKILL.md`

Customize her personality. Make her based. Make her cringe. Your call.

## Security

- **Default:** tools run on host for main session. Full power for solo use.
- **Multi-user:** set `agents.defaults.sandbox.mode: "non-main"` to sandbox non-main sessions in Docker. Keep the randos contained.

## Chat Commands

| Command | What it do |
|---|---|
| `/status` | session status, token count, how much you've spent |
| `/new` or `/reset` | memory wipe, fresh start |
| `/compact` | compress context (she summarizes) |
| `/think <level>` | off\|minimal\|low\|medium\|high\|xhigh |
| `/verbose on\|off` | chatty or quiet |
| `/usage off\|tokens\|full` | show token usage per message |
| `/restart` | reboot the gateway |

## Build from Source (gigachad mode)

Requires **Bun**.

```bash
git clone https://github.com/milady-ai/milaidy.git
cd milaidy

bun install
bun run ui:build   # builds the pretty UI
bun run build

bun run milaidy start

# Dev mode (hot reload)
bun run dev
```

### Desktop app build

```bash
bun run build:desktop
```

### Release builds

CI handles signing and notarization. See `.github/workflows/release.yml`.

Required secrets for macOS:
- `CSC_LINK` — base64 .p12 cert
- `CSC_KEY_PASSWORD` — cert password
- `APPLE_ID` — dev account email
- `APPLE_APP_SPECIFIC_PASSWORD` — from [appleid.apple.com](https://appleid.apple.com)
- `APPLE_TEAM_ID` — team ID

No secrets = no release. We take signing seriously.

## License

MIT — do whatever, just don't be evil

---

*made with love by anons who believe AI should be personal, private, and actually useful*

*wagmi*
