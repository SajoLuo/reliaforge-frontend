import assert from "node:assert/strict"
import { readdir, readFile } from "node:fs/promises"
import test from "node:test"

const docsRoot = new URL("../docs/", import.meta.url)

async function markdownNames(directory) {
  return (await readdir(directory, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name)
    .sort()
}

function headingLevels(markdown) {
  return [...markdown.matchAll(/^(#{1,6})\s+/gm)].map((match) => match[1].length)
}

function executableCodeBlocks(markdown) {
  return [...markdown.matchAll(/^```([^\r\n]*)\r?\n([\s\S]*?)^```[ \t]*$/gm)].map((match) => ({
    language: match[1].trim(),
    body: match[2].replaceAll("\r\n", "\n"),
  })).filter((block) => block.language !== "text")
}

function assertStructuralParity(english, chinese) {
  assert.deepEqual(headingLevels(chinese), headingLevels(english))
  assert.deepEqual(executableCodeBlocks(chinese), executableCodeBlocks(english))
}

test("substantive frontend docs have reciprocal English and Chinese entry points", async () => {
  const englishNames = await markdownNames(docsRoot)
  const chineseNames = await markdownNames(new URL("zh/", docsRoot))
  assert.deepEqual(chineseNames, englishNames)

  for (const name of englishNames) {
    const english = await readFile(new URL(name, docsRoot), "utf8")
    const chinese = await readFile(new URL(`zh/${name}`, docsRoot), "utf8")
    assert.match(english, new RegExp(`\\[简体中文\\]\\(zh/${name.replace(".", "\\.")}\\)`))
    assert.match(chinese, new RegExp(`\\[English\\]\\(\\.\\./${name.replace(".", "\\.")}\\)`))
    assertStructuralParity(english, chinese)
  }
})

test("repository READMEs link to each other", async () => {
  const english = await readFile(new URL("../README.md", import.meta.url), "utf8")
  const chinese = await readFile(new URL("../README_CN.md", import.meta.url), "utf8")
  assert.match(english, /\[简体中文\]\(README_CN\.md\)/)
  assert.match(chinese, /\[English\]\(README\.md\)/)
  assertStructuralParity(english, chinese)
})
