const db_m = require("../../db/models/sqlite");
const qy_m = require("../../db/query/query_mem");
const db_r = require("../../db/models/query_exec_rdb");
const qy_r = require("../../db/query/query_rdb");
const models = require("../../db/models/index");
const webp = require("webp-converter");
const fs = require("fs");
const https = require("https");
const sleep = require("sleep-promise");

class Scrap {
    constructor(seq_no, community_name, board_name_en) {
        this.seq_no = seq_no;
        this.community_name = community_name;
        this.board_name_en = board_name_en;
    }

    main = async (area, url, page) => {
        return new Promise(async (resolve, reject) => {
            this.page = page;
            let title_area = area["title_area"];
            let content_area = area["content_area"];
            let reg_date_area = area["reg_date_area"];
            let reg_date_format = area["reg_date_format"];
            let nickname_area = area["nickname_area"];
            let id_query = area["id_query"];
            let img_url_conversion = area["img_url_conversion"];
            let img_path = "img";

            try {
                await this.page.goto(url, {
                    waitUntil: ["networkidle0", "domcontentloaded"],
                });
            } catch (err) {
                console.log(
                    `[${this.community_name} - ${this.board_name_en}] ${url} 이동 중 에러\n${err}`
                );
                return resolve(url);
            }

            await this.chk_alert()
                .then((result) => {
                    if (result) return resolve(false);
                })
                .catch(() => {
                    console.log(
                        `${this.community_name} - ${this.board_name_en}] ${url} 삭제된 글로 추정\n{err}`
                    );
                    return resolve(url);
                });

            //await this.page.waitForSelector(content_area);
            try {
                await this.autoScroll(this.page);
            } catch (err) {
                console.log(
                    `[${this.community_name} - ${this.board_name_en}] ${url} autoScroll 중 에러\n${err}`
                );
                return resolve(url);
            }

            let elem, elem_cont, title;
            // 제목
            if (title_area.startsWith("/"))
                elem = (await this.page.$x(title_area))[0];
            else elem = await this.page.$(title_area);
            try {
                title = await this.page.evaluate((el) => {
                    if (el.innerText) return el.innerText;
                    else if (el.textContent) return el.textContent;
                }, elem);
            } catch (err) {
                console.log(
                    `[${this.community_name} - ${this.board_name_en}] ${url} 제목 스크래핑 에러\n${err}`
                );
                return resolve(url);
            }
            //console.log(title);
            if (title && title.length > 0) {
                title = title
                    .replaceAll("<", "&lt;")
                    .replaceAll(">", "&gt;")
                    .replaceAll('"', "&quot;")
                    .replaceAll("'", "&#039;");
            }

            // 내용
            elem_cont = await this.page.$(content_area);
            let content = await this.page
                .evaluate((el) => el.outerHTML, elem_cont)
                .catch((err) => {
                    console.log(
                        `[${this.community_name} - ${this.board_name_en}] ${url} 내용 스크래핑 에러\n${err}`
                    );
                    return resolve(url);
                });
            if (content) {
                content = content
                    .replaceAll("<", "&lt;")
                    .replaceAll(">", "&gt;")
                    .replaceAll('"', "&quot;")
                    .replaceAll("'", "&#039;");
            }

            // 등록일
            let reg_date;
            if (reg_date_area) {
                if (reg_date_area.startsWith("/"))
                    elem = (await this.page.$x(reg_date_area))[0];
                else elem = await this.page.$(reg_date_area);

                reg_date = await this.page
                    .evaluate((el) => {
                        if (el.innerText) return el.innerText;
                        else if (el.textContent) return el.textContent;
                    }, elem)
                    .catch((err) => {
                        console.log(
                            `[${this.community_name} - ${this.board_name_en}] ${url} 등록일 스크래핑 에러\n${err}`
                        );
                        return resolve(url);
                    });
                if (reg_date) {
                    reg_date = await this.format_reg_date(
                        reg_date,
                        reg_date_format
                    );
                }
            } else {
                reg_date = "";
            }

            // 닉네임
            if (nickname_area.startsWith("/"))
                elem = (await this.page.$x(nickname_area))[0];
            else elem = await this.page.$(nickname_area);

            let nickname = await this.page
                .evaluate((el) => {
                    if (el.innerText) return el.innerText;
                    else if (el.textContent) return el.textContent;
                    else if (el.getAttribute("title"))
                        return el.getAttribute("title");
                }, elem)
                .catch((err) => {
                    console.log(
                        `[${this.community_name} - ${this.board_name_en}] ${url} 닉네임 스크래핑 에러\n${err}`
                    );
                    return resolve(url);
                });
            if (nickname) nickname = nickname.replaceAll("\n", "");

            // 글ID
            elem = await this.page.$(id_query);
            let id = await this.page
                .evaluate((el) => {
                    if (el.getAttribute("value"))
                        return el.getAttribute("value");
                }, elem)
                .catch((err) => {
                    console.log(
                        `[${this.community_name} - ${this.board_name_en}] ${url} ID 스크래핑 에러\n${err}`
                    );
                    return resolve(url);
                });

            // 이미지
            elem = await elem_cont.$$("img[src]").catch((err) => {
                console.log(
                    `[${this.community_name} - ${this.board_name_en}] ${url} 이미지 스크래핑 에러\n${err}`
                );
                return resolve(url);
            });

            let imgs = [];
            for (let r of elem) {
                console.log(r);
                let img_url = await (await r.getProperty("src")).jsonValue();
                if (img_url_conversion && img_url_conversion.length > 0)
                    img_url = img_url.replace(
                        url.split("?")[0],
                        img_url_conversion
                    );
                imgs.push(url);
            }
            console.log(imgs);

            let img_folder_path = `${img_path}/${this.community_name}`;
            if (!fs.existsSync(img_path)) {
                fs.mkdirSync(img_path);
            }
            if (!fs.existsSync(`${img_folder_path}`)) {
                fs.mkdirSync(`${img_folder_path}`);
            }

            let arr_img_file_name = [];
            let cnt = 0;
            for (let img_url of imgs) {
                cnt += 1;
                console.log(img_url);
                await page.goto(img_url, {
                    waitUntil: ["networkidle0", "domcontentloaded"],
                });
                let img_file_name = `${this.board_name_en}_${id}_${cnt}`;
                arr_img_file_name.push(img_file_name);

                await this.img_download(
                    img_url,
                    img_folder_path,
                    img_file_name
                );
            }

            let thumbnail_src;
            if (imgs && imgs.length > 0) thumbnail_src = imgs[0];
            else thumbnail_src = "";

            //console.log(                "\x1b[32m%s\x1b[0m",                `[${this.community_name} - ${this.board_name_en}] ${title} / ${nickname} / ${reg_date}`            );

            // 크롤링 시간
            let crawled_time = (
                await db_r.select(models.test, qy_r.time_now())
            )[0]["time_now"];

            // INSERT 성공 시 seq_no 값 반환
            let seq_no = await this.insert_scrap(
                this.community_name,
                this.board_name_en,
                url,
                title,
                content,
                thumbnail_src,
                reg_date,
                nickname,
                crawled_time
            ).catch((err) => {
                console.log(
                    `[Scrap] ${this.community_name}-${this.board_name_en} ${url} insert_scrap() 실행 중 에러\n${err}`
                );
                return resolve(url);
            });

            await this.del_url(url);

            for (let i in imgs) {
                await this.insert_imgs(
                    seq_no,
                    Number(i) + Number(1),
                    imgs[i]
                ).catch((err) => {
                    console.log(
                        `[Scrap] ${this.community_name}-${this.board_name_en} ${url} insert_imgs() 실행 중 에러\n${err}`
                    );
                    return resolve(false);
                });
            }

            return resolve("DONE");
        });
    }; // main

