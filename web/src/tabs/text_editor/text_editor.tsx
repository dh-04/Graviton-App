import TextEditor from "../../components/TextEditor/TextEditor";

import { clientState } from "../../state/state";
import { getRecoil } from "recoil-nexus";
import { FileFormat } from "../../services/clients/client.types";
import { Popup } from "../../modules/popup";
import * as commands from "@codemirror/commands";
import {
  SaveTabOptions,
  Tab,
  TabContextMenuHooks,
  TextEditorTabData,
} from "../../modules/tab";
import { rust } from "@codemirror/lang-rust";
import { basename, dirname } from "path";
import {
  LanguageServerClient,
  languageServerWithTransport,
} from "codemirror-languageserver";
import { useEffect, useState } from "react";
import TabText from "../../components/Tabs/TabText";
import LoadingTabContent from "../../components/Tabs/LoadingTabContent";
import {
  LanguageServerInitialization,
  NotifyLanguageServers,
} from "../../types/messaging";
import FileIcon from "../../components/Filesystem/FileIcon";
import useLSPClients from "../../hooks/useLSPClients";
import GravitonTransport from "./graviton_lsp_transport";
import { useTranslation } from "react-i18next";
import {
  crosshairCursor,
  drawSelection,
  dropCursor,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  KeyBinding,
  keymap,
  lineNumbers,
  rectangularSelection,
} from "@codemirror/view";
import {
  bracketMatching,
  defaultHighlightStyle,
  foldGutter,
  foldKeymap,
  indentOnInput,
  syntaxHighlighting,
} from "@codemirror/language";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
} from "@codemirror/autocomplete";
import { lintKeymap } from "@codemirror/lint";
import { EditorState, Extension, StateCommand } from "@codemirror/state";
import { javascript } from "@codemirror/lang-javascript";

interface SavedState {
  scrollHeight: number;
}

/**
 * A tab that displays a CodeMirror editor inside it
 */
class TextEditorTab extends Tab {
  public state: SavedState = {
    scrollHeight: 0,
  };
  public path: string;
  public filename: string;
  public format: FileFormat;
  public lastSavedStateText: string[] = [];
  public view?: EditorView;
  public contentResolver: Promise<string | null>;

  /**
   * @param path - Path of the opened file
   * @param initialContent - Current content of the file
   */
  constructor(
    filename: string,
    path: string,
    contentResolver: Promise<string | null>,
    format: FileFormat,
  ) {
    super(filename);
    this.path = path;
    this.hint = path;
    this.filename = filename;
    this.format = format;
    this.contentResolver = contentResolver;
  }

  public container = TabTextEditorContainer;

  public icon({ tab }: { tab: Tab }) {
    const textEditorTab = tab as unknown as TextEditorTab;
    return (
      <FileIcon
        isOpened={false}
        item={{
          isFile: true,
          name: textEditorTab.filename,
        }}
      />
    );
  }

  contextMenusTab({ tab }: TabContextMenuHooks) {
    const textEditorTab = tab as unknown as TextEditorTab;
    return [
      {
        label: {
          text: "CopyPath",
        },
        action() {
          navigator.clipboard.writeText(textEditorTab.path);
          return false;
        },
      },
    ];
  }

  /**
   * Destroy the CodeMirror view
   */
  public close(): void {
    this.view?.destroy();
    return;
  }

  /**
   * Only open text files
   * @param format - The requested file's format
   */
  static isCompatible(format: FileFormat) {
    return format !== "Binary";
  }

  /**
   * Shortcut to update the tab's state
   * @param state - Wether the editor is edited or not
   */
  public setEdited(state: boolean) {
    this.edited = state;
  }

  /**
   * Get the content of the Codemirror state as a String
   * @returns The current content on the editor
   */
  public getContent(): string | null {
    if (this.view) return this.view.state.doc.sliceString(0);
    return null;
  }

  /**
   * Save the tab
   *
   * @param options - Different options to tweak the saving behavior
   */
  public save({ force, close, setEdited }: SaveTabOptions): Popup | null {
    const safeSave = () => {
      this.saveFile();

      // Mark the tab as saved
      setEdited(false);
    };

    if (force === true) {
      safeSave();
    } else if (this.edited) {
      return new Popup(
        {
          text: "popups.AskSaveFile.title",
          props: { file_path: this.filename },
        },
        {
          text: "popups.AskSaveFile.content",
        },
        [
          {
            label: {
              text: "Save",
            },
            action: () => safeSave(),
          },
          {
            label: {
              text: "Don't save",
            },
            action: () => {
              // User decided to not save the file, therefore close it
              close();
            },
          },
          {
            label: {
              text: "Cancel",
            },
            action: () => undefined,
          },
        ],
        200,
      );
    }
    return null;
  }

  /**
   * Write the file to the FS
   */
  private async saveFile() {
    const currentContent = this.getContent();

    // Make sure the file is loaded and has content
    if (this.view && currentContent != null) {
      const client = getRecoil(clientState);

      // Save the file
      await client.write_file_by_path(this.path, currentContent, "local");

      // Update the last saved state text
      this.lastSavedStateText = this.view.state.doc.toJSON();
    }
  }

  public toJson(): TextEditorTabData {
    return {
      tab_type: "TextEditor",
      path: this.path,
      filesystem: "local",
      format: this.format,
      filename: this.filename,
      id: this.id,
    };
  }
}

