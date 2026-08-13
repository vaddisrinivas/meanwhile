import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const read = path => readFile(new URL(path, root), "utf8");

test("generated pages contain no template markers", async () => {
  const paths = [
    "index.html",
    "share/index.html",
    "go/index.html",
    "guides/what-to-do-while-codex-works/index.html",
    "packs/touch-grass/index.html"
  ];
  for (const path of paths) {
    const content = await read(path);
    assert.doesNotMatch(content, /__[A-Z][A-Z_]+__/);
    assert.match(content, /MEANWHILE/i);
  }
});

test("universal skill copy and bundled catalogue match their sources", async () => {
  assert.equal(await read("meanwhile/SKILL.md"), await read(".agents/skills/meanwhile/SKILL.md"));
  assert.equal(await read("quests.json"), await read("meanwhile/references/quests.json"));
  assert.equal(await read("quests.json"), await read(".agents/skills/meanwhile/references/quests.json"));
});

test("installer resolves universal and Claude destinations", async () => {
  const project = await mkdtemp(join(tmpdir(), "meanwhile-install-"));
  const output = execFileSync(process.execPath, [
    fileURLToPath(new URL("scripts/install.mjs", root)),
    "--target", "all",
    "--scope", "project",
    "--project-dir", project,
    "--dry-run"
  ], { encoding: "utf8" });
  assert.match(output, /\.agents\/skills\/meanwhile/);
  assert.match(output, /\.claude\/skills\/meanwhile/);
});
