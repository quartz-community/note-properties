---
"@quartz-community/note-properties": patch
---

Security: frontmatter can no longer run code during a build (#4). On Quartz versions without built-in frontmatter parsing, where this plugin parses frontmatter itself, a note starting with `---js` or `---javascript` had its frontmatter evaluated as JavaScript (gray-matter's default engine). It's now refused with an error. Quartz 5.1 parses frontmatter itself and has the same fix.
