const { asyncQuestion } = require('./utils/CLI.js');

asyncQuestion('First: ')
  .then(res => console.log(`Respond ${res}`))
  .then(_ => asyncQuestion('Sec: '))
  .then(res => console.log(`Respond ${res}`))
  .catch(_ => console.log('Interrupted'));
