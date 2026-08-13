import test from "node:test";
import assert from "node:assert/strict";
import { loadAndValidate, validateCatalog } from "../scripts/validate.mjs";

test("catalogue validates and exposes both wait modes", async () => {
  const catalog = await loadAndValidate();
  assert.deepEqual(validateCatalog(catalog), []);
  assert.deepEqual(catalog.wait_modes.map(mode => mode.id).sort(), ["journey", "micro"]);
  assert.ok(catalog.quests.some(quest => quest.mode === "micro"));
  assert.ok(catalog.quests.some(quest => quest.mode === "journey"));
  assert.ok(catalog.quests.filter(quest => quest.mode === "micro").every(quest => !quest.resource && quest.duration_seconds <= 120));
});

test("packs and task-specific learning resolve to real quests", async () => {
  const catalog = await loadAndValidate();
  const ids = new Set(catalog.quests.map(quest => quest.id));
  assert.equal(catalog.packs.length, 7);
  assert.ok(catalog.packs.every(pack => pack.quest_ids.every(id => ids.has(id))));
  assert.ok(catalog.quests.some(quest => quest.contexts.includes("oauth") && quest.resource));
  assert.ok(catalog.quests.some(quest => quest.contexts.includes("compose") && quest.resource));
});
