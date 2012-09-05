// JavaScript brainfuck Interpretter
// Christopher Harrison, 2012
// MIT License

exports.brainfuck = function(s) {
  var me = this;

  // Settings for VM
  this.vm = {
    src:      '',
    in:       '',

    complete: function(ops, ts) {
                var done = new Date().getTime();
                var secs = (done - ts) / 1000;

                console.log(this.name + ': Completed '.concat(
                            ops,
                            ' operations in ',
                            secs,
                            ' seconds (',
                            (ops / 1000) / secs,
                            ' kops/s)'));
              },
    success:  function() {
                console.log(this.name + ': Execution Successful');
              },
    error:    function(stack) {
                // Stack is array of {status (String), fatal (Boolean)}
                console.log(this.name + ': Execution Failed');
              },
  };

  if (s) {
    for (i in s) {
      this.vm[i] = s[i];
    }

    if (!this.vm.name) {
      var crypto = require('crypto');
  
      if (this.vm.src) {
        var id = this.vm.src;
      } else {
        var id = new Date().getTime().toString();
      }
      
      this.vm.name = crypto.createHash('sha256').update(id).digest('hex').slice(0, 10);
    }
  }

  // Interpreter
  this.exec = function(limit) {
    // Initialise
    var d  = [0];                       // Data (expands rightwards)
    var dp = 0;                         // Data pointer

    var xp = 0;                         // Execution pointer
    var xStack = new Array();           // Execution stack
    var xi = 0;                         // Operation count
    var xStart = new Date().getTime();  // Execution start time;

    var inStack = me.vm.in              // String input is converted into a numeric stack:
                    .split('')          // e.g., 'foo' > [111, 111, 102]
                    .reverse()
                    .map(function(i) { return i.charCodeAt(0); });

    var outStack = new Array();
    var errorStack = {
      errors: new Array(),
      push:   function(text, fatal) {
                var status = me.vm.name + ': ' + (fatal?'ERROR ':'WARNING ') + text;
                this.errors.push({status: text, fatal: fatal});

                if (fatal) {
                  console.error(status);
                  me.vm.error(this.errors);
                } else {
                  console.warn(status);
                }
              }
    };
 
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
            errorStack.push('Beginning of file at ' + xp, true);
            me.vm.complete(xi, xStart);
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
            errorStack.push('Input exhausted at ' + xp, false);
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
              errorStack.push('No return point from ' + xp, true);
              me.vm.complete(xi, xStart);
              return false;
            }
          }
          break;

        default:
          ++xp;
      }
    }

    if (limit && xi >= limit) errorStack.push('Execution limit reached', false);

    // Finish up
    me.vm.success();
    me.vm.complete(xi, xStart);
    return outStack
             .map(function(i) { return String.fromCharCode(i); })  // Returns '?' when out of Unicode bounds
             .join('');
  };
};
