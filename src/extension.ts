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

import type { Disposable, ExtensionContext, TextDocument } from "vscode";
import {
  commands,
  CompletionItem,
  CompletionItemKind,
  languages,
  Position,
  Range,
  StatusBarAlignment,
  StatusBarItem,
  window,
  workspace,
} from "vscode";

import { CLASSES } from "./css-classes";

const CONFIGURATION = {
  allowEmmet: "wevis-intellisense.allowEmmet",
  htmlLanguages: "wevis-intellisense.htmlLanguages",
  javaScriptLanguages: "wevis-intellisense.javaScriptLanguages",
};

const COMMANDS = [
  {
    cmd: "wevis-intellisense.openSetting",
    action: () => {
      commands.executeCommand(
        "workbench.action.openSettings",
        "@ext:rootenginear.wevis-intellisense"
      );
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
        const start: Position = new Position(position.line, 0);
        const range: Range = new Range(start, position);
        const text: string = document.getText(range);

        // Check if the cursor is on a class attribute and retrieve all the css rules in this class attribute
        const rawClasses: RegExpMatchArray | null = text.match(classMatchRegex);
        if (!rawClasses || rawClasses.length === 1) {
          return [];
        }

        // Will store the classes found on the class attribute
        const classesOnAttribute = rawClasses[1].split(splitChar);

        // Creates a collection of CompletionItem based on the classes already cached
        const completionItems = CLASSES.map((className) => {
          const completionItem = new CompletionItem(
            className,
            CompletionItemKind.Variable
          );
          const completionClassName = className;

          completionItem.filterText = completionClassName;
          completionItem.insertText = completionClassName;

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
    .get<string[]>(CONFIGURATION.javaScriptLanguages)
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

  const htmlLanguages = workspace
    .getConfiguration()
    .get<string[]>(CONFIGURATION.htmlLanguages);
  if (htmlLanguages) {
    registerProviders(htmlLanguages);
  }

  const javaScriptLanguages = workspace
    .getConfiguration()
    .get<string[]>(CONFIGURATION.javaScriptLanguages);
  if (javaScriptLanguages) {
    registerProviders(javaScriptLanguages);
  }
}

function unregisterProviders(disposables: Disposable[]) {
  disposables.forEach((disposable) => disposable.dispose());
  disposables.length = 0;
}

let wvStatus: StatusBarItem;

function updateStatusBarItem() {
  const editor = window.activeTextEditor;
  const currentLang = editor?.document.languageId;

  const allowLanguages = [
    ...(workspace.getConfiguration().get<string[]>(CONFIGURATION.htmlLanguages) ?? []),
    ...(workspace.getConfiguration().get<string[]>(CONFIGURATION.javaScriptLanguages) ??
      []),
  ];

  if (currentLang && allowLanguages.includes(currentLang)) {
    wvStatus.show();
  } else {
    wvStatus.hide();
  }
}

const htmlDisposables: Disposable[] = [];
const javaScriptDisposables: Disposable[] = [];
const emmetDisposables: Disposable[] = [];

export function activate({ subscriptions }: ExtensionContext) {
  /**
   * Init Autocomplete
   */
  const disposables: Disposable[] = [];

  workspace.onDidChangeConfiguration(
    async (e) => {
      try {
        if (e.affectsConfiguration(CONFIGURATION.allowEmmet)) {
          const isEnabled = workspace
            .getConfiguration()
            .get<boolean>(CONFIGURATION.allowEmmet);
          if (isEnabled) {
            unregisterProviders(emmetDisposables);
            registerEmmetProviders(emmetDisposables);
          } else {
            unregisterProviders(emmetDisposables);
          }
        }

        if (e.affectsConfiguration(CONFIGURATION.htmlLanguages)) {
          unregisterProviders(htmlDisposables);
          registerHTMLProviders(htmlDisposables);
        }

        if (e.affectsConfiguration(CONFIGURATION.javaScriptLanguages)) {
          unregisterProviders(javaScriptDisposables);
          registerJavaScriptProviders(javaScriptDisposables);
        }
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
    subscriptions.push(commands.registerCommand(cmd, action));
  });

  /**
   * Init Status
   */
  wvStatus = window.createStatusBarItem(StatusBarAlignment.Right, Infinity);
  wvStatus.text = `Wv`;
  wvStatus.tooltip =
    "WeVis IntelliSense is available in this file!\nClick to open settings...";
  wvStatus.command = "wevis-intellisense.openSetting";
  subscriptions.push(wvStatus);

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
}
