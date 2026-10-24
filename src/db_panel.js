import * as db from "./db.js";
import { getMsg, VALID_MSG_KEYS } from "./i18n.js";
import { InlineKeyboard, getAuthContext } from "./router.js";
import { sendPaginated } from "./pagination.js";
import { escapeHtml, decodeGroupIdFromCallback, encodeGroupIdForCallback } from "./utils.js";
import { handleDbPendingInput } from "./db_pending.js";

const DB_LIST_PER_PAGE = 8;

export async function handleDbCommand(env, tg, msg) {
  const ctx = await getAuthContext(env, msg.from_user.id);
  if (!ctx.authorized) return true;
  const mainText = await buildMainText(env, ctx);
  const kb = await buildMainMenu(env);
  await tg.sendMessage(msg.chat.id, mainText, {
    reply_markup: kb, parse_mode: "HTML",
  });
  return true;
}

async function buildMainText(env, ctx) {
  const [clipCount, targetCount, adminCount, lockCount, msgCount, groupCount] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) as c FROM clipboard").first().then(r => r.c),
    env.DB.prepare("SELECT COUNT(*) as c FROM target_chats").first().then(r => r.c),
    env.DB.prepare("SELECT COUNT(*) as c FROM admins").first().then(r => r.c),
    env.DB.prepare("SELECT COUNT(*) as c FROM reply_locks").first().then(r => r.c),
    env.DB.prepare("SELECT COUNT(*) as c FROM custom_msgs").first().then(r => r.c),
    env.DB.prepare("SELECT COUNT(*) as c FROM known_groups").first().then(r => r.c),
  ]);
  const total = clipCount + targetCount + adminCount + lockCount + msgCount + groupCount;
  const langNames = { fa: "🇮🇷 فارسی", en: "🇬🇧 English", zh: "🇨🇳 中文", fr: "🇫🇷 Français" };
  return (
    "🗄️ <b>پنل مدیریت دیتابیس</b>\n\n" +
    `📋 کلیپ‌بورد: <b>${clipCount}</b>\n` +
    `🎯 گروه‌های هدف: <b>${targetCount}</b>\n` +
    `👑 ادمین‌ها: <b>${adminCount}</b>\n` +
    `🔒 قفل‌های ریپلای: <b>${lockCount}</b>\n` +
    `💬 متن‌های سفارشی: <b>${msgCount}</b>\n` +
    `👥 گروه‌های شناخته‌شده: <b>${groupCount}</b>\n\n` +
    `⚡ سرعت: ${ctx.config.speed}s | 👍 ریکشن: ${ctx.config.default_reaction} | ` +
    `🌐 زبان: ${langNames[ctx.config.language] || ctx.config.language}\n\n` +
    `📊 مجموع رکوردها: <b>${total}</b>`
  );
}

async function buildMainMenu(env) {
  const [clip, tgt, adm, lok, msg, grp] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) as c FROM clipboard").first().then(r => r.c),
    env.DB.prepare("SELECT COUNT(*) as c FROM target_chats").first().then(r => r.c),
    env.DB.prepare("SELECT COUNT(*) as c FROM admins").first().then(r => r.c),
    env.DB.prepare("SELECT COUNT(*) as c FROM reply_locks").first().then(r => r.c),
    env.DB.prepare("SELECT COUNT(*) as c FROM custom_msgs").first().then(r => r.c),
    env.DB.prepare("SELECT COUNT(*) as c FROM known_groups").first().then(r => r.c),
  ]);
  const kb = new InlineKeyboard();
  kb.row(
    { text: `📋 کلیپ‌بورد (${clip})`, callback_data: "db_clip" },
    { text: `🎯 اهداف (${tgt})`, callback_data: "db_tgt" }
  );
  kb.row(
    { text: `👑 ادمین‌ها (${adm})`, callback_data: "db_adm" },
    { text: `🔒 قفل‌ها (${lok})`, callback_data: "db_lok" }
  );
  kb.row(
    { text: `💬 متن‌ها (${msg})`, callback_data: "db_msg" },
    { text: `👥 گروه‌ها (${grp})`, callback_data: "db_grp" }
  );
  kb.row(
    { text: "⚙️ تنظیمات", callback_data: "db_set" },
    { text: "⚠️ پاک‌سازی کل", callback_data: "db_wipe" }
  );
  kb.row({ text: "🔄 بروزرسانی", callback_data: "db_refresh" });
  return kb.build();
}

