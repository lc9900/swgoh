const fs = require('fs');
const path = require('path');

// gds -- p1 and p2 only need 6 star toons.
class Tb {
    constructor(){
        this.tb_gds_req_file = {
            p1: `${__dirname}/data/gds_p1_platoon.req`,
            p2: `${__dirname}/data/gds_p2_platoon.req`,
            p3: `${__dirname}/data/gds_p3_platoon.req`,
            p4: `${__dirname}/data/gds_p4_platoon.req`,
        };

        this.tb_gds_req = {
            p1: {units: this.getReqFromFile("p1"), rarity: 6},
            p2: {units: this.getReqFromFile("p2"), rarity: 6},
            p3: {units: this.getReqFromFile("p3"), rarity: 7},
            p4: {units: this.getReqFromFile("p4"), rarity: 7},
        };

        this.tb_gds_guild = {};
        // let tb_gds_guild = {
        //     // The array is sorted base on gp by each character.
        //     'Darth Revan': [
        //         ["seeker", 12345, 6],
        //         ["landcrawler", 12346, 6],
        //     ],
        // };
    }

    reset(){
        this.tb_gds_guild = {};
    }

    addUnitGdsGuild(player_name, unit_name, unit_gp, unit_rarity){

        if(this.tb_gds_guild[unit_name]) this.tb_gds_guild[unit_name].push([player_name, unit_gp, unit_rarity]);
        else {
            this.tb_gds_guild[unit_name] = [[player_name, unit_gp, unit_rarity]];
        }
    }

    sortTbGdsGuild(){
        for(let toon in this.tb_gds_guild){
            this.tb_gds_guild[toon].sort((a,b) => { return a[1] - b[1]});
        }
    }

    // simple method to check if a toon is needed for platoon using toon's name
    needToon(name, rarity){
        let res = false;

        // If the rarity is below p1 requirement, no point checking more
        if(rarity < this.tb_gds_req.p1.rarity){
            // console.log(`${name} at ${rarity} is less than required ${this.tb_gds_req.p1.rarity}`);
            return res;
        }

        for(let p in this.tb_gds_req){
            if(this.tb_gds_req[p].units[name]) res = true;
        }

        return  res;
    }

    getReqFromFile(phase){
        let raw_arr = this.getFileAsArray(this.tb_gds_req_file[phase]), res = {};
        raw_arr.forEach( line => {
            let [toon, count] = line.trim().split(":");
            res[toon.trim()] = count.trim() * 1;
        });
        return res;
    }

    getFileAsArray(file){
        let data = fs.readFileSync(file).toString().trim();
        return data.split("\n");
    }
}

module.exports = Tb;
