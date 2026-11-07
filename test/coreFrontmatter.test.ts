import { describe, it, expect } from "vitest";
import { VFile } from "vfile";
import { NoteProperties, coreParsesFrontmatter } from "../src/transformer";
import type { BuildCtx } from "@quartz-community/types";

const coreCtx = {
  allSlugs: [],
  cfg: { plugins: { transformers: [{ name: "Frontmatter" }, { name: "NoteProperties" }] } },
} as unknown as BuildCtx;
const legacyCtx = { allSlugs: [] } as unknown as BuildCtx;

describe("built-in frontmatter detection", () => {
  it("detects Quartz's built-in Frontmatter transformer", () => {
    expect(coreParsesFrontmatter(coreCtx)).toBe(true);
    expect(coreParsesFrontmatter(legacyCtx)).toBe(false);
  });

  it("only builds the properties view when core parses frontmatter", () => {
    const plugins = NoteProperties({ includeAll: true }).markdownPlugins!(coreCtx);
    // no remark-frontmatter, no parser: a single step reading file.data.frontmatter
    expect(plugins).toHaveLength(1);
    const step = (plugins[0] as () => (tree: unknown, file: VFile) => void)();

    const file = new VFile({ value: "---\ntitle: ignored\n---\n", path: "note.md" });
    file.data = {
      frontmatter: { title: "Parsed by core", tags: ["a"], "quartz-properties": false },
    } as VFile["data"];
    step(null, file);

    expect(file.data.frontmatter).toEqual({
      title: "Parsed by core",
      tags: ["a"],
      "quartz-properties": false,
    });
    expect(file.data.noteProperties).toMatchObject({
      properties: { title: "Parsed by core", tags: ["a"] },
      showProperties: false,
    });
    // internal keys never show up in the table
    expect(file.data.noteProperties?.properties).not.toHaveProperty("quartz-properties");
  });

  it("does nothing for files without frontmatter data", () => {
    const plugins = NoteProperties({}).markdownPlugins!(coreCtx);
    const step = (plugins[0] as () => (tree: unknown, file: VFile) => void)();
    const file = new VFile({ value: "", path: "note.md" });
    file.data = {};
    step(null, file);
    expect(file.data.noteProperties).toBeUndefined();
  });

  it("keeps parsing frontmatter itself on Quartz versions without the built-in", () => {
    const plugins = NoteProperties({}).markdownPlugins!(legacyCtx);
    expect(plugins).toHaveLength(2);
  });
});
