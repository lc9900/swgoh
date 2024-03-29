// https://discordjs.guide/
// https://discord.js.org/
// embed messages has a total max of 60000 characters limit

let Discord = require('discord.js');
let logger = require('winston');
let phrases = require('./phrases');
const axios = require('axios');
const fs = require('fs');
const table = require('table').table;
const Tb = require('./Tb');
const base_url = "http://api.swgoh.gg";
const my_guild_id = "3k6Ny4_6SD60qExSAuJstg";
const tb_gds = new Tb('gds');
const tb_gls = new Tb('gls');
const tb_hls = new Tb('hls');
const tb_hds = new Tb('hds');

axios.defaults.withCredentials = true
// tb_gds.printTbMeta();

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


let guild = {}, refresh_time, cb_rude = 'off',
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
        "bear.gif",
    ],
    tracked_toons = [
        'Lord Vader',
        'Jedi Master Kenobi',
        'Jedi Master Luke Skywalker',
        'Sith Eternal Emperor',
        'Supreme Leader Kylo Ren',
        'Rey',
        'Maul',
        'Commander Ahsoka Tano',
        'Jedi Knight Luke Skywalker',
        'Ki-Adi-Mundi',
        'Shaak Ti',
        'ARC Trooper',
        'CT-21-0408 "Echo"',
        'CT-5555 "Fives"',
        'CT-7567 "Rex"',
        'Admiral Raddus',
        'Cassian Andor',
        'Mon Mothma',
        'Dash Rendar',
        'Bistan',
        'Jyn Erso',
        'Hera Syndulla',
        'Admiral Raddus',
        'Cassian Andor',
        'Kyle Katarn',
        'Darth Talon',
        "Mara Jade, The Emperor's Hand",
        'Echo',
        'Hunter',
        'Wrecker',
        'Tech',
        'Ahsoka Tano (Fulcrum)',
    ],
    tracked_ships = [
        "Executor",
        'TIE/IN Interceptor Prototype',
        // "Hound's Tooth",
        // "Han's Millennium Falcon",
        // "Anakin's Eta-2 Starfighter",
        // "Negotiator",
        // "Malevolence",
    ],
    tracked_toon_stats = {
        "gear_level": [11,12],
        "relic_tier": [0,1,2,3,4,5,6,7,8,9],
    },
    tracked_ship_stats = {
        "rarity": [4,5,6,7],
    },

    get_tracked_toons = [
        "Hermit Yoda",
        "Rebel Officer Leia Organa",
        'General Skywalker',
        'Darth Malak',
        'Wampa',
        'Wat Tambor',
    ],
    get_tracked_toon_stats = {
        "rarity": [1,2,3,4,5,6,7],
    },
    get_tracked_ships = [
        "Negotiator",
        "Malevolence",
    ],
    get_tracked_ship_stats = {
        "rarity": [5,6,7],
    },
    guild_store_a, guild_store_b, guild_store_self, guild_data_self, guild_player_data_self;
    // guild_store_a = {toons: {}, ships: {}}, guild_store_b = {toons:{}, ships:{}}, guild_store_self = {toons:{}, ships:{}};

// let tb.tb_players = {
//     // "LandCrawler": {
//     //     p1: ["toon1", "toon2"],
//     //     p2: ["toon3", "toon4"],
//     //     p3: ["toon5", "toon6"],
//     //     p4: ["toon7", "toon8"],
//     // }
// };

// If the name can be matched to any guild member, then return true, else return false
function verifyPlayerName(player_name){
    let re = new RegExp(player_name, 'i'),
        matched_names = guild_data_self.data.members.filter(player => re.test(player.player_name));
    if(matched_names.length > 0) return true;
    else return false;
}

