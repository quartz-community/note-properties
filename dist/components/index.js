import { joinSegments, simplifySlug as simplifySlug$1 } from '@quartz-community/utils';
import { jsxs, jsx, Fragment } from 'preact/jsx-runtime';

// src/util/lang.ts
function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}
function simplifySlug(fp) {
  return simplifySlug$1(fp);
}
function resolveRelative(current, target) {
  const simplified = simplifySlug(target);
  const rootPath = pathToRoot(current);
  return joinSegments(rootPath, simplified);
}
function pathToRoot(slug) {
  let rootPath = slug.split("/").filter((x) => x !== "").slice(0, -1).map((_) => "..").join("/");
  if (rootPath.length === 0) {
    rootPath = ".";
  }
  return rootPath;
}

// src/i18n/locales/en-US.ts
var en_US_default = {
  components: {
    noteProperties: {
      title: "Properties"
    }
  }
};

// src/i18n/index.ts
var locales = {
  "en-US": en_US_default
};
function i18n(locale) {
  return locales[locale] || en_US_default;
}

// src/components/styles/noteProperties.scss
var noteProperties_default = '.note-properties {\n  margin: 0.5rem 0 1rem;\n  border: 1px solid var(--lightgray);\n  border-radius: 5px;\n  font-size: 0.9rem;\n}\n.note-properties[open] > .note-properties-header {\n  border-bottom: 1px solid var(--lightgray);\n}\n.note-properties .note-properties-header {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n  padding: 0.4rem 0.8rem;\n  cursor: pointer;\n  user-select: none;\n  list-style: none;\n  color: var(--darkgray);\n  font-weight: 600;\n}\n.note-properties .note-properties-header::-webkit-details-marker {\n  display: none;\n}\n.note-properties .note-properties-header::before {\n  content: "";\n  display: inline-block;\n  width: 0.5em;\n  height: 0.5em;\n  border-right: 2px solid var(--darkgray);\n  border-bottom: 2px solid var(--darkgray);\n  transform: rotate(-45deg);\n  transition: transform 0.2s ease;\n}\n.note-properties[open] > .note-properties-header::before {\n  transform: rotate(45deg);\n}\n.note-properties .note-properties-count {\n  margin-left: auto;\n  font-size: 0.75rem;\n  color: var(--gray);\n  font-weight: 400;\n}\n.note-properties .note-properties-table {\n  width: 100%;\n  border-collapse: collapse;\n  table-layout: fixed;\n}\n.note-properties .note-properties-row {\n  border-bottom: 1px solid var(--lightgray);\n}\n.note-properties .note-properties-row:last-child {\n  border-bottom: none;\n}\n.note-properties .note-properties-key {\n  width: 35%;\n  padding: 0.35rem 0.8rem;\n  color: var(--gray);\n  font-size: 0.85rem;\n  vertical-align: top;\n  word-break: break-word;\n}\n.note-properties .note-properties-value {\n  padding: 0.35rem 0.8rem;\n  vertical-align: top;\n  word-break: break-word;\n}\n.note-properties .note-properties-empty {\n  color: var(--gray);\n  font-style: italic;\n}\n.note-properties .note-properties-boolean input[type=checkbox] {\n  pointer-events: none;\n  margin: 0;\n  vertical-align: middle;\n}\n.note-properties .note-properties-number {\n  font-family: var(--codeFont);\n  font-size: 0.85em;\n}\n.note-properties .note-properties-link {\n  text-decoration: none;\n  color: var(--secondary);\n}\n.note-properties .note-properties-link:hover {\n  text-decoration: underline;\n}\n.note-properties .note-properties-separator {\n  color: var(--gray);\n}\n.note-properties .note-properties-list {\n  display: inline;\n}\n.note-properties .note-properties-tags {\n  display: inline;\n}\n.note-properties .note-properties-tags .tag-link {\n  display: inline-block;\n  padding: 0.1rem 0.4rem;\n  border-radius: 3px;\n  background: var(--highlight);\n  color: var(--secondary);\n  font-size: 0.85em;\n  text-decoration: none;\n}\n.note-properties .note-properties-tags .tag-link:hover {\n  background: var(--secondary);\n  color: var(--light);\n}\n.note-properties .note-properties-object code {\n  font-size: 0.85em;\n  padding: 0.1rem 0.3rem;\n  border-radius: 3px;\n  background: var(--highlight);\n  word-break: break-all;\n}';

