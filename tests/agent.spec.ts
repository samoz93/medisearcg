import { Agent } from "../src";

describe("Agent Api test suit", () => {
  let agent: Agent;
  beforeEach(() => {
    agent = new Agent({
      api_key: "1234",
    });
    jest.spyOn(agent, "isReady").mockReturnValue(Promise.resolve(true));
  });

  test("Make sure we can create a conversation", async () => {
    const conversation = await agent.createConversation({
      settings: {
        language: "English",
      },
      previousConversations: ["user", "agent"],
    });
    expect(conversation).toBeDefined();
    expect(agent.getAllConversation().length).toBe(1);
    expect(agent.getConversation(conversation.uuid)).toBe(conversation);
  });

  test("Make sure we fail if the client is not ready", async () => {
    jest.spyOn(agent, "isReady").mockReturnValue(Promise.resolve(false));

    expect(
      agent.createConversation({
        settings: {
          language: "English",
        },
      })
    ).rejects.toThrow();
  });

  test("Make sure we fail if the chat history is corrupt", async () => {
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
  });
});
