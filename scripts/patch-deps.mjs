#!/usr/bin/env node
/**
 * Post-install patch for @elizaos/plugin-sql
 *
 * Adds .onConflictDoNothing() to createWorld() to prevent
 * "duplicate key value violates unique constraint" errors on the worlds
 * table when ensureWorldExists() is called more than once for the same world.
 *
 * This can be removed once @elizaos/plugin-sql publishes a version with the
 * fix (already merged in source: WorldStore.create uses onConflictDoNothing).
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const target = resolve(
  root,
  "node_modules/@elizaos/plugin-sql/dist/node/index.node.js",
);

if (!existsSync(target)) {
  console.log("[patch-deps] plugin-sql dist not found, skipping patch.");
  process.exit(0);
}

const src = readFileSync(target, "utf8");

const buggy = `await this.db.insert(worldTable).values({
        ...world,
        id: newWorldId,
        name: world.name || ""
      });`;

const fixed = `await this.db.insert(worldTable).values({
        ...world,
        id: newWorldId,
        name: world.name || ""
      }).onConflictDoNothing();`;

if (src.includes(fixed)) {
  console.log("[patch-deps] plugin-sql already patched, nothing to do.");
  process.exit(0);
}

if (!src.includes(buggy)) {
  console.log(
    "[patch-deps] plugin-sql createWorld() signature changed — patch may no longer be needed.",
  );
  process.exit(0);
}

writeFileSync(target, src.replace(buggy, fixed), "utf8");
console.log(
  "[patch-deps] Patched plugin-sql createWorld() with onConflictDoNothing().",
);
