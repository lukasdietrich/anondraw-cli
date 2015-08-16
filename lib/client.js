var EventEmitter = require("events").EventEmitter;

var _ = require("lodash");

function Client (raw, name) {
    var self = this;

    this._raw = raw;
    this._name = name;

    this._users = {};

    raw.on("playerlist", function (userlist) {
        self._users = _.reduce(userlist, function (map, player) {
            map[player.id] = _.omit(player, "id");
            return map;
        }, {});
    });

    raw.on("leave", function (user) {
        delete self._users[user.id];
    });

    raw.on("reputation", function (data) {
        var user = self._users[data.id];
        var old = user.reputation || 0;

        user.reputation = data.reputation;

        if (old !== user.reputation)
            self.emit("reputation", { user: user, from: old, to: user.reputation });
    });

    raw.on("chatmessage", function (data) {
        if (data.user === "SERVER")
            return;

        self.emit("message", {
            time: Date.now(),
            user: data.user,
            text: data.message
        })
    });
}

Client.prototype = Object.create(EventEmitter.prototype);

Client.prototype.getUsers = function () {
    return _.values(this._users);
}

Client.prototype.getName = function () {
    return this._name;
}

Client.prototype.send = function () {
    this._raw.emit.apply(this._raw, arguments);
}

module.exports = Client;
