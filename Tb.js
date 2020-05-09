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
            p1: {units: this.getReqFromFile("p1"), star: 6},
            p2: {units: this.getReqFromFile("p2"), star: 6},
            p3: {units: this.getReqFromFile("p3"), star: 7},
            p4: {units: this.getReqFromFile("p4"), star: 7},
        };
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
