import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const allowedKinds = new Set([
  "learn-user", "proof", "reality", "decide", "test", "taste", "scope",
  "retrieve", "observe", "research", "learn", "play", "recover"
]);
const allowedStates = new Set(["busy", "blocked", "proof", "taste", "frustrated", "learning"]);
const allowedMinutes = new Set([1, 3, 5, 10, 20]);
const allowedModes = new Set(["micro", "journey"]);
const allowedIntents = new Set(["useful", "learn-user", "learn", "play"]);
const allowedReturnPolicies = new Set(["none", "optional", "reply_in_chat"]);

function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function findDuplicates(values) {
  return [...new Set(values.filter((value, index) => values.indexOf(value) !== index))];
}

export function validateCatalog(catalog) {
  const errors = [];
  if (!catalog || typeof catalog !== "object" || Array.isArray(catalog)) return ["catalogue must be an object"];
  if (catalog.name !== "Meanwhile") errors.push("name must be Meanwhile");
  if (!/^\d+\.\d+\.\d+$/.test(catalog.version || "")) errors.push("version must be semver");
  if (!nonEmpty(catalog.purpose)) errors.push("purpose is required");
  if (!catalog.agent_contract?.outcome_record?.shape) errors.push("agent_contract.outcome_record.shape is required");

  const resources = Array.isArray(catalog.resources) ? catalog.resources : [];
  const signals = Array.isArray(catalog.history_signals) ? catalog.history_signals : [];
  const waitModes = Array.isArray(catalog.wait_modes) ? catalog.wait_modes : [];
  const packs = Array.isArray(catalog.packs) ? catalog.packs : [];
  const quests = Array.isArray(catalog.quests) ? catalog.quests : [];
  if (!quests.length) errors.push("at least one quest is required");
  if (waitModes.length !== 2) errors.push("wait_modes must define micro and journey");
  if (!packs.length) errors.push("at least one pack is required");

  for (const duplicate of findDuplicates(resources.map(item => item.id))) errors.push(`duplicate resource id: ${duplicate}`);
  for (const duplicate of findDuplicates(signals.map(item => item.id))) errors.push(`duplicate signal id: ${duplicate}`);
  for (const duplicate of findDuplicates(waitModes.map(item => item.id))) errors.push(`duplicate wait mode id: ${duplicate}`);
  for (const duplicate of findDuplicates(packs.map(item => item.id))) errors.push(`duplicate pack id: ${duplicate}`);
  for (const duplicate of findDuplicates(quests.map(item => item.id))) errors.push(`duplicate quest id: ${duplicate}`);

  const resourceIds = new Set(resources.map(item => item.id));
  const signalIds = new Set(signals.map(item => item.id));
  const questIds = new Set(quests.map(item => item.id));

  waitModes.forEach((mode, index) => {
    const at = `wait_modes[${index}]`;
    if (!allowedModes.has(mode.id)) errors.push(`${at}.id is invalid`);
    if (!nonEmpty(mode.label) || !nonEmpty(mode.description)) errors.push(`${at} copy is required`);
    if (!Number.isInteger(mode.minimum_wait_seconds) || mode.minimum_wait_seconds < 1) errors.push(`${at}.minimum_wait_seconds is invalid`);
    if (!Number.isInteger(mode.maximum_quest_seconds) || mode.maximum_quest_seconds < 1) errors.push(`${at}.maximum_quest_seconds is invalid`);
    if (typeof mode.requires_prior_opt_in !== "boolean") errors.push(`${at}.requires_prior_opt_in is invalid`);
  });

  packs.forEach((pack, index) => {
    const at = `packs[${index}]`;
    if (!idPattern.test(pack.id || "")) errors.push(`${at}.id is invalid`);
    if (!nonEmpty(pack.title) || !nonEmpty(pack.description)) errors.push(`${at} copy is required`);
    if (!Array.isArray(pack.quest_ids) || !pack.quest_ids.length) errors.push(`${at}.quest_ids is required`);
    else {
      for (const duplicate of findDuplicates(pack.quest_ids)) errors.push(`${at}.quest_ids repeats ${duplicate}`);
      for (const id of pack.quest_ids) if (!questIds.has(id)) errors.push(`${at}.quest_ids contains unknown id: ${id}`);
    }
  });

  resources.forEach((resource, index) => {
    const at = `resources[${index}]`;
    if (!idPattern.test(resource.id || "")) errors.push(`${at}.id is invalid`);
    if (!nonEmpty(resource.label)) errors.push(`${at}.label is required`);
    try {
      const url = new URL(resource.url);
      if (url.protocol !== "https:") errors.push(`${at}.url must use HTTPS`);
      if (url.hostname === "www.youtube.com" && url.pathname === "/results") {
        errors.push(`${at}.url must be a destination, not YouTube search results`);
      }
    } catch {
      errors.push(`${at}.url is invalid`);
    }
  });

  signals.forEach((signal, index) => {
    const at = `history_signals[${index}]`;
    if (!idPattern.test(signal.id || "")) errors.push(`${at}.id is invalid`);
    if (!nonEmpty(signal.label)) errors.push(`${at}.label is required`);
    if (!Array.isArray(signal.bias) || !signal.bias.length) errors.push(`${at}.bias is required`);
  });

  quests.forEach((quest, index) => {
    const at = `quests[${index}]`;
    if (!idPattern.test(quest.id || "")) errors.push(`${at}.id is invalid`);
    if (!nonEmpty(quest.title)) errors.push(`${at}.title is required`);
    if (!allowedKinds.has(quest.kind)) errors.push(`${at}.kind is invalid`);
    if (!allowedModes.has(quest.mode)) errors.push(`${at}.mode is invalid`);
    if (!allowedMinutes.has(quest.minutes)) errors.push(`${at}.minutes is invalid`);
    if (quest.duration_seconds !== quest.minutes * 60) errors.push(`${at}.duration_seconds must equal minutes * 60`);
    if (!nonEmpty(quest.prompt)) errors.push(`${at}.prompt is required`);
    if (!nonEmpty(quest.receipt)) errors.push(`${at}.receipt is required`);
    if (!allowedReturnPolicies.has(quest.return_policy)) errors.push(`${at}.return_policy is invalid`);
    if (!Array.isArray(quest.states) || !quest.states.length || quest.states.some(value => !allowedStates.has(value))) {
      errors.push(`${at}.states is invalid`);
    }
    if (!Array.isArray(quest.intents) || !quest.intents.length || quest.intents.some(value => !allowedIntents.has(value))) {
      errors.push(`${at}.intents is invalid`);
    }
    if (!Array.isArray(quest.contexts) || !quest.contexts.length || quest.contexts.some(value => !nonEmpty(value))) {
      errors.push(`${at}.contexts is invalid`);
    }
    if (!Array.isArray(quest.signals) || quest.signals.some(value => !signalIds.has(value))) {
      errors.push(`${at}.signals contains an unknown id`);
    }
    if (quest.resource && !resourceIds.has(quest.resource)) errors.push(`${at}.resource is unknown`);
    if (quest.mode === "micro" && quest.duration_seconds > 120) errors.push(`${at} is too long for micro mode`);
    if (quest.mode === "micro" && quest.resource) errors.push(`${at} must not open a tab in micro mode`);
    if (quest.mode === "journey" && quest.duration_seconds <= 120) errors.push(`${at} is too short for journey mode`);
    if (["play", "recover"].includes(quest.kind) && quest.return_policy !== "none") {
      errors.push(`${at}.return_policy must be none for ${quest.kind}`);
    }
    if (quest.kind === "learn" && quest.return_policy !== "optional") {
      errors.push(`${at}.return_policy must be optional for learn`);
    }
    if (![ "play", "recover", "learn" ].includes(quest.kind) && quest.return_policy !== "reply_in_chat") {
      errors.push(`${at}.return_policy must be reply_in_chat for ${quest.kind}`);
    }
    for (const field of ["title", "prompt", "receipt"]) {
      if (/<\/?[a-z][\s\S]*>/i.test(quest[field] || "")) errors.push(`${at}.${field} must not contain HTML`);
    }
  });

  return errors;
}

export async function loadAndValidate() {
  const catalog = JSON.parse(await readFile(new URL("../quests.json", import.meta.url), "utf8"));
  const errors = validateCatalog(catalog);
  if (errors.length) throw new Error(errors.map(error => `- ${error}`).join("\n"));
  return catalog;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const catalog = await loadAndValidate();
    console.log(`Valid: ${catalog.quests.length} quests, ${catalog.packs.length} packs, ${catalog.resources.length} resources.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
