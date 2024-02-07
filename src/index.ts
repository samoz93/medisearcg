import { Agent } from "./services";

export * from "./services";
export * from "./types";

const setup = async () => {
  const agent = new Agent({
    api_key: "4419b33f-4ada-4a2c-8211-4de5899670bd",
  });

  const convo = await agent.createConversation();
  convo.allEventsStream.subscribe((data) => {
    console.log(data);
  });

  convo.ask("What is the meaning of life?");
};

setup();
