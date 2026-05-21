const JsonDB = require("../utils/JsonDB");

const db = new JsonDB("shop");

const Shop = {
  async findOne(query) { return db.findOne(query); },
  find(query) { return db.find(query); },
  async create(data) { return db.create(data); },
  async insertMany(items) { return db.insertMany(items); },
  async findOneAndUpdate(query, update, options = {}) {
    return db.findOneAndUpdate(query, update, options);
  },
};

module.exports = Shop;
