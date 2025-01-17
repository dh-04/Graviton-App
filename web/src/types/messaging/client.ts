import { BaseMessage } from "../../services/clients/client.types";

///////// NotifyExtension Messages

export interface ExtensionMessage extends BaseMessage {
  content: string;
  extension_id: string;
}

export interface NotifyExtension<T = ExtensionMessage> {
  NotifyExtension: T;
}

///////// LSP Messages

export interface LanguageServerInitialization extends BaseMessage {
  id: string;
}

export interface LanguageServerNotification extends BaseMessage {
  id: string;
  content: string;
}

type LanguageServerMessage =
  | LanguageServerInitialization
  | LanguageServerNotification;

export interface NotifyLanguageServers<T = LanguageServerMessage> {
  NotifyLanguageServers: T;
}

///////// UI Events Messages

export interface StatusBarItemClicked extends BaseMessage {
  id: string;
}

export type UIEvents = StatusBarItemClicked;

export interface UIEvent<T = UIEvents> {
  UIEvent: T;
}
