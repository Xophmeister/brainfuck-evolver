// JavaScript brainfuck Interpretter
// Christopher Harrison, 2012
// MIT License

var brainfuck = function(s) {
  var me = this;

  // Settings for VM
  this.vm = {
    src:      '',
    in:       '',

    complete: function(ops, ts) {
                var done = new Date().getTime();
                var secs = (done - ts) / 1000;

                console.log('Completed '.concat(
                            ops,
                            ' operations in ',
                            secs,
                            ' seconds (',
                            ops/secs,
                            ' ops/s)'));
              },
    success:  function() {
                console.log('Execution Successful');
              },
    error:    function(stack) {
                console.error('Execution Failed');
                if (stack.map && stack.join) {
                  console.error(stack
                                  .map(function(i) { return '  ' + i; } )
                                  .join('\n'));
                };
              },
  };

  if (s) {
    for (i in s) {
      this.vm[i] = s[i];
    }
  }

  // Interpreter
  this.exec = function(limit) {
    // Initialise
    var d  = [0];                                // Data (expands rightwards)
    var dp = 0;                                  // Data pointer

    var xp = 0;                                  // Execution pointer
    var xStack = new Array();                    // Execution stack
    var xi = 0;                                  // Operation count
    var xStart = new Date().getTime();           // Execution start time;

    var inStack = me.vm.in                       // String input is converted into a numeric stack:
                    .split('')                   // e.g., 'foo' > [111, 111, 102]
                    .reverse()
                    .map(function(i) { return i.charCodeAt(0); });

    var outStack = new Array();
    var errorStack = new Array();
 
    // Execute
    while (xp < me.vm.src.length && (limit?xi < limit:true)) {
      switch (me.vm.src[xp]) {
        case '+':
          ++xi;
          ++d[dp];
          ++xp;
          break;

        case '-':
          ++xi;
          --d[dp];
          ++xp;
          break;

        case '>':
          ++xi;
          if (++dp == d.length) d.push(0);
          ++xp;
          break;

        case '<':
          ++xi;
          if (--dp < 0) {
            errorStack.push('Error: Beginning of file at ' + xp);
            me.vm.complete(xi, xStart);
            me.vm.error(errorStack);
            return false;
          }
          ++xp;
          break;

        case '.':
          ++xi;
          outStack.push(d[dp]);
          ++xp;
          break;

        case ',':
          ++xi;
          if (get = inStack.pop()) {
            d[dp] = get;
          } else {
            d[dp] = 0;
            console.warn('  Warning: No input');
          }
          ++xp;
          break;

        case '[':
          ++xi;
          xStack.push(xp++);
          break;

        case ']':
          ++xi;
          if (d[dp] == 0) {
            xStack.pop();
            ++xp;
          } else {
            if (jump = xStack.slice(-1)[0]) {
              xp = jump;
            } else {
              errorStack.push('Error: No return point from ' + xp);
              me.vm.complete(xi, xStart);
              me.vm.error(errorStack);
              return false;
            }
          }
          break;

        default:
          ++xp;
      }
    }

    // Finish up
    me.vm.complete(xi, xStart);
    me.vm.success();
    return outStack.map(function(i) { return String.fromCharCode(i); }).join('');
  };
};

var helloWorld = new brainfuck({
  src: '++++++++++ This should be ignored [>+++++++>++++++++++>+++>+<<<<-]>++.>+.+++++++..+++.>++.<<+++++++++++++++.>.+++.------.--------.>+.>.'
});

var outputter = new brainfuck({
  src: '++++++++++++[>,.<-]',
  in:  'Hello world!'
});

console.log(helloWorld.exec());
console.log(outputter.exec(100));
