# Changelog

## 1.1.0

### Minor Changes

- 163c5f6: Use Quartz's built-in frontmatter parsing when available (Quartz 5.1+): the plugin then only builds the properties view from `file.data.frontmatter`, and disabling it no longer breaks titles, tags, aliases or drafts. On older Quartz versions it parses frontmatter itself as before. The `delimiters` / `language` options are deprecated in favour of `configuration.frontmatter`.

### Patch Changes

- 7719c30: Tags in the properties view link to their tag page only when the site has one (the tag-page plugin or a hand-written page); otherwise they are shown as text instead of a link to a missing page. A tag with child tags links straight to `tags/<tag>/`.
- d756c6b: `toml` 5 (prototype pollution and DoS advisories), matching Quartz core. Only used for TOML frontmatter on Quartz versions without built-in frontmatter.

## 1.0.0

### Major Changes

- Stable 1.0 release. All `@quartz-community/*` dependencies now use `^1.0.0` ranges.

  Pre-1.0 caret ranges pinned the minor version (`^0.2.1` means `>=0.2.1 <0.3.0`), so
  published fixes to shared packages could never be resolved by dependents. Moving the
  ecosystem to 1.0 makes caret ranges behave conventionally.

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial Quartz community plugin template.

### Fixed

- Frontmatter wikilinks containing spaces are now correctly slugified instead of rendering with `%20` in the href. `[[My Note]]` in a frontmatter property now renders as `./my-note` instead of `./My%20Note`.

### Changed

- **BREAKING (inherited from `@quartz-community/utils`)**: tag URLs and frontmatter-wikilink slugs are now lowercased to match Obsidian's case-insensitive matching. Tags `#MyTag`, `#mytag`, and `#MYTAG` collapse into a single tag page `tags/mytag`.
- Replaced the plugin's local slugification helpers with the shared `@quartz-community/utils` versions to eliminate drift across the Quartz ecosystem.