function tbPlatoonsData(tb){

    // tb.printTbMeta();
    // If there's data in it, then no need to redo.
    // Resetting this data will be part of refresh.
    if(Object.keys(tb.tb_guild).length !== 0) {
        // console.log(`tb_guild: ${Object.keys(tb.tb_guild)}`);
        return;
    }
    // console.log("tbPlatoonsData - guild_data_self.players #############################");
    // console.log(JSON.stringify(guild_data_self.players, null, 2));
    guild_data_self.data.members.forEach(player => {
        player.units.forEach(unit =>{
            // console.log(JSON.stringify(unit, null, 2)); //debug

            // if(unit.data.name == 'CC-2224 Cody') console.log(`Player has ${unit.data.name} with rarity ${unit.data.rarity}`);
            // console.log(`Processing ${unit.data.name} with rarity ${unit.data.rarity}`);
            if(tb.needToon(unit.data.name, unit.data.rarity)){
                // console.log(`Adding ${unit.data.name} with rarity ${unit.data.rarity}`);
                // if(unit.data.name == 'CC-2224 Cody') console.log(`Adding ${unit.data.name} with rarity ${unit.data.rarity}`);

                tb.addUnitGuild(player.player_name, unit.data.name, unit.data.power, unit.data.rarity);
            }
        });
    });

    tb.sortTbGuild();
}