function TabTextEditorContainer({
  close,
  setEdited,
  tab,
}: {
  close: () => void;
  setEdited: (state: boolean) => void;
  tab: Tab;
}) {
  const textEditorTab = tab as unknown as TextEditorTab;

  const [view, setView] = useState(textEditorTab.view);
  const { find, add } = useLSPClients();
  const { t } = useTranslation();

  useEffect(() => {
    if (view != null) return;

    // Wait until the tab is mounted to read it's content
    textEditorTab.contentResolver.then((initialValue) => {
      if (initialValue != null) {
        textEditorTab.view = new EditorView({
          state: createDefaulState(initialValue),
          dispatch: (tx) => {
            if (tx.docChanged) setEdited(true);
            (textEditorTab.view as EditorView).update([tx]);
          },
        });

        // Update the view component
        setView(textEditorTab.view);
      } else {
        // If there is no content to read then just close the tab
        textEditorTab.close();
        close();
      }
    });

    function getKeymap() {
      // Undo command
      const undo: StateCommand = (target) => {
        commands.undo(target);
        return checkEditStatus(target);
      };

      // Redo command
      const redo: StateCommand = (target) => {
        commands.redo(target);
        return checkEditStatus(target);
      };

      // If the new state doc is the same as the last saved one then set the tab as unedited
      const checkEditStatus: StateCommand = (target) => {
        const currentStateText = target.state.doc.toJSON();

        if (
          textEditorTab.lastSavedStateText.length == currentStateText.length &&
          textEditorTab.lastSavedStateText.every((e, i) =>
            e == currentStateText[i]
          )
        ) {
          setEdited(false);
        } else {
          setEdited(true);
        }

        return false;
      };

      // Define the custom keymap
      const customKeymap: readonly KeyBinding[] = [
        { key: "mod-y", run: redo, preventDefault: true },
        { key: "mod-z", run: undo, preventDefault: true },
      ];

      return keymap.of(customKeymap);
    }

    // Initialize the CodeMirror State
    function createDefaulState(initialValue: string): EditorState {
      const extensions = [
        getKeymap(),
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        foldGutter(),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        bracketMatching(),
        closeBrackets(),
        autocompletion(),
        rectangularSelection(),
        crosshairCursor(),
        highlightActiveLine(),
        highlightSelectionMatches(),
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
          ...foldKeymap,
          ...completionKeymap,
          ...lintKeymap,
        ]),
      ];
      let lspLanguage: [string, string] | null = null;

      if (typeof textEditorTab.format !== "string") {
        switch (textEditorTab.format.Text) {
          case "TypeScript":
            lspLanguage = ["typescript", textEditorTab.format.Text];
            extensions.push(javascript());
            break;
          case "JavaScript":
            lspLanguage = ["javascript", textEditorTab.format.Text];
            extensions.push(javascript());
            break;
          case "Rust":
            lspLanguage = ["rust", textEditorTab.format.Text];
            extensions.push(rust());
            break;
          default:
            lspLanguage = null;
        }
      }

      // TODO(marc2332):
      // - This should not assume there is a language server implementation running
      //   Instead, the language server must notify this frontend, or maybe just ask the core

      // LSP IS DISABLED FOR NOW
      // @ts-ignore
      if (lspLanguage != null && true === false) {
        const [languageId] = lspLanguage;
        const unixPath = textEditorTab.path.replace(/\\/g, "/");
        const rootUri = `file:///${dirname(unixPath)}`;

        const lsClient = find(rootUri, languageId);

        const lspPlugin = createLSPPlugin(
          languageId,
          unixPath,
          rootUri,
          (client) => {
            add({
              rootUri,
              languageId,
              client,
            });
          },
          lsClient,
        );

        extensions.push(lspPlugin);
      }

      const state = EditorState.create({
        extensions,
        doc: initialValue,
      });

      // Leave the just created state as the latest one saved
      textEditorTab.lastSavedStateText = state.doc.toJSON();

      return state;
    }
  }, [view]);

  const saveScroll = (height: number) => {
    textEditorTab.state.scrollHeight = height;
  };

  if (view) {
    return (
      <TextEditor
        view={view}
        scrollHeight={textEditorTab.state.scrollHeight}
        saveScroll={saveScroll}
      />
    );
  } else {
    return (
      <LoadingTabContent>
        <TabText>{t("messages.LoadingContent")}</TabText>
      </LoadingTabContent>
    );
  }
}

function createLSPPlugin(
  languageId: string,
  unixPath: string,
  rootUri: string,
  clientCreated: (client: LanguageServerClient) => void,
  lsClient?: LanguageServerClient,
): Extension {
  if (!lsClient) {
    const client = getRecoil(clientState);

    client.emitMessage<
      NotifyLanguageServers<LanguageServerInitialization>
    >({
      NotifyLanguageServers: {
        state_id: client.config.state_id,
        msg_type: "Initialization",
        id: languageId,
      },
    });

    lsClient = new (LanguageServerClient as any)({
      transport: new GravitonTransport(languageId, client),
      rootUri,
      languageId,
      workspaceFolders: [
        {
          name: basename(dirname(unixPath)),
          uri: unixPath,
        },
      ],
    });

    clientCreated(lsClient as LanguageServerClient);
  }

  const lspPlugin = (languageServerWithTransport as any)({
    client: lsClient,
    rootUri,
    documentUri: `file:///${unixPath}`,
    languageId,
    workspaceFolders: [
      {
        name: basename(dirname(unixPath)),
        uri: unixPath,
      },
    ],
  });

  return lspPlugin;
}

export default TextEditorTab;
