import { describe, it, expect } from "vitest";
import { VFile } from "vfile";
import { NoteProperties } from "../src/transformer";
import type { BuildCtx } from "@quartz-community/types";

function getProperties(
  frontmatter: string,
  opts: Parameters<typeof NoteProperties>[0],
): Record<string, unknown> {
  const plugin = NoteProperties(opts);
  const ctx = { allSlugs: [] } as unknown as BuildCtx;
  const plugins = plugin.markdownPlugins!(ctx);
  const transformer = (plugins[1] as () => (tree: unknown, file: VFile) => void)();

  const markdown = `---\n${frontmatter}\n---\ncontent`;
  const file = new VFile({
    value: new TextEncoder().encode(markdown),
    path: "note.md",
  });
  file.data = {};
  transformer(null, file);

  const noteProps = file.data.noteProperties as { properties: Record<string, unknown> };
  return noteProps.properties;
}

describe("hideEmptyProperties", () => {
  describe("disabled (default)", () => {
    it("includes null values", () => {
      const props = getProperties("description: ~", { includeAll: true });
      expect("description" in props).toBe(true);
    });

    it("includes empty string values", () => {
      const props = getProperties('description: ""', { includeAll: true });
      expect("description" in props).toBe(true);
    });

    it("includes empty array values", () => {
      const props = getProperties("tags: []", { includeAll: true });
      expect("tags" in props).toBe(true);
    });
  });

  describe("enabled with includeAll: true", () => {
    const opts = { includeAll: true, hideEmptyProperties: true };

    it("excludes null values", () => {
      const props = getProperties("description: ~", opts);
      expect("description" in props).toBe(false);
    });

    it("excludes empty string", () => {
      const props = getProperties('description: ""', opts);
      expect("description" in props).toBe(false);
    });

    it("excludes whitespace-only string", () => {
      const props = getProperties('description: "   "', opts);
      expect("description" in props).toBe(false);
    });

    it("excludes empty array", () => {
      const props = getProperties("tags: []", opts);
      expect("tags" in props).toBe(false);
    });

    it("keeps properties with non-empty values", () => {
      const props = getProperties('description: "hello"\ntags:\n  - foo', opts);
      expect(props["description"]).toBe("hello");
      expect(props["tags"]).toEqual(["foo"]);
    });

    it("keeps only non-empty properties when mixed", () => {
      const props = getProperties('description: ""\nsummary: "has content"', opts);
      expect("description" in props).toBe(false);
      expect(props["summary"]).toBe("has content");
    });
  });

  describe("enabled with includeAll: false (includedProperties)", () => {
    const opts = {
      includeAll: false,
      includedProperties: ["description", "tags"],
      hideEmptyProperties: true,
    };

    it("excludes empty string from includedProperties", () => {
      const props = getProperties('description: ""', opts);
      expect("description" in props).toBe(false);
    });

    it("excludes empty array from includedProperties", () => {
      const props = getProperties("tags: []", opts);
      expect("tags" in props).toBe(false);
    });

    it("keeps non-empty values in includedProperties", () => {
      const props = getProperties('description: "hello"', opts);
      expect(props["description"]).toBe("hello");
    });

    it("excludes properties not in includedProperties regardless", () => {
      const props = getProperties('summary: "visible"', opts);
      expect("summary" in props).toBe(false);
    });
  });
});
