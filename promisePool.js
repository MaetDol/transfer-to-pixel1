module.exports = class PromisePool {

  constructor( limit ){
    this.limit = limit;
    this.onBoardSize = 0;
    this.clearHandler = [];
    this.pool = [];
  }

  push( producer, size ){
    const { pool, onBoardSize, limit } = this;
    const promise = new Promise((resolve, reject) => {
      producer.resolve = resolve;
      producer.reject = reject;
    })

    if( onBoardSize < limit ){
      this.consume([ producer, size ]);
    } else {
      pool.push([ producer, size ]);
    }

    return promise;
  }

  consume([ producer, size ]){
    this.onBoardSize += size;

    producer().then( d => {
      this.onBoardSize -= size;
      if( !this.pool.length && !this.onBoardSize ){
        this.clearHandler.forEach( fnc => fnc() );
      } else {
        this.next();
      }
      return d;
    })
    .then( producer.resolve )
    .catch( producer.reject );
  }

  next(){
    const { pool, limit } = this;
    while( pool.length && this.onBoardSize < limit ){
      this.consume( pool.shift() );
    }
  }

  onClear( fnc ){
    this.clearHandler.push( fnc );
  }
  
};
