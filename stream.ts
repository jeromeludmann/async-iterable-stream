type Subscriber<T = any> = (value: T) => void;
type Unsubscriber = () => void;
type Operator<T1 = any, T2 = any> = (
  value: T1,
  next: (nextValue: T2) => void,
) => void;

type Map<T1 = any, T2 = any> = (value: T1) => T2;
type Filter<T = any> = (value: T) => boolean;

class StreamImpl<T = unknown> {
  private start: () => void;
  private operator: Operator<T>;
  private subscribers: Subscriber[];
  private streams: StreamImpl<any>[];

  constructor(start: () => void, operator?: Operator) {
    this.start = start;
    this.operator = operator ?? ((value, next) => next(value));
    this.subscribers = [];
    this.streams = [];
  }

  subscribe(subscriber: Subscriber<T>): Unsubscriber {
    this.subscribers.push(subscriber);
    this.start();
    return () =>
      this.subscribers = this.subscribers.filter((s) => s !== subscriber);
  }

  map<TReturn>(map: Map<T, TReturn>): Stream<TReturn> {
    return this.createStream<TReturn>((value, next) => {
      const nextValue = map(value);
      next(nextValue);
    });
  }

  filter<TReturn = T>(filter: Filter<T>): Stream<TReturn> {
    return this.createStream<TReturn>((value, next) => {
      if (filter(value)) {
        next(value);
      }
    });
  }

  private createStream<T>(operator: Operator) {
    const stream = new StreamImpl<T>(this.start, operator);
    this.streams.push(stream);
    return stream;
  }

  protected process(stream: StreamImpl<any>, value: unknown) {
    stream.operator(value, (newValue) => {
      for (const subscriber of stream.subscribers) {
        subscriber(newValue);
      }

      for (const child of stream.streams) {
        this.process(child, newValue);
      }
    });
  }
}

export function createStream<T>(source: AsyncIterable<T>): Stream<T> {
  return new (class<T> extends StreamImpl<T> {
    private started: boolean;

    constructor(source: AsyncIterable<T>) {
      super(() => this.read(source));
      this.started = false;
    }

    private async read(source: AsyncIterable<T>) {
      if (this.started) return;
      this.started = true;

      for await (const value of source) {
        this.process(this, value);
      }
    }
  })(source);
}

export interface Stream<T> extends StreamImpl<T> {}
