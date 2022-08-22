const pt = require("puppeteer");

class Driver {
    constructor() {}

    init_driver = async (dirname) => {
        const driver = await pt.launch({
            headless: true,
            args: [
                "--window-size=1920,1080",
                "--disable-notifications",
                "--disable-site-isolation-trials",
                "--disable-extensions",
                "--no-sandbox",
                "--disable-setuid-sandbox",
            ],
            //userDataDir: dirname,
        });

        return driver;
    };
}

module.exports = Driver;
