# Changelog

All notable changes to the "wevis-intellisense" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1] — 2022-11-19

### Fixed

- Register autosuggest providers after enabling.

## [1.1.0] — 2022-11-19

### Added

- Autosuggest can be toggled in valid files using command "WeVis IntelliSense: Toggle IntelliSense" (`wevis-intellisense.toggleIntelliSense`). Clicking at status item now also run this command.
- Add an extension setting:
  - `wevisIntellisense.enableIntellisense`
    - Enable IntelliSense in available file.
    - Default: `true`
- Status item now shows disabled autosuggest status with `statusBarItem.warningBackground` color (typically dark yellow).

### Changed

- Status item now **toggles autosuggest** instead of **open extension settings**.
- Setting ids have been changed:
  - `wevis-intellisense.allowEmmet` -> `wevisIntellisense.allowEmmet`
  - `wevis-intellisense.htmlLanguages` -> `wevisIntellisense.htmlLanguages`
  - `wevis-intellisense.javaScriptLanguages` -> `wevisIntellisense.javascriptLanguages`
- Change `activationEvents` from `*` to `onStartupFinished`

### Fixed

- Dispose `commands` and `wvStatusItem` on deactivate.

## [1.0.0] — 2022-11-18

### Added

- Autosuggest CSS classes in languages:
  - As HTML: `html`, `vue`, `vue-html`, `svelte`, `astro`
  - As JavaScript: `javascript`, `javascriptreact`, `typescriptreact`
- Autosuggest CSS classes in Emmet.
- Show autosuggest availability in status bar. When clicking, it will open the extension settings.
- Add command "WeVis IntelliSense: Open Settings" (`wevis-intellisense.openSettings`)
- Add extension settings:
  - `wevisIntellisense.allowEmmet`
    - Allow suggestion with Emmet abbreviation.
    - Default: `true`
  - `wevisIntellisense.htmlLanguages`
    - A list of HTML based languages where suggestions are enabled.
    - Default: `["html", "vue", "vue-html", "svelte", "astro"]`
  - `wevisIntellisense.javascriptLanguages`
    - A list of JavaScript based languages where suggestions are enabled.
    - Default: `["javascript", "javascriptreact", "typescriptreact"]`
