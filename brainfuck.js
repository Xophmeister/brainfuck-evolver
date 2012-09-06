// JavaScript brainfuck Interpretter
// Christopher Harrison, 2012
// MIT License

var brainfuck = module.exports = function(s) {
  var me = this;

  // Settings for VM
  var vm = {
    name:     'Anonymous',

    src:      '',
    in:       '',

    complete: function(ops, ts, cells) {
                var done = new Date().getTime(),
                    secs = (done - ts) / 1000;

                console.log(vm.name + ': Completed '.concat(
                            ops,
                            ' operations in ',
                            secs,
                            ' seconds (',
                            (ops / 1000) / secs,
                            ' kops/s) using ',
                            cells,
                            ' memory cells'));
              },
    success:  function() {
                console.log(vm.name + ': Execution Successful');
              },
    error:    function(stack) {
                // Stack is array of {status (String), fatal (Boolean)}
                console.log(vm.name + ': Execution Failed');
              },
  };

  // Override VM defaults, if set
  if (s) {
    for (i in s) {
      vm[i] = s[i];
    }
  }

  // Set up event listeners
  var events = ['complete', 'success', 'error'];
  for (i in events) {
    if (typeof(vm[events[i]]) == 'function') this.on(events[i], vm[events[i]]);
  }

  // Interpreter
  this.exec = function(limit) {
    // Initialise
    var d  = [0],                       // Data (expands rightwards)
        dp = 0;                         // Data pointer

    var xp = 0,                         // Execution pointer
        xStack = new Array(),           // Execution stack
        xi = 0,                         // Operation count
        xStart = new Date().getTime();  // Execution start time;

    var inStack = vm.in                 // String input is converted into a numeric stack:
                    .split('')          // e.g., 'foo' > [111, 111, 102]
                    .reverse()
                    .map(function(i) { return i.charCodeAt(0); });

    var outStack = new Array();

    var errorStack = {
      errors: new Array(),
      push:   function(text, fatal) {
                this.errors.push({status: text, fatal: fatal});
                var status = vm.name + ': \u001b' + (fatal?'[31mERROR ':'[34mWARNING ') + '\u001b[0m' + text;

                if (fatal) {
                  console.error(status);
                  me.emit('error', this.errors);
                } else {
                  console.warn(status);
                }
              }
    };
 
    // Execute
    while (xp < vm.src.length && (limit?xi < limit:true)) {
      switch (vm.src[xp]) {
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
            me.emit('complete', xi, xStart, d.length);
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
              me.emit('complete', xi, xStart, d.length);
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
    me.emit('success');
    me.emit('complete', xi, xStart, d.length);
    return outStack
             .map(function(i) { return String.fromCharCode(i); })  // Returns '?' when out of Unicode bounds
             .join('');
  };
};

var EventEmitter = require('events').EventEmitter;
brainfuck.prototype = Object.create(EventEmitter.prototype);
