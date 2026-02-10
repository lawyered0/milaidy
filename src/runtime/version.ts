import { createRequire } from "node:module";
import process from "node:process";

declare const __MILAIDY_VERSION__: string | undefined;

const require = createRequire(import.meta.url);

function readVersionFromPackageJson(): string | null {
  try {
    const pkg = require("../../package.json") as { version?: string };
    return pkg.version ?? null;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "MODULE_NOT_FOUND") {
      return null;
    }
    throw err;
  }
}

function readVersionFromBuildInfo(): string | null {
  for (const candidate of [
    "../../build-info.json",
    "../build-info.json",
    "./build-info.json",
  ]) {
    try {
      const info = require(candidate) as { version?: string };
      if (info.version) return info.version;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "MODULE_NOT_FOUND") {
        throw err;
      }
    }
  }
  return null;
}

// Single source of truth for the current Milaidy version.
// - Embedded/bundled builds: injected define or env var.
// - Dev/npm builds: package.json.
export const VERSION =
  (typeof __MILAIDY_VERSION__ === "string" && __MILAIDY_VERSION__) ||
  process.env.MILAIDY_BUNDLED_VERSION ||
  readVersionFromPackageJson() ||
  readVersionFromBuildInfo() ||
  "0.0.0";
