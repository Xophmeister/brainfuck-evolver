# brainfuck Evolver

This project is a personal learning exercise in node.js. My goal is to
create a genetic programming algorithm that evolves a brainfuck
programme which will output a specified input in a reasonable amount of
time.

## brainfuck

brainfuck is a Turing-complete esoteric programming language with a
minimal instruction set. Details can be found on [its Wikipedia
page](http://en.wikipedia.org/wiki/Brainfuck).

My implementation uses the following parameters:

* A rightward-expanding memory model (rather than limited to 30,000
  cells), constrained only by the execution environment.
* The source code, input and output registers are isolated.
* Output is converted to text (from Unicode code points, rather than
  ASCII) and also returned as raw data.
* Kalliokoski EOF behaviour (i.e., outputs 0).

We initialise the virtual machine with a settings object, which takes
the following keys:

* `name` *String*: A descriptive name for the VM; defaults to
  'Anonymous'.
* `src` *String*: The brainfuck programme source; defaults to an empty
  programme.
* `timeout` *Number*: The global execution timeout for the programme in
  milliseconds; defaults to 2000 (use 0 for no limit).
* `limit` *Number*: The instruction execution limit for the programme;
  defaults to 0 (i.e., no limit).
* `output` *Function*: Called on completion of programme execution with
  its output passed as the argument. This will be `null` in the case of
  a fatal exception, otherwise an object of `{text: String, raw:
  Array}`.
* `complete` *Function*: Called on completion of programme execution
  with three arguments: number of operations, starting timestamp (Unix
  time in milliseconds) and number of memory cells used.
* `success` *Function*: Called on successful program execution (i.e., no
  fatal exceptions occurred).
* `error` *Function*: Called in the event of a fatal exception with the
  error stack (array of `{status: String, pointer: Number, fatal:
  Boolean}`) passed as the argument.

Note that the callback events are all set to reasonable defaults,
outputting to the console appropriately.

Possible exceptions are:

* Global timeout *Fatal*
* Beginning of file *Fatal*: When the data pointer attempts to move out
  of bounds, leftwards.
* No return point *Fatal*: When there is a mismatched jump command in
  the programme source.
* Reached execution limit *Non-Fatal*: Will terminate gracefully and
  return whatever output exists.
* End of file *Non-Fatal*: When the input register has been fully
  consumed.

The virtual machine is booted by issuing the `run` function on the
object. This runs asynchronously, with its argument used to fill the
input register.

### Hello World Example
   
    var brainfuck  = require('./brainfuck.js'),
        helloWorld = new brainfuck({
                       name: 'Hello World',
                       src:  '++++++++++[>+++++++>++++++++++>+++>+<<<<-]>++.>+.+++++++..+++.>++.<<+++++++++++++++.>.+++.------.--------.>+.>.'
                     });

    helloWorld.run();

### Unit Tests

Run `node tdd/brainfuck.js` to run through the test suite.
