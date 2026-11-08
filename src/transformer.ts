import matter from "gray-matter";
import remarkFrontmatter from "remark-frontmatter";
import yaml from "js-yaml";
import toml from "toml";
import type {
  QuartzTransformerPlugin,
  BuildCtx,
  QuartzPluginData,
  FullSlug,
  FilePath,
} from "@quartz-community/types";
import { slugTag, slugifyFilePath, getFileExtension, transformLink } from "@quartz-community/utils";
import type { TransformOptions } from "@quartz-community/utils";
import { slugifyWikilinkTarget } from "./util/path";
import type { NotePropertiesOptions } from "./types";

/**
 * gray-matter adds custom engines to its defaults, which include a `javascript`/`js` engine that
 * `eval`s the frontmatter (`---js`). Content is data, not code: refuse those languages.
 */
const refuseJavaScript = (): never => {
  throw new Error(
    "JavaScript frontmatter (---js / ---javascript) is not supported: Quartz does not execute code from content. Use YAML or TOML frontmatter.",
  );
};

const defaultOptions: NotePropertiesOptions = {
  includeAll: false,
  includedProperties: ["description", "tags", "aliases"],
  excludedProperties: [],
  hidePropertiesView: false,
  aliasProperties: ["permalink"],
  delimiters: "---",
  language: "yaml",
};

function coalesceAliases(data: Record<string, unknown>, aliases: string[]): unknown | undefined {
  for (const alias of aliases) {
    if (data[alias] !== undefined && data[alias] !== null) return data[alias];
  }
}

function coerceToArray(input: unknown): string[] | undefined {
  if (input === undefined || input === null) return undefined;

  if (!Array.isArray(input)) {
    return String(input)
      .split(",")
      .map((s: string) => s.trim());
  }

  return input
    .filter((v: unknown) => typeof v === "string" || typeof v === "number")
    .map((v: string | number) => v.toString());
}

function getAliasSlugs(aliases: string[]): FullSlug[] {
  return aliases.map((alias) => {
    const isMd = getFileExtension(alias) === ".md";
    const mockFp = isMd ? alias : alias + ".md";
    return slugifyFilePath(mockFp as FilePath);
  });
}

const WIKILINK_PATTERN = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
const MDLINK_PATTERN = /\[(?:[^\]]*)\]\(([^)]+)\)/g;

function extractLinksFromValue(value: unknown): string[] {
  if (typeof value === "string") {
    const links: string[] = [];
    let match: RegExpExecArray | null;

    WIKILINK_PATTERN.lastIndex = 0;
    while ((match = WIKILINK_PATTERN.exec(value)) !== null) {
      links.push(slugifyWikilinkTarget(match[1]!));
    }

    MDLINK_PATTERN.lastIndex = 0;
    while ((match = MDLINK_PATTERN.exec(value)) !== null) {
      links.push(match[1]!);
    }

    return links;
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => extractLinksFromValue(item));
  }

  if (value !== null && typeof value === "object") {
    return Object.values(value).flatMap((v) => extractLinksFromValue(v));
  }

  return [];
}

function collectLinkTargetsFromValue(value: unknown): Set<string> {
  const targets = new Set<string>();
  if (typeof value === "string") {
    let match: RegExpExecArray | null;
    WIKILINK_PATTERN.lastIndex = 0;
    while ((match = WIKILINK_PATTERN.exec(value)) !== null) {
      targets.add(slugifyWikilinkTarget(match[1]!));
    }
    MDLINK_PATTERN.lastIndex = 0;
    while ((match = MDLINK_PATTERN.exec(value)) !== null) {
      targets.add(match[1]!);
    }
  } else if (Array.isArray(value)) {
    for (const item of value) {
      for (const t of collectLinkTargetsFromValue(item)) targets.add(t);
    }
  } else if (value !== null && typeof value === "object") {
    for (const v of Object.values(value)) {
      for (const t of collectLinkTargetsFromValue(v)) targets.add(t);
    }
  }
  return targets;
}

/** Quartz-internal frontmatter keys that should never appear in the properties table. */
const QUARTZ_INTERNAL_KEYS = new Set([
  "quartz-properties",
  "quartzProperties",
  "quartz-properties-collapse",
  "quartzPropertiesCollapse",
]);

function coerceToBool(value: unknown): boolean | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (lower === "true") return true;
    if (lower === "false") return false;
  }
  return undefined;
}
function getVisibleProperties(
  data: Record<string, unknown>,
  opts: NotePropertiesOptions,
): Record<string, unknown> {
  const excluded = new Set(opts.excludedProperties);
  // Always exclude Quartz-internal keys from the visible properties table
  for (const key of QUARTZ_INTERNAL_KEYS) {
    excluded.add(key);
  }
  if (opts.includeAll) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (!excluded.has(key)) {
        result[key] = value;
      }
    }
    return result;
  }

  const result: Record<string, unknown> = {};
  for (const key of opts.includedProperties) {
    if (!excluded.has(key) && data[key] !== undefined) {
      result[key] = data[key];
    }
  }
  return result;
}

/**
 * Quartz 5.1+ parses frontmatter in core (built-in "Frontmatter" transformer, configured under
 * `configuration.frontmatter`). On those versions this plugin only builds the properties view from
 * `file.data.frontmatter`; on older versions it parses frontmatter itself, as before.
 */
export function coreParsesFrontmatter(ctx: BuildCtx): boolean {
  const transformers = (ctx as { cfg?: { plugins?: { transformers?: { name?: string }[] } } }).cfg
    ?.plugins?.transformers;
  return Array.isArray(transformers) && transformers.some((t) => t?.name === "Frontmatter");
}

