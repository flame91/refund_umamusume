const Sequelize = require("sequelize");
const config = require("./environment");

const main = new Sequelize(
  config.main.database,
  config.main.username,
  config.main.password,
  {
    logging: config.main.logging,
    host: config.main.host,
    dialect: config.main.dialect,
    port: config.main.port,
    timezone: config.main.timezone,
    define: { timestamps: true },
  }
);

const test = new Sequelize(
  config.test.database,
  config.test.username,
  config.test.password,
  {
    logging: config.test.logging,
    host: config.test.host,
    dialect: config.test.dialect,
    port: config.test.port,
    timezone: config.test.timezone,
    define: { timestamps: true },
  }
);

module.exports = {
  main: main,
  test: test,
};