function tbPlatoonsProcess(tb, phase, toon_name=".*"){
    let limit = 800, counter = 0, total = 0, player, current,max, value, res = [], data = {fields: []},
        rarity_req = tb.tb_req[phase].rarity, re = new RegExp(toon_name, 'i'), toons_req_filtered = [],
        toons_req = Object.keys(tb.tb_req[phase].units).sort();
    data.title = `${tb.title} ${phase.toUpperCase()} Platoon Assignments`;
    data.description = `Assignments are made base on toon gp, starting from the lowest`;
    tb.tb_players = {};

    // debug 
    // console.log(JSON.stringify(tb, null, 2));

    // If the toon name is not matched, then skip. Default matches everything
    toons_req_filtered = toons_req.filter(toon => re.test(toon));
    if(toons_req_filtered.length == 0){
        data.fields.push({name: `WARNING! No toon found matching ${toon_name}`, value: "Did you put in the right name?", inline: true});
        res.push(data);
    }

    toons_req_filtered.forEach(toon =>{
        max = tb.tb_req[phase].units[toon];
        value = '\n';
        current = 0;

        // debug
        // console.log(`${toon}'s max: ${max}`);
        // console.log(`toon: ${toon}`);
        // if(toon == 'CC-2224 Cody') console.log(JSON.stringify(tb.tb_guild, null, 2));

        // if(tb.tb_guild[toon] === undefined){
        //     console.log(`toon: ${toon}`);
        //     return;
        // }

        // console.log(`toon is: ${toon}` );
        // console.log(JSON.stringify(tb.tb_guild[toon], null, 2));

        // if (tb.tb_guild[toon] == undefined) tb.tb_guild[toon] = [];
        for(let i = 0; i < tb.tb_guild[toon].length; i++){

            player = tb.tb_guild[toon][i];
            // if player's rarity fits, then count it
            if(player[2] >= rarity_req){
                // value += `**${player[0]}**: ${player[1]}\n`;
                addToPlayerPlatoon(tb, phase, player[0].toUpperCase(), toon);
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
            data.title = `${tb.title} ${phase.toUpperCase()} Platoon Assignments`;
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

function addToPlayerPlatoon(tb, phase, player_name, toon_name){
    // tb.printTbMeta();
    if(tb.tb_players[player_name] === undefined) {
        tb.tb_players[player_name] = {
            p1: [],
            p2: [],
            p3: [],
            p4: [],
            p5: [],
            p6: [],
        };
    }
    if(tb.tb_players[player_name][phase].includes(toon_name)) return;
    tb.tb_players[player_name][phase].push(toon_name);
}

function tbPlayerPlatoonProcess(tb, player_name, phase){
    let value = '\n', res = {fields: []}, re = new RegExp(player_name, 'i'),
    matched_names = Object.keys(tb.tb_players).filter(name => re.test(name));

    res.title = `${phase.toUpperCase()} ${tb.title} Platoon Assignments for the following player(s)`;
    res.description = `Please fulfill your assignments`;

    if(matched_names.length == 0){
        if(verifyPlayerName(player_name)) res.fields.push({name: `==**No platoon assignment required**==`, value: "\nYou are off the hook", inline: true});
        else res.fields.push({name: `WARNING! No player found matching ${player_name}`, value: "\n" + dis(cb_rude), inline: true});
    }

    // if(matched_names.length == 0) res.fields.push({name: "WARNING!!!", value: "\nEither no matching player found or player has no assignments", inline: true});
    else {
        matched_names.forEach(player_name => {
            value = '\n';
            if(tb.tb_players[player_name][phase].length > 0) tb.tb_players[player_name][phase].forEach(toon => value += `${toon}\n`);
            else value += "\nNo platoon assignment required";
            res.fields.push({name: `==**${player_name}**==`, value: "```"+value+"```", inline: true});
        });
    }
    // value = '\n';
    // if(tb.tb_players[player_name]){
    //     // console.log(tb.tb_players[player_name][phase]);
    //     tb.tb_players[player_name][phase].forEach(toon => {
    //         value += `${toon}\n`;
    //     });
    // } else {
    //     value += "No platton assignment required";
    // }

    // res.fields.push({name: `==**${phase.toUpperCase()}**==`, value: "```"+value+"```", inline: true});
    return res;
}

async function refreshGuild(force=false){
    let now = new Date();
    // If we never refreshed, or we want to force it, or the data we have is more than 1 day old
    if(refresh_time === undefined || force === true || timeDiff(refresh_time, now, 'day') > 0){
        guild_store_self = initGuildStore();
        tb_gds.reset();
        tb_gls.reset();
        tb_hls.reset();
        tb_hds.reset();
        refresh_status = 1
        guild_data_self = await getGuildData(my_guild_id);

        // console.log(JSON.stringify(guild_data_self, null, 2)); // debug
        // console.log(guild_store_self);

        // console.log("###################################");
        // console.log("###################################");
        // console.log("###################################");
        // console.log("###################################");

        guildMemberCleanUp(guild_data_self.data.members);
        // console.log(JSON.stringify(guild_data_self.data.members, null, 2)); // debug
        // console.log("After print");
        // showGuildMembers(guild_data_self.data.members); // debug

        await getGuildPlayerData(guild_data_self.data.members);

        // console.log(JSON.stringify(guild_data_self.data.members[0].units, null, 2)); //debug


        parseGuild(guild_data_self.data.members, guild_store_self);

        // console.log(JSON.stringify(guild_store_self, null, 2)); // debug
        refresh_status = 0;
        refresh_time  = now;
    }
    else {
        // console.log(`No refresh needed -- refresh_time: ${refresh_time}, force: ${force}, diff: ${timeDiff(refresh_time, now, 'day')}`);
    }
}

// debug show functon
function showGuildMembers(players){
    console.log(`Total ${players.length} players`)
    for(let i = 0; i < players.length; i++){
        player = players[i];
        console.log(`player #${i}: ${player.player_name}, ally_code: ${JSON.stringify(player.ally_code, null, 2)}`) // debug
    }
}

function getGuildData(id){
    // return  axios.get(base_url + "/guild/" + id)
    return  axios.get(base_url + "/guild-profile/" + id)
            .then(response => response.data);
}

function getPlayerData(ally_code){
    return  axios.get(base_url + "/player/" + ally_code)
            .then(response => response.data);
}

function guildMemberCleanUp(players){
    let target = [];
    
    // Cleanup players with ally code of null
    for(let i = 0; i < players.length; i++){
        player = players[i];
        if(!player.ally_code) target.push(i);
    }

    target.forEach(index => {
        players.splice(index,1);
    })
}

async function getGuildPlayerData(players){
    let player, data;

    for(let i = 0; i < players.length; i++){
        player = players[i];

        // console.log(`player: ${player.player_name}, ally_code: ${JSON.stringify(player.ally_code, null, 2)}, typeof ally_code: ${typeof player.ally_code}`) // debug

        if(!player.ally_code) continue;
        
        // console.log(`Getting data for player: ${player.player_name}, ally_code: ${player.ally_code}`) // debug

        data = await getPlayerData(player.ally_code);
        player.units = data.units;
    }

    // console.log(`getGuildPlayerData() is done.`); // debug
}

function parseGuild(players, guild_store){
    let player, relic_tier, player_units = [];

    // console.log(JSON.stringify(players, null, 2)); // debug
    // for(let i = 0; i < players.length; i++){
    //     player = players[i];
    //     console.log(`${player.player_name}`);
    // }

    for(let i = 0; i < players.length; i++){
        player = players[i];
        // player_data = await getPlayerData(player.ally_code);

        // console.log(JSON.stringify(player_data.units[0], null, 2)); // debug
        player.units.forEach(unit => {
            if(tracked_toons.includes(unit.data.name)){

                // console.log(`found ${unit.data.name}`); // debug

                guild_store.toons[unit.data.name].total++;

                // For omicron
                if(unit.data.omicron_abilities.length > 0) guild_store.toons[unit.data.name].omi++;

                // console.log(`guild_store.toons[unit.data.name].total is ${guild_store.toons[unit.data.name].total}`);

                // console.log(`unit.data.gear_level is ${unit.data.gear_level} of type  ${typeof(unit.data.gear_level)}`); // debug

                if(tracked_toon_stats.gear_level.includes(unit.data.gear_level)){
                    guild_store.toons[unit.data.name].gear_level[unit.data.gear_level].count++;

                    // Omi count per gear level
                    if(unit.data.omicron_abilities.length > 0) guild_store.toons[unit.data.name].gear_level[unit.data.gear_level].omi_count++;

                    // console.log(`toon ${unit.data.name} count is ${guild_store.toons[unit.data.name].gear_level[unit.data.gear_level]}`) //debug
                }
                if(typeof unit.data.relic_tier === 'number'){
                    if(tracked_toon_stats.relic_tier.includes(unit.data.relic_tier - 2)){
                        guild_store.toons[unit.data.name].relic_tier[unit.data.relic_tier - 2].count++;

                        // console.log(`current omi count: ${guild_store.toons[unit.data.name].relic_tier[unit.data.relic_tier - 2]['omi']}`);

                        // Omi count per relic level
                        if(unit.data.omicron_abilities.length > 0) {
                            guild_store.toons[unit.data.name].relic_tier[unit.data.relic_tier - 2].omi_count++;
                            // console.log("Added omi: " + guild_store.toons[unit.data.name].relic_tier[unit.data.relic_tier - 2]['omi']);
                        }
                        // debug
                        // if(unit.data.name === "Ahsoka Tano (Fulcrum)"){
                        //     console.log("Fulcrum: " + JSON.stringify(unit, null, 2));
                        // }
                    }
                }
            }
            
            // if(unit.data.name === "Ahsoka Tano (Fulcrum)"){
            //     console.log("Fulcrum: " + JSON.stringify(guild_store.toons[unit.data.name], null, 2));
            // }

            // Ships now
            if(tracked_ships.includes(unit.data.name)){
                // console.log(`found ${unit.data.name}`)
                guild_store.ships[unit.data.name].total++;;
                if(tracked_ship_stats.rarity.includes(unit.data.rarity)){
                    guild_store.ships[unit.data.name].rarity[unit.data.rarity]++;
                }
            }
            ///////////////////////////// GET stuff here
            if(get_tracked_toons.includes(unit.data.name)){
                guild_store.get_toons[unit.data.name].total++;
                if(get_tracked_toon_stats.rarity.includes(unit.data.rarity)){
                    guild_store.get_toons[unit.data.name].rarity[unit.data.rarity]++;
                }
            }
            if(get_tracked_ships.includes(unit.data.name)){
                // console.log(`found ${unit.data.name}`)
                guild_store.get_ships[unit.data.name].total++;;
                if(get_tracked_ship_stats.rarity.includes(unit.data.rarity)){
                    guild_store.get_ships[unit.data.name].rarity[unit.data.rarity]++;
                }
            }
        });
    }

    // console.log(JSON.stringify(guild_store, null, 2));
    // return guild_store;
}

function twCompare(guild_a, guild_b, self=false){
    let res = {fields: []}, level, toon, ship, i, table_data = [], res_a = {}, res_b = {}, value = "", total = 0,
        str = `${guild_a.data.name} vs ${guild_b.data.name}\n`;
    parseGuild(guild_a.data.members, guild_store_a);
    if(!self) parseGuild(guild_b.data.members, guild_store_b);
    else guild_store_b = guild_store_self;

    res.title = `${guild_a.data.name} vs ${guild_b.data.name}`;
    res.description = `**Players**: ${guild_a.data.members.length} vs ${guild_b.data.members.length}\n**GP**: ${guild_a.data.galactic_power} vs ${guild_b.data.galactic_power}`;

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
            value += `**${level}s**: ${a} vs ${b}\n`;
            // str += `${level}*: ${a} vs ${b}\n`;
        }
        // res.fields.push({ name: '\u200B', value: '\u200B' });
        total += value.length;
        res.fields.push({name: `==${ship}==`, value: value, inline: true});
    }
    // console.log(`Total: ${total}`);
    return res;
}


function getEval(){
    let res = {fields: []}, level, toon, ship, i, table_data = [], res_a = {}, res_b = {}, str='', total = 0;
    // parseGuild(guild_a.players, guild_store_a);

    // str += `GP: ${guild_data_self.data.galactic_power}\n\n`;

    res.title = `${guild_data_self.data.name}`;
    res.description = `**Players**: ${guild_data_self.data.members.length}\n**GP**: ${guild_data_self.data.galactic_power}`;

    // console.log(JSON.stringify(guild_store_a, null, 2));
    for(toon in guild_store_self.get_toons){
        // str += `*${toon}*\n`;
        // res.push(`*** ${toon} gear compare ***\n`);
        str = `*Total: ${guild_store_self.get_toons[toon].total}*\n`;
        for(i = 0; i < get_tracked_toon_stats.rarity.length; i++){
            level = get_tracked_toon_stats.rarity[i];
            let a = guild_store_self.get_toons[toon].rarity[level];
            if(a === 0) continue;

            str +=`**${level} Stars**: ${a}\n`;
        }
        total = total + str.length;

        res.fields.push({name: `==${toon}==`, value: str, inline: true});
    }

    for(ship in guild_store_self.get_ships){
        // str = `*${ship}*\n`;
        str = `*Total: ${guild_store_self.get_ships[ship].total}*\n`;

        for(i = 0; i < get_tracked_ship_stats.rarity.length; i++){
            level = get_tracked_ship_stats.rarity[i];
            let a = guild_store_self.get_ships[ship].rarity[level];
            if(a == 0) {
                // console.log("found both zero");
                continue;
            }

            str += `**${level}s**: ${a}\n`;
        }

        total = total + str.length;
        res.fields.push({name: `==${ship}==`, value: str, inline: true});
    }
    // console.log(JSON.stringify(res, null, 2));
    // console.log(`Total length: ${total}`);
    return res;
}

// Discord limits amount of characters in a message, and truncates anything over that.
// longMessageProcess() takes the message, and turns it into a list of messages, and
// each individual message will be less than the max.
function longMessageProcess(data){
    let res = [], limit = 300, counter = 0;
    let message = {
        title: data.title,
        description: data.description,
        fields: []
    };

    // console.log("longMessageProcess got data fields: " + data.fields.length);

    for( let i = 0; i < data.fields.length; i++){
        // console.log("In the loop with i: " + i);
        message.fields.push(data.fields[i]);
        counter = counter + String(data.fields[i]).length;

        // console.log("counter: " + counter);
        // console.log("data.fields[i].length: " + String(data.fields[i]).length);
        // console.log("data.fields[i]: " + JSON.stringify(data.fields[i]));

        // We've hit the single message limit, so pushing the message to res,
        // and start a new message.
        if (counter >= limit) {
            // console.log("Pushing message");
            res.push(message);
            message = {fields: []};
            message.title = data.title;
            message.description = data.description;
            counter = 0;
        }
    }

    // If the current message is less than the limit, than add it to res
    if(counter <= limit && counter > 0) {
        // console.log("Pushing message");
        res.push(message);
    }
    return res;
}

function selfEval(){
    let res = {fields: []}, level, toon, ship, i, table_data = [], res_a = {}, res_b = {}, str='', total = 0;
    // parseGuild(guild_a.players, guild_store_a);

    // str += `GP: ${guild_data_self.data.galactic_power}\n\n`;

    res.title = `${guild_data_self.data.name}`;
    res.description = `**Players**: ${guild_data_self.data.members.length}\n**GP**: ${guild_data_self.data.galactic_power}`;

    // console.log(JSON.stringify(guild_store_self, null, 2)); // debug

    for(toon in guild_store_self.toons){
        // console.log(`Processing ${toon}`);
        // str += `*${toon}*\n`;
        // res.push(`*** ${toon} gear compare ***\n`);
        str = `*${guild_store_self.toons[toon].total}*\n`;
        str += `*Omicron:${guild_store_self.toons[toon].omi}*\n`;
        // console.log(str);
        for(i = 0; i < tracked_toon_stats.gear_level.length; i++){
            level = tracked_toon_stats.gear_level[i];
            let a = guild_store_self.toons[toon].gear_level[level].count;
            let omi_count = guild_store_self.toons[toon].gear_level[level].omi_count;
            if(a === 0) continue;

            str +=`**G${level}**: ${a}, Omi: ${omi_count}\n`;
        }
        // res.push(str);
        // str += `***relic***\n`;

        // Relic tier data from swgoh is all wrong. Commenting this out.
        for(i = 0; i < tracked_toon_stats.relic_tier.length; i++){
            level = tracked_toon_stats.relic_tier[i];
            let a = guild_store_self.toons[toon].relic_tier[level].count;
            let omi_count = guild_store_self.toons[toon].relic_tier[level].omi_count;

            if(a === 0) continue;

            str +=`**R${level}**: ${a}, Omi: ${omi_count}\n`;
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

            str += `**${level}s**: ${a}\n`;
        }

        total = total + str.length;
        res.fields.push({name: `==${ship}==`, value: str, inline: true});
    }
    // console.log(JSON.stringify(res, null, 2));
    // console.log(`Total length: ${total}`);
    return longMessageProcess(res);
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
    let stat, guild_store = {toons: {}, ships: {}, get_toons:{}, get_ships:{}};
    tracked_toons.forEach(toon => {
       guild_store.toons[toon] = {};
       guild_store.toons[toon].total = 0;
       guild_store.toons[toon].omi = 0;
       for(stat in tracked_toon_stats){
         let list = tracked_toon_stats[stat];
         //guild_store["General Kenobi"]["gear_level"]
         guild_store.toons[toon][stat] = {};
         list.forEach(item => {
            // guild_store["General Kenobi"]["gear_level"]['10'] = 0
            guild_store.toons[toon][stat][item] = {count: 0, omi_count: 0};
            // guild_store.toons[toon][stat][item]['omi'] = 0;
         });
       }
    });

    // debug
    // console.log(JSON.stringify(guild_store,null,2));

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

    get_tracked_toons.forEach(toon =>{
        guild_store.get_toons[toon] = {};
        guild_store.get_toons[toon].total = 0;
        guild_store.get_toons[toon].omi = 0
        for(stat in get_tracked_toon_stats){
            let list = get_tracked_toon_stats[stat];
            guild_store.get_toons[toon][stat] = {};
            //guild_store.get_toons['wampa'][rarity][5] = 0
            list.forEach(item =>{
                guild_store.get_toons[toon][stat][item] = 0;
            });
        }
    });
    get_tracked_ships.forEach(ship => {
        guild_store.get_ships[ship] = {};
        guild_store.get_ships[ship].total = 0
        for(stat in get_tracked_ship_stats){
            let list = get_tracked_ship_stats[stat];
            guild_store.get_ships[ship][stat] = {};
            //guild_store.get_toons['Negotiator'][rarity][5] = 0
            list.forEach(item =>{
                guild_store.get_ships[ship][stat][item] = 0;
            });
        }
    });
    return guild_store;
}

function dis(cb_rude){
    let num = Math.floor(Math.random() * phrases.dis.length);
    if(cb_rude === 'on') return phrases.dis[num];
    else return "Sigh........-.-'";
}

function rude(flag){
    if(flag === undefined) return cb_rude;
    else if(flag === 'on') {
        cb_rude = 'on';
        return "Oh, it's on baby!";
    }
    else {
        cb_rude = 'off';
        return "If it ain't on, it's off to me.";
    }
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
    // console.log(`We got a message ${JSON.stringify(message, null, 2)}`); //debug
    // console.log(`We got a message ${message.content}`); //debug

    let i, num, who = '', guild_a, guild_b, res, self = false;
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.content.substring(0, 4) == '/cb ') {
        var args = message.content.substring(4).split(' ').filter(el => el.length > 0); // filtering out empty elements due to extra spaces in typo
        var cmd = args[0];
        // console.log(args);
        args = args.splice(1);
        switch(cmd) {
            // !ping
            case 'light':
                // await refreshGuild();
                who = args[0]? args[0]+"! ": message.author.username +"! ";
                args = args.splice(1);
                num = Math.floor(Math.random() * phrases.compliments.length);
                await message.channel.send(who + phrases.compliments[num]);
                // bot.sendMessage({
                //     to: channelID,
                //     message: who + phrases.compliments[num]
                // });
                break;
            case 'bash':
                // await refreshGuild();
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
                // await refreshGuild();
                num = Math.floor(Math.random() * phrases.quotes.length);
                await message.channel.send(phrases.quotes[num]);
                // bot.sendMessage({
                //     to: channelID,
                //     message: phrases.quotes[num]
                // });
                break;
            // https://cdn.discordapp.com/attachments/353622124839043076/682413698496593966/image0.gif
            case 'ep':
                // await refreshGuild();
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
                // await refreshGuild();
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
                // await refreshGuild();
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
                // await refreshGuild();
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
                // await refreshGuild();
                who = args[0]? args[0]+"! ": message.author.username +"! ";
                args = args.splice(1);
                await message.channel.send(who + ":middle_finger:".repeat(Math.floor(Math.random() * 20) + 5));
                // bot.sendMessage({
                //     to: channelID,
                //     message: who + ":middle_finger:".repeat(Math.floor(Math.random() * 20) + 5)
                // });
                break;
            case 'snowflake':
                // await refreshGuild();
                who = args[0]? args[0]+"! ": message.author.username +"! ";
                args = args.splice(1);
                await message.channel.send(who + ":snowflake:".repeat(Math.floor(Math.random() * 20) + 5));
                // bot.sendMessage({
                //     to: channelID,
                //     message: who + ":snowflake:".repeat(Math.floor(Math.random() * 20) + 5)
                // });
                break;
            case 'halo':
                // await refreshGuild();
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
                // message.channel.send({embed: Object.assign(res, embed)});

                // console.log("res.length: " + res.length);
                for(i = 0; i < res.length; i++){
                    await message.channel.send({embed: Object.assign(res[i], embed)});
                    sleep(800);
                }

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
                // await refreshGuild();
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
                await refreshGuild();
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
                axios.get(base_url + "/guild-profile/" + my_guild_id)
                    .then(response => response.data)
                    .then(async data => {
                        guild = data,
                        await message.channel.send('```' + findIssues(guild.data.members) + '```');
                        // bot.sendMessage({
                        //     to: channelID,
                        //     message: '```' + findIssues(guild.players) + '```',
                        // });
                    });
                break;
            case 'gds':
                await refreshGuild();
                // tb.setType('gds');
                if(tb_gds.phases.includes(args[0])){

                    // tb_gds.printTbMeta();

                    tbPlatoonsData(tb_gds);
                    tb_gds.sortTbGuild();
                    res = tbPlatoonsProcess(tb_gds,args[0], args.slice(1).join(" "));
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
                // tb.setType('gds');
                if((tb_gds.phases.includes(args[0]) || args[0] === 'all') && args[1]){

                    // tb_gds.printTbMeta();
                    let phase_list = args[0] === 'all' ? tb_gds.phases:[args[0]];
                    // console.log(phase_list); // debug

                    tbPlatoonsData(tb_gds);
                    // tb_gds.sortTbGuild();

                    for(let i = 0; i < phase_list.length; i++){
                        tbPlatoonsProcess(tb_gds,phase_list[i]);
                        // The slice here is for names with space in them
                        res = tbPlayerPlatoonProcess(tb_gds,args.slice(1).join(" ").toUpperCase(), phase_list[i]);
                        // res = tbPlayerPlatoonProcess("m", args[0]);
                        embed.color = "#13eb49";
                        await message.channel.send({embed: Object.assign(res, embed)});
                        sleep(800);
                    }


                }
                else{
                    message.channel.send("Must enter a phase -- p1, p2, p3, p4 and player's name");
                }

                break;
            case 'hds':
                await refreshGuild();
                if(tb_hds.phases.includes(args[0])){
                    tbPlatoonsData(tb_hds);
                    // tb_hds.sortTbGuild();
                    res = tbPlatoonsProcess(tb_hds,args[0], args.slice(1).join(" "));
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
                    message.channel.send("Must enter a phase -- p1, p2, p3, p4, p5, p6");
                }

                break;
            case '1hds':
                await refreshGuild();
                if((tb_hds.phases.includes(args[0]) || args[0] === 'all') && args[1]){
                    let phase_list = args[0] === 'all' ? tb_hds.phases:[args[0]];
                    tbPlatoonsData(tb_hds);
                    // tb_hds.sortTbGuild();

                    for(let i = 0; i < phase_list.length; i++){
                        tbPlatoonsProcess(tb_hds,phase_list[i]);
                        // The slice here is for names with space in them
                        res = tbPlayerPlatoonProcess(tb_hds,args.slice(1).join(" ").toUpperCase(), phase_list[i]);
                        // res = tbPlayerPlatoonProcess("m", args[0]);
                        embed.color = "#13eb49";
                        await message.channel.send({embed: Object.assign(res, embed)});
                        sleep(800);
                    }

                }
                else{
                    message.channel.send("Must enter a phase -- p1, p2, p3, p4, p5, p6 and player's name");
                }

                break;
                // End of 1hds
            case 'hls':
                await refreshGuild();
                // tb.setType('hls');
                if(tb_hls.phases.includes(args[0])){
                    tbPlatoonsData(tb_hls);
                    // tb_hls.sortTbGuild();
                    res = tbPlatoonsProcess(tb_hls,args[0], args.slice(1).join(" "));
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
                    message.channel.send("Must enter a phase -- p1, p2, p3, p4, p5, p6");
                }

                break;
            case '1hls':
                await refreshGuild();
                // tb.setType('hls');
                if((tb_hls.phases.includes(args[0]) || args[0] === 'all') && args[1]){
                    let phase_list = args[0] === 'all' ? tb_hls.phases:[args[0]];
                    tbPlatoonsData(tb_hls);
                    // tb_hls.sortTbGuild();

                    for(let i = 0; i < phase_list.length; i++){
                        tbPlatoonsProcess(tb_hls,phase_list[i]);
                        // The slice here is for names with space in them
                        res = tbPlayerPlatoonProcess(tb_hls,args.slice(1).join(" ").toUpperCase(), phase_list[i]);
                        // res = tbPlayerPlatoonProcess("m", args[0]);
                        embed.color = "#13eb49";
                        await message.channel.send({embed: Object.assign(res, embed)});
                        sleep(800);
                    }

                }
                else{
                    message.channel.send("Must enter a phase -- p1, p2, p3, p4, p5, p6 and player's name");
                }

                break;
            case 'gls':
                await refreshGuild();
                // tb.setType('hls');
                if(tb_gls.phases.includes(args[0])){
                    tbPlatoonsData(tb_gls);
                    // tb_gls.sortTbGuild();
                    res = tbPlatoonsProcess(tb_gls,args[0], args.slice(1).join(" "));
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
            case '1gls':
                await refreshGuild();
                // tb.setType('hls');
                if((tb_gls.phases.includes(args[0]) || args[0] === 'all') && args[1]){
                    let phase_list = args[0] === 'all' ? tb_gls.phases:[args[0]];
                    tbPlatoonsData(tb_gls);
                    // tb_gls.sortTbGuild();

                    for(let i = 0; i < phase_list.length; i++){
                        tbPlatoonsProcess(tb_gls,phase_list[i]);
                        // The slice here is for names with space in them
                        res = tbPlayerPlatoonProcess(tb_gls,args.slice(1).join(" ").toUpperCase(), phase_list[i]);
                        // res = tbPlayerPlatoonProcess("m", args[0]);
                        embed.color = "#13eb49";
                        await message.channel.send({embed: Object.assign(res, embed)});
                        sleep(800);
                    }

                }
                else{
                    message.channel.send("Must enter a phase -- p1, p2, p3, p4 and player's name");
                }

                break;
            case "rude":
                message.channel.send(rude(args[0]));
                break;
            case "get":
                await refreshGuild();
                res = getEval(guild_data_self);
                message.channel.send({embed: Object.assign(res, embed)});
                break;
            case 'test':
                // await message.channel.send("This command is reserved for testing.");
                await refreshGuild();
                break;
            case 'help':
                    await message.channel.send("**LS Geo TB:**");
                    await message.channel.send("`/cb 1gls <p1|p2|p3|p4|all> <player name sub-string>`");
                    await message.channel.send("i.e. `/cb 1gls all land`");
                    await message.channel.send("**DS Geo TB:**");
                    await message.channel.send("`/cb 1gds <p1|p2|p3|p4|all> <player name sub-string>`");
                    await message.channel.send("i.e. `/cb 1gds all land`");
                    break;
            default:
                await refreshGuild();
                // console.log(JSON.stringify(tb_gds, null, 2));
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
        let units = player.units, name = player.player_name;
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
