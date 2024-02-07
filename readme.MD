# Project Name

MediSearch Library

## Description

A nodejs library to use MediSearch api

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [License](#license)

## Installation

`pnpm i samoz93/medi-search`

## Usage

Sample usage

```javascript
const agent = new Agent({
  api_key: "c269c6fc-7f4e-47b2-831d-43418b7d1fce",
});

const conversation = await agent.createConversation({
  settings: {
    language: "English",
  },
  // The last message should be for the agent such as the next message you send will be for the user
  previousConversations: ["user_message", "agent_message"],
});

// Listen to all events
conversation.allEventsStream.subscribe((response) => {
  switch (response.event) {
    case "articles":
      console.log(response);
      break;
    case "error":
      // ...
      break;
    case "llm_response":
      // ...
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
// Interrupt the current query
conversation.interrupt();
// Close the conversation
conversation.close();

// Get all conversations
const allConversations = agent.getAllConversation();
console.log(allConversations);
// Get a specific conversation
const specificConversation = agent.getConversation(conversation.uuid);
console.log(specificConversation);

// Close all conversations
agent.destroy();
```

## License

MIT
