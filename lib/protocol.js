var Client  = require("./client");

var request = require("request");
var socket  = require("socket.io-client");
var crypto  = require("crypto");

/**
 * Constructs a new protocol instance
 * 
 * @param {object} set of api endpoints
 */
function Protocol (endpoints) {
    this._endpoints = endpoints;
}

/**
 * Calls api via http interface.
 * The callback will be called with (error::string, response::object)
 * 
 * @param  {string} endpoint name
 * @param  {string} resource
 * @param  {object} querystring data
 * @param  {Function} callback
 */
Protocol.prototype._get = function (endpoint, resource, query, callback) {
    request({
        method: "GET",
        uri: [this._endpoints[endpoint], resource].join("/"),
        json: true,
        qs: query
    }, function (err, res, body) {
        callback(err, body);
    });
}

/**
 * Resolves a room name to a server address.
 * The callback will be called with (error::string, uri::string)
 * 
 * @param  {string} room name
 * @param  {Function} callback
 */
Protocol.prototype._resolve = function (room, callback) {
    this._get("load", "getserver", { 
        room: room 
    }, function (err, o) {
        callback(err, err ? null : o.server);
    });
}

Protocol.prototype._authenticate = function (mail, pass, callback) {
    function sha256 (s) {
        return crypto.createHash("sha256").update(s).digest("hex");
    }

    this._get("auth", "login", {
        email: mail,
        pass: sha256(pass)
    }, function (err, o) {
        callback(err || o.error, o);
    });
}

Protocol.prototype._if = function (condition, action, callback) {
    if (condition) {
        action(callback);
    } else {
        callback();
    }
}

/**
 * Creates a socket connection to a room server.
 * The callback will be called with (error::string, socket::socket.io-client)
 * 
 * @param  {string} room name
 * @param  {Function} callback
 */
Protocol.prototype.connect = function (room, user, callback) {
    var self = this;

    this._resolve(room, function (err, server) {
        if (err)
            return callback(err);

        var client = socket("http://" + server, { transports: ["websocket"] });

        client.on("connect", function () {
            client.emit("changename", user.name, function (err, name) {
                self._if(user.mail && user.pass, function (callback) {
                    self._authenticate(user.mail, user.pass, callback);
                }, function (err, auth) {
                    callback(null, new Client(client, name));

                    if (auth)
                        client.emit("uKey", auth.uKey);

                    client.emit("changeroom", room);
                });
            });
        });
    });
}


module.exports = Protocol;
