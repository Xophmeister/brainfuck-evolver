var brainfuck = require('./brainfuck.js'),
    assert    = require('assert');

var execLimit = 1000;

var helloWorld = new brainfuck({
  name: 'hello.bf',
  src:  '++++++++++ This text will be ignored! [>+++++++>++++++++++>+++>+<<<<-]>++.>+.+++++++..+++.>++.<<+++++++++++++++.>.+++.------.--------.>+.>.'
});
assert(helloWorld.exec(execLimit) === 'Hello World!\n', 'Failed Hello World Test');

var badSyntax = new brainfuck({
  src: '+++++[>+++++++++++++<-]>.]'
});
assert(badSyntax.exec(execLimit) === false, 'Failed Bad Syntax Test');

var BOF = new brainfuck({
  name: 'BOF Test',
  src:  '<'
});
assert(BOF.exec(execLimit) === false, 'Failed BOF Test');

var innerLoop = new brainfuck({
  name:  'Inner Loop and Input Test',
  src:   '+++[>+++[>,.<-]<-]',
  input: 'brainfuck'
});
assert(innerLoop.exec(execLimit) === 'brainfuck', 'Failed Inner Loop and Input Test');

console.log('\nPassed!');
