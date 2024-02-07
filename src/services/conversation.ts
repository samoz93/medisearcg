import { Subject, filter } from "rxjs";
import {
  ICloseEvent,
  IConversationSettings,
  IInterruptEvent,
  ILlmResponse,
  IMessageEvent,
  IResponseTypes,
  IResponseUnion,
} from "../types";

export class Conversation {
  private chat: string[] = [];
  private isGenerating = false;
  obs = new Subject<IResponseUnion>();
  public readonly uuid: string;

  constructor(
    private connectionSettings: {
      api_key: string;
      uuid: string;
      client: WebSocket;
    },
    private conversationSettings: IConversationSettings,
    previousConversations: string[],
    private interruptOnOverlappingRequest = false
  ) {
    if (previousConversations?.length) {
      this.chat = previousConversations;
    }

    this.uuid = connectionSettings.uuid;

    // Save the observable and the unsubscribe function
    this.connectionSettings.client.addEventListener("message", (data) => {
      if (data.data) {
        const response = this.incomingMessagePipe(
          JSON.parse(data.data?.toString())
        );
        this.obs.next(response);
      }
    });
  }

  get allEventsStream() {
    return this.obs.asObservable();
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

  private get whoNext() {
    return this.chat.length % 2 === 0 ? "user" : "agent";
  }

  private incomingMessagePipe = (data: IResponseUnion): IResponseUnion => {
    switch (data.event) {
      case "articles":
        // Articles event may be triggered multiple time, a hacky fix to not throw off the order of the chat
        if (this.whoNext === "agent") {
          this.chat.push(this.lastResponse!.text);
        } else {
          this.chat[this.chat.length - 1] = this.lastResponse!.text;
        }
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
      settings: {
        language: this.conversationSettings.language,
      },
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
    this.obs.complete();
  }
}
