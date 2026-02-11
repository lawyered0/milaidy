/**
 * Navigation — tabs + onboarding.
 */

export type Tab =
  | "chat"
  | "apps"
  | "agent"
  | "plugins"
  | "advanced"
  | "trajectories"
  | "voice"
  | "runtime"
  | "database"
  | "settings"
  | "logs";

export const TAB_GROUPS = [
  { label: "Chat", tabs: ["chat"] as Tab[] },
  { label: "Apps", tabs: ["apps"] as Tab[] },
  { label: "Agent", tabs: ["agent"] as Tab[] },
  {
    label: "Advanced",
    tabs: [
      "advanced",
      "plugins",
      "trajectories",
      "runtime",
      "database",
      "logs",
    ] as Tab[],
  },
  { label: "Settings", tabs: ["settings"] as Tab[] },
] as const;

const TAB_PATHS: Record<Tab, string> = {
  chat: "/chat",
  apps: "/apps",
  agent: "/agent",
  plugins: "/plugins",
  advanced: "/advanced",
  trajectories: "/trajectories",
  voice: "/voice",
  runtime: "/runtime",
  database: "/database",
  settings: "/settings",
  logs: "/logs",
};

/** Legacy path redirects — old paths that now map to new tabs. */
const LEGACY_PATHS: Record<string, Tab> = {
  "/game": "apps",
  "/character": "agent",
  "/inventory": "agent",
  "/features": "plugins",
  "/connectors": "plugins",
  "/skills": "plugins",
  "/admin": "advanced",
  "/config": "settings",
  "/fine-tuning": "agent",
  "/triggers": "agent",
};

const PATH_TO_TAB = new Map(
  Object.entries(TAB_PATHS).map(([tab, p]) => [p, tab as Tab]),
);

export function pathForTab(tab: Tab, basePath = ""): string {
  const base = normalizeBasePath(basePath);
  const p = TAB_PATHS[tab];
  return base ? `${base}${p}` : p;
}

export function tabFromPath(pathname: string, basePath = ""): Tab | null {
  const base = normalizeBasePath(basePath);
  let p = pathname || "/";
  if (base) {
    if (p === base) p = "/";
    else if (p.startsWith(`${base}/`)) p = p.slice(base.length);
  }
  let normalized = normalizePath(p).toLowerCase();
  if (normalized.endsWith("/index.html")) normalized = "/";
  if (normalized === "/") return "chat";
  if (normalized === "/voice") return "settings";
  // Check current paths first, then legacy redirects
  return PATH_TO_TAB.get(normalized) ?? LEGACY_PATHS[normalized] ?? null;
}

function normalizeBasePath(basePath: string): string {
  if (!basePath) return "";
  let base = basePath.trim();
  if (!base.startsWith("/")) base = `/${base}`;
  if (base === "/") return "";
  if (base.endsWith("/")) base = base.slice(0, -1);
  return base;
}

function normalizePath(p: string): string {
  if (!p) return "/";
  let normalized = p.trim();
  if (!normalized.startsWith("/")) normalized = `/${normalized}`;
  if (normalized.length > 1 && normalized.endsWith("/")) normalized = normalized.slice(0, -1);
  return normalized;
}

export function titleForTab(tab: Tab): string {
  switch (tab) {
    case "chat": return "Chat";
    case "apps": return "Apps";
    case "agent": return "Agent";
    case "plugins": return "Plugins";
    case "advanced": return "Advanced";
    case "trajectories": return "Trajectories";
    case "voice": return "Voice";
    case "runtime": return "Runtime";
    case "database": return "Databases";
    case "settings": return "Settings";
    case "logs": return "Logs";
    default: return "Milaidy";
  }
}
