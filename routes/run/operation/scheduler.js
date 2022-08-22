const db_m = require("../../db/models/sqlite");
const qy_m = require("../../db/query/query_mem");
const db_r = require("../../db/models/query_exec_rdb");
const qy_r = require("../../db/query/query_rdb");
const models = require("../../db/models/index");
const sleep = require("sleep-promise");

// 게시판 URL로 이동 ->
// list_area, list_type, title_area, title_type 가지고
// 게시물 리스트 크롤링
// URL로 TB_ARTICLE_LIST에 이미 있는지 체크 후
// MEM_CRAWL_URL_LIST에 INSERT

class Scheduler {
    constructor(seq_no, community_name, board_name) {
        this.seq_no = seq_no;
        this.community_name = community_name;
        this.board_name = board_name;
    }

    main = (area, url, page) => {
        return new Promise(async (resolve, reject) => {
            this.page = page;
            let target_count = 99;
            let list_area = area["list_area"];

            let base_url,
                url_list = [];
            let cnt = 0,
                elems;

            //console.log("\x1b[33m%s\x1b[0m", `[Scheduler] ${url}로 이동`);

            await this.page
                .goto(url, {
                    waitUntil: ["networkidle0", "domcontentloaded"],
                })
                .catch((err) => {
                    console.log(
                        `[${this.community_name} - ${this.board_name}] ${url} 이동 중 에러`
                    );
                    return reject(["ERR", 1 * 60 * 1000]);
                });
            await sleep(1000);

            let spl_url = await this.page.url().split("/");
            base_url = spl_url[0] + "//" + spl_url[2];

            if (list_area.startsWith("/")) {
                await this.page.waitForXPath(list_area).catch(() => {});
                elems = await this.page.$x(list_area);
            } else {
                await this.page.waitForSelector(list_area).catch(() => {});
                elems = await this.page.$$(list_area);
            }

            for (let r of elems) {
                let temp = await (await r.getProperty("href")).jsonValue();
                url_list.push(temp);
            }

            let final_url;
            for (let i in url_list) {
                if (url_list[i].startsWith("http")) {
                    final_url = url_list[i];
                } else {
                    final_url = base_url + url_list[i];
                }

                if ((await this.chk_duplicated_url(final_url)) == "DUPLICATED")
                    continue;

                await this.put_url(final_url).catch((err) => {
                    console.log(
                        `[Scheduler] ${this.community_name}-${this.board_name} put_url() 실행 중 에러 : ${err}`
                    );
                    return reject(err);
                });
                cnt += 1;
                if (cnt >= target_count) break;
            }
            console.log(
                "\x1b[33m%s\x1b[0m",
                `[${this.community_name} - ${this.board_name}] 스케줄 ${cnt}건 추가`
            );
            return resolve(cnt);
        });
    };

    chk_duplicated_url = async (url) => {
        return new Promise(async (resolve, reject) => {
            const qSelectUrl = qy_r.select_url(url);
            await db_r
                .select(models.test, qSelectUrl)
                .then((result) => {
                    if (result[0]["cnt"] == 0) return resolve("NOT DUPLICATED");
                    else if (result[0]["cnt"] >= 1)
                        return resolve("DUPLICATED");
                })
                .catch((err) => {
                    console.log(
                        `[Scheduler.chk_duplicated_url()] ${this.community_name}-${this.board_name} qSelectUrl Error : ${err}`
                    );
                    return reject(err);
                });
        });
    };

    // 메모리DB에 스크래핑 대상 URL 1건씩 쌓기
    put_url = async (url) => {
        return new Promise(async (resolve, reject) => {
            const qInsertUrlIdList = qy_m.insert_url_id_list(this.seq_no, url);

            await db_m
                .query(qInsertUrlIdList)
                .then(() => {
                    return resolve(true);
                })
                .catch((err) => {
                    console.log(
                        `[Scheduler.put_url()] ${this.community_name}-${this.board_name} qInsertUrlIdList Error : ${err}`
                    );
                    return reject(err);
                });
        });
    };
}

module.exports = Scheduler;
