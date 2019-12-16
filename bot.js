var Discord = require('discord.io');
var logger = require('winston');
var phrases = require('./phrases');
const axios = require('axios');
const table = require('table').table;
const base_url = "https://swgoh.gg/api";
const my_guild_id = 8665;


let BOT_TOKEN = process.env.BOT_TOKEN;

if(!BOT_TOKEN){
    var auth = require('./auth.json');
    BOT_TOKEN = auth.token;
}


let guild = {},
    table_config = {
        columns:{
            0:{alignment: 'left', width: 8},
            1:{alignment: 'center', width: 5},
        },
    },
    tracked_toons = [
        'Darth Revan',
        'Darth Malak',
        'General Skywalker',
        'HK-47',
        'Bastila Shan (Fallen)',
        'Bossk',
        'Geonosian Brood Alpha',
        'Padmé Amidala',
        'Jedi Knight Revan',
        'Grand Master Yoda',
        'Chewbacca',
        'C-3PO',
        'Darth Traya',
        'Jedi Knight Anakin',
        'Carth Onasi',
        'General Grievous',
        'Enfys Nest',
        'Mission Vao',
        'Zaalbar',
        'CC-2224 "Cody"',
        'CT-5555 "Fives"',
        'CT-7567 "Rex"',
        'CT-21-0408 "Echo"',
        'Clone Sergeant - Phase I',
        'General Kenobi',
        'Grand Admiral Thrawn',
    ],
    tracked_ships = [
        "Hound's Tooth",
        "Han's Millennium Falcon",
        "Bistan's U-wing",
    ],
    tracked_toon_stats = {
        "gear_level": [11,12,13],
        "relic_tier": [1,2,3,4,5,6,7],
    },
    tracked_ship_stats = {
        "rarity": [5,6,7],
    },
    guild_store_a = {toons: {}, ships: {}}, guild_store_b = {toons:{}, ships:{}};

function twParseGuild(players, guild_store){
    let relic_tier;

    players.forEach(player => {
        player.units.forEach(unit => {
            if(tracked_toons.includes(unit.data.name)){
                // console.log(`found ${unit.data.name}`);
                guild_store.toons[unit.data.name].total++;
                if(tracked_toon_stats.gear_level.includes(unit.data.gear_level)){
                    guild_store.toons[unit.data.name].gear_level[unit.data.gear_level]++;
                }
                if(typeof unit.data.relic_tier === 'number'){
                    if(tracked_toon_stats.relic_tier.includes(unit.data.relic_tier - 2)){
                        guild_store.toons[unit.data.name].relic_tier[unit.data.relic_tier - 2]++;
                        // debug
                        // if(unit.data.relic_tier === 1 && unit.data.name === "General Kenobi"){
                        //     console.log("GK R1 data: " + JSON.stringify(unit, null, 2));
                        // }
                    }
                }
            }

            // Ships now
            if(tracked_ships.includes(unit.data.name)){
                // console.log(`found ${unit.data.name}`)
                guild_store.ships[unit.data.name].total++;;
                if(tracked_ship_stats.rarity.includes(unit.data.rarity)){
                    guild_store.ships[unit.data.name].rarity[unit.data.rarity]++;
                }
            }
        });
    });
}

