/**
 * Acknowledgement
 * --------------------------------------------------
 * This extension is heavily rely on code from https://github.com/zignd/HTML-CSS-Class-Completion
 * Thank you for a great source code so I don't have to spend days reading labyrinthine VSCode docs
 *
 * References
 * --------------------------------------------------
 * - https://github.com/zignd/HTML-CSS-Class-Completion/tree/master
 * - https://github.com/microsoft/vscode-extension-samples/tree/main/completions-sample
 * - https://github.com/microsoft/vscode-extension-samples/tree/main/statusbar-sample
 * - https://github.com/microsoft/vscode-extension-samples/tree/main/snippet-sample
 * - https://github.com/microsoft/vscode-extension-samples/tree/main/quickinput-sample
 */

import {
  commands,
  CompletionItem,
  CompletionItemKind,
  Disposable,
  ExtensionContext,
  languages,
  Position,
  Range,
  StatusBarAlignment,
  StatusBarItem,
  TextDocument,
  ThemeColor,
  window,
  workspace,
} from "vscode";

import { CLASSES } from "./classes";
import { SETTINGS, COMMANDS, COMPLETION_TRIGGER_CHARS, REGEXPS } from "./config";

/**
 * Autosuggestion
 */
const registerCompletionProvider = (
  languageSelector: string,
  classMatchRegex: RegExp,
  splitChar = " "
) =>
  languages.registerCompletionItemProvider(
    languageSelector,
    {
      provideCompletionItems(document: TextDocument, position: Position) {
        const start = new Position(position.line, 0);
        const range = new Range(start, position);
        const text = document.getText(range);

        // Check if there is a match, if not just return []
        const rawClasses = text.match(classMatchRegex);
        const matchedString = rawClasses?.[1] ?? rawClasses?.[2] ?? rawClasses?.[3];
        if (!rawClasses || typeof matchedString !== "string") {
          return [];
        }

        // 1. Separate all already-there classes
        const classesInAttribute = matchedString.split(splitChar).map((c) => c.trim());
        // 2. Remove them from the list
        //    so we don't get duplicate suggest when it's already there
        const availableClasses = CLASSES.filter(
          (className) => !classesInAttribute.includes(className)
        );
        // 3. Create a list of CompletionItem
        const completionItems = availableClasses.map((className) => {
          const completionItem = new CompletionItem(className, CompletionItemKind.Value);

          completionItem.filterText = className;
          completionItem.insertText = className;

          return completionItem;
        });

        return completionItems;
      },
    },
    ...COMPLETION_TRIGGER_CHARS
  );

const registerProviders = (
  disposables: Disposable[],
  who: "emmet" | "className" = "className"
) =>
  workspace
    .getConfiguration()
    .get<string[]>(SETTINGS.autosuggestLanguages)
    ?.forEach((extension) => {
      const [regex, splitChar] =
        who === "emmet" ? [REGEXPS.emmetRegex, "."] : [REGEXPS.classNameRegex, " "];
      disposables.push(registerCompletionProvider(extension, regex, splitChar));
    });

const unregisterProviders = (disposables: Disposable[]) => {
  disposables.forEach((disposable) => disposable.dispose());
  disposables.length = 0;
};

/**
 * Status Item
 */
let wvStatusItem: StatusBarItem;

const updateStatusBarItem = () => {
  const config = workspace.getConfiguration();
  const editor = window.activeTextEditor;
  const currentLang = editor?.document.languageId;

  const allowLanguages = config.get<string[]>(SETTINGS.autosuggestLanguages) ?? [];

  if (!(currentLang && allowLanguages.includes(currentLang))) {
    return wvStatusItem.hide();
  }

  const isIntellisenseEnabled = config.get<boolean>(SETTINGS.enableIntellisense);

  if (isIntellisenseEnabled) {
    wvStatusItem.tooltip = "WeVis IntelliSense is enabled!\nClick to disable";
    wvStatusItem.color = undefined;
  } else {
    wvStatusItem.tooltip =
      "WeVis IntelliSense is available but disabled!\nClick to enable";
    wvStatusItem.color = new ThemeColor("statusBarItem.warningBackground");
  }

  wvStatusItem.show();
};

/**
 * System
 */
const classDisposables: Disposable[] = [];
const emmetDisposables: Disposable[] = [];
const commandDisposables: Disposable[] = [];
const otherDisposables: Disposable[] = [];

export const activate = ({ subscriptions }: ExtensionContext) => {
  /**
   * Init Autosuggestion
   */
  otherDisposables.push(
    workspace.onDidChangeConfiguration(
      (event) => {
        try {
          const config = workspace.getConfiguration();
          const isIntellisenseEnabled = config.get<boolean>(SETTINGS.enableIntellisense);

          if (isIntellisenseEnabled) {
            if (event.affectsConfiguration(SETTINGS.enableIntellisense)) {
              const isEnabled = config.get<boolean>(SETTINGS.allowEmmet);
              if (isEnabled) {
                registerProviders(emmetDisposables, "emmet");
              }
              registerProviders(classDisposables);
            }

            if (event.affectsConfiguration(SETTINGS.allowEmmet)) {
              const isEnabled = config.get<boolean>(SETTINGS.allowEmmet);
              unregisterProviders(emmetDisposables);
              if (isEnabled) {
                registerProviders(emmetDisposables, "emmet");
              }
            }

            if (event.affectsConfiguration(SETTINGS.autosuggestLanguages)) {
              unregisterProviders(classDisposables);
              registerProviders(classDisposables);
            }
          } else {
            unregisterProviders(emmetDisposables);
            unregisterProviders(classDisposables);
          }

          updateStatusBarItem();
        } catch (err) {
          console.error(
            "Failed to automatically reload the extension after the configuration change:",
            err
          );
        }
      },
      null,
      otherDisposables
    )
  );

  const isEmmetEnabled = workspace.getConfiguration().get<boolean>(SETTINGS.allowEmmet);
  if (isEmmetEnabled) {
    registerProviders(emmetDisposables, "emmet");
  }
  registerProviders(classDisposables);

  /**
   * Init Commands
   */
  COMMANDS.forEach(({ cmd, action }) => {
    commandDisposables.push(commands.registerCommand(cmd, action));
  });

  subscriptions.push(...commandDisposables);

  /**
   * Init Status Item
   */
  wvStatusItem = window.createStatusBarItem(StatusBarAlignment.Right, Infinity);
  wvStatusItem.text = "WV";
  wvStatusItem.command = "wevis-intellisense.toggleIntelliSense";

  subscriptions.push(wvStatusItem);

  otherDisposables.push(
    window.onDidChangeActiveTextEditor(updateStatusBarItem, null, otherDisposables)
  );
  otherDisposables.push(
    window.onDidChangeTextEditorOptions(updateStatusBarItem, null, otherDisposables)
  );
  otherDisposables.push(
    window.onDidChangeVisibleTextEditors(updateStatusBarItem, null, otherDisposables)
  );
  otherDisposables.push(
    window.onDidChangeWindowState(updateStatusBarItem, null, otherDisposables)
  );

  updateStatusBarItem();

  subscriptions.push(...otherDisposables);
};

export const deactivate = () => {
  unregisterProviders(classDisposables);
  unregisterProviders(emmetDisposables);
  unregisterProviders(commandDisposables);
  unregisterProviders(otherDisposables);
  wvStatusItem.dispose();
};
