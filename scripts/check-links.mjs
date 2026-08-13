import { readFile } from "node:fs/promises";

const urls = (await readFile(new URL("../links.txt", import.meta.url), "utf8"))
  .split("\n")
  .map(value => value.trim())
  .filter(Boolean);
const accepted = status => (status >= 200 && status < 400) || [401, 403, 405, 429].includes(status);

async function check(url) {
  const options = { redirect: "follow", signal: AbortSignal.timeout(15000), headers: { "User-Agent": "Meanwhile-Link-Check/1.0" } };
  let response = await fetch(url, { ...options, method: "HEAD" });
  if (!accepted(response.status)) response = await fetch(url, { ...options, method: "GET" });
  if (!accepted(response.status)) throw new Error(`${response.status} ${url}`);
  return `${response.status} ${url}`;
}

const results = await Promise.allSettled(urls.map(check));
for (const result of results) {
  if (result.status === "fulfilled") console.log(result.value);
  else console.error(result.reason.message);
}
const failures = results.filter(result => result.status === "rejected").length;
if (failures) {
  console.error(`${failures} destination(s) failed.`);
  process.exitCode = 1;
} else {
  console.log(`Healthy: ${urls.length} destinations.`);
}