// ═══════════ CALLBACK HANDLER ═══════════
export async function handleDbPanelCallback(env, tg, call) {
  const ctx = await getAuthContext(env, call.from_user.id);
  if (!ctx.authorized) {
    await tg.answerCallbackQuery(call.id).catch(() => {});
    return;
  }
  const data = call.data;

  if (data === "db_noop") { await tg.answerCallbackQuery(call.id).catch(() => {}); return; }

  // main / refresh
  if (data === "db_main" || data === "db_refresh") {
    const mainText = await buildMainText(env, ctx);
    const kb = await buildMainMenu(env);
    await tg.editMessageText(call.message.chat.id, call.message.message_id, mainText, {
      reply_markup: kb, parse_mode: "HTML",
    }).catch(() => {});
    await tg.answerCallbackQuery(call.id).catch(() => {});
    return;
  }

  // wipe
  if (data === "db_wipe") {
    const kb = new InlineKeyboard();
    kb.row(
      { text: "✅ بله، حذف کن", callback_data: "db_wipe_allc" },
      { text: "❌ انصراف", callback_data: "db_main" }
    );
    await tg.editMessageText(call.message.chat.id, call.message.message_id,
      "⚠️ <b>هشدار!</b>\nاین عملیات کل دیتابیس (کلیپ‌بورد، اهداف، قفل‌ها، متن‌های سفارشی) را پاک می‌کند.\nمطمئنید؟",
      { reply_markup: kb.build(), parse_mode: "HTML" }).catch(() => {});
    return;
  }
  if (data === "db_wipe_allc") {
    await Promise.all([
      db.clearClipboard(env),
      db.clearTargets(env),
      db.clearReplyLocks(env),
      db.clearCustomMsgs(env),
    ]);
    const kb = await buildMainMenu(env);
    await tg.editMessageText(call.message.chat.id, call.message.message_id, "✅ دیتابیس پاک شد.", {
      reply_markup: kb, parse_mode: "HTML",
    }).catch(() => {});
    return;
  }

  // submenus
  if (["db_clip", "db_tgt", "db_adm", "db_lok", "db_msg", "db_grp"].includes(data)) {
    const cat = data.slice(3);
    const { text, kb } = await buildSubmenu(env, cat);
    await tg.editMessageText(call.message.chat.id, call.message.message_id, text, {
      reply_markup: kb, parse_mode: "HTML",
    }).catch(() => {});
    return;
  }

  // settings
  if (data === "db_set") {
    const kb = new InlineKeyboard();
    kb.row({ text: `⚡ سرعت: ${ctx.config.speed}s`, callback_data: "db_set_speed" });
    kb.row({ text: `👍 ریکشن: ${ctx.config.default_reaction}`, callback_data: "db_set_react" });
    kb.row({ text: `🌐 زبان: ${ctx.config.language}`, callback_data: "db_set_lang" });
    kb.row({ text: "🔙 بازگشت", callback_data: "db_main" });
    const txt =
      `⚙️ <b>تنظیمات</b>\n\n` +
      `⚡ سرعت: ${ctx.config.speed} ثانیه\n` +
      `👍 ریکشن: ${ctx.config.default_reaction}\n` +
      `🌐 زبان: ${ctx.config.language}`;
    await tg.editMessageText(call.message.chat.id, call.message.message_id, txt, {
      reply_markup: kb.build(), parse_mode: "HTML",
    }).catch(() => {});
    return;
  }

  if (data === "db_set_speed") {
    await db.setSession(env, call.from_user.id, { mode: "db_pending", action: "set_speed" });
    await tg.editMessageText(call.message.chat.id, call.message.message_id,
      "⚡ سرعت جدید (ثانیه) را بفرستید (مثلاً 0.5):").catch(() => {});
    return;
  }
  if (data === "db_set_react") {
    await db.setSession(env, call.from_user.id, { mode: "db_pending", action: "set_reaction" });
    await tg.editMessageText(call.message.chat.id, call.message.message_id,
      "👍 ایموجی ریکشن جدید را بفرستید:").catch(() => {});
    return;
  }
  if (data === "db_set_lang") {
    const kb = new InlineKeyboard();
    const row = [];
    for (const [code, name] of [["fa", "🇮🇷 فارسی"], ["en", "🇬🇧 English"], ["zh", "🇨🇳 中文"], ["fr", "🇫🇷 Français"]]) {
      row.push({ text: (code === ctx.config.language ? "✅ " : "") + name, callback_data: `lang_${code}` });
    }
    kb.row(...row);
    await tg.editMessageText(call.message.chat.id, call.message.message_id,
      "🌐 زبان جدید را انتخاب کنید:", { reply_markup: kb.build() }).catch(() => {});
    return;
  }

  // view
  if (data.includes("_v_")) {
    const cat = data.slice(3, data.indexOf("_v_"));
    const text = await buildViewText(env, cat);
    await sendPaginated(env, tg, call.message.chat.id, text);
    await tg.answerCallbackQuery(call.id).catch(() => {});
    return;
  }

  // delete list
  if (data.includes("_dl_")) {
    const cat = data.slice(3, data.indexOf("_dl_"));
    const page = parseInt(data.split("_dl_")[1]) || 0;
    const { text, kb } = await buildDeleteMenu(env, cat, page);
    await tg.editMessageText(call.message.chat.id, call.message.message_id, text, {
      reply_markup: kb, parse_mode: "HTML",
    }).catch(() => {});
    return;
  }

  // delete item
  if (data.includes("_di_")) {
    const cat = data.slice(3, data.indexOf("_di_"));
    const key = data.split("_di_")[1];
    await doDelete(env, cat, key);
    const { text, kb } = await buildDeleteMenu(env, cat, 0);
    await tg.editMessageText(call.message.chat.id, call.message.message_id, text, {
      reply_markup: kb, parse_mode: "HTML",
    }).catch(() => {});
    await tg.answerCallbackQuery(call.id, "✅ حذف شد").catch(() => {});
    return;
  }

  // clear
  if (data.endsWith("_clear")) {
    const cat = data.slice(3, data.indexOf("_clear"));
    const kb = new InlineKeyboard();
    kb.row(
      { text: "✅ بله، حذف کن", callback_data: `db_${cat}_clearc` },
      { text: "❌ انصراف", callback_data: "db_main" }
    );
    await tg.editMessageText(call.message.chat.id, call.message.message_id,
      "⚠️ مطمئنید که می‌خواهید همه را پاک کنید؟",
      { reply_markup: kb.build(), parse_mode: "HTML" }).catch(() => {});
    return;
  }
  if (data.endsWith("_clearc")) {
    const cat = data.slice(3, data.indexOf("_clearc"));
    if (cat === "clip") await db.clearClipboard(env);
    else if (cat === "tgt") await db.clearTargets(env);
    else if (cat === "lok") await db.clearReplyLocks(env);
    else if (cat === "msg") await db.clearCustomMsgs(env);
    else if (cat === "grp") await db.clearKnownGroups(env);
    const kb = await buildMainMenu(env);
    await tg.editMessageText(call.message.chat.id, call.message.message_id, "✅ همه پاک شدند.", {
      reply_markup: kb, parse_mode: "HTML",
    }).catch(() => {});
    return;
  }

  // add
  if (data === "db_clip_add") {
    await db.setSession(env, call.from_user.id, { mode: "db_pending", action: "add_clip" });
    await tg.editMessageText(call.message.chat.id, call.message.message_id,
      "📤 متن / عکس / ویدیو / گیف / استیکر مورد نظر را بفرستید:").catch(() => {});
    return;
  }
  if (data === "db_tgt_add") {
    await db.setSession(env, call.from_user.id, { mode: "db_pending", action: "add_tgt" });
    await tg.editMessageText(call.message.chat.id, call.message.message_id,
      "🆔 آیدی عددی گروه هدف را بفرستید (مثلاً -1001234567890):").catch(() => {});
    return;
  }
  if (data === "db_adm_add") {
    await db.setSession(env, call.from_user.id, { mode: "db_pending", action: "add_adm" });
    await tg.editMessageText(call.message.chat.id, call.message.message_id,
      "👤 آیدی عددی کاربر مورد نظر را بفرستید:").catch(() => {});
    return;
  }
  if (data === "db_lok_add") {
    await db.setSession(env, call.from_user.id, { mode: "db_pending", action: "add_lok" });
    await tg.editMessageText(call.message.chat.id, call.message.message_id,
      "🔒 به فرمت <code>user_id group_id</code> بفرستید:\nمثال: <code>12345 -1001234567890</code>",
      { parse_mode: "HTML" }).catch(() => {});
    return;
  }
  if (data === "db_msg_add") {
    await db.setSession(env, call.from_user.id, { mode: "db_pending", action: "add_msg" });
    const keys = VALID_MSG_KEYS.slice(0, 8).join(", ");
    await tg.editMessageText(call.message.chat.id, call.message.message_id,
      `✏️ به فرمت <code>key متن</code> بفرستید:\nکلیدهای مجاز: <code>${keys}</code>\nمثال:\n<code>welcome سلام دنیا</code>`,
      { parse_mode: "HTML" }).catch(() => {});
    return;
  }

  await tg.answerCallbackQuery(call.id).catch(() => {});
}

