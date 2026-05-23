const locks = new Map();

async function withLock(key, fn) {
  const current = locks.get(key) ?? Promise.resolve();
  let unlock;
  const next = new Promise((res) => { unlock = res; });
  locks.set(key, current.then(() => next));
  await current;
  try {
    return await fn();
  } finally {
    unlock();
    if (locks.get(key) === next) locks.delete(key);
  }
}

module.exports = { withLock };
