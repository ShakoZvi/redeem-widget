#!/usr/bin/env node

import { mkdir, copyFile, access } from "node:fs/promises";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(__dirname, "..");
const distDir = resolve(packageRoot, "dist");

const ASSETS = [
  "redeem-widget.umd.js",
  "redeem-widget.umd.js.map",
  "redeem-widget.css",
];

async function ensureExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const targetArg = process.argv[2];
  if (!targetArg) {
    console.error("[redeem-widget-install] Target directory is required.");
    console.error("Usage: redeem-widget-install <target-directory>");
    process.exit(1);
  }

  const cwd = process.env.INIT_CWD || process.cwd();
  const target = resolve(cwd, targetArg);

  const distExists = await ensureExists(distDir);
  if (!distExists) {
    console.error(`[redeem-widget-install] dist not found at ${distDir}. Did the package build run?`);
    process.exit(1);
  }

  await mkdir(target, { recursive: true });

  let copied = 0;
  for (const file of ASSETS) {
    const src = join(distDir, file);
    const dst = join(target, file);
    if (!(await ensureExists(src))) {
      continue;
    }
    await copyFile(src, dst);
    copied += 1;
  }

  console.log(`[redeem-widget-install] Copied ${copied} asset(s) to ${target}`);
}

main().catch((error) => {
  console.error("[redeem-widget-install] Failed:", error);
  process.exit(1);
});
