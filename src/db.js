export async function getConfig(env) {
  const cfg = {
    admin_group: null,
    speed: 0.4,
    default_reaction: "👍",
    language: "fa",
  };
  const r = await env.DB.prepare("SELECT key, value FROM config").all();
  for (const row of r.results || []) {
    try {
      cfg[row.key] = JSON.parse(row.value);
    } catch {
      cfg[row.key] = row.value;
    }
  }
  return cfg;
}

export async function setConfig(env, key, value) {
  await env.DB
    .prepare(
      "INSERT INTO config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    )
    .bind(key, JSON.stringify(value))
    .run();
}

export async function getAdmins(env) {
  const r = await env.DB.prepare("SELECT user_id FROM admins").all();
  return (r.results || []).map((x) => x.user_id);
}

export async function addAdmin(env, uid) {
  await env.DB.prepare("INSERT OR IGNORE INTO admins (user_id) VALUES (?)").bind(uid).run();
}

export async function removeAdmin(env, uid) {
  await env.DB.prepare("DELETE FROM admins WHERE user_id = ?").bind(uid).run();
}

export async function getTargets(env) {
  const r = await env.DB.prepare("SELECT chat_id FROM target_chats").all();
  return (r.results || []).map((x) => x.chat_id);
}

export async function addTarget(env, id) {
  await env.DB.prepare("INSERT OR IGNORE INTO target_chats (chat_id) VALUES (?)").bind(id).run();
}

export async function removeTarget(env, id) {
  await env.DB.prepare("DELETE FROM target_chats WHERE chat_id = ?").bind(id).run();
}

export async function clearTargets(env) {
  await env.DB.prepare("DELETE FROM target_chats").run();
}

export async function getClipboard(env) {
  const r = await env.DB.prepare(
    "SELECT id, type, content, file_id, caption, timestamp FROM clipboard ORDER BY timestamp ASC"
  ).all();
  return r.results || [];
}

export async function addClipboardItem(env, item) {
  await env.DB
    .prepare(
      "INSERT INTO clipboard (id, type, content, file_id, caption, timestamp) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(
      item.id,
      item.type,
      item.content || null,
      item.file_id || null,
      item.caption || null,
      item.timestamp
    )
    .run();
}

export async function removeClipboardItem(env, id) {
  await env.DB.prepare("DELETE FROM clipboard WHERE id = ?").bind(id).run();
}

export async function clearClipboard(env) {
  await env.DB.prepare("DELETE FROM clipboard").run();
}

export async function getReplyLocks(env) {
  const r = await env.DB.prepare("SELECT user_id, group_id FROM reply_locks").all();
  return r.results || [];
}

export async function addReplyLock(env, uid, gid) {
  await env.DB
    .prepare("INSERT OR IGNORE INTO reply_locks (user_id, group_id) VALUES (?, ?)")
    .bind(uid, gid)
    .run();
}

export async function removeReplyLock(env, uid, gid) {
  await env.DB
    .prepare("DELETE FROM reply_locks WHERE user_id = ? AND group_id = ?")
    .bind(uid, gid)
    .run();
}

export async function clearReplyLocks(env) {
  await env.DB.prepare("DELETE FROM reply_locks").run();
}

export async function getCustomMsgs(env) {
  const r = await env.DB.prepare("SELECT key, value FROM custom_msgs").all();
  const out = {};
  for (const row of r.results || []) out[row.key] = row.value;
  return out;
}

export async function setCustomMsg(env, key, value) {
  await env.DB
    .prepare(
      "INSERT INTO custom_msgs (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    )
    .bind(key, value)
    .run();
}

export async function removeCustomMsg(env, key) {
  await env.DB.prepare("DELETE FROM custom_msgs WHERE key = ?").bind(key).run();
}

export async function clearCustomMsgs(env) {
  await env.DB.prepare("DELETE FROM custom_msgs").run();
}

export async function getKnownGroups(env) {
  const r = await env.DB.prepare("SELECT chat_id, title FROM known_groups").all();
  const out = {};
  for (const row of r.results || []) out[row.chat_id] = row.title;
  return out;
}

export async function setKnownGroup(env, chatId, title) {
  await env.DB
    .prepare(
      "INSERT INTO known_groups (chat_id, title) VALUES (?, ?) ON CONFLICT(chat_id) DO UPDATE SET title = excluded.title"
    )
    .bind(String(chatId), title)
    .run();
}

export async function removeKnownGroup(env, chatId) {
  await env.DB.prepare("DELETE FROM known_groups WHERE chat_id = ?").bind(String(chatId)).run();
}

export async function clearKnownGroups(env) {
  await env.DB.prepare("DELETE FROM known_groups").run();
}

export async function getSession(env, uid) {
  const r = await env.DB.prepare("SELECT data FROM sessions WHERE user_id = ?").bind(uid).first();
  if (!r) return null;
  try {
    return JSON.parse(r.data);
  } catch {
    return null;
  }
}

export async function setSession(env, uid, data) {
  await env.DB
    .prepare(
      "INSERT INTO sessions (user_id, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at"
    )
    .bind(uid, JSON.stringify(data), Date.now() / 1000)
    .run();
}

export async function clearSession(env, uid) {
  await env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(uid).run();
}

export async function isCancelled(env, uid) {
  const r = await env.DB.prepare("SELECT cancelled FROM cancel_flags WHERE user_id = ?").bind(uid).first();
  return !!(r && r.cancelled);
}

export async function setCancel(env, uid, value) {
  await env.DB
    .prepare(
      "INSERT INTO cancel_flags (user_id, cancelled) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET cancelled = excluded.cancelled"
    )
    .bind(uid, value ? 1 : 0)
    .run();
}

export async function storePages(env, pages) {
  const key = crypto.randomUUID();
  await env.DB
    .prepare("INSERT INTO pages (key, data, created_at) VALUES (?, ?, ?)")
    .bind(key, JSON.stringify(pages), Date.now() / 1000)
    .run();
  // clean old pages > 1h
  await env.DB
    .prepare("DELETE FROM pages WHERE created_at < ?")
    .bind(Date.now() / 1000 - 3600)
    .run();
  return key;
}

export async function getPages(env, key) {
  const r = await env.DB.prepare("SELECT data FROM pages WHERE key = ?").bind(key).first();
  if (!r) return null;
  try {
    return JSON.parse(r.data);
  } catch {
    return null;
  }
}

export async function getPinnedMsg(env, chatId) {
  const r = await env.DB
    .prepare("SELECT message_id FROM pinned_lang_msgs WHERE chat_id = ?")
    .bind(String(chatId))
    .first();
  return r ? r.message_id : null;
}

export async function setPinnedMsg(env, chatId, messageId) {
  await env.DB
    .prepare(
      "INSERT INTO pinned_lang_msgs (chat_id, message_id) VALUES (?, ?) ON CONFLICT(chat_id) DO UPDATE SET message_id = excluded.message_id"
    )
    .bind(String(chatId), messageId)
    .run();
}

export async function getPointer(env, key) {
  const r = await env.DB.prepare("SELECT value FROM pointers WHERE key = ?").bind(key).first();
  return r ? r.value : 0;
}

export async function setPointer(env, key, value) {
  await env.DB
    .prepare(
      "INSERT INTO pointers (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    )
    .bind(key, value)
    .run();
}

export async function getNextClipboardItem(env, key) {
  const items = await getClipboard(env);
  if (!items.length) return null;
  let ptr = await getPointer(env, key);
  if (ptr >= items.length) ptr = 0;
  const item = items[ptr];
  await setPointer(env, key, ptr + 1);
  return item;
}