    img_download = async (img_url, img_folder_path, img_file_name) => {
        return new Promise(async (resolve, reject) => {
            const Stream = require("stream").Transform;
            https
                .request(img_url, function (response) {
                    var data = new Stream();

                    response.on("data", function (chunk) {
                        data.push(chunk);
                    });

                    response.on("end", function () {
                        fs.writeFileSync(
                            `${img_folder_path}/${img_file_name}`,
                            data.read()
                        );
                        const result = webp.cwebp(
                            `${img_folder_path}/${img_file_name}`,
                            `${img_folder_path}/${img_file_name}.webp`,
                            "-jpeg_like"
                        );
                        return resolve(true);
                    });
                })
                .end();
        });
    };

    format_reg_date = async (date, format) => {
        let d = {},
            year,
            month,
            day,
            hour,
            minute,
            time = "";
        d["year"] = format.indexOf("YYYY");
        d["month"] = format.indexOf("MM");
        d["day"] = format.indexOf("DD");
        d["hour"] = format.indexOf("hh");
        d["minute"] = format.indexOf("mm");

        if (d["year"] >= 0) {
            year = date.substr(d["year"], 4);
            time += `${year}`;
        }
        if (d["month"] >= 0) {
            month = date.substr(d["month"], 2);
            time += `-${month}`;
        }
        if (d["day"] >= 0) {
            day = date.substr(d["day"], 2);
            time += `-${day}`;
        }
        if (d["hour"] >= 0) {
            hour = date.substr(d["hour"], 2);
            time += ` ${hour}`;
        }
        if (d["minute"] >= 0) {
            minute = date.substr(d["minute"], 2);
            time += `:${minute}`;
        }

        return time;
    };

