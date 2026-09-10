import { existsSync, lstatSync, readdirSync, readFileSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";

const root = process.cwd();
const excludedDirectories = new Set([
  ".artifacts",
  ".git",
  ".next",
  "node_modules",
]);

function markdownFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) {
      return excludedDirectories.has(entry.name)
        ? []
        : markdownFiles(join(directory, entry.name));
    }

    return entry.isFile() && entry.name.endsWith(".md")
      ? [join(directory, entry.name)]
      : [];
  });
}

function headingText(line) {
  const match = line.match(/^ {0,3}#{1,6}\s+(.+?)\s*#*\s*$/);
  if (!match) return null;

  return match[1]
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/[`*_~]/g, "");
}

function slug(text, collapseWhitespace) {
  const whitespace = collapseWhitespace ? /\s+/g : /\s/g;
  return text
    .trim()
    .toLocaleLowerCase("en-US")
    .replace(/[^\p{L}\p{N}\p{M}\s-]/gu, "")
    .replace(whitespace, "-");
}

function anchorsFor(file) {
  const anchors = new Set();
  const countVariants = [new Map(), new Map()];

  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const heading = headingText(line);
    if (!heading) continue;

    for (const [variant, collapseWhitespace] of [false, true].entries()) {
      const base = slug(heading, collapseWhitespace);
      const counts = countVariants[variant];
      const count = counts.get(base) ?? 0;
      anchors.add(count === 0 ? base : `${base}-${count}`);
      counts.set(base, count + 1);
    }
  }

  return anchors;
}

function destinationFrom(raw) {
  const trimmed = raw.trim();
  const destination = trimmed.startsWith("<")
    ? trimmed.slice(1, trimmed.indexOf(">"))
    : trimmed.split(/\s+["']/)[0];

  try {
    return decodeURIComponent(destination);
  } catch {
    return destination;
  }
}

const failures = [];
const files = markdownFiles(root);

for (const file of files) {
  const content = readFileSync(file, "utf8");
  const linkPattern = /!?\[[^\]]*\]\(([^)]+)\)/g;

  for (const match of content.matchAll(linkPattern)) {
    const destination = destinationFrom(match[1]);
    if (
      !destination ||
      destination.startsWith("#") ||
      /^[a-z][a-z0-9+.-]*:/i.test(destination)
    ) {
      if (destination.startsWith("#")) {
        const anchor = destination.slice(1);
        if (anchor && !anchorsFor(file).has(anchor)) {
          failures.push(`${relative(root, file)}: missing anchor #${anchor}`);
        }
      }
      continue;
    }

    const [pathPart, anchor] = destination.split("#", 2);
    const target = resolve(dirname(file), pathPart);
    if (!target.startsWith(`${root}/`) || !existsSync(target)) {
      failures.push(`${relative(root, file)}: missing path ${destination}`);
      continue;
    }

    const targetFile = lstatSync(target).isDirectory()
      ? join(target, "README.md")
      : target;
    if (anchor && extname(targetFile) === ".md") {
      if (!existsSync(targetFile) || !anchorsFor(targetFile).has(anchor)) {
        failures.push(
          `${relative(root, file)}: missing anchor #${anchor} in ${relative(root, targetFile)}`,
        );
      }
    }
  }
}

if (failures.length > 0) {
  console.error(`Markdown link check failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Markdown link check passed for ${files.length} files.`);
}
