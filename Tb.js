const fs = require('fs');
const path = require('path');

// gds -- p1 and p2 only need 6 star toons.
class Tb {
    constructor(type){
        this.type = type;
        this.title = '';
        this.tb_req_files = {};
        this.tb_req = {};
        this.tb_guild = {};
        // let tb_guild = {
        //     // The array is sorted base on gp by each character.
        //     'Darth Revan': [
        //         ["seeker", 12345, 6],
        //         ["landcrawler", 12346, 6],
        //     ],
        // };
        this.tb_players = {};
        // "LandCrawler": {
        //     p1: ["toon1", "toon2"],
        //     p2: ["toon3", "toon4"],
        //     p3: ["toon5", "toon6"],
        //     p4: ["toon7", "toon8"],
        // }
        this.phases = [];
        this.init();
    }

    // getType(){
    //     return this.type;
    // }

    // setType(type){
    //     // if the type is already set, then do nothing
    //     if(this.type === type) return;

    //     // otherwise clean slate, then set type, and init
    //     this.reset();
    //     this.type = type; // gds, gls, hls
    //     init();
    // }

    init(){
        // console.log(`type: ${this.type}`);
        switch(this.type){
            case 'gds':
                this.title = "Geo TB Darkside";
                this.phases = ['p1','p2','p3','p4'];
                this.tb_req_files = {
                    p1: `${__dirname}/data/gds_p1_platoon.req`,
                    p2: `${__dirname}/data/gds_p2_platoon.req`,
                    p3: `${__dirname}/data/gds_p3_platoon.req`,
                    p4: `${__dirname}/data/gds_p4_platoon.req`,
                };
                this.tb_req = {
                    p1: {units: this.getReqFromFile("p1"), rarity: 6},
                    p2: {units: this.getReqFromFile("p2"), rarity: 6},
                    p3: {units: this.getReqFromFile("p3"), rarity: 7},
                    p4: {units: this.getReqFromFile("p4"), rarity: 7},
                };
                break;
            case 'hds':
                this.title = "Hoth TB Darkside";
                this.phases = ['p1','p2','p3','p4','p5','p6'];
                this.tb_req_files = {
                    p1: `${__dirname}/data/hds_p1_platoon.req`,
                    p2: `${__dirname}/data/hds_p2_platoon.req`,
                    p3: `${__dirname}/data/hds_p3_platoon.req`,
                    p4: `${__dirname}/data/hds_p4_platoon.req`,
                    p5: `${__dirname}/data/hds_p5_platoon.req`,
                    p6: `${__dirname}/data/hds_p6_platoon.req`,
                };

                this.tb_req = {
                    p1: {units: this.getReqFromFile("p1"), rarity: 2},
                    p2: {units: this.getReqFromFile("p2"), rarity: 3},
                    p3: {units: this.getReqFromFile("p3"), rarity: 4},
                    p4: {units: this.getReqFromFile("p4"), rarity: 5},
                    p5: {units: this.getReqFromFile("p5"), rarity: 6},
                    p6: {units: this.getReqFromFile("p6"), rarity: 7},
                };
                break;
            case 'hls':
                this.title = "Hoth TB Lightside";
                this.phases = ['p1','p2','p3','p4','p5','p6'];
                this.tb_req_files = {
                    p1: `${__dirname}/data/hls_p1_platoon.req`,
                    p2: `${__dirname}/data/hls_p2_platoon.req`,
                    p3: `${__dirname}/data/hls_p3_platoon.req`,
                    p4: `${__dirname}/data/hls_p4_platoon.req`,
                    p5: `${__dirname}/data/hls_p5_platoon.req`,
                    p6: `${__dirname}/data/hls_p6_platoon.req`,
                };

                this.tb_req = {
                    p1: {units: this.getReqFromFile("p1"), rarity: 2},
                    p2: {units: this.getReqFromFile("p2"), rarity: 3},
                    p3: {units: this.getReqFromFile("p3"), rarity: 4},
                    p4: {units: this.getReqFromFile("p4"), rarity: 5},
                    p5: {units: this.getReqFromFile("p5"), rarity: 6},
                    p6: {units: this.getReqFromFile("p6"), rarity: 7},
                };
                break;
            case 'gls':
                this.title = "Geo TB Lighside";
                this.phases = ['p1','p2','p3','p4'];
                this.tb_req_files = {
                    p1: `${__dirname}/data/gls_p1_platoon.req`,
                    p2: `${__dirname}/data/gls_p2_platoon.req`,
                    p3: `${__dirname}/data/gls_p3_platoon.req`,
                    p4: `${__dirname}/data/gls_p4_platoon.req`,
                };

                this.tb_req = {
                    p1: {units: this.getReqFromFile("p1"), rarity: 7},
                    p2: {units: this.getReqFromFile("p2"), rarity: 7},
                    p3: {units: this.getReqFromFile("p3"), rarity: 7},
                    p4: {units: this.getReqFromFile("p4"), rarity: 7},
                };
                break;
            default:
                console.log("Unrecognized type");
                return false;
        }
    }

