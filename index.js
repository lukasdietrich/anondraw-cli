var Protocol = require("./lib/protocol");
var Cli      = require("./lib/cli");

var _        = require("lodash");
var yargs    = require("yargs");
var util     = require("util");
var chalk    = require("chalk");
var moment   = require("moment");

function main (protocol, args) {
    var cli = new Cli(process.stdin, process.stdout);

    protocol.connect(args.room, args, function (err, client) {
        cli.setPrompt(chalk.red(client.getName()) + chalk.gray(" > "))

        var commands = {
            list: function () {
                var users = client.getUsers();

                cli.print(util.format("Users (%s):\n%s",
                    chalk.yellow(users.length),
                    _.map(users, function (o) {
                        return chalk.blue(o.name);
                    }).join(", ")));
            }
        };

        client.on("leave", function (user) {
            cli.print(util.format("%s has %s",
                chalk.magenta(user.name),
                chalk.red("left")));
        });

        client.on("reputation", function (change) {
            var delta = change.to - change.from;

            cli.print(util.format("%s now has %s (%s) reputation!",
                chalk.magenta(change.user.name),
                chalk.magenta(change.to),
                chalk.yellow(delta > 0 ? "+" + delta : delta)));
        });

        client.on("message", function (message) {
            cli.print(util.format("[%s] <%s> %s", 
                chalk.yellow(moment(message.time).format("HH:mm:ss")), 
                chalk.blue(message.user), 
                message.text));
        });

        cli.on("line", function (line) {
            if (line.indexOf("/") === 0) {
                var command = line.substring(1);

                if (commands[command]) {
                    commands[command](line.substring(command.length + 2));
                } else {
                    cli.print(chalk.bgRed(util.format("unknown command '%s'", command)));
                }
            } else {
                client.send("chatmessage", line);
            }
        });
    });
}

main(new Protocol({
    load: "http://direct.anondraw.com:3552",
    auth: "http://direct.anondraw.com:4552"
}), yargs
    .option("name", {
        alias: "n",
        describe: "Your displayed username",
        demand: true
    })
    .option("mail", {
        alias: "m",
        describe: "Anondraw account email"
    })
    .option("pass", {
        alias: "p",
        describe: "Anondraw account passphrase"
    })
    .option("room", {
        alias: "r",
        describe: "Chatroom to talk in",
        default: "member_main"
    })
    .implies("mail", "pass")
    .argv);
