// https://discordjs.guide/
// https://discord.js.org/
// embed messages has a total max of 60000 characters limit

var Discord = require('discord.js');
var logger = require('winston');
var phrases = require('./phrases');
const axios = require('axios');
const fs = require('fs');
const table = require('table').table;
const Tb = require('./Tb');
const base_url = "https://swgoh.gg/api";
const my_guild_id = 8665;
const tb = new Tb();
let embed = {
    color: '#0099ff',
    // title: "Guild vs Us",
    // description: "GP vs GP",
    // fields: [{
    //     name: "Fields",
    //     value: "They can have different fields with small headlines."
    //   },
    //   {
    //     name: "Masked links",
    //     value: "You can put [masked links](http://google.com) inside of rich embeds."
    //   },
    //   {
    //     name: "Markdown",
    //     value: "You can put all the *usual* **__Markdown__** inside of them."
    //   }
    // ],
  };

let BOT_TOKEN = process.env.BOT_TOKEN;

if(!BOT_TOKEN){
    var auth = require('./auth.json');
    BOT_TOKEN = auth.token;
}


let guild = {}, refresh_time,
    refresh_status = 0, // 0 - not refreshing data right now, 1 - guild data is being refreshed
    table_config = {
        columns:{
            0:{alignment: 'left', width: 8},
            1:{alignment: 'center', width: 5},
        },
    },
    images = [
        "ep.gif",
        "sex_choco.gif",
        "dance_wiener.gif",
        "r2piss.gif",
        "grabmyass.gif",
    ],
    tracked_toons = [
        'Supreme Leader Kylo Ren',
        'Rey',
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
        'Darth Traya',
        'Jedi Knight Anakin',,
        'General Grievous',
        'CT-5555 "Fives"',
        'CT-7567 "Rex"',
        'CT-21-0408 "Echo"',
        'General Kenobi',
    ],
    tracked_ships = [
        "Hound's Tooth",
        "Han's Millennium Falcon",
        "Anakin's Eta-2 Starfighter",
        "Negotiator",
        "Malevolence",
    ],
    tracked_toon_stats = {
        "gear_level": [11,12,13],
        "relic_tier": [1,2,3,4,5,6,7],
    },
    tracked_ship_stats = {
        "rarity": [5,6,7],
    },
    guild_store_a, guild_store_b, guild_store_self, guild_data_self;
    // guild_store_a = {toons: {}, ships: {}}, guild_store_b = {toons:{}, ships:{}}, guild_store_self = {toons:{}, ships:{}};

let tb_gds_player = {
    // "LandCrawler": {
    //     p1: ["toon1", "toon2"],
    //     p2: ["toon3", "toon4"],
    //     p3: ["toon5", "toon6"],
    //     p4: ["toon7", "toon8"],
    // }
};

function tbGdsPlatoonsData(){

    // If there's data in it, then no need to redo.
    // Resetting this data will be part of refresh.
    if(Object.keys(tb.tb_gds_guild).length !== 0) {
        // console.log(`tb_gds_guild: ${Object.keys(tb.tb_gds_guild)}`);
        return;
    }

    guild_data_self.players.forEach(player => {
        player.units.forEach(unit =>{
            // console.log(`Processing ${unit.data.name} with rarity ${unit.data.rarity}`);
            if(tb.needToon(unit.data.name, unit.data.rarity)){
                // console.log(`Adding ${unit.data.name} with rarity ${unit.data.rarity}`);
                tb.addUnitGdsGuild(player.data.name, unit.data.name, unit.data.power, unit.data.rarity);
            }
        });
    });

    tb.sortTbGdsGuild();
}