    reset(){
        this.tb_guild = {};
        this.tb_req_files = {};
        this.tb_req = {};
        this.tb_players = {};
        this.init();
    }

    // // To be replaced by addUnitGuild
    // addUnitGdsGuild(player_name, unit_name, unit_gp, unit_rarity){

    //     if(this.tb_gds_guild[unit_name]) this.tb_gds_guild[unit_name].push([player_name, unit_gp, unit_rarity]);
    //     else {
    //         this.tb_gds_guild[unit_name] = [[player_name, unit_gp, unit_rarity]];
    //     }
    // }

    // // To be replaced by addUnitGuild
    // sortTbGdsGuild(){
    //     for(let toon in this.tb_gds_guild){
    //         this.tb_gds_guild[toon].sort((a,b) => { return a[1] - b[1]});
    //     }
    // }


    addUnitGuild(player_name, unit_name, unit_gp, unit_rarity){

        if(this.tb_guild[unit_name]) this.tb_guild[unit_name].push([player_name, unit_gp, unit_rarity]);
        else {
            this.tb_guild[unit_name] = [[player_name, unit_gp, unit_rarity]];
        }
    }

    sortTbGuild(){
        for(let toon in this.tb_guild){
            this.tb_guild[toon].sort((a,b) => { return a[1] - b[1]});
        }
    }

    // simple method to check if a toon is needed for platoon using toon's name
    needToon(name, rarity){
        let res = false;
        // this.printTbMeta();
        // console.log(`needToon input: name is ${name}, rarity is ${rarity}`);
        // if(name == 'CC-2224 Cody') console.log(`needToon input: name is ${name}, rarity is ${rarity}`);
        // If the rarity is below p1 requirement, no point checking more
        if(rarity < this.tb_req.p1.rarity){
            // console.log(`${name} at ${rarity} is less than required ${this.tb_gds_req.p1.rarity}`);
            return res;
        }

        for(let p in this.tb_req){
            if(this.tb_req[p].units[name]) res = true;
        }
        // if(name == 'CC-2224 Cody') console.log(`name: ${name}, needToon: ${res}`);
        return  res;
    }

    getReqFromFile(phase){
        let raw_arr = this.getFileAsArray(this.tb_req_files[phase]), res = {};
        // this.printTbMeta();
        // console.log(`phase: ${phase}`);
        raw_arr.forEach( line => {
            let [toon, count] = line.trim().split(":");
            // console.log(`toon: ${toon}, count: ${count}`);
            res[toon.trim()] = count.trim() * 1;
        });
        return res;
    }

    getFileAsArray(file){
        let data = fs.readFileSync(file).toString().trim();
        return data.split("\n");
    }

    printTbMeta(){
        console.log(`Type: ${this.type}`);
    }
}

module.exports = Tb;