function twCompare(guild_a, guild_b){
    let res = [], level, toon, ship, i, table_data = [], res_a = {}, res_b = {},
        str = `${guild_a.data.name} vs ${guild_b.data.name}\n`;
    twParseGuild(guild_a.players, guild_store_a);
    twParseGuild(guild_b.players, guild_store_b);

    str += `GP: ${guild_a.data.galactic_power} vs ${guild_b.data.galactic_power}\n`;
    str += `Registered Players: ${guild_a.players.length} vs ${guild_b.players.length}\n\n`;

    // console.log(JSON.stringify(guild_store_a, null, 2));
    for(toon in guild_store_a.toons){
        str += `*** ${toon} ***\n`;
        // res.push(`*** ${toon} gear compare ***\n`);
        str += `Total: ${guild_store_a.toons[toon].total} vs ${guild_store_b.toons[toon].total}\n`;
        for(i = 0; i < tracked_toon_stats.gear_level.length; i++){
            level = tracked_toon_stats.gear_level[i];
            let a = guild_store_a.toons[toon].gear_level[level],
                b = guild_store_b.toons[toon].gear_level[level];
            if(a === 0 && b === 0) continue;

            str +=`G${level}: ${a} vs ${b}\n`;
        }
        // res.push(str);
        // str += `***relic***\n`;

        // Relic tier data from swgoh is all wrong. Commenting this out.
        for(i = 0; i < tracked_toon_stats.relic_tier.length; i++){
            level = tracked_toon_stats.relic_tier[i];
            let a = guild_store_a.toons[toon].relic_tier[level],
                b = guild_store_b.toons[toon].relic_tier[level];
            if(a === 0 && b === 0) continue;

            str +=`R${level}: ${a} vs ${b}\n`;
        }

        if(str.length > 1900){
            res.push(str);
            str = `${guild_a.data.name} vs ${guild_b.data.name}\n\n`;
            str += `GP: ${guild_a.data.galactic_power} vs ${guild_b.data.galactic_power}\n`;
            str += `Registered Players: ${guild_a.players.length} vs ${guild_b.players.length}\n\n`;
        }
    }

    for(ship in guild_store_a.ships){
        str += `*** ${ship} ***\n`;
        str += `Total: ${guild_store_a.ships[ship].total} vs ${guild_store_b.ships[ship].total}\n`;

        for(i = 0; i < tracked_ship_stats.rarity.length; i++){
            level = tracked_ship_stats.rarity[i];
            let a = guild_store_a.ships[ship].rarity[level],
                b = guild_store_b.ships[ship].rarity[level];
            if(a == 0 && b == 0) {
                // console.log("found both zero");
                continue;
            }

            str += `${level}*: ${a} vs ${b}\n`;
        }

        if(str.length > 1900){
            res.push(str);
            str = `${guild_a.data.name} vs ${guild_b.data.name}\n\n`;
            str += `GP: ${guild_a.data.galactic_power} vs ${guild_b.data.galactic_power}\n`;
            str += `Registered Players: ${guild_a.players.length} vs ${guild_b.players.length}\n\n`;
        }
    }
    // res.push(str);

    // return res;
    if(str.length > 0) res.push(str);
    return res;
}

// guild store should look like --
// {
//     toons:{
//         "General Kenobi":{
//           "gear_level": {
//             10: 0,
//             11: 0,
//             12: 0,
//           },
//         },
//     },
//     ships:{

//     }

