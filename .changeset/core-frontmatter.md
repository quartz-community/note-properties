---
"@quartz-community/note-properties": minor
---

Use Quartz's built-in frontmatter parsing when available (Quartz 5.1+): the plugin then only builds the properties view from `file.data.frontmatter`, and disabling it no longer breaks titles, tags, aliases or drafts. On older Quartz versions it parses frontmatter itself as before. The `delimiters` / `language` options are deprecated in favour of `configuration.frontmatter`.