function tbGdsPlatoonsProcess(phase){
    let limit = 800, counter = 0, total = 0, player, current,max, value, res = [], data = {fields: []},
        rarity_req = tb.tb_gds_req[phase].rarity,
        toons_req = Object.keys(tb.tb_gds_req[phase].units).sort();
    data.title = `Geo TB Darkside ${phase.toUpperCase()} Platoon Assignments`;
    data.description = `Assignments are made base on toon gp, starting from the lowest`;
    tb_gds_player = {};

    toons_req.forEach(toon =>{
        max = tb.tb_gds_req[phase].units[toon];
        value = '\n';
        current = 0;

        // debug
        // console.log(`${toon}'s max: ${max}`);

        for(let i = 0; i < tb.tb_gds_guild[toon].length; i++){
            player = tb.tb_gds_guild[toon][i];
            // if player's rarity fits, then count it
            if(player[2] >= rarity_req){
                // value += `**${player[0]}**: ${player[1]}\n`;
                addToPlayerGdsPlatoon(phase, player[0].toUpperCase(), toon);
                value+= `${player[0]}\n`;
                total += value.length;
                counter += value.length;
                current++;
            }

            //debug
            // console.log(`current: ${current}, value: ${value}`);

            if(current >= max) break; // Checking if we already have the amount of toons needed.


        }

        //debug
        // console.log(`Value before push: ${value}`);
        // console.log((`Object sent: ${JSON.stringify({name: `**${toon}**(${max})`, value: "```"+value+"```", inline: true})}`));

        data.fields.push({name: `**${toon}**(${max})`, value: "```"+value+"```", inline: true});

        if(counter > limit){
            // console.log(`counter at ${counter}`);
            data.len = counter;
            res.push(data);
            data = {fields: []};
            data.title = `Geo TB Darkside ${phase.toUpperCase()} Platoon Assignments`;
            data.description = `Assignments are made base on toon gp, starting from the lowest`;
            counter = 0;
        }
    });
    // console.log(`Total value length: ${total}`);
    if(counter <= limit && counter > 0) {
        data.len = counter;
        res.push(data);
    }
    return res;
}

function addToPlayerGdsPlatoon(phase, player_name, toon_name){
    if(!tb_gds_player[player_name]) {
        tb_gds_player[player_name] = {
            p1: [],
            p2: [],
            p3: [],
            p4: [],
        };
    }
    if(tb_gds_player[player_name][phase].includes(toon_name)) return;
    tb_gds_player[player_name][phase].push(toon_name);
}

function tbGdsPlayerPlatoonProcess(player_name, phase){
    let value, res = {fields: []};

    res.title = `${player_name}'s Geo TB Darkside ${phase.toUpperCase()} Platoon Assignments`;
    res.description = `Please fulfill your assignments`;

    value = '\n';
    if(tb_gds_player[player_name]){
        // console.log(tb_gds_player[player_name][phase]);
        tb_gds_player[player_name][phase].forEach(toon => {
            value += `${toon}\n`;
        });
    } else {
        value += "No platton assignment required";
    }

    res.fields.push({name: `==**${phase.toUpperCase()}**==`, value: "```"+value+"```", inline: true});
    return res;
}

async function refreshGuild(force=false){
    let now = new Date();
    // If we never refreshed, or we want to force it, or the data we have is more than 1 day old
    if(refresh_time === undefined || force === true || timeDiff(refresh_time, now, 'day') > 0){
        guild_store_self = initGuildStore();
        tb.reset();
        tb_gds_player = {};
        refresh_status = 1
        guild_data_self = await getGuildData(my_guild_id);
        // console.log(JSON.stringify(guild_data_self, null, 2));
        // console.log(guild_store_self);
        twParseGuild(guild_data_self.players, guild_store_self);
        refresh_status = 0;
        refresh_time  = now;
    }
    else {
        // console.log(`No refresh needed -- refresh_time: ${refresh_time}, force: ${force}, diff: ${timeDiff(refresh_time, now, 'day')}`);
    }
}

function getGuildData(id){
    return  axios.get(base_url + "/guild/" + id)
            .then(response => response.data);
}

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

