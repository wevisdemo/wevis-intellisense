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

import { CLASSES } from "./css-classes";

const CONFIGURATION = {
  enableIntellisense: "wevisIntellisense.enableIntellisense",
  allowEmmet: "wevisIntellisense.allowEmmet",
  htmlLanguages: "wevisIntellisense.htmlLanguages",
  javascriptLanguages: "wevisIntellisense.javascriptLanguages",
};

const COMMANDS = [
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
      const isIntellisenseEnabled = config.get<boolean>(CONFIGURATION.enableIntellisense);
      config.update(CONFIGURATION.enableIntellisense, !isIntellisenseEnabled, true);
    },
  },
];

const COMPLETION_TRIGGER_CHARS = "\"'` .".split("");

const HTML_REGEX = /class={?["'`]([\w- ]*$)/;
const JSX_REGEX = /className={?["'`]([\w- ]*$)/;
const EMMET_REGEX = /\.([\w-. ]*$)/;

const registerCompletionProvider = (
  languageSelector: string,
  classMatchRegex: RegExp,
  splitChar = " "
) =>
  languages.registerCompletionItemProvider(
    languageSelector,
    {
      provideCompletionItems(
        document: TextDocument,
        position: Position
      ): CompletionItem[] {
        const start = new Position(position.line, 0);
        const range = new Range(start, position);
        const text = document.getText(range);

        // Check if the cursor is on a class attribute and retrieve all the css rules in this class attribute
        const rawClasses = text.match(classMatchRegex);
        if (!rawClasses || rawClasses.length === 1) {
          return [];
        }

        // Will store the classes found on the class attribute
        const classesOnAttribute = rawClasses[1].split(splitChar);

        // Creates a collection of CompletionItem based on the classes already cached
        const completionItems = CLASSES.map((className) => {
          const completionItem = new CompletionItem(className, CompletionItemKind.Value);

          completionItem.filterText = className;
          completionItem.insertText = className;

          return completionItem;
        });

        // Removes from the collection the classes already specified on the class attribute
        for (const classOnAttribute of classesOnAttribute) {
          for (let j = 0; j < completionItems.length; j++) {
            if (completionItems[j].insertText === classOnAttribute) {
              completionItems.splice(j, 1);
            }
          }
        }

        return completionItems;
      },
    },
    ...COMPLETION_TRIGGER_CHARS
  );

const registerHTMLProviders = (disposables: Disposable[]) =>
  workspace
    .getConfiguration()
    .get<string[]>(CONFIGURATION.htmlLanguages)
    ?.forEach((extension) => {
      disposables.push(registerCompletionProvider(extension, HTML_REGEX));
    });

const registerJavaScriptProviders = (disposables: Disposable[]) =>
  workspace
    .getConfiguration()
    .get<string[]>(CONFIGURATION.javascriptLanguages)
    ?.forEach((extension) => {
      disposables.push(registerCompletionProvider(extension, JSX_REGEX));
      disposables.push(registerCompletionProvider(extension, HTML_REGEX));
    });

function registerEmmetProviders(disposables: Disposable[]) {
  const registerProviders = (modes: string[]) => {
    modes.forEach((language) => {
      disposables.push(registerCompletionProvider(language, EMMET_REGEX, "."));
    });
  };

  const config = workspace.getConfiguration();

  const htmlLanguages = config.get<string[]>(CONFIGURATION.htmlLanguages);
  if (htmlLanguages) {
    registerProviders(htmlLanguages);
  }

  const javaScriptLanguages = config.get<string[]>(CONFIGURATION.javascriptLanguages);
  if (javaScriptLanguages) {
    registerProviders(javaScriptLanguages);
  }
}

function unregisterProviders(disposables: Disposable[]) {
  disposables.forEach((disposable) => disposable.dispose());
  disposables.length = 0;
}

let wvStatusItem: StatusBarItem;

function updateStatusBarItem() {
  const config = workspace.getConfiguration();
  const editor = window.activeTextEditor;
  const currentLang = editor?.document.languageId;

  const allowLanguages = [
    ...(config.get<string[]>(CONFIGURATION.htmlLanguages) ?? []),
    ...(config.get<string[]>(CONFIGURATION.javascriptLanguages) ?? []),
  ];

  if (!(currentLang && allowLanguages.includes(currentLang))) {
    return wvStatusItem.hide();
  }

  const isIntellisenseEnabled = config.get<boolean>(CONFIGURATION.enableIntellisense);

  if (isIntellisenseEnabled) {
    wvStatusItem.tooltip = "WeVis IntelliSense is enabled!\nClick to disable";
    wvStatusItem.color = undefined;
  } else {
    wvStatusItem.tooltip =
      "WeVis IntelliSense is available but disabled!\nClick to enable";
    wvStatusItem.color = new ThemeColor("statusBarItem.warningBackground");
  }

  wvStatusItem.show();
}

const htmlDisposables: Disposable[] = [];
const javaScriptDisposables: Disposable[] = [];
const emmetDisposables: Disposable[] = [];
const commandDisposables: Disposable[] = [];

export function activate({ subscriptions }: ExtensionContext) {
  /**
   * Init Autocomplete
   */
  const disposables: Disposable[] = [];

  workspace.onDidChangeConfiguration(
    async (e) => {
      try {
        const config = workspace.getConfiguration();
        const isIntellisenseEnabled = config.get<boolean>(
          CONFIGURATION.enableIntellisense
        );

        if (isIntellisenseEnabled) {
          if (e.affectsConfiguration(CONFIGURATION.enableIntellisense)) {
            const isEnabled = config.get<boolean>(CONFIGURATION.allowEmmet);
            if (isEnabled) {
              registerEmmetProviders(emmetDisposables);
            }
            registerHTMLProviders(htmlDisposables);
            registerJavaScriptProviders(javaScriptDisposables);
          }

          if (e.affectsConfiguration(CONFIGURATION.allowEmmet)) {
            const isEnabled = config.get<boolean>(CONFIGURATION.allowEmmet);
            unregisterProviders(emmetDisposables);
            if (isEnabled) {
              registerEmmetProviders(emmetDisposables);
            }
          }

          if (e.affectsConfiguration(CONFIGURATION.htmlLanguages)) {
            unregisterProviders(htmlDisposables);
            registerHTMLProviders(htmlDisposables);
          }

          if (e.affectsConfiguration(CONFIGURATION.javascriptLanguages)) {
            unregisterProviders(javaScriptDisposables);
            registerJavaScriptProviders(javaScriptDisposables);
          }
        } else {
          unregisterProviders(emmetDisposables);
          unregisterProviders(htmlDisposables);
          unregisterProviders(javaScriptDisposables);
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
    disposables
  );

  subscriptions.push(...disposables);

  registerEmmetProviders(emmetDisposables);
  registerHTMLProviders(htmlDisposables);
  registerJavaScriptProviders(javaScriptDisposables);

  /**
   * Init Commands
   */
  COMMANDS.forEach(({ cmd, action }) => {
    commandDisposables.push(commands.registerCommand(cmd, action));
  });

  subscriptions.push(...commandDisposables);

  /**
   * Init Status
   */
  wvStatusItem = window.createStatusBarItem(StatusBarAlignment.Right, Infinity);
  wvStatusItem.text = "WV";
  wvStatusItem.command = "wevis-intellisense.toggleIntelliSense";

  subscriptions.push(wvStatusItem);

  window.onDidChangeActiveTextEditor(updateStatusBarItem);
  window.onDidChangeTextEditorOptions(updateStatusBarItem);
  window.onDidChangeVisibleTextEditors(updateStatusBarItem);
  window.onDidChangeWindowState(updateStatusBarItem);

  updateStatusBarItem();
}

export function deactivate() {
  unregisterProviders(htmlDisposables);
  unregisterProviders(javaScriptDisposables);
  unregisterProviders(emmetDisposables);
  unregisterProviders(commandDisposables);
  wvStatusItem.dispose();
}
