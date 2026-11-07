# @quartz-community/note-properties

Renders frontmatter properties as a visible properties view on the page, similar to Obsidian's properties panel.

> [!NOTE]
> Quartz 5.1+ parses frontmatter itself (built-in, configured under `configuration.frontmatter`). On those
> versions this plugin only builds and renders the properties view; disabling it no longer breaks titles,
> tags, aliases or drafts. On older Quartz versions it still parses frontmatter as before.

## Installation

```bash
npx quartz plugin add github:quartz-community/note-properties
```

## Usage

This plugin serves as both a **transformer** (collecting the properties to show, resolving links in them) and a **component** (displaying the properties view).

```yaml title="quartz.config.yaml"
plugins:
  # Transformer (selects the properties to show)
  - source: github:quartz-community/note-properties
    enabled: true
    options:
      includeAll: false
      includedProperties:
        - description
        - tags
        - aliases
      excludedProperties: []
      aliasProperties:
        - permalink
      hidePropertiesView: false

  # Component (displays properties in the page layout)
  - source: github:quartz-community/note-properties
    enabled: true
    layout:
      position: beforeBody
      priority: 15
```

For advanced use cases, you can override in TypeScript:

```ts title="quartz.ts (override)"
import * as ExternalPlugin from "./.quartz/plugins";

ExternalPlugin.NoteProperties({
  includeAll: false,
  includedProperties: ["description", "tags", "aliases"],
  excludedProperties: [],
  hidePropertiesView: false,
  aliasProperties: ["permalink"],
});
```

## Configuration

| Option               | Type       | Default                              | Description                                                                                    |
| -------------------- | ---------- | ------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `includeAll`         | `boolean`  | `false`                              | Whether to include all frontmatter properties.                                                 |
| `includedProperties` | `string[]` | `["description", "tags", "aliases"]` | Properties to include when `includeAll` is `false`.                                            |
| `excludedProperties` | `string[]` | `[]`                                 | Properties to exclude when `includeAll` is `true`.                                             |
| `hidePropertiesView` | `boolean`  | `false`                              | Whether to hide the rendered properties view on the page.                                      |
| `aliasProperties`    | `string[]` | `["permalink"]`                      | Properties whose values are registered as alternate slugs. Values are normalized automatically.|
| `delimiters`         | `string`   | `"---"`                              | Quartz < 5.1 only: frontmatter delimiters. On 5.1+ set `configuration.frontmatter.delimiters`. |
| `language`           | `string`   | `"yaml"`                             | Quartz < 5.1 only: `"yaml"` or `"toml"`. On 5.1+ set `configuration.frontmatter.language`.     |

## Documentation

See the [Quartz documentation](https://quartz.jzhao.xyz/plugins/Frontmatter) for more information.

## License

MIT
