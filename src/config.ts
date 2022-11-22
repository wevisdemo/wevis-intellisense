import { commands, workspace } from "vscode";

export const SETTINGS = {
  enableIntellisense: "wevisIntellisense.enableIntellisense",
  allowEmmet: "wevisIntellisense.allowEmmet",
  autosuggestLanguages: "wevisIntellisense.autosuggestLanguages",
};

export const COMMANDS = [
  {
    cmd: "wevis-intellisense.openSettings",
    action: () => {
      commands.executeCommand(
        "workbench.action.openSettings",
        "@ext:rootenginear.wevis-intellisense"
      );
    },
  },
  {
    cmd: "wevis-intellisense.toggleIntelliSense",
    action: () => {
      const config = workspace.getConfiguration();
      const isIntellisenseEnabled = config.get<boolean>(SETTINGS.enableIntellisense);
      config.update(SETTINGS.enableIntellisense, !isIntellisenseEnabled, true);
    },
  },
];

export const COMPLETION_TRIGGER_CHARS = [..."\"'` ."];

// Testcase:
// li class="group/item [@supports(display:grid)]:grid -inset-1 [&_p]:mt-4 after:content-['*']
export const REGEXPS = {
  classNameRegex: /class(?:Name)?={?(?:"([^"]*$)|'([^']*$)|`(.*$))/,
  emmetRegex: /\.(.*$)/,
};
