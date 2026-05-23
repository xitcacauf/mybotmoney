const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "../../data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

class QueryBuilder {
  constructor(results, getNested) {
    this._results = results;
    this._getNested = getNested;
  }
  sort(sortObj) {
    const [key, dir] = Object.entries(sortObj)[0];
    this._results = [...this._results].sort((a, b) => {
      const av = this._getNested(a, key) || 0;
      const bv = this._getNested(b, key) || 0;
      return dir === -1 ? bv - av : av - bv;
    });
    return this;
  }
  limit(n) {
    this._results = this._results.slice(0, n);
    return this;
  }
  then(resolve, reject) {
    return Promise.resolve(this._results).then(resolve, reject);
  }
}

class JsonDB {
  constructor(name) {
    this.filePath = path.join(DATA_DIR, `${name}.json`);
    this._data = [];
    this._mutex = Promise.resolve();
    this._load();
  }

  _load() {
    try {
      if (fs.existsSync(this.filePath)) {
        this._data = JSON.parse(fs.readFileSync(this.filePath, "utf-8"));
      }
    } catch { this._data = []; }
  }

  _save() {
    fs.writeFileSync(this.filePath, JSON.stringify(this._data, null, 2));
  }

  _enqueue(fn) {
    const result = this._mutex.then(fn);
    this._mutex = result.catch(() => {});
    return result;
  }

  _getNested(obj, dotPath) {
    return dotPath.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
  }

  _setNested(obj, dotPath, value) {
    const keys = dotPath.split(".");
    let o = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      if (o[keys[i]] == null || typeof o[keys[i]] !== "object") o[keys[i]] = {};
      o = o[keys[i]];
    }
    o[keys[keys.length - 1]] = value;
  }

  _matches(doc, query) {
    return Object.entries(query).every(([k, v]) => {
      if (v !== null && typeof v === "object" && !Array.isArray(v)) {
        if ("$ne" in v) return this._getNested(doc, k) !== v.$ne;
        if ("$gt" in v) return (this._getNested(doc, k) || 0) > v.$gt;
        if ("$lt" in v) return (this._getNested(doc, k) || 0) < v.$lt;
        if ("$in" in v) return v.$in.includes(this._getNested(doc, k));
      }
      return this._getNested(doc, k) === v;
    });
  }

  _applyUpdate(doc, update) {
    if (update.$set) {
      for (const [k, v] of Object.entries(update.$set)) {
        this._setNested(doc, k, v);
      }
    }
    if (update.$inc) {
      for (const [k, v] of Object.entries(update.$inc)) {
        const curr = this._getNested(doc, k) || 0;
        this._setNested(doc, k, curr + v);
      }
    }
    if (update.$push) {
      for (const [k, v] of Object.entries(update.$push)) {
        const arr = this._getNested(doc, k) || [];
        arr.push(typeof v === "object" ? { ...v, createdAt: v.createdAt || new Date() } : v);
        this._setNested(doc, k, arr);
      }
    }
    if (update.$addToSet) {
      for (const [k, v] of Object.entries(update.$addToSet)) {
        const arr = this._getNested(doc, k) || [];
        if (!arr.includes(v)) arr.push(v);
        this._setNested(doc, k, arr);
      }
    }
    doc.updatedAt = new Date().toISOString();
  }

  async findOne(query) {
    this._load();
    return this._data.find((d) => this._matches(d, query)) || null;
  }

  find(query = {}) {
    this._load();
    const results = Object.keys(query).length === 0
      ? [...this._data]
      : this._data.filter((d) => this._matches(d, query));
    return new QueryBuilder(results, this._getNested.bind(this));
  }

  async create(data) {
    return this._enqueue(() => {
      this._load();
      const doc = { ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      this._data.push(doc);
      this._save();
      return doc;
    });
  }

  async insertMany(items) {
    return this._enqueue(() => {
      this._load();
      const docs = items.map((i) => ({ ...i, createdAt: new Date().toISOString() }));
      this._data.push(...docs);
      this._save();
      return docs;
    });
  }

  async findOneAndUpdate(query, update, options = {}) {
    return this._enqueue(() => {
      this._load();
      let idx = this._data.findIndex((d) => this._matches(d, query));
      let doc;
      if (idx === -1) {
        if (!options.upsert) return null;
        doc = { ...query, createdAt: new Date().toISOString() };
        this._data.push(doc);
        idx = this._data.length - 1;
      } else {
        doc = this._data[idx];
      }
      this._applyUpdate(doc, update);
      this._data[idx] = doc;
      this._save();
      return options.new !== false ? doc : doc;
    });
  }

  async countDocuments(query = {}) {
    this._load();
    return this.find(query)._results.length;
  }
}

module.exports = JsonDB;
