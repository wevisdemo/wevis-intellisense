<img src="./icon.png" width="128" height="128" loading="lazy" decoding="async" align="right" />

# WeVis IntelliSense

[![MIT License](https://img.shields.io/github/license/rootEnginear/wevis-intellisense)](https://github.com/rootEnginear/wevis-intellisense)
[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/rootenginear.wevis-intellisense)](https://marketplace.visualstudio.com/items?itemName=rootenginear.wevis-intellisense)
[![Visual Studio Marketplace Last Updated](https://img.shields.io/visual-studio-marketplace/last-updated/rootenginear.wevis-intellisense)](https://marketplace.visualstudio.com/items?itemName=rootenginear.wevis-intellisense)

VSCode IntelliSense for [WeVis Design System](https://wevisdemo.github.io/design-systems/).

To install the extension, use the keyword `WeVis` in your extension sidebar. Alternatively, you can download it from [Visual Studio Code Marketplace](https://marketplace.visualstudio.com/items?itemName=rootenginear.wevis-intellisense).

## Features

Autosuggest available CSS classes from the design system in several files format such as HTML (.html), Vue (.vue), React (.js, .jsx, .tsx), Svelte (.svelte), Astro (.astro). It works on the pattern `` class[Name]=[{]<"|'|`> ``; if the pattern matched, it will try to suggest you.

![Autosuggestion in class attribute](./assets/class.jpg)

This extension also works with Emmet, so you can type `.` and it will start suggesting you. This is enabled by default, but you can disable this functionality in the settings.

![Autosuggestion in Emmet](./assets/emmet.jpg)

To provide a clear indication whether the extension is available for a file, A small "WV" will appear at the status bar when available. You can click on it to quickly enable/disable the autosuggest functionality. When disabled, it will be in warning color (typically dark yellow).

![Extension availability shown in the status bar](./assets/status.jpg)

The extension shipped with several commands, which you can use them via the command palette (`Ctrl/Cmd + Shift + P`).

![Open extension settings using the command palette](./assets/command.jpg)

For upcoming features and plan, please see [Planned Features](#planned-features).

## Extension Settings

There are 4 settings available in this extension:

- `wevisIntellisense.enableIntellisense`
  - Enable IntelliSense in available file.
  - Default: `true`
- `wevisIntellisense.allowEmmet`
  - Allow suggestion with Emmet abbreviation.
  - Default: `true`
- `wevisIntellisense.htmlLanguages`
  - A list of HTML based languages where suggestions are enabled.
  - Default: `["html", "vue", "vue-html", "svelte", "astro"]`
- `wevisIntellisense.javascriptLanguages`
  - A list of JavaScript based languages where suggestions are enabled.
  - Default: `["javascript", "javascriptreact", "typescriptreact"]`

## Planned Features

- [x] Autosuggestion
- [ ] Snippets
  - [ ] Component Snippets
  - [ ] Cookbook Snippets
- [ ] Component Generator

## Changelogs

Updates and changelogs can be found in the [changelog file](./CHANGELOG.md).
