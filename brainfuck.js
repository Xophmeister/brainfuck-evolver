// JavaScript brainfuck Virtual Machine
// Christopher Harrison, 2012
// MIT License

var brainfuck = module.exports = function(s) {
  var me = this;

  // Settings for VM interface
  var os = {
    name:     'Anonymous',
    src:      '',

    timeout:  2000,
    limit:    0,

    output:   function(value) {
                // If execution failed:    value = null
                // If execution succeeded: value = {text: String, raw: Array}
                console.log(os.name + ':', value);
              },
    complete: function(ops, ts, cells) {
                var done = new Date().getTime(),
                    secs = (done - ts) / 1000;

                console.log(os.name + ': Completed',
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
                console.log(os.name + ': Execution Successful');
              },
    error:    function(stack) {
                // Stack is array of {status: String, pointer: Number, fatal: Boolean}
                console.log(os.name + ': Execution Failed');
              }
  };
  
  // Override interface defaults, if set correctly
  if (s) {
    for (i in os) {
      if (os.hasOwnProperty(i) && s[i]) {
        if (typeof os[i] === typeof s[i]) {
          os[i] = s[i];
        } else {
          // Fall back to default
          console.warn(os.name + ':', i, 'is wrong type; expecting', typeof os[i]);
        }
      }
    }
  }
  
  // Setup VM
  var vm = {
    interrupt: false,
    running:   false,

    data:      [0],
    dp:        0,

    xp:        0,

    count:     0,
    start:     null,

    jmpStack:  [],

    inStack:   [],
    outStack:  [],

    errStack:  {
                 errors: [],
                 push:   function(status, pointer, fatal) {
                           this.errors.push({status: status, pointer: pointer, fatal: fatal});
                           var text = os.name + (pointer ? (' (' + pointer + ')') : '') + ': \u001b[3' + (fatal ? '1mERROR ' : '4mWARNING ') + '\u001b[0m' + status;  // ANSI colour sequences

                           if (fatal) {
                             console.error(text);
                             vm.interrupt = true;
                           } else {
                             console.warn(text);
                           }
                         },
                 fatal:  function() {
                           return this.errors.reduce(function(i, j) { return i || j.fatal; }, false);
                         }
               },

    execute:   function() {
                 if (vm.interrupt && vm.running) {  // Process interrupt
                   vm.running = clearTimeout(vm.running);
                   me.emit('complete', vm.count, vm.start, vm.data.length);

                   // If we experience a fatal exception, then execution failed :(
                   // Otherwise, we're good :)
                   if (vm.errStack.errors.length && vm.errStack.fatal()) {
                     me.emit('error', vm.errStack.errors);
                     me.emit('output', null);
                   } else {
                     me.emit('success');
                     me.emit('output', {
                       text: String.fromCharCode.apply(null, vm.outStack),  // Returns '?' when out of Unicode bounds
                       raw:  vm.outStack
                     });
                   }

                 } else {
                   // Capture interrupting conditions 
                   if (os.limit && vm.count >= os.limit) {  // Execution limit (non-fatal)
                     vm.errStack.push('Execution limit', null, false);
                     vm.interrupt = true;

                   } else if (vm.xp >= os.src.length) {  // Execution completed
                     vm.interrupt = true;

                   } else {  // Fetch-Execute
                     switch (os.src[vm.xp]) {
                       case '+':
                         ++vm.count;
                         ++vm.data[vm.dp];
                         ++vm.xp;
                         break;

                       case '-':
                         ++vm.count;
                         --vm.data[vm.dp];
                         ++vm.xp;
                         break;

                       case '>':
                         ++vm.count;
                         if (++vm.dp === vm.data.length) vm.data.push(0);
                         ++vm.xp;
                         break;

                       case '<':
                         ++vm.count;
                         if (--vm.dp < 0) {
                           vm.errStack.push('Beginning of file', vm.xp, true);
                         }
                         ++vm.xp;
                         break;

                       case '.':
                         ++vm.count;
                         vm.outStack.push(vm.data[vm.dp]);
                         ++vm.xp;
                         break;

                       case ',':
                         ++vm.count;
                         if (get = vm.inStack.shift()) {
                           vm.data[vm.dp] = get;
                         } else {
                           vm.data[vm.dp] = 0;
                           vm.errStack.push('Input exhausted', vm.xp, false);
                         }
                         ++vm.xp;
                         break;

                       case '[':
                         ++vm.count;
                         vm.jmpStack.push(++vm.xp);
                         break;

                       case ']':
                         ++vm.count;
                         if (vm.data[vm.dp] == 0) {
                           vm.jmpStack.pop();
                           ++vm.xp;
                         } else {
                           if (jump = vm.jmpStack.slice(-1)[0]) {
                             vm.xp = jump;
                           } else {
                             vm.errStack.push('No return point', vm.xp, true);
                           }
                         }
                         break;

                       default:
                         ++vm.xp;
                     }
                   }
                   process.nextTick(vm.execute);
                 }
               }
  };

  // Set up event listeners
  var events = ['output', 'complete', 'success', 'error'],
      noop   = function() {};
  for (i = 0; i < events.length; ++i) {
    this.on(events[i], (typeof os[events[i]] === 'function' &&  os[events[i]]) || noop);
  }

  // Boot sequence
  this.run = function(input) {
    if (vm.running) {
      console.warn(os.name + ': \u001b[34mWARNING\u001b[0m Already Running');
    } else {
      vm.inStack = (input || '').split('')                  // String input is converted into array of Unicode code points:
                                .map(function(i) {          // e.g., 'foo' > [102, 111, 111]
                                   return i.charCodeAt(0);
                                 });

      vm.start = new Date().getTime();
      if (os.timeout) {                  
        vm.running = setTimeout(function() {
                                  vm.errStack.push('Execution timeout', null, true);  // Global timeout (fatal)
                                }, os.timeout);
      } else {
        vm.running = true;
      }
      
      process.nextTick(vm.execute);
    }
  };
};

var EventEmitter = require('events').EventEmitter;
brainfuck.prototype = Object.create(EventEmitter.prototype);