function notePropertiesData(
  data: Record<string, unknown>,
  opts: NotePropertiesOptions,
): NonNullable<QuartzPluginData["noteProperties"]> {
  // Read per-note overrides for properties view visibility and collapsed state
  const showProperties = coerceToBool(
    coalesceAliases(data, ["quartz-properties", "quartzProperties"]),
  );
  const collapseProperties = coerceToBool(
    coalesceAliases(data, ["quartz-properties-collapse", "quartzPropertiesCollapse"]),
  );
  return {
    properties: getVisibleProperties(data, opts),
    hideView: opts.hidePropertiesView,
    showProperties,
    collapseProperties,
  };
}

export const NoteProperties: QuartzTransformerPlugin<Partial<NotePropertiesOptions>> = (
  userOpts,
) => {
  const opts = { ...defaultOptions, ...userOpts };
  return {
    name: "NoteProperties",
    markdownPlugins(_ctx: BuildCtx) {
      if (coreParsesFrontmatter(_ctx)) {
        return [
          () => {
            return (_, file) => {
              const data = file.data.frontmatter as Record<string, unknown> | undefined;
              if (!data) return;
              file.data.noteProperties = notePropertiesData(data, opts);
            };
          },
        ];
      }

      // Legacy path (Quartz without built-in frontmatter): parse frontmatter here.
      const { allSlugs } = _ctx;
      return [
        [remarkFrontmatter, ["yaml", "toml"]],
        () => {
          return (_, file) => {
            const fileData = Buffer.from(file.value as Uint8Array);
            const { data } = matter(fileData, {
              delimiters: opts.delimiters,
              language: opts.language,
              engines: {
                yaml: (s) => yaml.load(s, { schema: yaml.JSON_SCHEMA }) as object,
                toml: (s) => toml.parse(s) as object,
                javascript: refuseJavaScript,
                js: refuseJavaScript,
              },
            });

            if (data.title != null && data.title.toString() !== "") {
              data.title = data.title.toString();
            } else {
              data.title = file.stem ?? "Untitled";
            }

            const tags = coerceToArray(coalesceAliases(data, ["tags", "tag"]));
            if (tags) data.tags = [...new Set(tags.map((tag: string) => slugTag(tag)))];

            const aliases = coerceToArray(coalesceAliases(data, ["aliases", "alias"])) ?? [];
            const propertyAliases = opts.aliasProperties.flatMap((property) => {
              const value = data[property];
              const isScalar = typeof value === "string" || typeof value === "number";
              if (!isScalar && !Array.isArray(value)) return [];
              return coerceToArray(value) ?? [];
            });
            const allAliases = [...aliases, ...propertyAliases];

            if (aliases.length > 0) data.aliases = aliases;

            if (allAliases.length > 0) {
              file.data.aliases = [...new Set(getAliasSlugs(allAliases))];
              allSlugs.push(...file.data.aliases);
            }

            const cssclasses = coerceToArray(coalesceAliases(data, ["cssclasses", "cssclass"]));
            if (cssclasses) data.cssclasses = cssclasses;

            const socialImage = coalesceAliases(data, ["socialImage", "image", "cover"]);

            const created = coalesceAliases(data, ["created", "date"]);
            if (created) data.created = created;

            const modified = coalesceAliases(data, [
              "modified",
              "lastmod",
              "updated",
              "last-modified",
            ]);
            if (modified) data.modified = modified;
            data.modified ||= created;

            const published = coalesceAliases(data, ["published", "publishDate", "date"]);
            if (published) data.published = published;

            if (socialImage) data.socialImage = socialImage;

            const uniqueSlugs = [...new Set(allSlugs)];
            allSlugs.splice(0, allSlugs.length, ...uniqueSlugs);

            const frontmatterLinks = extractLinksFromValue(data);
            if (frontmatterLinks.length > 0) {
              const existingLinks = (file.data.frontmatterLinks as string[]) ?? [];
              file.data.frontmatterLinks = [...existingLinks, ...frontmatterLinks];
            }

            file.data.noteProperties = notePropertiesData(data, opts);

            file.data.frontmatter = data as QuartzPluginData["frontmatter"];
          };
        },
      ];
    },
    htmlPlugins(ctx: BuildCtx) {
      return [
        () => {
          return (_tree: unknown, file: { data: Record<string, unknown> }) => {
            const noteProps = file.data.noteProperties as
              | { properties: Record<string, unknown>; resolvedLinks?: Record<string, string> }
              | undefined;
            if (!noteProps) return;

            const fileSlug = file.data.slug as FullSlug;
            const transformOptions: TransformOptions = {
              strategy: "shortest",
              allSlugs: ctx.allSlugs,
            };

            const targets = new Set<string>();
            for (const value of Object.values(noteProps.properties)) {
              for (const t of collectLinkTargetsFromValue(value)) targets.add(t);
            }

            if (targets.size === 0) return;

            const resolved: Record<string, string> = {};
            for (const target of targets) {
              resolved[target] = transformLink(fileSlug, target, transformOptions);
            }
            noteProps.resolvedLinks = resolved;
          };
        },
      ];
    },
  };
};

declare module "vfile" {
  interface DataMap {
    aliases: FullSlug[];
    frontmatterLinks: string[];
    noteProperties: {
      properties: Record<string, unknown>;
      hideView: boolean;
      showProperties?: boolean;
      collapseProperties?: boolean;
      resolvedLinks?: Record<string, string>;
    };
  }
}
