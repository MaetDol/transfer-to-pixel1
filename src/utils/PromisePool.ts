type Producer<R> = {
  producer: () => Promise<R>;
  size: number;
  resolve: (value: R) => void;
  reject: (value: unknown) => void;
};

export class PromisePool {
  limit: number = 0;
  onBoardSize: number = 0;
  pool: Producer<unknown>[] = [];

  constructor(limit: number) {
    this.limit = limit;
    this.onBoardSize = 0;
    this.pool = [];
  }

  push<T>(producer: () => Promise<T>, size: number) {
    const { pool, onBoardSize, limit } = this;
    const producerInfo: Producer<T> = {
      producer,
      size,
      resolve: () => {},
      reject: () => {},
    };
    const promise = new Promise<T>((resolve, reject) => {
      producerInfo.resolve = resolve;
      producerInfo.reject = reject;
    });

    if (onBoardSize < limit) {
      this.consume(producerInfo);
    } else {
      pool.push(producerInfo);
    }

    return promise;
  }

  consume(producerInfo: Producer<unknown>) {
    this.onBoardSize += producerInfo.size;

    producerInfo
      .producer()
      .then(producerInfo.resolve)
      .catch(producerInfo.reject)
      .finally(() => {
        this.onBoardSize -= producerInfo.size;
        if (!this.pool.length && !this.onBoardSize) {
        } else {
          this.next();
        }
      });
  }

  next() {
    const { pool, limit } = this;
    while (pool.length && this.onBoardSize < limit) {
      const producerInfo = pool.shift();
      if (producerInfo) this.consume(producerInfo);
    }
  }
}
