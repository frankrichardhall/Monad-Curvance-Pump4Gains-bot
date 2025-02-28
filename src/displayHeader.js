require('colors');

function displayHeader() {
  process.stdout.write('\x1Bc');
  console.log('========================================'.cyan);
  console.log('=       Monad Curvance Pump4Gains      ='.cyan);
  console.log('========================================'.cyan);
  console.log();
}

module.exports = displayHeader;