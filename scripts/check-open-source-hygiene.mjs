import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const IGNORED_DIRECTORIES = new Set([".git", "node_modules", "dist", "coverage", "playwright-report", "test-results"])
const SAFE_EMAIL_DOMAINS = new Set(["example.com", "users.noreply.github.com"])
const EXACT_ALLOWLIST = [
  { rule: "risk-path", path: ".env.example", reason: "placeholder-only developer configuration" },
  {
    rule: "nonpublic-email",
    path: "package-lock.json",
    reason: "third-party npm registry deprecation metadata",
    linePattern: /^\s*"deprecated"\s*:/,
  },
]

const productA = ["op", "po"].join("")
const productB = ["to", "wer"].join("")
const productC = String.fromCodePoint(0x706b, 0x773c)
const productAPattern = new RegExp(`(?<![a-z])${productA}(?:it(?=\\.com\\b)|(?![a-z]))`, "i")
const productBPattern = new RegExp(`(?<![a-z])${productB}(?![a-z])`, "i")
const secretKeyPatterns = [
  ["pass", "word"].join(""),
  ["se", "cret"].join(""),
  ["to", "ken"].join(""),
  ["api", "key"].join("[_-]?"),
  ["private", "key"].join("[_-]?"),
]
const forbiddenHostSuffixes = [[".", "local"].join(""), [".", "internal"].join(""), [".", "corp"].join("")]
const riskNames = ["credentials", "credential", "screenshot", "screenshots", "backup", "cache", "result", "results"]
const secretKeyPattern = new RegExp(`(?:${secretKeyPatterns.join("|")})`, "i")

function isPlaceholder(value) {
  const normalized = value.trim().replace(/^['"]|['"]$/g, "").toLowerCase()
  return normalized.length === 0
    || normalized.startsWith("replace-")
    || normalized.startsWith("example")
    || normalized.startsWith("placeholder")
    || normalized.startsWith("${")
    || normalized.startsWith("<")
    || normalized.endsWith("-here")
}

function isAllowed(rule, relativePath, line = "") {
  return EXACT_ALLOWLIST.some((entry) => entry.rule === rule
    && entry.path === relativePath
    && entry.reason.length > 0
    && (!entry.linePattern || entry.linePattern.test(line)))
}

function walk(root) {
  const files = []
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) continue
    const fullPath = path.join(root, entry.name)
    if (entry.isDirectory()) files.push(...walk(fullPath))
    else if (entry.isFile()) files.push(fullPath)
  }
  return files.sort((left, right) => left.localeCompare(right))
}

function riskPathRule(relativePath) {
  const normalized = relativePath.toLowerCase().replaceAll("\\", "/")
  const parts = normalized.split("/")
  const basename = parts.at(-1) ?? ""
  if (basename.startsWith(".env")) return true
  if (riskNames.some((name) => parts.includes(name) || basename.startsWith(`${name}.`))) return true
  return /\.(?:bak|db|key|log|pem|sqlite|sqlite3)$/.test(basename)
}

function directFindings(line) {
  const findings = []
  if (productAPattern.test(line) || productBPattern.test(line) || line.includes(productC)) findings.push("forbidden-brand")
  if (/\b(?:10\.(?:\d{1,3}\.){2}\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.(?:\d{1,3}\.)\d{1,3}|192\.168\.(?:\d{1,3}\.)\d{1,3})\b/.test(line)) findings.push("private-address")
  if (/\b[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.(?:local|internal|corp)\b/i.test(line)) findings.push("internal-host")
  if (/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i.test(line)) findings.push("document-identifier")
  return findings
}

function urlFindings(line) {
  const findings = []
  const urlPattern = /https?:\/\/[^\s"'<>`()[\]]+/g
  for (const rawUrl of line.match(urlPattern) ?? []) {
    try {
      const hostname = new URL(rawUrl).hostname.toLowerCase()
      if (forbiddenHostSuffixes.some((suffix) => hostname.endsWith(suffix))) findings.push("internal-host")
    } catch {
      findings.push("malformed-url")
    }
  }
  return findings
}

function emailFindings(line) {
  const findings = []
  const emailPattern = /\b[A-Z0-9._%+-]+@([A-Z0-9.-]+\.[A-Z]{2,})\b/gi
  for (const match of line.matchAll(emailPattern)) {
    if (!SAFE_EMAIL_DOMAINS.has(match[1].toLowerCase())) findings.push("nonpublic-email")
  }
  return findings
}

function secretFindings(line) {
  const findings = []
  const secretPattern = new RegExp(`\\b(?:[A-Za-z][A-Za-z0-9_-]*[_-])?(?:${secretKeyPatterns.join("|")})\\b\\s*[:=]\\s*["']([^"']*)["']`, "i")
  const secretMatch = line.match(secretPattern)
  if (secretMatch && !isPlaceholder(secretMatch[1])) findings.push("secret-literal")

  const environmentMatch = line.trim().match(/^([A-Z][A-Z0-9_]*)=(.*)$/)
  if (environmentMatch && secretKeyPattern.test(environmentMatch[1]) && !isPlaceholder(environmentMatch[2])) {
    findings.push("secret-literal")
  }
  return findings
}

function lineFindings(line) {
  return [...new Set([
    ...directFindings(line),
    ...urlFindings(line),
    ...emailFindings(line),
    ...secretFindings(line),
  ])]
}

export function scanTree(root) {
  const resolvedRoot = path.resolve(root)
  const findings = []
  for (const file of walk(resolvedRoot)) {
    const relativePath = path.relative(resolvedRoot, file).replaceAll("\\", "/")
    if (riskPathRule(relativePath) && !isAllowed("risk-path", relativePath)) {
      findings.push({ rule: "risk-path", path: relativePath, line: 0 })
    }
    const stat = fs.statSync(file)
    if (stat.size > 2 * 1024 * 1024 && !isAllowed("large-file", relativePath)) {
      findings.push({ rule: "large-file", path: relativePath, line: 0 })
      continue
    }
    const raw = fs.readFileSync(file)
    if (raw.includes(0)) {
      if (!isAllowed("binary-file", relativePath)) findings.push({ rule: "binary-file", path: relativePath, line: 0 })
      continue
    }
    let content
    try {
      content = new TextDecoder("utf-8", { fatal: true }).decode(raw)
    } catch {
      if (!isAllowed("non-utf8-file", relativePath)) findings.push({ rule: "non-utf8-file", path: relativePath, line: 0 })
      continue
    }
    const lines = content.split(/\r?\n/)
    lines.forEach((line, index) => {
      for (const rule of lineFindings(line)) {
        if (!isAllowed(rule, relativePath, line)) {
          findings.push({ rule, path: relativePath, line: index + 1 })
        }
      }
    })
  }
  return findings
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : ""
if (invokedPath === fileURLToPath(import.meta.url)) {
  try {
    const findings = scanTree(process.argv[2] || ".")
    for (const finding of findings) process.stderr.write(`${finding.rule}\t${finding.path}:${finding.line}\n`)
    process.exit(findings.length === 0 ? 0 : 1)
  } catch (error) {
    const errorType = error instanceof Error ? error.constructor.name : "UnknownError"
    process.stderr.write(`scanner-error\t<repository>:0\t${errorType}\n`)
    process.exit(2)
  }
}
