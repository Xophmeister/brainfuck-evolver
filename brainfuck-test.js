var brainfuck = require('./brainfuck.js'),
    assert    = require('assert');

var helloWorld = new brainfuck({
  name: 'hello.bf',
  src:  '++++++++++ This text will be ignored! [>+++++++>++++++++++>+++>+<<<<-]>++.>+.+++++++..+++.>++.<<+++++++++++++++.>.+++.------.--------.>+.>.'
});

assert(helloWorld.exec(1000) === 'Hello World!\n');

var test = new brainfuck({
  src: '+++++[-]+]'
});

assert(test.exec(1000) === false);