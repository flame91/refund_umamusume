const LOG = false; // true or false

const environments = {
    main: {
        username: "crawl",
        password: "Zmfhffld13!",
        database: "araso_main",
        dialect: "mysql",
        host: "192.168.1.14",
        port: "3306",
        timezone: "+09:00",
        logging: LOG,
    },
    test: {
        username: "crawl",
        password: "Zmfhffld13!",
        database: "araso_test",
        dialect: "mysql",
        host: "192.168.1.14",
        port: "3306",
        timezone: "+09:00",
        logging: LOG,
    },
};

module.exports = {
    main: environments[process.env.NODE_ENV || "main"],
    test: environments[process.env.NODE_ENV || "test"],
};