// }
// Call this function when tw command is executed.
function initGuildStore(guild_store){
    let stat;
    tracked_toons.forEach(toon => {
       guild_store.toons[toon] = {};
       guild_store.toons[toon].total = 0;
       for(stat in tracked_toon_stats){
         let list = tracked_toon_stats[stat];
         //guild_store["General Kenobi"]["gear_level"]
         guild_store.toons[toon][stat] = {};
         list.forEach(item => {
            // guild_store["General Kenobi"]["gear_level"][10] = 0
            guild_store.toons[toon][stat][item] = 0;
         });
       }
    });
    tracked_ships.forEach(ship => {
       guild_store.ships[ship] = {};
       guild_store.ships[ship].total = 0;
       for(stat in tracked_ship_stats){
         let list = tracked_ship_stats[stat];
         guild_store.ships[ship][stat] = {};
         list.forEach(item => {
            guild_store.ships[ship][stat][item] = 0;
         });
       }
    });
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////
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
    let num, who = '', guild_a, guild_b;
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
                initGuildStore(guild_store_a);
                axios.get(base_url + "/guild/" + my_guild_id)
                    .then(response => response.data)
                    .then(data => {
                        let res = selfEval(data);
                        for(let i = 0; i < res.length; i++){
                            // console.log(res[i].length);
                            bot.sendMessage({
                               to: channelID,
                               message: '```' + res[i] + '```',
                            });
                            sleep(5000);
                        }
                    });
                break;
            case 'clear':
                bot.sendMessage({
                   to: channelID,
                   message: clearScreen(),
                });
                break;
            case 'tw':
                initGuildStore(guild_store_a);
                initGuildStore(guild_store_b);
                axios.get(base_url + "/guild/" + args[0])
                    .then(response => response.data)
                    .then(data => {
                        let url = '';
                        // twParseGuild(data.players, guild_store_a);
                        guild_a = data;
                        if(args[1] === undefined){
                            url = base_url + "/guild/" + my_guild_id;
                        }
                        else url = base_url + "/guild/" + args[1];
                        return axios.get(url)
                            .then(response => response.data)
                            .then(data => {
                                return guild_b = data;
                            })
                    })
                    .then(() => {
                        let res = twCompare(guild_a, guild_b), i = 0;
                        // console.log(res);
                        // console.log(res.length);
                        // console.log(JSON.stringify(guild_store_b, null, 2));
                        for(let i = 0; i < res.length; i++){
                            // console.log(res[i].length);
                            bot.sendMessage({
                               to: channelID,
                               message: '```' + res[i] + '```',
                            });
                            sleep(5000);
                        }
                    })
                    .catch(err => console.log(err));
                break;
            case 'issue':
                axios.get(base_url + "/guild/" + my_guild_id)
                    .then(response => response.data)
                    .then(data => {
                        guild = data,
                        bot.sendMessage({
                            to: channelID,
                            message: '```' + findIssues(guild.players) + '```',
                        });
                    });
                break;
            case 'test':
                bot.sendMessage({
                   to: channelID,
                   message: "This command is reserved for testing."
                });
                break;
                //////////////
                /////////// Find issues
                // axios.get(base_url + "/guild/" + my_guild_id)
                //     .then(response => response.data)
                //     .then(data => {
                //         guild = data,
                //         bot.sendMessage({
                //             to: channelID,
                //             message: findIssues(guild.players),
                //         });
                //     });

                /////////////////////////////
                //////// tw compare //////////////////
                // initGuildStore(guild_store_a);
                // initGuildStore(guild_store_b);
                // axios.get(base_url + "/guild/" + args[0])
                //     .then(response => response.data)
                //     .then(data => {
                //         let url = '';
                //         // twParseGuild(data.players, guild_store_a);
                //         guild_a = data;
                //         if(args[1] === undefined){
                //             url = base_url + "/guild/" + my_guild_id;
                //         }
                //         else url = base_url + "/guild/" + args[1];
                //         return axios.get(url)
                //             .then(response => response.data)
                //             .then(data => {
                //                 return guild_b = data;
                //             })
                //     })
                //     .then(() => {
                //         let res = twCompare(guild_a, guild_b), i = 0;
                //         // console.log(res);
                //         // console.log(res.length);
                //         // console.log(JSON.stringify(guild_store_b, null, 2));
                //         for(let i = 0; i < res.length; i++){
                //             // console.log(res[i].length);
                //             bot.sendMessage({
                //                to: channelID,
                //                message: '```' + res[i] + '```',
                //             });
                //             sleep(5000);
                //         }
                //     })
                //     .catch(err => console.log(err));
                // break;
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
            if(unit.data.relic_tier && unit.data.relic_tier - 2 >= relic_tier){
                if(res[unit.data.name]) res[unit.data.name]++;
                else res[unit.data.name] = 1;

                // if(unit.data.name == "General Grievous") {
                //     console.log({
                //         Player: player.data.name,
                //         Grievous: unit.data
                //     });
                // }
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

function findIssues(players){
    let table_data = [], res = {}, str = "========== G13 Toon at Relic 0 ==========\n", name;
    players.forEach(player =>{
        let units = player.units, name = player.data.name;
        units.forEach(unit => {
            if(unit.data.relic_tier && unit.data.relic_tier - 2 == 0 && unit.gear_level == 13){
                if(!res[name]) res[name] = [];
                res[name].push(unit.data.name);
            }
        });
    });

    if(Object.keys(res).length > 0) {
        for(let key in res){
            str += `${key}: ${JSON.stringify(res[key])} \n`;
        }
    } else str += "None found!";

    return str;
}

function findBugs(players, gear_level=10){
    let table_data = [], res = {}, str = ` ========== Bugs G${gear_level} and Above ==========\n`,
        toons = [
        "Geonosian Brood Alpha",
        "Geonosian Soldier",
        "Poggle the Lesser",
        "Sun Fac",
        "Geonosian Spy",
        ];
    players.forEach(player =>{
        let units = player.units;

        units.forEach(unit => {
            if(toons.includes(unit.data.name)){
                if(unit.data.gear_level && unit.data.gear_level >= gear_level){
                    if(res[unit.data.name]) res[unit.data.name]++;
                    else res[unit.data.name] = 1;
                }
            }
        });
    });

    // console.log(table(table_data, table_config));
    // return table(table_data, table_config);
    return str += JSON.stringify(res, null, 2).replace(/{|}/g, "");
}

function clearScreen(){
    return "Cleared\n".repeat(40);
}

// function sleep(milliseconds) {
//   var start = new Date().getTime();
//   for (var i = 0; i < 1e7; i++) {
//     if ((new Date().getTime() - start) > milliseconds){
//       break;
//     }
//   }
// }

// This is better because it doesn't depend on i < 1e7.
// It's actually using the difference between end - start
function sleep(ms){
  let start = Date.now(), end = Date.now();
  while(end - start < ms){
    end = Date.now();
  }
}

function selfEval(guild_a){
    let res = [], level, toon, ship, i, table_data = [], res_a = {}, res_b = {},
        str = `${guild_a.data.name} \n`;;
    twParseGuild(guild_a.players, guild_store_a);

    str += `GP: ${guild_a.data.galactic_power}\n\n`;

    // console.log(JSON.stringify(guild_store_a, null, 2));
    for(toon in guild_store_a.toons){
        str += `*** ${toon} ***\n`;
        // res.push(`*** ${toon} gear compare ***\n`);
        str += `Total: ${guild_store_a.toons[toon].total}\n`;
        for(i = 0; i < tracked_toon_stats.gear_level.length; i++){
            level = tracked_toon_stats.gear_level[i];
            let a = guild_store_a.toons[toon].gear_level[level];
            if(a === 0) continue;

            str +=`G${level}: ${a}\n`;
        }
        // res.push(str);
        // str += `***relic***\n`;

        // Relic tier data from swgoh is all wrong. Commenting this out.
        for(i = 0; i < tracked_toon_stats.relic_tier.length; i++){
            level = tracked_toon_stats.relic_tier[i];
            let a = guild_store_a.toons[toon].relic_tier[level];
            if(a === 0) continue;

            str +=`R${level}: ${a}\n`;
        }

        if(str.length > 1900){
            res.push(str);
            str = `${guild_a.data.name} \n\n`;
            str += `GP: ${guild_a.data.galactic_power}\n\n`;
        }
    }

    for(ship in guild_store_a.ships){
        str += `*** ${ship} ***\n`;
        str += `Total: ${guild_store_a.ships[ship].total}\n`;

        for(i = 0; i < tracked_ship_stats.rarity.length; i++){
            level = tracked_ship_stats.rarity[i];
            let a = guild_store_a.ships[ship].rarity[level];
            if(a == 0) {
                // console.log("found both zero");
                continue;
            }

            str += `${level}*: ${a}\n`;
        }

        if(str.length > 1900){
            res.push(str);
            str = `${guild_a.data.name} \n`;
            str += `GP: ${guild_a.data.galactic_power}\n\n`;
        }
    }

    if(str.length > 0) res.push(str);
    // console.log(JSON.stringify(res, null, 2));
    return res;
}
