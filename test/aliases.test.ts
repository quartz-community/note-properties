import { describe, it, expect } from "vitest";
import { VFile } from "vfile";
import { NoteProperties } from "../src/transformer";
import type { BuildCtx, FullSlug } from "@quartz-community/types";
import type { NotePropertiesOptions } from "../src/types";

function buildFile(frontmatter: string, options: Partial<NotePropertiesOptions> = {}) {
  const allSlugs: FullSlug[] = [];
  const plugin = NoteProperties(options);
  const ctx = { allSlugs } as unknown as BuildCtx;

  const mdPlugins = plugin.markdownPlugins!(ctx);
  const transformer = (mdPlugins[1] as () => (tree: unknown, file: VFile) => void)();

  const markdown = `---\n${frontmatter}\n---\ncontent`;
  const file = new VFile({
    value: new TextEncoder().encode(markdown),
    path: "note.md",
  });
  file.data = {};
  transformer(null, file);

  return { file, allSlugs };
}

describe("aliasProperties", () => {
  it("registers permalink as an alias by default", () => {
    const { file } = buildFile("permalink: projects/My Project");
    expect(file.data.aliases).toEqual(["projects/my-project"]);
  });

  it("slugifies values from a configured alias property", () => {
    const { file } = buildFile("project: My Project", { aliasProperties: ["project"] });
    expect(file.data.aliases).toEqual(["my-project"]);
  });

  it("registers each entry of an array-valued alias property", () => {
    const { file } = buildFile("keywords: [alpha, beta]", { aliasProperties: ["keywords"] });
    expect(file.data.aliases).toEqual(["alpha", "beta"]);
  });

  it("combines aliases with alias properties and dedupes them", () => {
    const { file } = buildFile("aliases: [Shared]\npermalink: shared");
    expect(file.data.aliases).toEqual(["shared"]);
  });

  it("ignores over-complex alias property values", () => {
    const { file, allSlugs } = buildFile("project:\n  name: example", {
      aliasProperties: ["project"],
    });
    expect(file.data.aliases).toBeUndefined();
    expect(allSlugs).toEqual([]);
  });
});
