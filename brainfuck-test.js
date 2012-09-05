var bf = require('./brainfuck.js');

var helloWorld = new bf.brainfuck({
  src:  '++++++++++ This text will be ignored! [>+++++++>++++++++++>+++>+<<<<-]>++.>+.+++++++..+++.>++.<<+++++++++++++++.>.+++.------.--------.>+.>.',
  name: 'hello.bf'
});

console.log(helloWorld.exec());

function bfPrint(text) {
  var noop = function() {};
  var outputter = new bf.brainfuck({
    src: text.replace(/./g, '+') + '[>,.<-]',
    in:  text,

    complete: noop,
    error:    noop,
    success:  noop
  });

  if(x = outputter.exec()) {
    console.log(x); 
  };
}

bfPrint('Lorem ipsum dolor sit amet...');
