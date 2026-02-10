/**
 * Auth module — subscription-based OAuth for Claude Max and Codex Pro.
 *
 * Uses @mariozechner/pi-ai for OAuth flows (PKCE, token exchange, refresh).
 * Adds server-side credential storage and env var injection on top.
 */

export type { AnthropicFlow } from "./anthropic.js";
// Anthropic (Claude Pro/Max)
export { refreshAnthropicToken, startAnthropicLogin } from "./anthropic.js";
// Claude Code setup token runtime support
export { applyClaudeCodeStealth } from "./apply-stealth.js";
// Credential storage + management
export {
  applySubscriptionCredentials,
  deleteCredentials,
  getAccessToken,
  getSubscriptionStatus,
  hasValidCredentials,
  loadCredentials,
  saveCredentials,
} from "./credentials.js";
export type { CodexFlow } from "./openai-codex.js";
// OpenAI Codex (ChatGPT Plus/Pro)
export { refreshCodexToken, startCodexLogin } from "./openai-codex.js";

// Types
export type {
  OAuthCredentials,
  StoredCredentials,
  SubscriptionProvider,
} from "./types.js";