// ═══════════ Submenu ═══════════
async function buildSubmenu(env, cat) {
  const labels = { clip: "کلیپ‌بورد", tgt: "گروه‌های هدف", adm: "ادمین‌ها", lok: "قفل‌های ریپلای", msg: "متن‌های سفارشی", grp: "گروه‌های شناخته" };
  const kb = new InlineKeyboard();
  if (cat === "adm") {
    kb.row(
      { text: "➕ افزودن", callback_data: "db_adm_add" },
      { text: "👁️ مشاهده", callback_data: "db_adm_v_0" }
    );
    kb.row({ text: "🗑️ حذف تکی", callback_data: "db_adm_dl_0" });
  } else if (cat === "grp") {
    kb.row({ text: "👁️ مشاهده", callback_data: "db_grp_v_0" });
    kb.row({ text: "⚠️ پاک همه", callback_data: "db_grp_clear" });
  } else {
    kb.row(
      { text: "➕ افزودن", callback_data: `db_${cat}_add` },
      { text: "👁️ مشاهده", callback_data: `db_${cat}_v_0` }
    );
    kb.row(
      { text: "🗑️ حذف تکی", callback_data: `db_${cat}_dl_0` },
      { text: "⚠️ پاک همه", callback_data: `db_${cat}_clear` }
    );
  }
  kb.row({ text: "🔙 بازگشت", callback_data: "db_main" });
  return { text: `🗄️ <b>${labels[cat]}</b>\n\nیکی از گزینه‌ها را انتخاب کنید:`, kb: kb.build() };
}