    insert_scrap = async (
        community_name,
        board_name_en,
        id,
        url,
        title,
        content,
        thumbnail_src,
        reg_date,
        nickname,
        crawled_time
    ) => {
        return new Promise(async (resolve, reject) => {
            const qInsertArticle = qy_r.insert_article(
                community_name,
                board_name_en,
                id,
                url,
                title,
                content,
                thumbnail_src,
                reg_date,
                nickname,
                crawled_time
            );

            let result = await db_r
                .insert(models.test, qInsertArticle)
                .catch((err) => {
                    console.log(
                        `[Scheduler.insert_scrap()] ${this.community_name}-${this.board_name_en} ${url} qInsertArticle 에러\n${err}`
                    );
                    return reject(err);
                });

            return resolve(result[0]);
        });
    };

    insert_imgs = async (article_no, order_no, src) => {
        return new Promise(async (resolve, reject) => {
            const qInsertImgs = qy_r.insert_imgs(article_no, order_no, src);

            await db_r.insert(models.test, qInsertImgs).catch((err) => {
                console.log(
                    `[Scheduler.insert_imgs()] ${this.community_name}-${this.board_name_en} ${article_no} qInsertImgs Error\n${err}`
                );
                return reject(err);
            });

            return resolve();
        });
    };

    chk_alert = async () => {
        try {
            this.page.once("dialog", async (dialog) => {
                await dialog.accept();
                return true;
            });
        } catch {
            return false;
        }
    };

    autoScroll = async () => {
        await this.page.evaluate(async () => {
            await new Promise((resolve) => {
                var totalHeight = 0;
                var distance = 150;
                var timer = setInterval(() => {
                    var scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;

                    if (totalHeight >= scrollHeight - window.innerHeight) {
                        clearInterval(timer);
                        return resolve();
                    }
                }, 100);
            });
        });
    };

    del_url = async (url) => {
        return new Promise(async (resolve, reject) => {
            const qDeleteUrl = qy_m.delete_url(url);
            await db_m.query(qDeleteUrl).catch((err) => {
                console.log(
                    `[Scheduler.del_url()] ${this.community_name}-${this.board_name_en} ${url} qDeleteUrl 에러\n${err}`
                );
                return reject(err);
            });
            return resolve();
        });
    };
}

module.exports = Scrap;
