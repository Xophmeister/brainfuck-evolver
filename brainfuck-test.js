var brainfuck = require('./brainfuck.js'),
    assert    = require('assert');

var helloWorld = new brainfuck({
  name: 'hello.bf',
  src:  '++++++++++ This text will be ignored! [>+++++++>++++++++++>+++>+<<<<-]>++.>+.+++++++..+++.>++.<<+++++++++++++++.>.+++.------.--------.>+.>.'
});

assert.equal(helloWorld.exec(), 'Hello World!\n');

var test = new brainfuck({
  src: '+++++[.-]+]'
});

assert.equal(test.exec(1000), false);
