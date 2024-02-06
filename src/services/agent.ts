import { IConnection, IConversationSettings } from "../types";
import { Conversation } from "./conversation";
import { WebSocketClient } from "./webSocketClient";

export class Agent {
  private wsConnection: WebSocketClient;

  conversations: Record<string, Conversation> = {};

  constructor(private connection: IConnection) {
    this.wsConnection = new WebSocketClient(
      "wss://public.backend.medisearch.io:443/ws/medichat/api"
    );
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
    // Await the client to be ready
    const isReady = await this.wsConnection.isReady();
    if (!isReady) {
      throw new Error("Connection is closed. Please try again later.");
    }

    // Odd number is for the AI response
    if ((options.previousConversations?.length ?? 0) % 2 !== 0) {
      throw new Error(
        "The conversation history is not in the right format. It should be in the format user, agent, user, agent, etc., The last message should be for the agent such as the next message you send will be for the user"
      );
    }

    // Generate a new UUID for the conversation
    const uuid = crypto.randomUUID().toString();
    // Create a new conversation
    const convo = new Conversation(
      {
        api_key: this.connection.api_key,
        uuid,
        client: this.wsConnection,
      },
      {
        ...options.settings,
        previousConversations: options.previousConversations || [],
      },
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
    this.wsConnection.close();
  }
}
