const Database = require("better-sqlite3");
//const db = new Database(":memory:", { verbose: console.log });
const db = new Database(":memory:", {});

let func = {};

func.select_one = (query) => {
    return new Promise(async (resolve) => {
        resolve(db.prepare(query).all()[0]);
    });
};

func.select_all = (query, callback) => {
    return new Promise(async (resolve) => {
        resolve(db.prepare(query).all());
    });
};

func.query = (query) => {
    return new Promise(async (resolve) => {
        resolve(db.exec(query));
    });
};

module.exports = func;
