const readline = require('readline');

function newReadline() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

async function asyncQuestion(text) {
  const rl = newReadline();
  return new Promise((resolve, reject) => {
    rl.on('SIGTSTP', reject);
    rl.on('close', reject);

    rl.question(text, answer => {
      resolve(answer);
      rl.close();
    });
  });
}

module.exports = {
  asyncQuestion,
};