function twCompare(guild_a, guild_b, self=false){
    let res = {fields: []}, level, toon, ship, i, table_data = [], res_a = {}, res_b = {}, value = "", total = 0,
        str = `${guild_a.data.name} vs ${guild_b.data.name}\n`;
    twParseGuild(guild_a.players, guild_store_a);
    if(!self) twParseGuild(guild_b.players, guild_store_b);
    else guild_store_b = guild_store_self;

    res.title = `${guild_a.data.name} vs ${guild_b.data.name}`;
    res.description = `**Players**: ${guild_a.players.length} vs ${guild_b.players.length}\n**GP**: ${guild_a.data.galactic_power} vs ${guild_b.data.galactic_power}`;

    // str += `GP: ${guild_a.data.galactic_power} vs ${guild_b.data.galactic_power}\n`;
    // str += `Players: ${guild_a.players.length} vs ${guild_b.players.length}\n\n`;

    // console.log(JSON.stringify(guild_store_a, null, 2));
    for(toon in guild_store_a.toons){
        value = `*${guild_store_a.toons[toon].total} vs ${guild_store_b.toons[toon].total}*\n`;

        // str += `*** ${toon} ***\n`;
        // res.push(`*** ${toon} gear compare ***\n`);
        // str += `Total: ${guild_store_a.toons[toon].total} vs ${guild_store_b.toons[toon].total}\n`;
        for(i = 0; i < tracked_toon_stats.gear_level.length; i++){
            level = tracked_toon_stats.gear_level[i];
            let a = guild_store_a.toons[toon].gear_level[level],
                b = guild_store_b.toons[toon].gear_level[level];
            if(a === 0 && b === 0) continue;

            // res.fields.push({name: `G${level}`, value: `**${a} vs ${b}**`, inline: true});
            value +=`**G${level}**: ${a} vs ${b}\n`;
            // str +=`G${level}: ${a} vs ${b}\n`;
        }
        // res.push(str);
        // str += `***relic***\n`;

        // Relic tier data from swgoh is all wrong. Commenting this out.
        for(i = 0; i < tracked_toon_stats.relic_tier.length; i++){
            level = tracked_toon_stats.relic_tier[i];
            let a = guild_store_a.toons[toon].relic_tier[level],
                b = guild_store_b.toons[toon].relic_tier[level];
            if(a === 0 && b === 0) continue;

            // res.fields.push({name: `R${level}`, value: `**${a} vs ${b}**`, inline: true});
            value +=`**R${level}**: ${a} vs ${b}\n`;
            // str +=`R${level}: ${a} vs ${b}\n`;
        }
        total += value.length;
        res.fields.push({name: `==${toon}==`, value: value, inline: true});
    }

    for(ship in guild_store_a.ships){
        value = `*${guild_store_a.ships[ship].total} vs ${guild_store_b.ships[ship].total}*\n`;

        for(i = 0; i < tracked_ship_stats.rarity.length; i++){
            level = tracked_ship_stats.rarity[i];
            let a = guild_store_a.ships[ship].rarity[level],
                b = guild_store_b.ships[ship].rarity[level];
            if(a == 0 && b == 0) {
                // console.log("found both zero");
                continue;
            }

            // res.fields.push({name: `${level}*: ${a} vs ${b}`});
            value += `**${level}***: ${a} vs ${b}\n`;
            // str += `${level}*: ${a} vs ${b}\n`;
        }
        // res.fields.push({ name: '\u200B', value: '\u200B' });
        total += value.length;
        res.fields.push({name: `==${ship}==`, value: value, inline: true});
    }
    // console.log(`Total: ${total}`);
    return res;
}

