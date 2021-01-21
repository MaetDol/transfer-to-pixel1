module.exports = class PromisePool {

  constructor( limit ){
    this.limit = limit;
    this.onBoardSize = 0;
    this.pool = [];
  }

  push( producer, size ){
    const { pool, onBoardSize, limit } = this;

    if( onBoardSize < limit ){
      this.consume([ producer, size ]);
    } else {
      pool.push([ producer, size ]);
    }
  }

  consume([ producer, size ]){
    const promise = producer(); 

    this.onBoardSize += size;
    promise.then( _=> {
      this.onBoardSize -= size;
      this.next();
    });
  }

  next(){
    const { pool, limit } = this;
    while( pool.length && this.onBoardSize < limit ){
      this.consume( pool.shift() );
    }
  }
  
};