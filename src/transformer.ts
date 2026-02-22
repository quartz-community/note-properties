import matter from "gray-matter";
import remarkFrontmatter from "remark-frontmatter";
import yaml from "js-yaml";
import toml from "toml";
import type { PluggableList } from "unified";
import type {
  QuartzTransformerPlugin,
  BuildCtx,
  QuartzPluginData,
  FullSlug,
  FilePath,
} from "@quartz-community/types";
import type { NotePropertiesOptions } from "./types";

const defaultOptions: NotePropertiesOptions = {
  includeAll: false,
  includedProperties: ["description", "tags", "aliases"],
  excludedProperties: [],
  hidePropertiesView: false,
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

function slugTag(tag: string): string {
  return tag
    .split("/")
    .map((segment) =>
      segment
        .replace(/\s+/g, "-")
        .replace(/[^\w\p{L}\p{M}\p{N}/-]/gu, "")
        .toLowerCase(),
    )
    .join("/");
}

function getFileExtension(fp: string): string {
  return fp.split(".").pop() ?? "";
}

function slugifyFilePath(fp: string): FullSlug {
  fp = fp.replace(/\\/g, "/");
  fp = fp.replace(/\.md$/, "");
  let slug = fp
    .split("/")
    .map((segment) => segment.replace(/\s+/g, "-").replace(/[^\w\p{L}\p{M}\p{N}/-]/gu, ""))
    .join("/");
  slug = slug.replace(/\/$/, "");
  return slug as FullSlug;
}

function getAliasSlugs(aliases: string[]): FullSlug[] {
  return aliases.map((alias) => {
    const isMd = getFileExtension(alias) === "md";
    const mockFp = isMd ? alias : alias + ".md";
    return slugifyFilePath(mockFp as FilePath);
  });
}

// Wikilink pattern: [[target|display]] or [[target]]
const WIKILINK_PATTERN = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
// Markdown link pattern: [text](target)
const MDLINK_PATTERN = /\[(?:[^\]]*)\]\(([^)]+)\)/g;

function extractLinksFromValue(value: unknown): string[] {
  if (typeof value === "string") {
    const links: string[] = [];
    let match: RegExpExecArray | null;

    WIKILINK_PATTERN.lastIndex = 0;
    while ((match = WIKILINK_PATTERN.exec(value)) !== null) {
      links.push(match[1]!);
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

function getVisibleProperties(
  data: Record<string, unknown>,
  opts: NotePropertiesOptions,
): Record<string, unknown> {
  const excluded = new Set(opts.excludedProperties);

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

export const NoteProperties: QuartzTransformerPlugin<Partial<NotePropertiesOptions>> = (
  userOpts,
) => {
  const opts = { ...defaultOptions, ...userOpts };
  return {
    name: "NoteProperties",
    markdownPlugins(ctx: BuildCtx) {
      const { cfg, allSlugs } = ctx;
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
              },
            });

            if (data.title != null && data.title.toString() !== "") {
              data.title = data.title.toString();
            } else {
              data.title = file.stem ?? "Untitled";
            }

            const tags = coerceToArray(coalesceAliases(data, ["tags", "tag"]));
            if (tags) data.tags = [...new Set(tags.map((tag: string) => slugTag(tag)))];

            const aliases = coerceToArray(coalesceAliases(data, ["aliases", "alias"]));
            if (aliases) {
              data.aliases = aliases;
              file.data.aliases = getAliasSlugs(aliases);
              allSlugs.push(...file.data.aliases);
            }

            if (data.permalink != null && data.permalink.toString() !== "") {
              data.permalink = data.permalink.toString() as FullSlug;
              const fileAliases = (file.data.aliases as FullSlug[]) ?? [];
              fileAliases.push(data.permalink);
              file.data.aliases = fileAliases;
              allSlugs.push(data.permalink);
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

            const visibleProps = getVisibleProperties(data, opts);
            file.data.noteProperties = {
              properties: visibleProps,
              hideView: opts.hidePropertiesView,
            };

            file.data.frontmatter = data as QuartzPluginData["frontmatter"];
          };
        },
      ];
    },
  };
};

declare module "vfile" {
  interface DataMap {
    aliases: FullSlug[];
    frontmatter: { [key: string]: unknown } & {
      title: string;
    } & Partial<{
        tags: string[];
        aliases: string[];
        modified: string;
        created: string;
        published: string;
        description: string;
        socialDescription: string;
        publish: boolean | string;
        draft: boolean | string;
        lang: string;
        enableToc: string;
        cssclasses: string[];
        socialImage: string;
        comments: boolean | string;
      }>;
    frontmatterLinks: string[];
    noteProperties: {
      properties: Record<string, unknown>;
      hideView: boolean;
    };
  }
}