// ═══════════ View ═══════════
async function buildViewText(env, cat) {
  if (cat === "clip") {
    const items = await db.getClipboard(env);
    if (!items.length) return "📂 کلیپ‌بورد خالی است.";
    let txt = "📋 <b>کلیپ‌بورد:</b>\n\n";
    for (const it of items) {
      const snip = escapeHtml((it.type === "text" ? it.content : it.caption || "").slice(0, 40) || "—");
      txt += `🆔 <code>${it.id}</code> | ${it.type.toUpperCase()}\n${snip}\n────────────────\n`;
    }
    return txt;
  }
  if (cat === "tgt") {
    const targets = await db.getTargets(env);
    if (!targets.length) return "🎯 لیست اهداف خالی است.";
    const groups = await db.getKnownGroups(env);
    return "🎯 <b>گروه‌های هدف:</b>\n\n" + targets.map((t) =>
      `🔹 ${escapeHtml(groups[String(t)] || "?")} (<code>${t}</code>)`
    ).join("\n");
  }
  if (cat === "adm") {
    const admins = await db.getAdmins(env);
    return "👑 <b>ادمین‌ها:</b>\n\n" + admins.map((a) => `👤 <code>${a}</code>`).join("\n");
  }
  if (cat === "lok") {
    const locks = await db.getReplyLocks(env);
    if (!locks.length) return "🔒 قفل فعالی نیست.";
    return "🔒 <b>قفل‌های ریپلای:</b>\n\n" + locks.map((l) =>
      `👤 <code>${l.user_id}</code> → <code>${l.group_id}</code>`
    ).join("\n");
  }
  if (cat === "msg") {
    const msgs = await db.getCustomMsgs(env);
    const keys = Object.keys(msgs);
    if (!keys.length) return "💬 متن سفارشی وجود ندارد.";
    return "💬 <b>متن‌های سفارشی:</b>\n\n" + keys.map((k) =>
      `🔑 <code>${k}</code>\n${escapeHtml(msgs[k].slice(0, 60))}\n────────────\n`
    ).join("");
  }
  if (cat === "grp") {
    const groups = await db.getKnownGroups(env);
    const keys = Object.keys(groups);
    if (!keys.length) return "👥 گروهی ثبت نشده.";
    return "👥 <b>گروه‌های شناخته‌شده:</b>\n\n" + keys.map((k) =>
      `📌 ${escapeHtml(groups[k].slice(0, 40))}\n<code>${k}</code>\n────────────\n`
    ).join("");
  }
  return "";
}

