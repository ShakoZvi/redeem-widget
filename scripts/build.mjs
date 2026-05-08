import { mkdir, cp } from "node:fs/promises";
import { resolve } from "node:path";
import { build } from "esbuild";

const root = resolve(process.cwd());
const distDir = resolve(root, "dist");

await mkdir(distDir, { recursive: true });

await build({
  entryPoints: [resolve(root, "src/index.ts")],
  bundle: true,
  format: "esm",
  outfile: resolve(distDir, "redeem-widget.esm.js"),
  sourcemap: true,
  target: "es2020",
});

await build({
  entryPoints: [resolve(root, "src/index.ts")],
  bundle: true,
  format: "iife",
  globalName: "RedeemWidget",
  outfile: resolve(distDir, "redeem-widget.umd.js"),
  sourcemap: true,
  target: "es2020",
});

await build({
  entryPoints: [resolve(root, "src/react/RedeemWidget.tsx")],
  bundle: false,
  format: "esm",
  outfile: resolve(distDir, "react/RedeemWidget.js"),
  sourcemap: true,
  target: "es2020",
});

await cp(resolve(root, "src/styles/redeem-widget.css"), resolve(distDir, "redeem-widget.css"));
