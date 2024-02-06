import { Subject } from "rxjs";
import { Agent, WebSocketClient } from "../src/services";
import { ICommonEventOrResponse } from "../src/types";

jest.mock("../src/services/webSocketClient");

describe("Agent Api test suit", () => {
  let agent: Agent;
  let obs: Subject<ICommonEventOrResponse>;
  beforeEach(() => {
    agent = new Agent({
      api_key: "1234",
    });
    obs = new Subject<ICommonEventOrResponse>();

    jest
      .spyOn(WebSocketClient.prototype, "isReady")
      .mockReturnValue(Promise.resolve(true));

    jest
      .spyOn(WebSocketClient.prototype, "getObservable")
      .mockReturnValue([obs.asObservable(), () => {}]);
  });

  test("Make sure we can create a conversation", async () => {
    const conversation = await agent.createConversation({
      settings: {
        language: "English",
      },
      previousConversations: ["user", "agent"],
    });
    expect(WebSocketClient).toHaveBeenCalledTimes(1);
    expect(WebSocketClient.prototype.isReady).toHaveBeenCalledTimes(1);
    expect(conversation).toBeDefined();
    expect(agent.getAllConversation().length).toBe(1);
    expect(agent.getConversation(conversation.uuid)).toBe(conversation);
  });

  test("Make sure we fail if the client is not ready", async () => {
    jest
      .spyOn(WebSocketClient.prototype, "isReady")
      .mockReturnValue(Promise.resolve(false));

    expect(
      agent.createConversation({
        settings: {
          language: "English",
        },
      })
    ).rejects.toThrow();
  });

  test("Make sure we fail if the chat history is corrupt", async () => {
    jest
      .spyOn(WebSocketClient.prototype, "isReady")
      .mockReturnValue(Promise.resolve(true));

    expect(
      agent.createConversation({
        settings: {
          language: "English",
        },
        previousConversations: ["user", "agent", "user"],
      })
    ).rejects.toThrow();
  });

  test("Make sure we can close a conversation", async () => {
    await agent.createConversation({
      settings: {
        language: "English",
      },
    });
    agent.destroy();
    expect(agent.getAllConversation().length).toBe(0);
    expect(WebSocketClient.prototype.close).toHaveBeenCalledTimes(1);
  });
});
