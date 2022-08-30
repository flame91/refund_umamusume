const LOG = false; // true or false

const environments = {
    main: {
        username: "",
        password: "",
        database: "",
        dialect: "mysql",
        host: "",
        port: "3306",
        timezone: "+09:00",
        logging: LOG,
    },
};

module.exports = {
    main: environments[process.env.NODE_ENV || "main"],
};