// ═══════════ Delete menu ═══════════
async function getItems(env, cat) {
  if (cat === "clip") {
    const items = await db.getClipboard(env);
    return items.map((it) => ({
      key: String(it.id),
      label: `${it.type}: ${escapeHtml((it.type === "text" ? it.content : it.caption || "").slice(0, 25) || "—")}`,
    }));
  }
  if (cat === "tgt") {
    const targets = await db.getTargets(env);
    const groups = await db.getKnownGroups(env);
    return targets.map((t) => ({
      key: String(t),
      label: `${escapeHtml(groups[String(t)] || "?")} | ${t}`,
    }));
  }
  if (cat === "adm") {
    const admins = await db.getAdmins(env);
    return admins.map((a) => ({ key: String(a), label: `👤 ${a}` }));
  }
  if (cat === "lok") {
    const locks = await db.getReplyLocks(env);
    return locks.map((l) => ({
      key: `${l.user_id}_${encodeGroupIdForCallback(l.group_id)}`,
      label: `👤 ${l.user_id} → ${l.group_id}`,
    }));
  }
  if (cat === "msg") {
    const msgs = await db.getCustomMsgs(env);
    return Object.entries(msgs).map(([k, v]) => ({
      key: k, label: `🔑 ${k}: ${escapeHtml(v.slice(0, 25))}`,
    }));
  }
  if (cat === "grp") {
    const groups = await db.getKnownGroups(env);
    return Object.entries(groups).map(([k, v]) => ({
      key: k, label: `${escapeHtml(v.slice(0, 30))} | ${k}`,
    }));
  }
  return [];
}

async function buildDeleteMenu(env, cat, page) {
  const items = await getItems(env, cat);
  const totalPages = Math.max(1, Math.ceil(items.length / DB_LIST_PER_PAGE));
  page = Math.max(0, Math.min(page, totalPages - 1));
  const start = page * DB_LIST_PER_PAGE;
  const chunk = items.slice(start, start + DB_LIST_PER_PAGE);

  const kb = new InlineKeyboard();
  if (!items.length) {
    kb.row({ text: "🔙 بازگشت", callback_data: `db_${cat}` });
    return { text: "📂 خالی است.", kb: kb.build() };
  }

  for (const it of chunk) {
    let cb = `db_${cat}_di_${it.key}`;
    if (cb.length > 64) cb = cb.slice(0, 64);
    kb.row({ text: `🗑️ ${it.label}`, callback_data: cb });
  }

  const nav = [];
  if (page > 0) nav.push({ text: "◀️", callback_data: `db_${cat}_dl_${page - 1}` });
  nav.push({ text: `${page + 1}/${totalPages}`, callback_data: "db_noop" });
  if (page < totalPages - 1) nav.push({ text: "▶️", callback_data: `db_${cat}_dl_${page + 1}` });
  kb.row(...nav);
  kb.row({ text: "🔙 بازگشت", callback_data: `db_${cat}` });

  return {
    text: `🗑️ <b>حذف تکی</b> — صفحه ${page + 1}/${totalPages}\n\nروی آیتم مورد نظر بزنید:`,
    kb: kb.build(),
  };
}

async function doDelete(env, cat, key) {
  try {
    if (cat === "clip") await db.removeClipboardItem(env, key);
    else if (cat === "tgt") await db.removeTarget(env, parseInt(key));
    else if (cat === "adm") await db.removeAdmin(env, parseInt(key));
    else if (cat === "lok") {
      const parts = key.split("_");
      const uid = parseInt(parts[0]);
      const gid = decodeGroupIdFromCallback(parts.slice(1).join("_"));
      await db.removeReplyLock(env, uid, gid);
    }
    else if (cat === "msg") await db.removeCustomMsg(env, key);
    else if (cat === "grp") await db.removeKnownGroup(env, key);
  } catch (e) {
    console.error("doDelete error:", e);
  }
}
