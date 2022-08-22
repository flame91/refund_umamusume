const Sequelize = require("sequelize");
var execute = {};

execute.select = (conf, query) => {
    return new Promise(async (resolve, reject) => {
        await conf
            .query(query, { type: Sequelize.QueryTypes.SELECT })
            .then((result) => {
                return resolve(result);
            })
            .catch((err) => {
                return reject(err);
            });
    });
};

execute.update = (conf, query) => {
    return new Promise(async (resolve, reject) => {
        await conf
            .query(query, { type: Sequelize.QueryTypes.UPDATE })
            .then((result) => {
                return resolve(result);
            })
            .catch((err) => {
                return reject(err);
            });
    });
};

execute.insert = (conf, query) => {
    return new Promise(async (resolve, reject) => {
        await conf
            .query(query, { type: Sequelize.QueryTypes.INSERT })
            .then((result) => {
                return resolve(result);
            })
            .catch((err) => {
                return reject(err);
            });
    });
};

execute.delete = (conf, query) => {
    return new Promise(async (resolve, reject) => {
        await conf
            .query(query, { type: Sequelize.QueryTypes.DELETE })
            .then((result) => {
                return resolve(result);
            })
            .catch((err) => {
                return reject(err);
            });
    });
};

execute.query = (conf, query) => {
    return new Promise(async (resolve, reject) => {
        let result = await conf.query(query).catch((err) => {
            return reject(err);
        });
        return resolve(result);
    });
};

module.exports = execute;
