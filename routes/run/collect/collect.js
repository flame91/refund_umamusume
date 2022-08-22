const db_m = require("../../db/models/sqlite");
const qy_m = require("../../db/query/query_mem");
const db_r = require("../../db/models/query_exec_rdb");
const qy_r = require("../../db/query/query_rdb");
const models = require("../../db/models/index");

class Collect {
    constructor(seq_no) {
        this.seq_no = seq_no;
        this.create_mem_url(); // 수집 대상 URL용 테이블 생성
    }

    create_mem_url = async () => {
        return new Promise(async (resolve, reject) => {
            const qCreateUrlList = qy_m.create_url_list(this.seq_no);
            await db_m
                .query(qCreateUrlList)
                .then((result) => {
                    //console.log(`[Collect] ${this.seq_no} MEM_URL_LIST 생성됨`);
                    resolve(result);
                })
                .catch((err) => {
                    console.log(
                        `[Collect.create_mem_url()] ${this.seq_no} qCreateUrlList Error : ${err}`
                    );
                    reject(err);
                });
        });
    };
}

module.exports = Collect;
