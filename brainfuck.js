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
    limit:    null,

    output:   function(value) {
                // If execution failed:    value = null
                // If execution succeeded: value = {text: String, raw: Array}
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
                // Stack is array of {status: String, fatal: Boolean}
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
  this.run = function(input) {
    // Initialise
    var d  = [0],                       // Data (expands rightwards)
        dp = 0;                         // Data pointer

    var xp = 0,                         // Execution pointer
        xStack = new Array(),           // Execution stack
        xi = 0,                         // Operation count
        xStart = new Date().getTime();  // Execution start time;

    var inStack = (input || '')         // String input is converted into array of Unicode code points:
                    .split('')          // e.g., 'foo' > [102, 111, 111]
                    .map(function(i) { return i.charCodeAt(0); });

    var outStack = new Array();

    var errorStack = {
      errors: new Array(),
      push:   function(text, fatal) {
                this.errors.push({status: text, fatal: fatal});
                var status = vm.name + ': \u001b[3' + (fatal ? '1mERROR ' : '4mWARNING ') + '\u001b[0m' + text;  // ANSI colours

                if (fatal) {
                  console.error(status);
                } else {
                  console.warn(status);
                }
              }
    };
    
    function scheduler() {
      var interrupt = false,
          now       = new Date().getTime();
      
      // Check for execution timeout (fatal)
      if (vm.timeout && now - xStart >= vm.timeout) {
        errorStack.push('Execution timeout', true);
        interrupt = true;
      }
      delete now;

      // Check for execution limit (not fatal)
      if (vm.limit && xi >= vm.limit) {
        errorStack.push('Execution limit reached', false);
        interrupt = true;
      }

      // Check for invalid state (fatal)
      if (dp < 0 || xp === undefined) {
        errorStack.push('Invalid state', true);
        interrupt = true;
      }

      // Fetch Execute
      if (xp < vm.src.length && !interrupt) {
        fetchExecute(scheduler);
      }
    }

    function fetchExecute(callback) {
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
          --dp;
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
            errorStack.push('Input exhausted', false);
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
            xp = xStack.slice(-1)[0];
          }
          break;

        default:
          ++xp;
      }

      callback();
    }

    // Let's go, bitches!
    fetchExecute(scheduler);

    // Finish up
    me.emit('complete', xi, xStart, d.length);
    if (errorStack.errors.length && errorStack.errors.slice(-1)[0].fatal) {
      me.emit('error', errorStack.errors);
      me.emit('output', null);

      return false
    } else {
      me.emit('success');
      me.emit('output', {
        text: String.fromCharCode.apply(null, outStack),  // Returns '?' when out of Unicode bounds
        raw:  outStack
      });

      return true;
    }
  };
};

var EventEmitter = require('events').EventEmitter;
brainfuck.prototype = Object.create(EventEmitter.prototype);
