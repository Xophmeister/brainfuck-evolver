var brainfuck = require('../brainfuck.js'),
    assert    = require('assert');

var execLimit = 1000;

var helloWorld = new brainfuck({
  name: 'hello.bf',
  src:  '++++++++++ This text will be ignored! [>+++++++>++++++++++>+++>+<<<<-]>++.>+.+++++++..+++.>++.<<+++++++++++++++.>.+++.------.--------.>+.>.'
});
helloWorld.exec(execLimit, function(output) {
  assert(output.text === 'Hello World!\n', 'Failed Hello World Test');
});

var badSyntax = new brainfuck({
  src: '+++++[>+++++++++++++<-]>.]'
});
badSyntax.exec(execLimit, function(output) {
  // assert(output === false, 'Failed Bad Syntax Test');
});

var BOF = new brainfuck({
  name: 'BOF Test',
  src:  '<'
});
BOF.exec(execLimit, function(output) {
  // assert(output === false, 'Failed BOF Test');
});

var innerLoop = new brainfuck({
  name:  'Inner Loop and Input Test',
  src:   '+++[>+++[>,.<-]<-]',
  input: 'brainfuck'
});
innerLoop.exec(execLimit, function(output) {
  assert(output.text === 'brainfuck', 'Failed Inner Loop and Input Test');
});

console.log('\nPassed!');
