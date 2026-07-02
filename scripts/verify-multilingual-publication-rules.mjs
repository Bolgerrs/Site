#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const requiredLocales = ["ru", "en", "es", "fr", "zh", "ja", "de"];
const sourceRoots = ["apps/web/src"];
const copyCallNames = ["getLocaleCopy", "localizedKeywords"];

function readFile(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function listSourceFiles(directory) {
  const absoluteDirectory = path.join(repoRoot, directory);
  const entries = fs.readdirSync(absoluteDirectory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(absoluteDirectory, entry.name);
    const relativePath = path.relative(repoRoot, absolutePath);

    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") {
        continue;
      }
      files.push(...listSourceFiles(relativePath));
      continue;
    }

    if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      files.push(relativePath);
    }
  }

  return files;
}

function parseStringList(value) {
  return Array.from(value.matchAll(/["']([^"']+)["']/g), (match) => match[1]);
}

function assertSameLocales(label, foundLocales, failures) {
  const missing = requiredLocales.filter((locale) => !foundLocales.includes(locale));
  const extra = foundLocales.filter((locale) => !requiredLocales.includes(locale));

  if (missing.length > 0 || extra.length > 0) {
    failures.push(`${label}: expected ${requiredLocales.join(", ")}; missing=${missing.join(",") || "-"} extra=${extra.join(",") || "-"}`);
  }
}

function findClosingParen(source, openParenIndex) {
  let depth = 0;
  let quote = null;
  let escaped = false;

  for (let index = openParenIndex; index < source.length; index += 1) {
    const character = source[index];

    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (character === "\\") {
        escaped = true;
        continue;
      }
      if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === "\"" || character === "'" || character === "`") {
      quote = character;
      continue;
    }

    if (character === "(") {
      depth += 1;
      continue;
    }

    if (character === ")") {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}

function extractBalancedBlock(source, openIndex, openCharacter, closeCharacter) {
  let depth = 0;
  let quote = null;
  let escaped = false;

  for (let index = openIndex; index < source.length; index += 1) {
    const character = source[index];

    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (character === "\\") {
        escaped = true;
        continue;
      }
      if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === "\"" || character === "'" || character === "`") {
      quote = character;
      continue;
    }

    if (character === openCharacter) {
      depth += 1;
      continue;
    }

    if (character === closeCharacter) {
      depth -= 1;
      if (depth === 0) {
        return source.slice(openIndex, index + 1);
      }
    }
  }

  return "";
}

function splitTopLevelArguments(source) {
  const args = [];
  let current = "";
  let parenDepth = 0;
  let braceDepth = 0;
  let bracketDepth = 0;
  let quote = null;
  let escaped = false;

  for (const character of source) {
    if (quote) {
      current += character;
      if (escaped) {
        escaped = false;
        continue;
      }
      if (character === "\\") {
        escaped = true;
        continue;
      }
      if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === "\"" || character === "'" || character === "`") {
      quote = character;
      current += character;
      continue;
    }

    if (character === "(") parenDepth += 1;
    if (character === ")") parenDepth -= 1;
    if (character === "{") braceDepth += 1;
    if (character === "}") braceDepth -= 1;
    if (character === "[") bracketDepth += 1;
    if (character === "]") bracketDepth -= 1;

    if (character === "," && parenDepth === 0 && braceDepth === 0 && bracketDepth === 0) {
      args.push(current.trim());
      current = "";
      continue;
    }

    current += character;
  }

  if (current.trim()) {
    args.push(current.trim());
  }

  return args;
}

function lineNumberFor(source, index) {
  return source.slice(0, index).split("\n").length;
}

function scanLocalizedCopyCalls(file, source, failures) {
  for (const callName of copyCallNames) {
    let searchIndex = -1;
    const marker = `${callName}(`;

    while ((searchIndex = source.indexOf(marker, searchIndex + 1)) !== -1) {
      const openParenIndex = searchIndex + callName.length;
      const closeParenIndex = findClosingParen(source, openParenIndex);

      if (closeParenIndex === -1) {
        failures.push(`${file}:${lineNumberFor(source, searchIndex)}: unterminated ${callName} call`);
        continue;
      }

      const args = splitTopLevelArguments(source.slice(openParenIndex + 1, closeParenIndex));
      const copyArgument = args[1]?.trim();

      if (!copyArgument?.startsWith("{")) {
        continue;
      }

      const foundLocales = Array.from(copyArgument.matchAll(/(?:^|[^A-Za-z0-9_])(ru|en|es|fr|zh|ja|de)\s*:/g), (match) => match[1]);
      const missing = requiredLocales.filter((locale) => !foundLocales.includes(locale));

      if (missing.length > 0) {
        failures.push(`${file}:${lineNumberFor(source, searchIndex)}: ${callName} missing locale keys ${missing.join(", ")}`);
      }
    }
  }
}

