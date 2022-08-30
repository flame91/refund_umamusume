const Collect = require("./collect/collect"); // 메모리 리스트 수집 모듈
const Scheduler = require("./operation/scheduler");
const Scrap = require("./operation/scrap");

const Driver = require("../common/scraping/driver");
const pt = new Driver();

const models = require("../db/models/index.js");
const ua = require("../common/user-agent.js");
const sleep = require("sleep-promise");
const readline = require("readline");

const db_r = require("../db/models/query_exec_rdb");
const qy_r = require("../db/query/query_rdb");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const fs = require("fs");

//db module
let cnt_listener = 1,
    func = {},
    page_obj = {};

let last = ".page_end";
let list = ".us-post";
let cur_page;

const area = {
    no: ".gall_num",
    title: ".gall_tit>a:not(.reply_numbox)",
    writer: ".gall_writer",
    reg_date: ".gall_date",
    url: ".gall_tit>a",
};

const url_home =
    "https://gall.dcinside.com/mgallery/board/lists/?id=umamusu&sort_type=N&search_head=160";

//-------------------------------------------------------------------------------
//-------------------------------- Main Function --------------------------------
//-------------------------------------------------------------------------------
func.main = () => {
    return new Promise(async (resolve, reject) => {
        // 마지막 페이지 클릭하여 이동
        let page = await func.get_page(await func.get_driver("list"), "list");
        await page
            .goto(url_home, {
                waitUntil: ["networkidle0", "domcontentloaded"],
            })
            .catch((err) => {
                console.log(
                    `[우마무스메 환불 크롤러 ${name}] ${url_home} 이동 중 에러`
                );
                return reject(err);
            });

        await page.click(last);

        while (true) {
            cur_page = await page.url().split("&")[1].split("=")[1];
            if (cur_page > 2) cur_page = 2;
            await func.crawl_list(page);
            await sleep(30000);

            if (cur_page > 1) {
                await page.goto(
                    `https://gall.dcinside.com/mgallery/board/lists/?id=umamusu&page=${
                        cur_page - 1
                    }&search_head=160`,
                    {
                        waitUntil: ["networkidle0", "domcontentloaded"],
                    }
                );
            } else {
                await page.goto(url_home, {
                    waitUntil: ["networkidle0", "domcontentloaded"],
                });
            }
        }
    }); // Promise
}; // func.main()

func.get_driver = (name) => {
    return new Promise(async (resolve, reject) => {
        let driver = await pt.init_driver(name).catch((err) => {
            console.log(`[main] driver_obj[${name}] 생성 실패! ${err}`);
            return reject(err);
        });
        return resolve(driver);
    });
};

func.get_page = (driver, name) => {
    return new Promise(async (resolve, reject) => {
        let page = await driver.newPage().catch((err) => {
            console.log(`[main] page_obj[${name}] 생성 실패! ${err}`);
            return reject(err);
        });
        await page.setViewport({ width: 1920, height: 1080 });
        return resolve(page);
    });
};

func.crawl_list = async (page) => {
    return new Promise(async (resolve, reject) => {
        await page.waitForSelector(list);
        const list_article = await page.$$(list);

        const len = list_article.length;
        for (let i = len - 1; i >= 0; i--) {
            let obj = {};
            for (let j in area) {
                if (j == "url") {
                    obj[j] = await list_article[i].$eval(
                        area[j],
                        (el) => el.href
                    );
                } else {
                    obj[j] = await list_article[i].$eval(
                        area[j],
                        (el) => el.innerText
                    );
                }
                obj[j] = obj[j].replaceAll("'", "&#039;");
            }

            if ((await func.chk_registered(obj["no"])) == false) {
                obj["vendor"] =
                    obj["title"].includes("애플") ^
                    obj["title"].includes("구글")
                        ? obj["title"].includes("애플")
                            ? "apple"
                            : "google"
                        : null;
                let amount = obj["title"].replace(/[^0-9]/g, "");
                obj["amount"] =
                    amount.length < 5 || amount.length > 8 || amount == ""
                        ? 0
                        : amount;
                await func.insert_article(obj);
            } else continue;
        }
        return resolve();
    });
};

func.chk_registered = async (no) => {
    return new Promise(async (resolve, reject) => {
        const result = await db_r.select(
            models.main,
            qy_r.select_registered(no)
        );
        return resolve(result[0]["cnt"] > 0);
    });
};

func.insert_article = async (obj) => {
    return new Promise(async (resolve, reject) => {
        const qInsertArticle = qy_r.insert_article(
            obj["vendor"],
            obj["amount"],
            obj["no"],
            obj["title"],
            obj["writer"],
            obj["reg_date"],
            obj["url"]
        );

        await db_r.insert(models.main, qInsertArticle).catch((err) => {
            console.log(`[insert_scrap()] qInsertArticle 에러\n${err}`);
            return reject(err);
        });

        return resolve();
    });
};

module.exports = func;
