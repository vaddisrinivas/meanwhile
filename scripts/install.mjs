import { cp, mkdir, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const valueAfter = flag => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};
const targetArg = valueAfter("--target") || "all";
const scope = valueAfter("--scope") || "user";
const projectDir = resolve(valueAfter("--project-dir") || process.cwd());
const dryRun = args.includes("--dry-run");
const force = args.includes("--force");
const universalAliases = new Set(["universal", "codex", "cursor", "gemini", "opencode", "copilot"]);

if (args.includes("--help")) {
  console.log("Usage: node scripts/install.mjs [--target all|universal|claude|codex|cursor|gemini|opencode|copilot] [--scope user|project] [--project-dir PATH] [--dry-run] [--force]");
  process.exit(0);
}
if (!["user", "project"].includes(scope)) throw new Error("--scope must be user or project");
if (targetArg !== "all" && targetArg !== "claude" && !universalAliases.has(targetArg)) throw new Error(`unknown target: ${targetArg}`);

const source = fileURLToPath(new URL("../meanwhile/", import.meta.url));
await stat(new URL("../meanwhile/references/quests.json", import.meta.url)).catch(() => {
  throw new Error("Run node scripts/build.mjs before installing so the bundled catalogue is current.");
});

const roots = scope === "user"
  ? { universal: resolve(homedir(), ".agents/skills"), claude: resolve(homedir(), ".claude/skills") }
  : { universal: resolve(projectDir, ".agents/skills"), claude: resolve(projectDir, ".claude/skills") };
const kinds = targetArg === "all" ? ["universal", "claude"] : [universalAliases.has(targetArg) ? "universal" : "claude"];
const destinations = [...new Set(kinds.map(kind => resolve(roots[kind], "meanwhile")))];

if (!force) {
  for (const destination of destinations) {
    const exists = await stat(destination).then(() => true, () => false);
    if (exists) throw new Error(`${destination} already exists. Use --force to replace its files.`);
  }
}

for (const destination of destinations) {
  if (dryRun) {
    console.log(`Would install ${source} -> ${destination}`);
    continue;
  }
  await mkdir(dirname(destination), { recursive: true });
  await cp(source, destination, { recursive: true, force });
  console.log(`Installed Meanwhile -> ${destination}`);
}
