# async-iterable-stream

Streams for `AsyncIterable`.

## Usage

Assuming that `asyncCounter` is a function that returns an `AsyncIterable` (like
an `AsyncGenerator`) which can be iterated as following:

```ts
for await (const value of asyncCounter()) {
  // 1 2 3 4 5 ...
}
```

Import `createStream` from [`stream.ts`](stream.ts) and create a new stream
around this iterable:

```ts
const counter$ = createStream(asyncCounter());
```

Act on this stream with operators and create a new stream from it:

```ts
const odd$ = counter$ // 1 2 3 4 5 ...
  .filter((value) => value % 2 !== 0); // 1 3 5 7 9 ...
```

Then create another stream of the previous:

```ts
const oddThenSquare$ = odd$ // 1 3 5 7 9 ...
  .map((value) => value ** 2); // 1 6 25 49 81 ...
```

And many more.

Finally, subscribe to it:

```ts
oddThenSquare$.subscribe((value) => {
  // 1 6 25 49 81 ...
});
```

## Operators

- [x] map
- [x] filter
