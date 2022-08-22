const Collect = require("./collect/collect"); // 메모리 리스트 수집 모듈
const Scheduler = require("./operation/scheduler");
const Scrap = require("./operation/scrap");

const Driver = require("../common/scraping/driver");
const pt = new Driver();

const models = require("../db/models/index.js");
const ua = require("../common/user-agent.js");
const sleep = require("sleep-promise");
const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const fs = require("fs");

//db module
let cnt_listener = 1,
    func = {},
    page_obj = {};

const area = {
    bible: "#lnb > li:nth-child(1) > ul > li > a",
    last: ".frst_last:not(.this)",
    no: ".bd_lst_wrp>table>tbody>tr>.no",
    title: ".bd_lst_wrp>table>tbody>tr>.title",
    title_a: ".bd_lst_wrp>table>tbody>tr>.title>a",
    content: ".xe_content",
};

const url_home = "https://nocr.net/korbible";

//-------------------------------------------------------------------------------
//-------------------------------- Main Function --------------------------------
//-------------------------------------------------------------------------------
func.main = () => {
    return new Promise(async (resolve, reject) => {
        await func.chk_folder("성경");

        let arr_url_page = await func.crawl_list("list");
        let last_page = await func.create_page(arr_url_page);

        for (let i = 0; i < last_page; i++) {
            func.crawl_page(
                `${arr_url_page[0]}?page=${Number(i) + 1}`,
                page_obj[i],
                i + 1
            );
        }

        return resolve(true);
    }); // Promise
}; // func.main()

func.chk_folder = (dir_name) => {
    return new Promise(async (resolve, reject) => {
        if (!fs.existsSync(dir_name)) {
            fs.mkdirSync(dir_name);
        }
        return resolve(true);
    }); // Promise
};

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

func.crawl_list = async (name) => {
    return new Promise(async (resolve, reject) => {
        let page = await func.get_page(await func.get_driver(name));
        await page.setViewport({ width: 1920, height: 1080 });

        await page
            .goto(url_home, {
                waitUntil: ["networkidle0", "domcontentloaded"],
            })
            .catch((err) => {
                console.log(`[성경 ${name}] ${url_home} 이동 중 에러`);
                return reject(err);
            });

        // 성경 리스트 읽어와서 보여주기
        await page.waitForSelector(area["bible"]);
        let list_bible = await page.$$(area["bible"]);
        for (let i in list_bible) {
            let curTxt = await page.evaluate(
                (el) => el.innerText,
                list_bible[i]
            );
            console.log(`${Number(i) + 1}. ${curTxt}`);
        }

        // 원하는 성경 입력 & URL 리턴
        let url_target;
        rl.question("받고 싶은 성경을 입력해주세요 [숫자]: ", async (num) => {
            rl.close();
            url_target = await page.evaluate((el) => {
                return el.href;
            }, list_bible[num - 1]);
            return resolve([url_target, page]);
        });
    });
};

func.create_page = ([url_target, page]) => {
    return new Promise(async (resolve, reject) => {
        await page
            .goto(url_target, {
                waitUntil: ["networkidle0", "domcontentloaded"],
            })
            .catch((err) => {
                console.log(`[func.crawl_page() ${url_target} 이동 중 에러`);
                return reject(err);
            });

        await page.waitForSelector(area["last"]);
        let last_page = await page.evaluate(
            (el) => el.innerText,
            await page.$(area["last"])
        );

        cnt_listener += Number(last_page);
        process.setMaxListeners(cnt_listener);
        for (let i = 0; i < last_page; i++) {
            page_obj[i] = await func.get_page(await func.get_driver(i), i);
        }
        return resolve(last_page);
    });
};

func.crawl_page = (url_page, page, num) => {
    return new Promise(async (resolve, reject) => {
        let arr_no = [],
            arr_title = [],
            arr_url = [];

        await page
            .goto(url_page, {
                waitUntil: ["networkidle0", "domcontentloaded"],
            })
            .catch((err) => {
                console.log(`[func.crawl_page() ${url_page} 이동 중 에러`);
                return reject(err);
            });

        let elems = await page.$$(area["no"]);
        for (let r of elems)
            arr_no.push(await (await r.getProperty("innerText")).jsonValue());

        elems = await page.$$(area["title"]);
        for (let r of elems)
            arr_title.push(
                await (await r.getProperty("innerText")).jsonValue()
            );

        elems = await page.$$(area["title_a"]);
        for (let r of elems)
            arr_url.push(await (await r.getProperty("href")).jsonValue());

        for (let i in arr_url) {
            await page
                .goto(arr_url[i], {
                    waitUntil: ["networkidle0", "domcontentloaded"],
                })
                .catch((err) => {
                    console.log(
                        `[func.crawl_page() ${arr_url[i]} 이동 중 에러`
                    );
                    return reject(err);
                });

            let content = await (
                await (await page.$(area["content"])).getProperty("innerText")
            ).jsonValue();

            console.log(`[${num}] ${arr_title[i]}.txt 쓰는 중`);
            fs.writeFileSync(`./성경/${arr_title[i]}.txt`, content, (err) => {
                if (err) {
                    console.log(`${arr_title[i]} 파일 쓰기중 실패`);
                    return reject(err);
                }
                //file written successfully
            });
        }
        return resolve(true);
    });
};

module.exports = func;
