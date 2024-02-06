import { Agent } from "./services";

const start = async () => {
  const agent = new Agent({
    api_key: "c269c6fc-7f4e-47b2-831d-43418b7d1fce",
  });

  const conversation = await agent.createConversation({
    settings: {
      language: "English",
    },
  });

  // Listen to all events
  conversation.allEventsStream.subscribe((response) => {
    switch (response.event) {
      case "articles":
        console.log(response);

        break;
      case "error":
        break;
      case "llm_response":
        break;
      default:
        break;
    }
  });

  // Get only the llm_response events
  conversation.getEventStream("llm_response").subscribe((response) => {
    console.log(response);
  });

  conversation.ask("What is the meaning of life?");
};

// start()

console.log();

export * from "./services";
export * from "./types";
