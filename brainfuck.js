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
    limit:    null,

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
  
  // Override interface defaults, if set
  if (s) {
    for (i in s) {
      if (s.hasOwnProperty(i)) os[i] = s[i]; 
    }
  }
  
  // Setup VM
  var vm = {
    interrupt: false,
    scheduler: null,

    data:      [0],
    dp:        0,

    xp:        0,
    xpLast:    null,

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
                             me.emit('interrupt');
                           } else {
                             console.warn(text);
                           }
                         }
               },

    execute:   function() {
                 if (vm.interrupt) {  // Process interrupt
                   vm.scheduler = clearInterval(vm.scheduler);
                   me.emit('complete', vm.count, vm.start, vm.data.length);

                   // If top error is fatal, then execution failed
                   // Otherwise, we're good :)
                   if (vm.errStack.errors.length && vm.errStack.errors.slice(-1)[0].fatal) {
                     me.emit('error', vm.errStack.errors);
                     me.emit('output', null);
                   } else {
                     me.emit('success');
                     me.emit('output', {
                       text: String.fromCharCode.apply(null, vm.outStack),  // Returns '?' when out of Unicode bounds
                       raw:  vm.outStack
                     });
                   }

                 } else if (vm.xp !== vm.xpLast) {  // Fetch-Execute
                   vm.xpLast = vm.xp;

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
                 
                 // Process other exceptions
                 if (os.timeout) {  // Execution time out (fatal)
                   var now = new Date().getTime();
                   if (now - vm.start >= os.timeout) {
                     vm.errStack.push('Execution timeout', null, true);
                   }
                 } else if (os.limit && vm.count >= os.limit) {  // Execution limit (non-fatal)
                   vm.errStack.push('Execution limit', null, false);
                   me.emit('interrupt');
                 } else if (vm.xp >= os.src.length) {  // Execution completed
                   me.emit('interrupt');
                 }
               }
  };

  // Set up event listeners
  var events = ['output', 'complete', 'success', 'error'],
      noop   = function() {};
  for (i = 0; i < events.length; ++i) {
    this.on(events[i], (typeof os[events[i]] === 'function' &&  os[events[i]]) || noop);
  }
  this.on('interrupt', function() { vm.interrupt = true; });

  // Boot sequence
  this.run = function(input) {
    if (vm.scheduler) {
      console.warn(os.name + ': \u001b[34mWARNING\u001b[0m Already Running');
    } else {
      vm.inStack = (input || '').split('')                  // String input is converted into array of Unicode code points:
                                .map(function(i) {          // e.g., 'foo' > [102, 111, 111]
                                   return i.charCodeAt(0);
                                 });

      vm.start = new Date().getTime();

      vm.scheduler = setInterval(vm.execute, 0);
    }
  };
};

var EventEmitter = require('events').EventEmitter;
brainfuck.prototype = Object.create(EventEmitter.prototype);
