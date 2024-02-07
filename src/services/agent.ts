import { BehaviorSubject, lastValueFrom } from "rxjs";
import { IConnection, IConversationSettings } from "../types";
import { Conversation } from "./conversation";

export class Agent {
  private client: WebSocket;
  private _isReady = new BehaviorSubject(false);

  async isReady(): Promise<boolean> {
    if (this._isReady.value || this.client.readyState === WebSocket.OPEN) {
      return this._isReady.getValue();
    }

    return await lastValueFrom(this._isReady);
  }

  conversations: Record<string, Conversation> = {};

  constructor(private connection: IConnection) {
    this.client = new WebSocket(
      "wss://public.backend.medisearch.io:443/ws/medichat/api"
    );

    this.client.addEventListener("error", (err) => {
      this._isReady.next(false);
      this._isReady.complete();
    });

    this.client.addEventListener("open", () => {
      this._isReady.next(true);
      this._isReady.complete();
    });
  }

  generateID() {
    var id = "";
    var characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 32; i++) {
      id += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    return id;
  }

  /**
   *
   * @interface createConversation
   * @member {IConversationSettings} settings is used to determine the basic settings of the conversation
   * @member {boolean} interruptOnOverlappingRequest is used to determine if the conversation should be interrupted if a new request is made before the last one completes
   * @returns {Promise<Conversation>}
   */
  async createConversation(
    options: {
      settings: IConversationSettings;
      previousConversations?: string[];
    } = {
      settings: { language: "English" },
      previousConversations: [],
    },
    interruptOnOverlappingRequest = false
  ) {
    const ok = await this.isReady();

    // Await the client to be ready
    if (!ok) {
      throw new Error("Connection is closed. Please try again later.");
    }

    // Odd number is for the AI response
    if ((options.previousConversations?.length || 0) % 2 !== 0) {
      throw new Error(
        "The conversation history is not in the right format. It should be in the format user, agent, user, agent, etc., The last message should be for the agent such as the next message you send will be for the user"
      );
    }

    // Generate a new UUID for the conversation
    const uuid = this.generateID();

    // Create a new conversation
    const convo = new Conversation(
      {
        api_key: this.connection.api_key,
        uuid,
        client: this.client,
      },
      options.settings,
      options.previousConversations || [],
      interruptOnOverlappingRequest
    );

    // Save the conversation
    this.conversations[uuid] = convo;
    return convo;
  }

  getConversation(uuid: string) {
    return this.conversations[uuid];
  }

  getAllConversation() {
    return Object.values(this.conversations);
  }

  // Close all conversations and the websocket connection
  destroy() {
    Object.values(this.conversations).forEach((convo) => convo.close());
    this.conversations = {};
    this.client.close();
  }
}
