var Discord = require('discord.io');
var logger = require('winston');
var phrases = require('./phrases');

let BOT_TOKEN = process.env.BOT_TOKEN;

if(!BOT_TOKEN){
    var auth = require('./auth.json');
    BOT_TOKEN = auth.token;
}

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';
// Initialize Discord Bot
var bot = new Discord.Client({
   token: BOT_TOKEN,
   autorun: true
});
bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});
bot.on('message', function (user, userID, channelID, message, evt) {
    let num, who = '';
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.substring(0, 4) == '/cb ') {
        var args = message.substring(4).split(' ');
        var cmd = args[0];

        args = args.splice(1);
        switch(cmd) {
            // !ping
            case 'light':
                who = args[0]? args[0]+"! ": user+"! ";
                args = args.splice(1);
                num = Math.floor(Math.random() * phrases.compliments.length);
                bot.sendMessage({
                    to: channelID,
                    message: who + phrases.compliments[num]
                });
                break;
            case 'dark':
                who = args[0]? args[0]+"! ": user+"! ";
                args = args.splice(1);
                num = Math.floor(Math.random() * phrases.dis.length);
                bot.sendMessage({
                    to: channelID,
                    message: who + phrases.dis[num]
                });
                break;
            case 'charge':
                who = args[0]? args[0]+"! ": user+"! ";
                args = args.splice(1);
                num = Math.floor(Math.random() * phrases.money.length);
                bot.sendMessage({
                    to: channelID,
                    message: who + phrases.money[num]
                });
                break;
            case 'thraceme':
                bot.sendMessage({
                    to: channelID,
                    message: "Congratulations Thrace, that is awesome for you!"
                }, () => {
                    bot.sendMessage({
                        to: channelID,
                        message: "Thrace: Thanks! Pretty excited about it myself. You are awesome yourself"
                    });
                });
                break;
            case 'flip':
                who = args[0]? args[0]+"! ": user+"! ";
                args = args.splice(1);

                bot.sendMessage({
                    to: channelID,
                    message: who + ":middle_finger:".repeat(Math.floor(Math.random() * 20) + 5)
                });
                break;
            default:
                bot.sendMessage({
                   to: channelID,
                   message: "I don't understand the words that are coming out of your mouth...."
                });
            // Just add any case commands if you want to..
         }
     }
});