function selfEval(){
    let res = {fields: []}, level, toon, ship, i, table_data = [], res_a = {}, res_b = {}, str='', total = 0;
    // twParseGuild(guild_a.players, guild_store_a);

    // str += `GP: ${guild_data_self.data.galactic_power}\n\n`;

    res.title = `${guild_data_self.data.name}`;
    res.description = `**Players**: ${guild_data_self.players.length}\n**GP**: ${guild_data_self.data.galactic_power}`;

    // console.log(JSON.stringify(guild_store_a, null, 2));
    for(toon in guild_store_self.toons){
        // str += `*${toon}*\n`;
        // res.push(`*** ${toon} gear compare ***\n`);
        str = `*${guild_store_self.toons[toon].total}*\n`;
        for(i = 0; i < tracked_toon_stats.gear_level.length; i++){
            level = tracked_toon_stats.gear_level[i];
            let a = guild_store_self.toons[toon].gear_level[level];
            if(a === 0) continue;

            str +=`**G${level}**: ${a}\n`;
        }
        // res.push(str);
        // str += `***relic***\n`;

        // Relic tier data from swgoh is all wrong. Commenting this out.
        for(i = 0; i < tracked_toon_stats.relic_tier.length; i++){
            level = tracked_toon_stats.relic_tier[i];
            let a = guild_store_self.toons[toon].relic_tier[level];
            if(a === 0) continue;

            str +=`**R${level}**: ${a}\n`;
        }
        total = total + str.length;

        res.fields.push({name: `==${toon}==`, value: str, inline: true});
    }

    for(ship in guild_store_self.ships){
        // str = `*${ship}*\n`;
        str = `*${guild_store_self.ships[ship].total}*\n`;

        for(i = 0; i < tracked_ship_stats.rarity.length; i++){
            level = tracked_ship_stats.rarity[i];
            let a = guild_store_self.ships[ship].rarity[level];
            if(a == 0) {
                // console.log("found both zero");
                continue;
            }

            str += `${level}*: ${a}\n`;
        }

        total = total + str.length;
        res.fields.push({name: `==${ship}==`, value: str, inline: true});
    }
    // console.log(JSON.stringify(res, null, 2));
    // console.log(`Total length: ${total}`);
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
function initGuildStore(){
    let stat, guild_store = {toons: {}, ships: {}};
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
    return guild_store;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////
// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';
// Initialize Discord Bot
var client = new Discord.Client();

client.login(BOT_TOKEN);

client.on('ready', function (evt) {
    logger.info('Connected');
    logger.info(`Logged in as: ${client.user.tag}`);
});
// bot.on('message', function (user, userID, channelID, message, evt) {
client.on('message', async message => {
    // console.log("We got a message");
    let i, num, who = '', guild_a, guild_b, res, self = false;
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.content.substring(0, 4) == '/cb ') {
        var args = message.content.substring(4).split(' ');
        var cmd = args[0];

        args = args.splice(1);
        switch(cmd) {
            // !ping
            case 'light':
                await refreshGuild();
                who = args[0]? args[0]+"! ": message.author.username +"! ";
                args = args.splice(1);
                num = Math.floor(Math.random() * phrases.compliments.length);
                await message.channel.send(who + phrases.compliments[num]);
                // bot.sendMessage({
                //     to: channelID,
                //     message: who + phrases.compliments[num]
                // });
                break;
            case 'dark':
                await refreshGuild();
                who = args[0]? args[0]+"! ": message.author.username +"! ";
                args = args.splice(1);
                num = Math.floor(Math.random() * phrases.dis.length);
                await message.channel.send(who + phrases.dis[num]);
                // bot.sendMessage({
                //     to: channelID,
                //     message: who + phrases.dis[num]
                // });
                break;
            case 'quote':
                await refreshGuild();
                num = Math.floor(Math.random() * phrases.quotes.length);
                await message.channel.send(phrases.quotes[num]);
                // bot.sendMessage({
                //     to: channelID,
                //     message: phrases.quotes[num]
                // });
                break;
            // https://cdn.discordapp.com/attachments/353622124839043076/682413698496593966/image0.gif
            case 'ep':
                await refreshGuild();
                num = Math.floor(Math.random() * images.length);
                await message.channel.send({
                    files: [{
                        attachment: `./${images[num]}`,
                        name: images[num],
                    }],
                });
                // sendFiles(channelID, [images[num]]);
                break;
            case 'fight':
                await refreshGuild();
                who = args[0]? args[0]+"! ": message.author.username +"! ";
                args = args.splice(1);
                num = Math.floor(Math.random() * phrases.fight.length);
                await message.channel.send(who + phrases.fight[num]);
                // bot.sendMessage({
                //     to: channelID,
                //     message: who + phrases.fight[num]
                // });
                break;
            case 'charge':
                await refreshGuild();
                who = args[0]? args[0]+"! ": message.author.username +"! ";
                args = args.splice(1);
                num = Math.floor(Math.random() * phrases.money.length);
                await message.channel.send(who + phrases.money[num]);
                // bot.sendMessage({
                //     to: channelID,
                //     message: who + phrases.money[num]
                // });
                break;
            case 'thraceme':
                await refreshGuild();
                await message.channel.send("Congratulations Thrace, that is awesome for you!");
                await message.channel.send("Thrace: Thanks! Pretty excited about it myself. You are awesome yourself");
                // bot.sendMessage({
                //     to: channelID,
                //     message: "Congratulations Thrace, that is awesome for you!"
                // }, () => {
                //     bot.sendMessage({
                //         to: channelID,
                //         message: "Thrace: Thanks! Pretty excited about it myself. You are awesome yourself"
                //     });
                // });
                break;
            case 'flip':
                await refreshGuild();
                who = args[0]? args[0]+"! ": message.author.username +"! ";
                args = args.splice(1);
                await message.channel.send(who + ":middle_finger:".repeat(Math.floor(Math.random() * 20) + 5));
                // bot.sendMessage({
                //     to: channelID,
                //     message: who + ":middle_finger:".repeat(Math.floor(Math.random() * 20) + 5)
                // });
                break;
            case 'snowflake':
                await refreshGuild();
                who = args[0]? args[0]+"! ": message.author.username +"! ";
                args = args.splice(1);
                await message.channel.send(who + ":snowflake:".repeat(Math.floor(Math.random() * 20) + 5));
                // bot.sendMessage({
                //     to: channelID,
                //     message: who + ":snowflake:".repeat(Math.floor(Math.random() * 20) + 5)
                // });
                break;
            case 'halo':
                await refreshGuild();
                who = args[0]? args[0]+"! ": message.author.username +"! ";
                args = args.splice(1);
                num = Math.floor(Math.random() * phrases.halo.length);
                if(who.includes('secret')){
                    await message.channel.send("Cody made me do it!");
                    // bot.sendMessage({
                    //     to: channelID,
                    //     message: "Cody made me do it!"
                    // });
                }
                else {
                    await message.channel.send(who + phrases.halo[num]);
                    // bot.sendMessage({
                    //     to: channelID,
                    //     message: who + phrases.halo[num]
                    // });
                }

                break;
            case 'self':
                await refreshGuild();
                res = selfEval(guild_data_self);
                message.channel.send({embed: Object.assign(res, embed)});

                // guild_store_a = initGuildStore();
                // axios.get(base_url + "/guild/" + my_guild_id)
                //     .then(response => response.data)
                //     .then(async data => {
                //         let res = selfEval(data);
                //         for(let i = 0; i < res.length; i++){
                //             // console.log(res[i].length);
                //             await message.channel.send('```' + res[i] + '```');
                //             // bot.sendMessage({
                //             //    to: channelID,
                //             //    message: '```' + res[i] + '```',
                //             // });
                //             sleep(5000);
                //         }
                //     });
                break;
            case 'clear':
                await refreshGuild();
                await message.channel.send(clearScreen());
                // bot.sendMessage({
                //    to: channelID,
                //    message: clearScreen(),
                // });
                break;
            case 'refresh':
                await refreshGuild(true);
                await message.channel.send("Guild data refreshed");
                break;
            case 'tw':
                guild_store_a = initGuildStore();
                guild_store_b = initGuildStore();

                try{
                    guild_a = await getGuildData(args[0]);
                    if(args[1] === undefined){
                        await refreshGuild();
                        guild_b = guild_data_self;
                        self = true;
                    } else {
                        guild_b = await getGuildData(args[1]);
                    }
                    res = twCompare(guild_a, guild_b, self);
                    embed.color = "#e65609";
                    message.channel.send({embed: Object.assign(res, embed)});
                }
                catch(err){
                    console.log(err);
                }

                break;
            case 'issue':
                await refreshGuild();
                axios.get(base_url + "/guild/" + my_guild_id)
                    .then(response => response.data)
                    .then(async data => {
                        guild = data,
                        await message.channel.send('```' + findIssues(guild.players) + '```');
                        // bot.sendMessage({
                        //     to: channelID,
                        //     message: '```' + findIssues(guild.players) + '```',
                        // });
                    });
                break;
            case 'gds':
                await refreshGuild();
                if(['p1','p2','p3','p4'].includes(args[0])){
                    tbGdsPlatoonsData();
                    tb.sortTbGdsGuild();
                    res = tbGdsPlatoonsProcess(args[0]);
                    // console.log(res.length);
                    embed.color = "#ede613";

                    // message.channel.send({embed: Object.assign(res[3], embed)});

                    for(i = 0; i < res.length; i++){
                        // console.log(res[i].len);
                        // if(i == res.length - 1) console.log(res[i].fields);
                        await message.channel.send({embed: Object.assign(res[i], embed)});
                        sleep(800);
                    }
                }
                else{
                    message.channel.send("Must enter a phase -- p1, p2, p3, p4");
                }

                break;
            case '1gds':
                await refreshGuild();
                if(['p1','p2','p3','p4'].includes(args[0]) && args[1]){
                    tbGdsPlatoonsData();
                    tb.sortTbGdsGuild();
                    tbGdsPlatoonsProcess(args[0]);
                    // The slice here is for names with space in them
                    res = tbGdsPlayerPlatoonProcess(args.slice(1).join(" ").toUpperCase(), args[0]);
                    // res = tbGdsPlayerPlatoonProcess("m", args[0]);
                    embed.color = "#13eb49";
                    message.channel.send({embed: Object.assign(res, embed)});
                }
                else{
                    message.channel.send("Must enter a phase -- p1, p2, p3, p4 and player's name");
                }

                break;
            case 'test':
                await message.channel.send("This command is reserved for testing.");

                // let name = args.slice(1).join(" ");
                // console.log(name);

                break;
            default:
                await refreshGuild();
                await message.channel.send("I don't understand the words that are coming out of your mouth....");
                // bot.sendMessage({
                //    to: channelID,
                //    message: "I don't understand the words that are coming out of your mouth...."
                // });
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

// a, and b are Date() objects.
function timeDiff(a, b, unit='second'){
    let res;
    switch(unit){
        case 'day':
            res = Math.round((b.getTime() - a.getTime())/(1000*60*60*24));
            break;
        default:
            // Default is second
            res = Math.round((b.getTime() - a.getTime())/(1000));
    }
    return res;
}

function objectPrint(obj){
    console.log(JSON.stringify(obj, null, 2));
}

///////////////////////////////////////////////////////////////
function sendFiles(channelID, fileArr, interval) {
    var resArr = [], len = fileArr.length;
    var callback = typeof(arguments[2]) === 'function' ? arguments[2] : arguments[3];
    if (typeof(interval) !== 'number') interval = 1000;

    function _sendFiles() {
        setTimeout(function() {
            if (fileArr[0]) {
                bot.uploadFile({
                    to: channelID,
                    file: fileArr.shift()
                }, function(err, res) {
                    resArr.push(err || res);
                    if (resArr.length === len) if (typeof(callback) === 'function') callback(resArr);
                });
                _sendFiles();
            }
        }, interval);
    }
    _sendFiles();
}
