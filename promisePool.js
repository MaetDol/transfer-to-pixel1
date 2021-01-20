module.exports = class PromisePool {

  constructor( concurrency ){
    this.concurrency = concurrency;
    this.onBoard = [];
    this.pool = [];
  }

  push( producer ){
    const { pool, onBoard, concurrency } = this;

    if( onBoard.length < concurrency ){
      this.consume( producer );
    } else {
      pool.push( producer );
    }
  }

  consume( producer ){
    const { onBoard } = this;
    const promise = producer(); 

    onBoard.push( promise );
    promise.then( _=> {
      onBoard.splice( onBoard.indexOf(promise), 1 );
      this.next( promise );
    });
  }

  next( thisPromise ){
    const { pool, onBoard } = this;
    if( pool.length ){
      this.consume( pool.shift() );
    }
  }
  
};
