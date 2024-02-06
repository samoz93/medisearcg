import { filter, map } from "rxjs";
import {
  IArticlesResponse,
  ICloseEvent,
  IConversationSettings,
  IErrorResponse,
  IInterruptEvent,
  ILlmResponse,
  IMessageEvent,
  IResponseTypes,
  IResponseUnion,
} from "../types";
import { WebSocketClient } from "./webSocketClient";

export class Conversation {
  private chat: string[] = [];
  private isGenerating = false;
  private obs;
  public readonly uuid: string;
  private unsub: () => void;

  constructor(
    private connectionSettings: {
      api_key: string;
      uuid: string;
      client: WebSocketClient;
    },
    private conversationSettings: IConversationSettings & {
      previousConversations: string[];
    },
    private interruptOnOverlappingRequest = false
  ) {
    if (this.conversationSettings.previousConversations?.length) {
      this.chat = this.conversationSettings.previousConversations;
    }

    this.uuid = connectionSettings.uuid;

    // Create an observable for the conversation
    const [obs, unsub] =
      this.connectionSettings.client.getObservable<IResponseUnion>("message");

    // Save the observable and the unsubscribe function
    this.obs = obs.pipe(map(this.incomingMessagePipe));
    this.unsub = unsub;
  }

  get allEventsStream() {
    return this.obs;
  }

  getEventStream(event: IResponseTypes) {
    return this.allEventsStream.pipe(
      filter((message) => message.event === event)
    );
  }

  get conversationHistory() {
    return this.chat;
  }

  private lastResponse?: ILlmResponse;

  private incomingMessagePipe = (
    data: ILlmResponse | IErrorResponse | IArticlesResponse | IErrorResponse
  ): ILlmResponse | IErrorResponse | IArticlesResponse | IErrorResponse => {
    switch (data.event) {
      case "articles":
        this.chat.push(this.lastResponse!.text);
        return {
          ...data,
          lastResponse: this.lastResponse!,
        };
      case "error":
        this.isGenerating = false;
        // Remove the user's last question if the response is an error
        this.chat.pop();
        return data;
      case "llm_response":
        this.lastResponse = data as ILlmResponse;
        return data;
      default:
        this.isGenerating = false;
        // Remove the user's last question if the response is an error
        this.chat.pop();
        return {
          event: "error",
          error_code: "unknown_event",
          id: this.connectionSettings.uuid,
        };
    }
  };

  private sendMessage(
    message: Partial<IMessageEvent | IInterruptEvent | ICloseEvent>
  ) {
    this.connectionSettings.client.send(
      JSON.stringify({
        ...message,
        key: this.connectionSettings.api_key,
        id: this.connectionSettings.uuid,
      })
    );
  }

  ask(question: string) {
    if (this.isGenerating) {
      if (!this.interruptOnOverlappingRequest)
        throw new Error(
          "The previous response has not completed yet., please wait or set the global settings to interrupt on generating"
        );
      // TODO: handle this asynchronously, await the interruption before sending a new message
      this.interrupt();
    }

    this.isGenerating = true;

    // Add the question to the chat
    this.chat.push(question);

    this.sendMessage({
      event: "user_message",
      conversation: this.chat,
      settings: this.conversationSettings,
    });
  }

  interrupt() {
    const interruptMessage: Partial<IInterruptEvent> = {
      event: "interrupt",
    };
    this.sendMessage(interruptMessage);
  }

  close() {
    const closeMessage: Partial<ICloseEvent> = {
      event: "close",
    };
    this.sendMessage(closeMessage);
    this.unsub();
  }
}
