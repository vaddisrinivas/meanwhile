import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { loadAndValidate } from "./validate.mjs";

const checkOnly = process.argv.includes("--check");
const siteUrl = process.env.SITE_URL ? `${process.env.SITE_URL.replace(/\/+$/, "")}/` : "";

function scriptJson(value) {
  return JSON.stringify(value, null, 2).replaceAll("<", "\\u003c");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function replaceAll(template, replacements) {
  let output = template;
  for (const [marker, value] of Object.entries(replacements)) {
    if (!output.includes(marker)) throw new Error(`template marker missing: ${marker}`);
    output = output.replaceAll(marker, value);
  }
  return output;
}

function canonical(path) {
  if (!siteUrl) return "";
  return `  <link rel="canonical" href="${escapeHtml(new URL(path, siteUrl))}">`;
}

function questCards(quests, resourceById, root) {
  return quests.map(quest => {
    const resource = resourceById[quest.resource];
    const href = resource ? `${root}go/?id=${encodeURIComponent(quest.id)}` : `${root}?quest=${encodeURIComponent(quest.id)}`;
    const label = resource ? `Open ${resource.label}` : "Open in the catalogue";
    return `<article class="quest">
        <div class="meta">${escapeHtml(quest.mode)} | ${quest.minutes} min</div>
        <h3>${escapeHtml(quest.title)}</h3>
        <p>${escapeHtml(quest.prompt)}</p>
        <a href="${href}">${escapeHtml(label)} &rarr;</a>
      </article>`;
  }).join("\n");
}

function renderContentPage(template, page, quests, resourceById, path) {
  const root = "../../";
  const ogImage = siteUrl ? new URL("assets/meanwhile-social.png", siteUrl).toString() : `${root}assets/meanwhile-social.png`;
  return replaceAll(template, {
    "__DESCRIPTION__": escapeHtml(page.description),
    "__TITLE__": escapeHtml(page.title),
    "__OG_IMAGE__": escapeHtml(ogImage),
    "__CANONICAL__": canonical(path),
    "__ROOT__": root,
    "__EYEBROW__": escapeHtml(page.eyebrow),
    "__INTRO__": escapeHtml(page.intro),
    "__SECTIONS__": page.sections.map(section => `<section class="section"><h2>${escapeHtml(section.title)}</h2><p>${escapeHtml(section.body)}</p></section>`).join("\n"),
    "__QUESTS__": questCards(quests, resourceById, root)
  });
}

async function render() {
  const catalog = await loadAndValidate();
  const guides = JSON.parse(await readFile(new URL("../guides.json", import.meta.url), "utf8")).guides;
  const indexTemplate = await readFile(new URL("../src/index.template.html", import.meta.url), "utf8");
  const goTemplate = await readFile(new URL("../src/go.template.html", import.meta.url), "utf8");
  const shareTemplate = await readFile(new URL("../src/share.template.html", import.meta.url), "utf8");
  const contentTemplate = await readFile(new URL("../src/content-page.template.html", import.meta.url), "utf8");
  const skill = await readFile(new URL("../meanwhile/SKILL.md", import.meta.url), "utf8");
  const openaiMetadata = await readFile(new URL("../meanwhile/agents/openai.yaml", import.meta.url), "utf8");
  const catalogJson = `${JSON.stringify(catalog, null, 2)}\n`;
  const resourceById = Object.fromEntries(catalog.resources.map(resource => [resource.id, resource]));
  const questById = Object.fromEntries(catalog.quests.map(quest => [quest.id, quest]));
  const hasWorker = await stat(new URL("../worker/src/index.ts", import.meta.url)).then(() => true).catch(() => false);
  const redirects = Object.fromEntries(
    catalog.quests
      .filter(quest => quest.resource)
      .map(quest => [quest.id, resourceById[quest.resource].url])
  );

  const indexOgImage = siteUrl ? new URL("assets/meanwhile-social.png", siteUrl).toString() : "assets/meanwhile-social.png";
  const builtIndex = replaceAll(indexTemplate, {
    "__INDEX_OG_IMAGE__": escapeHtml(indexOgImage),
    "__INDEX_CANONICAL__": canonical(""),
    "__LUNA_DATA__": scriptJson(catalog)
  });

  const files = new Map([
    ["index.html", builtIndex],
    ["go/index.html", goTemplate.replace("__REDIRECT_MAP__", scriptJson(redirects))],
    ["share/index.html", shareTemplate.replace("__LUNA_DATA__", scriptJson(catalog))],
    ["links.txt", `${catalog.resources.map(resource => resource.url).sort().join("\n")}\n`],
    ["robots.txt", `User-agent: *\nAllow: /\n${siteUrl ? `Sitemap: ${new URL("sitemap.xml", siteUrl)}\n` : ""}`],
    ["meanwhile/references/quests.json", catalogJson],
    [".agents/skills/meanwhile/SKILL.md", skill],
    [".agents/skills/meanwhile/agents/openai.yaml", openaiMetadata],
    [".agents/skills/meanwhile/references/quests.json", catalogJson],
    ["skills/meanwhile/SKILL.md", skill],
    ["skills/meanwhile/references/quests.json", catalogJson],
    ...(hasWorker ? [["worker/src/redirects.ts", `export const redirects = ${JSON.stringify(redirects, null, 2)} as const;\n`]] : [])
  ]);

  const guideIds = new Set();
  for (const guide of guides) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(guide.slug)) throw new Error(`invalid guide slug: ${guide.slug}`);
    if (guideIds.has(guide.slug)) throw new Error(`duplicate guide slug: ${guide.slug}`);
    guideIds.add(guide.slug);
    const quests = guide.quest_ids.map(id => {
      if (!questById[id]) throw new Error(`guide ${guide.slug} references unknown quest: ${id}`);
      return questById[id];
    });
    files.set(`guides/${guide.slug}/index.html`, renderContentPage(contentTemplate, {
      ...guide,
      eyebrow: "Guide"
    }, quests, resourceById, `guides/${guide.slug}/`));
  }

  for (const pack of catalog.packs) {
    const quests = pack.quest_ids.map(id => questById[id]);
    files.set(`packs/${pack.id}/index.html`, renderContentPage(contentTemplate, {
      title: pack.title,
      description: pack.description,
      eyebrow: "Quest pack",
      intro: `${pack.description} Pick one option that fits the real wait and let the main work continue.`,
      sections: [
        { title: "Use one", body: "Choose one quest, not the whole list. The activity should end before the agent's projected wait." },
        { title: "Keep the boundary", body: "The side quest never replaces required input, active debugging, or the final proof that the main task worked." },
        { title: "Return naturally", body: "Play and recovery need no check-in. Useful observations can return in the same chat whenever they are ready." }
      ]
    }, quests, resourceById, `packs/${pack.id}/`));
  }

  if (siteUrl) {
    const paths = ["", "share/", ...guides.map(guide => `guides/${guide.slug}/`), ...catalog.packs.map(pack => `packs/${pack.id}/`)];
    files.set("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map(path => `  <url><loc>${escapeHtml(new URL(path, siteUrl))}</loc></url>`).join("\n")}\n</urlset>\n`);
  }

  return files;
}

const files = await render();
let stale = false;

for (const [relativePath, content] of files) {
  const target = new URL(`../${relativePath}`, import.meta.url);
  if (checkOnly) {
    const existing = await readFile(target, "utf8").catch(() => "");
    if (existing !== content) {
      console.error(`Stale generated file: ${relativePath}`);
      stale = true;
    }
  } else {
    await mkdir(new URL(".", target), { recursive: true });
    await writeFile(target, content);
    console.log(`Built ${relativePath}`);
  }
}

if (stale) process.exitCode = 1;
