const JsonDB = require("../utils/JsonDB");

const db = new JsonDB("tickets");

const Ticket = {
  async findOne(query) { return db.findOne(query); },
  find(query) { return db.find(query); },
  async create(data) { return db.create(data); },
  async findOneAndUpdate(query, update, options = {}) {
    return db.findOneAndUpdate(query, update, options);
  },
};

module.exports = Ticket;
