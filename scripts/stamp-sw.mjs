/**
 * Stamp service worker cache id on each build so browsers fetch a new SW after deploy.
 * Source of truth: public/sw.js — CACHE string is rewritten in place for the build artifact.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const swPath = join(process.cwd(), "public", "sw.js");
const id = `lifeos-${Date.now()}`;
const src = readFileSync(swPath, "utf8");
const next = src.replace(/const CACHE = "[^"]+";/, `const CACHE = "${id}";`);
if (next === src) {
  console.warn("stamp-sw: CACHE constant not found — skip");
  process.exit(0);
}
writeFileSync(swPath, next);
console.log(`stamp-sw: ${id}`);
