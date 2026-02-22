import type {
  QuartzComponent,
  QuartzComponentProps,
  QuartzComponentConstructor,
} from "@quartz-community/types";
import { classNames } from "../util/lang";
import { i18n } from "../i18n";
import style from "./styles/noteProperties.scss";
// @ts-ignore
import script from "./scripts/noteProperties.inline.ts";

export interface NotePropertiesComponentOptions {
  /** Collapse the properties panel by default */
  collapsed?: boolean;
}

function renderValue(value: unknown): preact.JSX.Element | string {
  if (value === null || value === undefined) {
    return <span class="note-properties-empty">—</span>;
  }

  if (typeof value === "boolean") {
    return (
      <span class={classNames("note-properties-boolean", value ? "is-true" : "is-false")}>
        <input type="checkbox" checked={value} disabled />
      </span>
    );
  }

  if (typeof value === "number") {
    return <span class="note-properties-number">{value}</span>;
  }

  if (typeof value === "string") {
    // Check for wikilinks
    const wikilinkMatch = value.match(/^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/);
    if (wikilinkMatch) {
      const target = wikilinkMatch[1];
      const display = wikilinkMatch[2] ?? target;
      return (
        <a href={target} class="internal note-properties-link">
          {display}
        </a>
      );
    }

    // Check for markdown links
    const mdLinkMatch = value.match(/^\[([^\]]*)\]\(([^)]+)\)$/);
    if (mdLinkMatch) {
      const display = mdLinkMatch[1]!;
      const href = mdLinkMatch[2]!;
      const isExternal = href.startsWith("http://") || href.startsWith("https://");
      return (
        <a
          href={href}
          class={classNames(isExternal ? "external" : "internal", "note-properties-link")}
          {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {display || href}
        </a>
      );
    }

    // Check for URLs
    if (value.startsWith("http://") || value.startsWith("https://")) {
      return (
        <a
          href={value}
          class="external note-properties-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          {value}
        </a>
      );
    }

    return <span class="note-properties-text">{value}</span>;
  }

  if (Array.isArray(value)) {
    return (
      <ul class="note-properties-list">
        {value.map((item, idx) => (
          <li key={idx}>{renderValue(item)}</li>
        ))}
      </ul>
    );
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    return (
      <dl class="note-properties-object">
        {entries.map(([k, v]) => (
          <>
            <dt>{k}</dt>
            <dd>{renderValue(v)}</dd>
          </>
        ))}
      </dl>
    );
  }

  return String(value);
}

function renderTagList(tags: string[]): preact.JSX.Element {
  return (
    <ul class="note-properties-tags">
      {tags.map((tag) => (
        <li key={tag}>
          <a href={`/tags/${tag}`} class="internal tag-link">
            #{tag}
          </a>
        </li>
      ))}
    </ul>
  );
}

export default ((opts?: NotePropertiesComponentOptions) => {
  const { collapsed = false } = opts ?? {};

  const Component: QuartzComponent = (props: QuartzComponentProps) => {
    const noteProps = props.fileData?.noteProperties as
      | { properties: Record<string, unknown>; hideView: boolean }
      | undefined;

    if (!noteProps || noteProps.hideView) return null;

    const properties = noteProps.properties;
    const entries = Object.entries(properties);
    if (entries.length === 0) return null;

    const locale = props.cfg?.locale || "en-US";
    const i18nData = i18n(locale);

    return (
      <details
        class={classNames(props.displayClass, "note-properties")}
        open={!collapsed}
        data-collapsed={collapsed}
      >
        <summary class="note-properties-header">
          <span class="note-properties-title">{i18nData.components.noteProperties.title}</span>
          <span class="note-properties-count">{entries.length}</span>
        </summary>
        <table class="note-properties-table">
          <tbody>
            {entries.map(([key, value]) => (
              <tr key={key} class="note-properties-row">
                <td class="note-properties-key">{key}</td>
                <td class="note-properties-value">
                  {key === "tags" && Array.isArray(value)
                    ? renderTagList(value as string[])
                    : renderValue(value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    );
  };

  Component.css = style;
  Component.afterDOMLoaded = script;

  return Component;
}) satisfies QuartzComponentConstructor;
