import { Subject, take } from "rxjs";
import { Agent, WebSocketClient } from "../src";
import { Conversation } from "../src/services/conversation";
import { ICommonEventOrResponse, IErrorResponse } from "../src/types";

jest.mock("../src/services/webSocketClient");

describe("Conversation API test suits", () => {
  let agent: Agent;
  let obs: Subject<ICommonEventOrResponse>;
  let conversation: Conversation;

  beforeEach(async () => {
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

    conversation = await agent.createConversation({
      settings: {
        language: "English",
      },
    });
  });

  test("Make sure we can get can receive a message", (done) => {
    conversation.allEventsStream.pipe(take(1)).subscribe((response) => {
      expect(response).toBeDefined();
      done();
    });

    obs.next({
      event: "llm_response",
      id: conversation.uuid,
    });
  });

  test("Make sure we get an error message for unknown events", (done) => {
    conversation.allEventsStream.pipe(take(1)).subscribe((response) => {
      expect(response).toBeDefined();
      expect(response.event).toBe("error");
      expect((response as IErrorResponse).error_code).toBe("unknown_event");
      done();
    });

    obs.next({
      // @ts-ignore
      event: "other",
      id: conversation.uuid,
    });
  });

  test("Make sure we can get can send a message and receive the articles with the related response", (done) => {
    const response1 = {
      event: "llm_response",
      id: conversation.uuid,
    };

    const response2 = {
      event: "llm_response",
      id: "conversation.uuid",
      text: "Hello",
    };
    conversation.allEventsStream.pipe().subscribe((response) => {
      expect(response).toBeDefined();
      if (response.event === "articles") {
        expect(response.lastResponse).toBeDefined();
        expect(response.lastResponse.text).toBe(response2.text);
        expect(response.lastResponse).toEqual(response2);
        done();
      }
    });

    //@ts-ignore
    obs.next(response1);
    //@ts-ignore
    obs.next(response2);

    obs.next({
      event: "articles",
      id: conversation.uuid,
    });
    obs.complete();
  });

  test("Make sure we can get can a unique observable based on type", (done) => {
    conversation
      .getEventStream("articles")
      .pipe()
      .subscribe({
        complete() {
          expect(true);
          done();
        },
        next(value) {
          expect(value).toBeDefined();
          if (value.event !== "articles") {
            done("Received the wrong kind of event");
          }
        },
      });

    //@ts-ignore
    obs.next({
      event: "error",
      id: conversation.uuid,
    });
    //@ts-ignore
    obs.next({
      event: "llm_response",
      id: conversation.uuid,
    });
    obs.next({
      event: "articles",
      id: conversation.uuid,
    });
    obs.complete();
  });
});
