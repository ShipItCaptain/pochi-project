const TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

const sessions = new Map();

const set = (waId, step, data, onTimeout) => {
  const existing = sessions.get(waId);
  if (existing?.timer) clearTimeout(existing.timer);

  const timer = setTimeout(() => {
    sessions.delete(waId);
    if (onTimeout) onTimeout();
  }, TIMEOUT_MS);

  sessions.set(waId, { step, data, timer, onTimeout });
};

const update = (waId, step, data) => {
  const existing = sessions.get(waId);
  if (!existing) return;
  clearTimeout(existing.timer);

  const timer = setTimeout(() => {
    sessions.delete(waId);
    if (existing.onTimeout) existing.onTimeout();
  }, TIMEOUT_MS);

  sessions.set(waId, { ...existing, step, data, timer });
};

const get = (waId) => sessions.get(waId);

const clear = (waId) => {
  const s = sessions.get(waId);
  if (s?.timer) clearTimeout(s.timer);
  sessions.delete(waId);
};

module.exports = { set, update, get, clear };
