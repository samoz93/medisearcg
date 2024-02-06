type ILanguages =
  | "English"
  | "arabic"
  | "german"
  | "chinese"
  | "hindi"
  | "japanese"
  | "french"
  | "spanish"
  | "slovak"
  | "turkish";

export type IEventTypes = "user_message" | "interrupt" | "close";
export type IResponseTypes = "llm_response" | "articles" | "error";

export type IConversationSettings = {
  language: ILanguages;
};

export interface ICommonEventOrResponse {
  event: IEventTypes | IResponseTypes;
  id: string;
}

interface ICommonInput {
  key: string;
}

export interface IMessageEvent extends ICommonInput, ICommonEventOrResponse {
  event: "user_message";
  conversation: string[];
  settings: IConversationSettings;
}

export interface IInterruptEvent extends ICommonInput, ICommonEventOrResponse {
  event: "interrupt";
}

export interface ICloseEvent extends ICommonInput, ICommonEventOrResponse {
  event: "close";
}

// OUTPUT
export interface ILlmResponse extends ICommonEventOrResponse {
  text: string;
  citations?: string[];
  event: "llm_response";
}

interface IArticle {
  title: string;
  url: string;
  authors: string[];
  year: string;
}

export interface IArticlesResponse extends ICommonEventOrResponse {
  event: "articles";
  articles: IArticle[];
  lastResponse: ILlmResponse;
}

type IErrorCodes =
  | "error_auth"
  | "error_missing_key"
  | "error_internal"
  | "error_llm"
  | "error_not_enough_articles"
  | "error_out_of_tokens"
  | "unknown_event";

/**
 *
 * @interface IError
 * @member {string} error_code is used to determine the reason for failure
 *  - error_auth: You are not authorized to make a request. Either your API key is wrong, or you ran out of free requests.
    - error_missing_key: API key is missing.
    - error_internal: Internal bug 🐛.
    - error_llm: Issue with the LLM 😟.
    - error_not_enough_articles: Not enough relevant articles found.
    - error_out_of_tokens: Ran out of context space, start a new conversation.
 */

export interface IErrorResponse extends ICommonEventOrResponse {
  event: "error";
  error_code: IErrorCodes;
}

export type IResponseUnion = ILlmResponse | IErrorResponse | IArticlesResponse;
