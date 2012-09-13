var brainfuck = require('../brainfuck.js'),
    assert    = require('assert');

var execLimit = 1000;

var helloWorld = new brainfuck({
  name:   'hello.bf',
  src:    '++++++++++ This text will be ignored! [>+++++++>++++++++++>+++>+<<<<-]>++.>+.+++++++..+++.>++.<<+++++++++++++++.>.+++.------.--------.>+.>.',

  limit:  execLimit,
  
  output: function(v) {
            assert(v && v.text === 'Hello World!\n', 'Failed Hello World Test');
          }
});

var badSyntax = new brainfuck({
  src:    '+++++[>+++++++++++++<-]>.]',

  limit:  execLimit,

  output: function(v) {
            assert(v === null, 'Failed Bad Syntax Test');
          }
});

var BOF = new brainfuck({
  name:   'BOF Test',
  src:    '<',

  limit:  execLimit,

  output: function(v) {
            assert(v === null, 'Failed BOF Test');
          }
});

var innerLoop = new brainfuck({
  name:   'Inner Loop and Input Test',
  src:    '+++[>+++[>,.<-]<-]',

  limit:  execLimit,

  output: function(v) {
            assert(v && v.text === 'brainfuck', 'Failed Inner Loop and Input Test');
          }
});

var timeOut = new brainfuck({
  name:   'Timeout Test',
  src:    '[+]',

  limit:  0,

  output: function(v) {
            assert(v === null, 'Failed Timeout Test');
          }
});

var tests = [{bf: helloWorld, input: null},
             {bf: badSyntax,  input: null},
             {bf: BOF,        input: null},
             {bf: innerLoop,  input: 'brainfuck'},
             {bf: timeOut,    input: null}];

for (i = 0; i < tests.length; ++i) {
  tests[i].bf.run(tests[i].input);
}