// src/components/scripts/noteProperties.inline.ts
var noteProperties_inline_default = 'var o="note-properties-collapsed";function d(){let e=document.querySelector("details.note-properties");if(!e)return;let t=localStorage.getItem(o);if(t!==null){let i=t==="true";e.open=!i}let n=()=>{localStorage.setItem(o,String(!e.open))};e.addEventListener("toggle",n),typeof window<"u"&&window.addCleanup&&window.addCleanup(()=>{e.removeEventListener("toggle",n)})}document.addEventListener("nav",()=>{d()});document.addEventListener("render",()=>{d()});\n';
var WIKILINK_RE = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
var MDLINK_RE = /\[([^\]]*)\]\(([^)]+)\)/g;
var URL_RE = /https?:\/\/[^\s<>]+/g;
function renderTextWithLinks(text, ctx) {
  const segments = [];
  for (const match of text.matchAll(WIKILINK_RE)) {
    const target = match[1];
    const display = match[2] ?? target;
    const href = resolveRelative(ctx.slug, target);
    segments.push({
      start: match.index,
      end: match.index + match[0].length,
      node: /* @__PURE__ */ jsx("a", { href, class: "internal note-properties-link", children: display })
    });
  }
  for (const match of text.matchAll(MDLINK_RE)) {
    const overlaps = segments.some(
      (s) => match.index < s.end && match.index + match[0].length > s.start
    );
    if (overlaps) continue;
    const display = match[1];
    const href = match[2];
    const isExternal = href.startsWith("http://") || href.startsWith("https://");
    const resolvedHref = isExternal ? href : resolveRelative(ctx.slug, href);
    segments.push({
      start: match.index,
      end: match.index + match[0].length,
      node: /* @__PURE__ */ jsx(
        "a",
        {
          href: resolvedHref,
          class: classNames(isExternal ? "external" : "internal", "note-properties-link"),
          ...isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {},
          children: display || href
        }
      )
    });
  }
  for (const match of text.matchAll(URL_RE)) {
    const overlaps = segments.some(
      (s) => match.index < s.end && match.index + match[0].length > s.start
    );
    if (overlaps) continue;
    segments.push({
      start: match.index,
      end: match.index + match[0].length,
      node: /* @__PURE__ */ jsx(
        "a",
        {
          href: match[0],
          class: "external note-properties-link",
          target: "_blank",
          rel: "noopener noreferrer",
          children: match[0]
        }
      )
    });
  }
  if (segments.length === 0) return [text];
  segments.sort((a, b) => a.start - b.start);
  const result = [];
  let cursor = 0;
  for (const seg of segments) {
    if (seg.start > cursor) {
      result.push(text.slice(cursor, seg.start));
    }
    result.push(seg.node);
    cursor = seg.end;
  }
  if (cursor < text.length) {
    result.push(text.slice(cursor));
  }
  return result;
}
function renderValue(value, ctx) {
  if (value === null || value === void 0) {
    return /* @__PURE__ */ jsx("span", { class: "note-properties-empty", children: "\u2014" });
  }
  if (typeof value === "boolean") {
    return /* @__PURE__ */ jsx("span", { class: classNames("note-properties-boolean", value ? "is-true" : "is-false"), children: /* @__PURE__ */ jsx("input", { type: "checkbox", checked: value, disabled: true }) });
  }
  if (typeof value === "number") {
    return /* @__PURE__ */ jsx("span", { class: "note-properties-number", children: value });
  }
  if (typeof value === "string") {
    const parts = renderTextWithLinks(value, ctx);
    return /* @__PURE__ */ jsx("span", { class: "note-properties-text", children: parts });
  }
  if (Array.isArray(value)) {
    const items = value.map((item, idx) => {
      const rendered = renderValue(item, ctx);
      return /* @__PURE__ */ jsxs(Fragment, { children: [
        idx > 0 && /* @__PURE__ */ jsx("span", { class: "note-properties-separator", children: ", " }),
        rendered
      ] });
    });
    return /* @__PURE__ */ jsx("span", { class: "note-properties-list", children: items });
  }
  if (typeof value === "object") {
    return /* @__PURE__ */ jsx("span", { class: "note-properties-object", children: /* @__PURE__ */ jsx("code", { children: JSON.stringify(value) }) });
  }
  return String(value);
}
function renderTagList(tags, ctx) {
  const items = tags.map((tag, idx) => {
    const href = resolveRelative(ctx.slug, `tags/${tag}`);
    return /* @__PURE__ */ jsxs(Fragment, { children: [
      idx > 0 && /* @__PURE__ */ jsx("span", { class: "note-properties-separator", children: ", " }),
      /* @__PURE__ */ jsx("a", { href, class: "internal tag-link", children: tag })
    ] });
  });
  return /* @__PURE__ */ jsx("span", { class: "note-properties-tags", children: items });
}
var NoteProperties_default = ((opts) => {
  const { collapsed = false } = opts ?? {};
  const Component = (props) => {
    const noteProps = props.fileData?.noteProperties;
    if (!noteProps) return null;
    if (noteProps.showProperties === false) return null;
    if (noteProps.showProperties !== true && noteProps.hideView) return null;
    const properties = noteProps.properties;
    const entries = Object.entries(properties);
    if (entries.length === 0) return null;
    const locale = props.cfg?.locale || "en-US";
    const i18nData = i18n(locale);
    const ctx = { slug: props.fileData?.slug ?? "" };
    const isCollapsed = noteProps.collapseProperties ?? collapsed;
    return /* @__PURE__ */ jsxs(
      "details",
      {
        class: classNames(props.displayClass, "note-properties"),
        open: !isCollapsed,
        "data-collapsed": isCollapsed,
        children: [
          /* @__PURE__ */ jsxs("summary", { class: "note-properties-header", children: [
            /* @__PURE__ */ jsx("span", { class: "note-properties-title", children: i18nData.components.noteProperties.title }),
            /* @__PURE__ */ jsx("span", { class: "note-properties-count", children: entries.length })
          ] }),
          /* @__PURE__ */ jsx("table", { class: "note-properties-table", children: /* @__PURE__ */ jsx("tbody", { children: entries.map(([key, value]) => /* @__PURE__ */ jsxs("tr", { class: "note-properties-row", children: [
            /* @__PURE__ */ jsx("td", { class: "note-properties-key", children: key }),
            /* @__PURE__ */ jsx("td", { class: "note-properties-value", children: key === "tags" && Array.isArray(value) ? renderTagList(value, ctx) : renderValue(value, ctx) })
          ] }, key)) }) })
        ]
      }
    );
  };
  Component.css = noteProperties_default;
  Component.afterDOMLoaded = noteProperties_inline_default;
  return Component;
});

export { NoteProperties_default as NotePropertiesComponent };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map