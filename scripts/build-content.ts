/**
 * Content pipeline: content/**.yaml -> schema validation -> checker self-test -> src/generated/content.json
 * Exits with code 1 on any error, so a broken item never deploys.
 */
import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { join, relative } from "node:path";
import { parse } from "yaml";
import { z } from "zod";
import { Item, Module, type Content } from "../src/lib/items";
import { validate } from "../src/lib/check";

const ROOT = process.cwd();
const CONTENT = join(ROOT, "content");
const OUT = join(ROOT, "src", "generated", "content.json");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : /\.ya?ml$/.test(name) ? [p] : [];
  });
}

const errors: string[] = [];
const fail = (where: string, msg: string) => errors.push(`${where}: ${msg}`);

const modulesRaw = parse(readFileSync(join(CONTENT, "modules.yaml"), "utf8"));
const modulesParsed = z.array(Module).safeParse(modulesRaw);
if (!modulesParsed.success) {
  console.error(z.prettifyError(modulesParsed.error));
  process.exit(1);
}
const modules = modulesParsed.data;
const moduleIds = new Set(modules.map((m) => m.id));

const items: Item[] = [];
const seen = new Map<string, string>();

for (const file of walk(CONTENT)) {
  const rel = relative(ROOT, file);
  if (rel.endsWith("modules.yaml")) continue;
  let doc: unknown;
  try {
    doc = parse(readFileSync(file, "utf8"));
  } catch (e) {
    fail(rel, `YAML error: ${(e as Error).message}`);
    continue;
  }
  const list = Array.isArray(doc) ? doc : [doc];
  list.forEach((raw, i) => {
    const where = list.length > 1 ? `${rel}#${i + 1}` : rel;
    const res = Item.safeParse(raw);
    if (!res.success) {
      fail(where, "\n" + z.prettifyError(res.error));
      return;
    }
    const item = res.data;
    if (seen.has(item.id)) fail(where, `duplicate id ${item.id} (also in ${seen.get(item.id)})`);
    seen.set(item.id, where);
    if (!moduleIds.has(item.module)) fail(where, `unknown module ${item.module}`);
    if (!item.id.startsWith(item.module + "-")) fail(where, `id ${item.id} must start with "${item.module}-"`);
    for (const e of validate(item)) fail(`${where} (${item.id})`, e);
    items.push(item);
  });
}

if (errors.length) {
  console.error(`\n✗ Content check failed with ${errors.length} error(s):\n`);
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}

const content: Content = { modules, items, builtAt: new Date().toISOString() };
mkdirSync(join(ROOT, "src", "generated"), { recursive: true });
writeFileSync(OUT, JSON.stringify(content, null, 1));

const per = modules.map((m) => `${m.code}: ${items.filter((i) => i.module === m.id).length}`).join(" · ");
console.log(`✓ ${items.length} items in ${modules.length} modules passed all checks (${per})`);
