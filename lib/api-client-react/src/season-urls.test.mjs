import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

// Exercise the generated serializers themselves without requiring a React DOM
// or another runtime loader. A path-level-only Orval parameter can be typed
// correctly while silently disappearing from the request URL.
const source = readFileSync(new URL("./generated/api.ts", import.meta.url), "utf8");
function generatedUrl(name) {
  const start = source.indexOf(`export const ${name} =`);
  assert.notEqual(start, -1, `Missing generated function: ${name}`);
  const end = source.indexOf("\n}", start) + 2;
  const javascript = ts.transpileModule(source.slice(start, end), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText.replace(/^export\s+/gm, "");
  return new Function("URLSearchParams", `${javascript}\nreturn ${name};`)(URLSearchParams);
}

for (const [name, path] of [
  ["getListEntriesUrl", "/api/entries"],
  ["getCreateEntryUrl", "/api/entries"],
  ["getGetLatestEntriesUrl", "/api/entries/latest"],
  ["getListEntrySummariesUrl", "/api/entries/summary"],
  ["getGetEntriesBulkTextUrl", "/api/bulk/entries"],
  ["getImportEntriesBulkTextUrl", "/api/bulk/entries"],
]) {
  test(`${name} preserves Season 2 and legacy defaults`, () => {
    const url = generatedUrl(name);
    assert.equal(url(), path);
    assert.equal(url({ fase: 2 }), `${path}?fase=2`);
  });
}

for (const name of ["getGetEntryUrl", "getUpdateEntryUrl", "getDeleteEntryUrl"]) {
  test(`${name} uses both season and day identity`, () => {
    const url = generatedUrl(name);
    assert.equal(url(1), "/api/entries/1");
    assert.equal(url(1, { fase: 2 }), "/api/entries/1?fase=2");
  });
}
