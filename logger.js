const fs = require('fs');
const path = require('path');

module.exports = function log( obj ){
  console.log( JSON.stringify(obj, null, 2) );
};
