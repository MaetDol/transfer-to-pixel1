module.exports = class PromisePool {

  constructor( limit ){
    this.limit = limit;
    this.onBoardSize = 0;
    this.clearHandler = [];
    this.pool = [];
  }

  push( producer, size ){
    const { pool, onBoardSize, limit } = this;

    if( onBoardSize < limit ){
      this.consume([ producer, size ]);
    } else {
      pool.push([ producer, size ]);
    }

    return new Promise((resolve, reject) => {
      producer.resolve = resolve;
      producer.reject = reject;
    })
  }

  consume([ producer, size ]){
    const promise = producer(); 

    this.onBoardSize += size;
    promise.then( d => {
      producer.resolve(d);
      this.onBoardSize -= size;
      this.next();
    }).catch( producer.reject );
  }

  next(){
    const { pool, limit, clearHandler } = this;
    while( pool.length && this.onBoardSize < limit ){
      this.consume( pool.shift() );
    }

    if( !pool.length ){
      clearHandler.forEach( fnc => fnc() );
    }
  }

  onClear( fnc ){
    this.clearHandler.push( fnc );
  }
  
};