function scanEmptyTranslations(file, source, failures) {
  const emptyTranslationPattern = /(?:^|[^A-Za-z0-9_])(ru|en|es|fr|zh|ja|de)\s*:\s*(["'`])\s*\2/gm;
  const nullTranslationPattern = /(?:^|[^A-Za-z0-9_])(ru|en|es|fr|zh|ja|de)\s*:\s*(undefined|null)\b/gm;

  for (const match of source.matchAll(emptyTranslationPattern)) {
    failures.push(`${file}:${lineNumberFor(source, match.index ?? 0)}: empty ${match[1]} translation`);
  }

  for (const match of source.matchAll(nullTranslationPattern)) {
    failures.push(`${file}:${lineNumberFor(source, match.index ?? 0)}: nullish ${match[1]} translation`);
  }
}

function scanDisallowedPublicCopy(file, source, failures) {
  const forbiddenTerms = [
    "Что можно сделать на этой странице",
    "Сигнатура",
    "Материальный язык",
    "Куда идти дальше",
    "Как пользоваться направлением",
    "Точки входа в продукты",
    "Маршруты Montelar",
    "Montelar paths",
    "Montelar Wege",
    "Rutas Montelar",
    "Parcours Montelar",
    "Montelar 路径",
    "Montelarの導線",
    "Выберите направление",
    "Выберите подкатегорию",
    "Select a direction",
    "Choose a subcategory",
    "Richtung wählen",
    "Unterkategorie wählen",
    "Elige una dirección",
    "Elige una subcategoría",
    "Choisir une direction",
    "Choisir une sous-catégorie",
    "选择方向",
    "选择子类别",
    "方向を選択",
    "サブカテゴリを選択",
  ];

  for (const term of forbiddenTerms) {
    const index = source.indexOf(term);
    if (index !== -1) {
      failures.push(`${file}:${lineNumberFor(source, index)}: forbidden public scaffold phrase "${term}"`);
    }
  }
}

function main() {
  const failures = [];
  const i18nSource = readFile("apps/web/src/config/i18n.ts");
  const siteLocalesMatch = i18nSource.match(/siteLocales\s*=\s*\[([\s\S]*?)\]\s*as const/);
  const configuredLocales = siteLocalesMatch ? parseStringList(siteLocalesMatch[1]) : [];
  assertSameLocales("apps/web/src/config/i18n.ts siteLocales", configuredLocales, failures);

  const switcherSource = readFile("apps/web/src/components/locale-switcher.tsx");
  const localeLabelsMatch = switcherSource.match(/const localeLabels[\s\S]*?=\s*\{([\s\S]*?)\};/);
  const labelLocales = localeLabelsMatch
    ? Array.from(localeLabelsMatch[1].matchAll(/(?:^|\n)\s*(ru|en|es|fr|zh|ja|de)\s*:/g), (match) => match[1])
    : [];
  assertSameLocales("locale switcher flag labels", labelLocales, failures);

  const localeNamesStart = switcherSource.indexOf("const localeNames");
  const localeNamesOpenBrace = switcherSource.indexOf("{", localeNamesStart);
  const localeNamesSource = extractBalancedBlock(switcherSource, localeNamesOpenBrace, "{", "}");

  for (const sourceLocale of requiredLocales) {
    const sourceBlockMatch = localeNamesSource.match(new RegExp(`\\n\\s*${sourceLocale}:\\s*\\{([^\\n}]*)\\}\\s*,?`, "m"));
    const targetLocales = sourceBlockMatch
      ? Array.from(sourceBlockMatch[1].matchAll(/(?:^|[^A-Za-z0-9_])(ru|en|es|fr|zh|ja|de)\s*:/g), (match) => match[1])
      : [];
    assertSameLocales(`locale switcher names from ${sourceLocale}`, targetLocales, failures);
  }

  for (const file of sourceRoots.flatMap(listSourceFiles)) {
    const source = readFile(file);
    scanEmptyTranslations(file, source, failures);
    scanLocalizedCopyCalls(file, source, failures);
    scanDisallowedPublicCopy(file, source, failures);
  }

  if (failures.length > 0) {
    console.error(`verify-multilingual-publication-rules: failed (${failures.length})`);
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log(
    `verify-multilingual-publication-rules: ok locales=${configuredLocales.join(",")} scanned=${sourceRoots.join(",")}`,
  );
}

main();
