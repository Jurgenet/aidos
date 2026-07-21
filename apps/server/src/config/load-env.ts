import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

let loaded = false;

/**
 * Loads variables from `./.env` (relative to cwd) into `process.env`.
 * - Runs at most once.
 * - Never overwrites an already-set env var.
 * - No deps. Used because we want zero-dep env loading on Node 24+ while
 *   staying compatible with `tsx` and built `node dist/...` invocations.
 */
export function loadEnv(): void {
  if (loaded) return;
  loaded = true;

  const envPath = resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) return;

  const content = readFileSync(envPath, 'utf-8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    if (!key) continue;
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
