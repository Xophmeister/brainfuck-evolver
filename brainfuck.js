// JavaScript brainfuck Interpretter
// Christopher Harrison, 2012
// MIT License

var brainfuck = module.exports = function(s) {
  var me = this;

  // Settings for VM
  var vm = {
    name:     'Anonymous',
    src:      '',

    timeout:  2000,

    output:   function(value) {
                console.log(vm.name + ':', value);
              },
    complete: function(ops, ts, cells) {
                var done = new Date().getTime(),
                    secs = (done - ts) / 1000;

                console.log(vm.name + ': Completed',
                            ops,
                            'operations in',
                            secs.toPrecision(3),
                            'seconds (' +
                            (secs ? ((ops / 1000) / secs).toPrecision(3) : '∞'),
                            'kops/s) using',
                            cells,
                            'memory cells');
              },
    success:  function() {
                console.log(vm.name + ': Execution Successful');
              },
    error:    function(stack) {
                // Stack is array of {status (String), fatal (Boolean)}
                console.log(vm.name + ': Execution Failed');
              }
  };

  // Override VM defaults, if set
  if (s) {
    for (i in s) {
      if (s.hasOwnProperty(i)) vm[i] = s[i]; 
    }
  }

  // Set up event listeners
  var events = ['output', 'complete', 'success', 'error'],
      noop   = function() {};
  for (i = 0; i < events.length; ++i) {
    this.on(events[i], (typeof vm[events[i]] === 'function' &&  vm[events[i]]) || noop);
  }

  // Interpreter
  this.exec = function(input, limit) {
    // Initialise
    var d  = [0],                       // Data (expands rightwards)
        dp = 0;                         // Data pointer

    var xp = 0,                         // Execution pointer
        xStack = new Array(),           // Execution stack
        xi = 0,                         // Operation count
        xStart = new Date().getTime();  // Execution start time;

    var inStack = (input || '')         // String input is converted into a numeric stack: 
                    .split('')          // e.g., 'foo' > [111, 111, 102]
                    .map(function(i) { return i.charCodeAt(0); });

    var outStack = new Array();

    var errorStack = {
      errors: new Array(),
      push:   function(text, fatal) {
                this.errors.push({status: text, fatal: fatal});
                var status = vm.name + ': \u001b' + (fatal ? '[31mERROR ' : '[34mWARNING ') + '\u001b[0m' + text;  // ANSI colours

                if (fatal) {
                  console.error(status);
                  me.emit('error', this.errors);
                  me.emit('complete', xi, xStart, d.length);
                  me.emit('output', null);
                } else {
                  console.warn(status);
                }
              }
    };
     
    // Execute
    while (xp < vm.src.length && (limit ? xi < limit : true)) {
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
          if (++dp === d.length) d.push(0);
          ++xp;
          break;

        case '<':
          ++xi;
          if (--dp < 0) {
            errorStack.push('Beginning of file at ' + xp, true);
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
          if (get = inStack.shift()) {
            d[dp] = get;
          } else {
            d[dp] = 0;
            errorStack.push('Input exhausted at ' + xp, false);
          }
          ++xp;
          break;

        case '[':
          ++xi;
          xStack.push(++xp);
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
              return false;
            }
          }
          break;

        default:
          ++xp;
      }

      // Check for execution timeout (fatal)
      var xTime = new Date().getTime();
      if (vm.timeout > 0 && xTime - xStart > vm.timeout) {
        errorStack.push('Execution timeout', true);
        return false
      }
    }

    // Check for execution limit (not fatal)
    if (limit && xi >= limit) errorStack.push('Execution limit reached', false);

    // Finish up
    me.emit('success');
    me.emit('complete', xi, xStart, d.length);
    me.emit('output', {
      text: String.fromCharCode.apply(null, outStack),  // Returns '?' when out of Unicode bounds
      raw:  outStack
    });

    return true;
  };
};

var EventEmitter = require('events').EventEmitter;
brainfuck.prototype = Object.create(EventEmitter.prototype);
