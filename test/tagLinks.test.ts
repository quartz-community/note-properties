import { describe, expect, it, vi } from "vitest";

vi.mock("../src/components/styles/noteProperties.scss", () => ({ default: "" }));
vi.mock("../src/components/scripts/noteProperties.inline", () => ({ default: "" }));

import NotePropertiesComponent, { tagPageFor } from "../src/components/NoteProperties";

type VNode = { type: unknown; props: { class?: string; href?: string; children?: unknown } };

function tagElements(node: unknown, out: [unknown, string | undefined, string][] = []) {
  if (Array.isArray(node)) {
    node.forEach((n) => tagElements(n, out));
    return out;
  }
  if (!node || typeof node !== "object" || !("props" in node)) return out;
  const v = node as VNode;
  if (String(v.props.class ?? "").includes("tag-link")) {
    out.push([v.type, v.props.href, String(v.props.children)]);
    return out;
  }
  // Function components (fragments of the list) are called to reach their output.
  if (typeof v.type === "function" && v.type.name !== "Fragment") {
    return tagElements((v.type as (p: unknown) => unknown)(v.props), out);
  }
  tagElements(v.props.children, out);
  return out;
}

function render(tags: string[], otherSlugs: string[]) {
  const fileData = {
    slug: "notes/page",
    frontmatter: { title: "Page", tags },
    noteProperties: { properties: { tags }, resolvedLinks: {} },
  };
  const allFiles = [fileData, ...otherSlugs.map((slug) => ({ slug }))];
  const Component = NotePropertiesComponent();
  return tagElements(Component({ fileData, allFiles, cfg: { locale: "en-US" } } as never));
}

describe("tags in the properties view", () => {
  it("link to tag pages, and show tags without one as text (tag-page plugin off)", () => {
    expect(render(["alpha", "beta", "plugin"], ["tags/alpha", "tags/plugin/index"])).toEqual([
      ["a", "../tags/alpha", "alpha"],
      ["span", undefined, "beta"],
      ["a", "../tags/plugin/", "plugin"],
    ]);
  });

  it("tagPageFor finds tags/<tag> and tags/<tag>/index", () => {
    const files = [{ slug: "tags/a" }, { slug: "tags/b/index" }];
    expect(tagPageFor("a", files)).toBe("tags/a");
    expect(tagPageFor("b", files)).toBe("tags/b/index");
    expect(tagPageFor("c", files)).toBeUndefined();
  });
});
