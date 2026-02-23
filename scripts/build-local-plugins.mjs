#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, realpathSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const localPlugins = [
  {
    npmName: "@elizaos/plugin-pi-ai",
    dirs: [
      path.join(root, "node_modules", "@elizaos", "plugin-pi-ai"),
      path.join(root, "packages", "plugin-pi-ai"),
    ],
  },
  {
    npmName: "@elizaos/plugin-moltbook",
    dirs: [
      path.join(root, "node_modules", "@elizaos", "plugin-moltbook"),
      path.join(root, "packages", "plugin-moltbook"),
    ],
  },
];

const toBuild = [];
for (const plugin of localPlugins) {
  const uniqueDirs = [];
  const seen = new Set();
  for (const dir of plugin.dirs) {
    if (!existsSync(dir)) continue;
    const resolved = realpathSync(dir);
    if (seen.has(resolved)) continue;
    seen.add(resolved);
    uniqueDirs.push(dir);
  }

  for (const dir of uniqueDirs) {
    toBuild.push({ npmName: plugin.npmName, dir });
  }
}

if (toBuild.length === 0) {
  console.log(
    "[build-local-plugins] No local plugin directories found, skipping.",
  );
  process.exit(0);
}

for (const entry of toBuild) {
  console.log(
    `[build-local-plugins] Building ${entry.npmName} in ${entry.dir}`,
  );
  const result = spawnSync("bun", ["run", "build"], {
    cwd: entry.dir,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
