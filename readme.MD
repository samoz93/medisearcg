# Project Name

MediSearch Library

## Description

A nodejs library to use MediSearch api

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Installation

`pnpm i samoz93/medi-search`

## Usage

Sample usage

```
  const agent = new Agent({
    api_key: "${your_api_key}",
  });

  const conversation = await agent.createConversation({
    language: "English",
  });

  conversation.allEventStream
  conversation.ask("What is the meaning of life?");
```

## Contributing

[Provide guidelines for contributing to your project]

## License

[Specify the license under which your project is distributed]
