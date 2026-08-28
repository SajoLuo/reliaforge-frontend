import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"
import { scanTree } from "./check-open-source-hygiene.mjs"

test("scanner reports sensitive content without returning values", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "reliaforge-scan-"))
  const brand = ["op", "po"].join("")
  const privateAddress = ["192", "168", "8", "9"].join(".")
  const secretKey = ["api", "key"].join("_")
  fs.writeFileSync(path.join(root, "sample.txt"), `${brand}\n${privateAddress}\n${secretKey} = "not-a-placeholder"\n`)
  const findings = scanTree(root)
  assert.deepEqual(findings.map((item) => item.rule).sort(), ["forbidden-brand", "private-address", "secret-literal"])
  assert.equal(JSON.stringify(findings).includes("not-a-placeholder"), false)
})

test("scanner accepts public placeholders and documented examples", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "reliaforge-scan-"))
  fs.writeFileSync(path.join(root, ".env.example"), "VITE_RELIAFORGE_API_URL=https://example.com\n")
  fs.writeFileSync(path.join(root, "README.md"), "Contact contributor@example.com about opportunities, opponents, and towering examples.\n")
  assert.deepEqual(scanTree(root), [])
})

test("scanner reports compound brand identifiers and the legacy domain", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "reliaforge-scan-"))
  const brand = ["op", "po"].join("")
  const product = ["to", "wer"].join("")
  fs.writeFileSync(
    path.join(root, "compound.txt"),
    `${brand.toUpperCase()}_INTERNAL=true\n${brand}_api=enabled\nhttps://api.${brand}it.com/v1\n${product}_api=enabled\n`,
  )

  assert.deepEqual(scanTree(root), [
    { rule: "forbidden-brand", path: "compound.txt", line: 1 },
    { rule: "forbidden-brand", path: "compound.txt", line: 2 },
    { rule: "forbidden-brand", path: "compound.txt", line: 3 },
    { rule: "forbidden-brand", path: "compound.txt", line: 4 },
  ])
})

test("scanner checks environment examples and plain internal hosts", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "reliaforge-scan-"))
  const secretKey = ["shared", "secret"].join("_").toUpperCase()
  const secretValue = ["not", "a", "placeholder"].join("-")
  const privateHost = ["service", "internal"].join(".")
  fs.writeFileSync(path.join(root, ".env.example"), `${secretKey}=${secretValue}\nHOST=${privateHost}\n`)

  const findings = scanTree(root)
  assert.deepEqual(findings.map((item) => item.rule).sort(), ["internal-host", "secret-literal"])
  assert.equal(JSON.stringify(findings).includes(secretValue), false)
})

test("scanner rejects non-example environment files", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "reliaforge-scan-"))
  fs.writeFileSync(path.join(root, ".env.production"), "VITE_RELIAFORGE_API_URL=https://example.com\n")
  assert.deepEqual(scanTree(root), [{ rule: "risk-path", path: ".env.production", line: 0 }])
})

test("scanner allows only root registry deprecation contacts and checks other email locations", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "reliaforge-scan-"))
  const maintainerEmail = ["maintainer", "package.test"].join("@")
  fs.writeFileSync(path.join(root, "package-lock.json"), `{\n  "deprecated":"Contact ${maintainerEmail}",\n  "author":"${maintainerEmail}"\n}\n`)
  fs.writeFileSync(path.join(root, "CONTRIBUTING.md"), `Contact ${maintainerEmail}\n`)
  fs.mkdirSync(path.join(root, "vendor"))
  fs.writeFileSync(path.join(root, "vendor", "package-lock.json"), `{\n  "deprecated":"Contact ${maintainerEmail}"\n}\n`)

  assert.deepEqual(scanTree(root), [
    { rule: "nonpublic-email", path: "CONTRIBUTING.md", line: 1 },
    { rule: "nonpublic-email", path: "package-lock.json", line: 3 },
    { rule: "nonpublic-email", path: "vendor/package-lock.json", line: 2 },
  ])
})

test("scanner rejects binary, non-UTF8, and secret-bearing unknown extensions", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "reliaforge-scan-"))
  fs.writeFileSync(path.join(root, "logo.png"), Buffer.from([0x89, 0x50, 0x00, 0x47]))
  fs.writeFileSync(path.join(root, "legacy.dat"), Buffer.from([0xff, 0xfe, 0x61]))
  fs.writeFileSync(path.join(root, "settings.toml"), "api_key = \"not-a-placeholder\"\n")

  assert.deepEqual(scanTree(root), [
    { rule: "non-utf8-file", path: "legacy.dat", line: 0 },
    { rule: "binary-file", path: "logo.png", line: 0 },
    { rule: "secret-literal", path: "settings.toml", line: 1 },
  ])
})

test("scanner allows only the canonical public brand asset", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "reliaforge-scan-"))
  fs.mkdirSync(path.join(root, "public"))
  fs.writeFileSync(path.join(root, "public", "reliaforge-mark.png"), Buffer.from([0x89, 0x50, 0x00, 0x47]))
  fs.writeFileSync(path.join(root, "public", "other.png"), Buffer.from([0x89, 0x50, 0x00, 0x47]))

  assert.deepEqual(scanTree(root), [
    { rule: "binary-file", path: "public/other.png", line: 0 },
  ])
})
