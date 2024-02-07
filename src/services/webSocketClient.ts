import { BehaviorSubject, Observable, Subject, lastValueFrom } from "rxjs";
import { RawData, WebSocket } from "ws";
import { ICommonEventOrResponse } from "../types";

export class WebSocketClient {
  readonly client: WebSocket;
  private _isReady = new BehaviorSubject(false);

  async isReady() {
    if (this._isReady.value || this.client.readyState === WebSocket.OPEN) {
      return this._isReady;
    }

    return await lastValueFrom(this._isReady);
  }

  constructor(url: string) {
    this.client = new WebSocket(url);
    this.client.on("open", () => {
      console.log("Connected");

      this._isReady.next(true);
      this._isReady.complete();
    });

    this.client.on("error", (error) => {
      console.log("Error", error);

      this._isReady.next(false);
      this._isReady.complete();
    });
  }

  getObservable<T extends ICommonEventOrResponse>(
    event: string
  ): [Observable<T>, () => void] {
    const obs = new Subject<T>();
    const sub = (raw: RawData) => {
      const data = JSON.parse(raw.toString("utf-8")) as T;
      console.log(data);
      obs.next(data);
    };

    const unsub = () => {
      this.client.off(event, sub);
    };

    this.client.on(event, sub);

    return [obs, unsub];
  }

  send(data: any) {
    console.log("Sending", data);

    this.client.send(JSON.stringify(data));
  }

  close() {
    this.client.close();
  }
}
