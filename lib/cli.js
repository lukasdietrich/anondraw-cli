var EventEmitter = require("events").EventEmitter;

var readline = require("readline");

function Cli (stream_in, stream_out) {
    var self = this;

    this._in = stream_in;
    this._out = stream_out;
    this._interface = readline.createInterface(stream_in, stream_out);

    this._interface.on("line", function (line) {
        self._out.moveCursor(0, -1);
        self._out.clearLine();

        self.prompt();
        self.emit("line", line);
    });
}

Cli.prototype = Object.create(EventEmitter.prototype);

Cli.prototype.prompt = function (preserve) {
    this._interface.prompt(preserve !== false);
}

Cli.prototype.print = function (message) {
    this._out.clearLine();
    this._out.cursorTo(0);
    console.log(message);
    this.prompt()
}

Cli.prototype.setPrompt = function (prefix) {
    this._interface.setPrompt(prefix);
    this.prompt();
}

module.exports = Cli;
