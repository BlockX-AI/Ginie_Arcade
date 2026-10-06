type Callback = () => void;
interface IHandler {
  callback: Callback;
  type: string;
}

export default class Observer {
  private handlers: IHandler[] = [];

  public getObservers = () => this.handlers;

  public subscribe = (type: string, callback: Callback) => {
    this.handlers.push({ type, callback });
  };

  public notify = (type: string) => {
    this.handlers.forEach(handler => {
      if (handler.type === type) {
        handler.callback();
      }
    });
  };
}
