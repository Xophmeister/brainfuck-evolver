var brainfuck = require('../brainfuck.js');

var helloWorld = new brainfuck({
  name:   'hello.bf',
  src:    '++++++++++ This text will be ignored! [>+++++++>++++++++++>+++>+<<<<-]>++.>+.+++++++..+++.>++.<<+++++++++++++++.>.+++.------.--------.>+.>.',

  limit:  1000
});

helloWorld.run();
