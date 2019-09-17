var Discord = require('discord.io');
var logger = require('winston');
var phrases = require('./phrases');
const axios = require('axios');
const table = require('table').table;
const base_url = "https://swgoh.gg/api";
const my_guild_id = 8665;
let guild = {},
    table_config = {
        columns:{
            0:{alignment: 'left', width: 8},
            1:{alignment: 'center', width: 5},
        },
    };

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
            case 'quote':
                num = Math.floor(Math.random() * phrases.quotes.length);
                bot.sendMessage({
                    to: channelID,
                    message: phrases.quotes[num]
                });
                break;
            case 'fight':
                who = args[0]? args[0]+"! ": user+"! ";
                args = args.splice(1);
                num = Math.floor(Math.random() * phrases.fight.length);
                bot.sendMessage({
                    to: channelID,
                    message: who + phrases.fight[num]
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
            case 'snowflake':
                who = args[0]? args[0]+"! ": user+"! ";
                args = args.splice(1);

                bot.sendMessage({
                    to: channelID,
                    message: who + ":snowflake:".repeat(Math.floor(Math.random() * 20) + 5)
                });
                break;
            case 'halo':
                who = args[0]? args[0]+"! ": user+"! ";
                args = args.splice(1);
                num = Math.floor(Math.random() * phrases.halo.length);
                if(who.includes('secret')){

                    bot.sendMessage({
                        to: channelID,
                        message: "Cody made me do it!"
                    });
                }
                else {
                    bot.sendMessage({
                        to: channelID,
                        message: who + phrases.halo[num]
                    });
                }

                break;
            case 'self':
                axios.get(base_url + "/guild/" + my_guild_id)
                    .then(response => response.data)
                    .then(data => {
                        guild = data,
                        bot.sendMessage({
                            to: channelID,
                            message: findAllRelic(guild.players),
                        });
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


//////////////////////////////////
function findAllRelic(players, relic_tier=7){
    let table_data = [], res = {}, str = " ========== Relic 7 Toons ==========\n";
    players.forEach(player =>{
        let units = player.units;
        units.forEach(unit => {
            if(unit.data.relic_tier && unit.data.relic_tier >= relic_tier){
                if(res[unit.data.name]) res[unit.data.name]++;
                else res[unit.data.name] = 1;
            }
        });
    });

    table_data.push([`Relic Tier ${relic_tier}`, "Count"]);
    for(let key in res){
        table_data.push([key, res[key]]);
    }
    // console.log(table(table_data, table_config));
    // return table(table_data, table_config);

    return str += JSON.stringify(res, null, 2).replace(/{|}/g, "");
}
