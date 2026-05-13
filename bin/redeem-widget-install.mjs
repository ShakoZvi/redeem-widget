#!/usr/bin/env node

import { mkdir, copyFile, access, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(__dirname, "..");
const distDir = resolve(packageRoot, "dist");

const ASSETS = [
  "redeem-widget.umd.js",
  "redeem-widget.umd.js.map",
  "redeem-widget.css",
];

const GITIGNORE_BLOCK_START = "# >>> @redeem/widget managed-block (do not edit by hand) >>>";
const GITIGNORE_BLOCK_END = "# <<< @redeem/widget managed-block <<<";
const GITIGNORE_ENTRIES = [
  "node_modules/",
  "npm-debug.log*",
  "yarn-debug.log*",
  "yarn-error.log*",
  ".npm/",
];

async function ensureExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function parseArgs(argv) {
  const args = { target: null, ensureGitignore: false, silent: false };
  for (const raw of argv) {
    if (raw === "--ensure-gitignore" || raw === "-g") {
      args.ensureGitignore = true;
    } else if (raw === "--silent" || raw === "-s") {
      args.silent = true;
    } else if (!raw.startsWith("-") && !args.target) {
      args.target = raw;
    }
  }
  return args;
}

async function ensureGitignore(cwd, log) {
  const gitignorePath = resolve(cwd, ".gitignore");
  let current = "";
  if (await ensureExists(gitignorePath)) {
    current = await readFile(gitignorePath, "utf8");
  }

  const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const blockRegex = new RegExp(
    `${escapeRegex(GITIGNORE_BLOCK_START)}[\\s\\S]*?${escapeRegex(GITIGNORE_BLOCK_END)}\\n?`,
    "m",
  );
  const block = [
    GITIGNORE_BLOCK_START,
    ...GITIGNORE_ENTRIES,
    GITIGNORE_BLOCK_END,
    "",
  ].join("\n");

  let next;
  if (blockRegex.test(current)) {
    next = current.replace(blockRegex, block);
  } else {
    const sep = current.length === 0 || current.endsWith("\n") ? "" : "\n";
    next = `${current}${sep}${current.length === 0 ? "" : "\n"}${block}`;
  }

  if (next !== current) {
    await writeFile(gitignorePath, next);
    log(`[redeem-widget-install] Updated .gitignore at ${gitignorePath}`);
  } else {
    log(`[redeem-widget-install] .gitignore already up to date.`);
  }
}

function printHint(target, cwd, log) {
  const rel = relative(cwd, target) || target;
  log("");
  log("[redeem-widget-install] Next steps for PHP / static hosts:");
  log(`  1. Add the following entries to your .gitignore (or run with --ensure-gitignore):`);
  GITIGNORE_ENTRIES.forEach((entry) => log(`       ${entry}`));
  log(`  2. Commit '${rel}/' so production PHP servers can serve the assets without Node.`);
  log(`  3. Commit 'package.json' and 'package-lock.json' for reproducible installs.`);
  log("");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const log = args.silent ? () => {} : (msg) => console.log(msg);

  if (!args.target) {
    console.error("[redeem-widget-install] Target directory is required.");
    console.error("Usage: redeem-widget-install <target-directory> [--ensure-gitignore] [--silent]");
    process.exit(1);
  }

  const cwd = process.env.INIT_CWD || process.cwd();
  const target = resolve(cwd, args.target);

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

  log(`[redeem-widget-install] Copied ${copied} asset(s) to ${target}`);

  if (args.ensureGitignore) {
    await ensureGitignore(cwd, log);
  } else {
    printHint(target, cwd, log);
  }
}

main().catch((error) => {
  console.error("[redeem-widget-install] Failed:", error);
  process.exit(1);
});
