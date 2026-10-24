import * as db from "./db.js";
import { getMsg, langKeyboard } from "./i18n.js";
import { handleCommand } from "./handlers.js";
import { handleSessionMessage, handleGroupTracking } from "./flows.js";
import { handleDbPanelCallback } from "./db_panel.js";
import { handlePaginationCallback } from "./pagination.js";

export async function routeUpdate(env, tg, update) {
  try {
    if (update.message) {
      await routeMessage(env, tg, update.message);
    } else if (update.callback_query) {
      await routeCallback(env, tg, update.callback_query);
    }
  } catch (e) {
    console.error("routeUpdate error:", e);
  }
}

async function routeMessage(env, tg, msg) {
  const uid = msg.from_user?.id;
  if (!uid) return;

  // بررسی سشن کاربر (معادل next_step_handler)
  const session = await db.getSession(env, uid);
  if (session) {
    const handled = await handleSessionMessage(env, tg, msg, session);
    if (handled) return;
  }

  // دستورات
  if (msg.text && msg.text.startsWith("/")) {
    const handled = await handleCommand(env, tg, msg);
    if (handled) return;
  }

  // ردیابی گروه
  if (msg.chat.type === "group" || msg.chat.type === "supergroup") {
    await handleGroupTracking(env, tg, msg);
  }
}

async function routeCallback(env, tg, call) {
  const data = call.data || "";
  const uid = call.from_user?.id;

  if (data === "pg_noop" || data.startsWith("pg_")) {
    return handlePaginationCallback(env, tg, call);
  }
  if (data.startsWith("lang_")) {
    return handleLangCallback(env, tg, call);
  }
  if (data.startsWith("db_")) {
    return handleDbPanelCallback(env, tg, call);
  }

  await tg.answerCallbackQuery(call.id).catch(() => {});
}

async function handleLangCallback(env, tg, call) {
  const lang = call.data.slice(5);
  if (!["fa", "en", "zh", "fr"].includes(lang)) {
    await tg.answerCallbackQuery(call.id, "❌").catch(() => {});
    return;
  }
  await db.setConfig(env, "language", lang);
  const custom = await db.getCustomMsgs(env);
  const msgText = getMsg("select_language", lang, custom);
  const kb = langKeyboard(lang, InlineKeyboard);
  await tg.editMessageText(call.message.chat.id, call.message.message_id, msgText, {
    reply_markup: kb.build(),
    parse_mode: "HTML",
  }).catch(() => {});
  await tg.answerCallbackQuery(call.id, getMsg("lang_changed", lang, custom)).catch(() => {});
}

// Inline keyboard builder
export class InlineKeyboard {
  constructor() {
    this.rows = [];
    this._row = [];
  }
  add(...buttons) {
    this._row.push(...buttons);
    return this;
  }
  row(...buttons) {
    if (this._row.length) {
      this.rows.push(this._row);
      this._row = [];
    }
    this._row.push(...buttons);
    return this;
  }
  build() {
    const rows = [...this.rows];
    if (this._row.length) rows.push(this._row);
    return { inline_keyboard: rows };
  }
}

// authorization helper
export async function getAuthContext(env, uid) {
  const [admins, config, custom] = await Promise.all([
    db.getAdmins(env),
    db.getConfig(env),
    db.getCustomMsgs(env),
  ]);
  let authorized = admins.includes(uid);
  let becameAdmin = false;
  if (admins.length === 0) {
    await db.addAdmin(env, uid);
    authorized = true;
    becameAdmin = true;
  }
  return { admins, config, custom, authorized, becameAdmin };
}
