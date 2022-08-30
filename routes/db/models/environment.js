const LOG = false; // true or false

const environments = {
    main: {
        username: "fallingup",
        password: "dlfdmscnlal!#%",
        database: "fallingup",
        dialect: "mysql",
        host: "175.113.135.86",
        port: "3306",
        timezone: "+09:00",
        logging: LOG,
    },
};

module.exports = {
    main: environments[process.env.NODE_ENV || "main"],
};
