import * as db from "./db.js";
import { getMsg, VALID_MSG_KEYS } from "./i18n.js";
import { InlineKeyboard, getAuthContext } from "./router.js";
import { sendPaginated } from "./pagination.js";
import { encodeGroupIdForCallback, decodeGroupIdFromCallback, escapeHtml } from "./utils.js";
import { sendClipboardItem } from "./clipboard_sender.js";

export async function handleCommand(env, tg, msg) {
  const text = msg.text || "";
  const uid = msg.from_user.id;
  const chatId = msg.chat.id;

  // دستورات داینامیک که با prefix شروع می‌شوند
  if (text.startsWith("/unlock_")) return handleDynamicUnlock(env, tg, msg);
  if (text.startsWith("/deltarget_")) return handleDeltarget(env, tg, msg);
  if (text.startsWith("/view_")) return handleViewItem(env, tg, msg);
  if (text.startsWith("/del_")) return handleDelItem(env, tg, msg);

  const cmd = text.split(/\s+/)[0].split("@")[0];

  switch (cmd) {
    case "/start":
    case "/help":
      return handleStart(env, tg, msg);
    case "/db":
    case "/database":
    case "/panel":
      return handleDbCommand(env, tg, msg);
    case "/setadminchat":
      return handleSetAdminChat(env, tg, msg);
    case "/addadmin":
      return handleAddAdmin(env, tg, msg);
    case "/setspeed":
      return handleSetSpeed(env, tg, msg);
    case "/setreaction":
      return handleSetReaction(env, tg, msg);
    case "/groups":
      return handleGroups(env, tg, msg);
    case "/addtarget":
      return handleAddTarget(env, tg, msg);
    case "/listtarget":
      return handleListTarget(env, tg, msg);
    case "/lockreply":
      return handleLockReply(env, tg, msg);
    case "/listlocks":
      return handleListLocks(env, tg, msg);
    case "/linkreply":
      return handleLinkReplyStart(env, tg, msg);
    case "/tagflow":
      return handleTagflowStart(env, tg, msg);
    case "/cancelflow":
      return handleCancelFlow(env, tg, msg);
    case "/addtoclipboard":
      return handleAddToClipboardStart(env, tg, msg);
    case "/listtext":
      return handleListText(env, tg, msg);
    case "/listmsg":
      return handleListMsg(env, tg, msg);
    case "/setmsg":
      return handleSetMsg(env, tg, msg);
    case "/hiddenchat":
      return handleHiddenChatStart(env, tg, msg);
    case "/stophidden":
      return handleStopHidden(env, tg, msg);
    default:
      return false;
  }
}

// ═══════════════ HELPERS ═══════════════
async function authOrSilent(env, tg, msg) {
  const ctx = await getAuthContext(env, msg.from_user.id);
  if (!ctx.authorized) return null;
  if (ctx.becameAdmin) {
    await tg.sendMessage(msg.chat.id, "👑 شما به عنوان ادمین اصلی ربات تعیین شدید.", {
      reply_to_message_id: msg.message_id,
    });
  }
  // Only allowed in private or admin group
  if (msg.chat.type !== "private" && ctx.config.admin_group && msg.chat.id !== ctx.config.admin_group) {
    return null;
  }
  return ctx;
}

// ═══════════════ /start ═══════════════
async function handleStart(env, tg, msg) {
  const ctx = await authOrSilent(env, tg, msg);
  if (!ctx) return true;

  // unpin old lang msg
  const oldPin = await db.getPinnedMsg(env, msg.chat.id);
  if (oldPin) {
    await tg.unpinChatMessage(msg.chat.id, oldPin).catch(() => {});
  }
  const kb = new InlineKeyboard();
  const current = ctx.config.language || "fa";
  const row = [];
  for (const code of ["fa", "en", "zh", "fr"]) {
    const name = { fa: "🇮🇷 فارسی", en: "🇬🇧 English", zh: "🇨🇳 中文", fr: "🇫🇷 Français" }[code];
    row.push({ text: (code === current ? "✅ " : "") + name, callback_data: `lang_${code}` });
  }
  kb.row(...row);

  const langMsg = await tg.sendMessage(msg.chat.id, getMsg("select_language", current, ctx.custom), {
    reply_markup: kb.build(),
    parse_mode: "HTML",
  });
  if (langMsg.ok) {
    await tg.pinChatMessage(msg.chat.id, langMsg.result.message_id, { disable_notification: true }).catch(() => {});
    await db.setPinnedMsg(env, msg.chat.id, langMsg.result.message_id);
  }

  await sendPaginated(
    env, tg, msg.chat.id,
    `${getMsg("welcome", current, ctx.custom)}\n\n${getMsg("help", current, ctx.custom)}`,
    msg.message_id
  );
  return true;
}

// ═══════════════ /setadminchat ═══════════════
async function handleSetAdminChat(env, tg, msg) {
  if (msg.chat.type === "private") return true;
  const admins = await db.getAdmins(env);
  if (!admins.includes(msg.from_user.id)) return true;
  await db.setConfig(env, "admin_group", msg.chat.id);
  await tg.sendMessage(msg.chat.id, "✅ این گروه به عنوان گروه ادمین‌ها ست شد.", {
    reply_to_message_id: msg.message_id,
  });
  return true;
}

// ═══════════════ /addadmin ═══════════════
async function handleAddAdmin(env, tg, msg) {
  const ctx = await authOrSilent(env, tg, msg);
  if (!ctx) return true;
  try {
    const newId = parseInt(msg.text.split(/\s+/)[1]);
    await db.addAdmin(env, newId);
    await tg.sendMessage(msg.chat.id, `✅ کاربر <code>${newId}</code> ادمین شد.`, {
      reply_to_message_id: msg.message_id, parse_mode: "HTML",
    });
  } catch {
    await tg.sendMessage(msg.chat.id, "❌ ساختار: <code>/addadmin [user_id]</code>", {
      reply_to_message_id: msg.message_id, parse_mode: "HTML",
    });
  }
  return true;
}

// ═══════════════ /setspeed ═══════════════
async function handleSetSpeed(env, tg, msg) {
  const ctx = await authOrSilent(env, tg, msg);
  if (!ctx) return true;
  try {
    const speed = parseFloat(msg.text.split(/\s+/)[1]);
    if (isNaN(speed) || speed < 0) throw new Error();
    await db.setConfig(env, "speed", speed);
    await tg.sendMessage(msg.chat.id, `⚡ سرعت روی ${speed} ثانیه تنظیم شد.`, {
      reply_to_message_id: msg.message_id,
    });
  } catch {
    await tg.sendMessage(msg.chat.id, "❌ ساختار: <code>/setspeed [seconds]</code>", {
      reply_to_message_id: msg.message_id, parse_mode: "HTML",
    });
  }
  return true;
}

// ═══════════════ /setreaction ═══════════════
async function handleSetReaction(env, tg, msg) {
  const ctx = await authOrSilent(env, tg, msg);
  if (!ctx) return true;
  try {
    const emoji = msg.text.split(/\s+/)[1];
    await db.setConfig(env, "default_reaction", emoji);
    await tg.sendMessage(msg.chat.id, `✅ ریکشن پیش‌فرض: <code>${escapeHtml(emoji)}</code>`, {
      reply_to_message_id: msg.message_id, parse_mode: "HTML",
    });
  } catch {
    await tg.sendMessage(msg.chat.id, "❌ مثال: <code>/setreaction 🔥</code>", {
      reply_to_message_id: msg.message_id, parse_mode: "HTML",
    });
  }
  return true;
}

// ═══════════════ /groups ═══════════════
async function handleGroups(env, tg, msg) {
  const ctx = await authOrSilent(env, tg, msg);
  if (!ctx) return true;
  const groups = await db.getKnownGroups(env);
  const keys = Object.keys(groups);
  if (!keys.length) {
    await tg.sendMessage(msg.chat.id, "❌ هنوز گروهی ثبت نشده.", { reply_to_message_id: msg.message_id });
    return true;
  }
  let res = "🔍 <b>گروه‌های شناسایی شده:</b>\n\n";
  for (const [gId, title] of Object.entries(groups)) {
    res += `👥 ${escapeHtml(title)} \n🆔 <code>${gId}</code>\n\n`;
  }
  await sendPaginated(env, tg, msg.chat.id, res, msg.message_id);
  return true;
}

// ═══════════════ /addtarget ═══════════════
async function handleAddTarget(env, tg, msg) {
  const ctx = await authOrSilent(env, tg, msg);
  if (!ctx) return true;
  try {
    const id = parseInt(msg.text.split(/\s+/)[1]);
    await db.addTarget(env, id);
    await tg.sendMessage(msg.chat.id, `🎯 گروه <code>${id}</code> به اهداف اضافه شد.`, {
      reply_to_message_id: msg.message_id, parse_mode: "HTML",
    });
  } catch {
    await tg.sendMessage(msg.chat.id, "❌ ساختار: <code>/addtarget [group_id]</code>", {
      reply_to_message_id: msg.message_id, parse_mode: "HTML",
    });
  }
  return true;
}

// ═══════════════ /listtarget ═══════════════
async function handleListTarget(env, tg, msg) {
  const ctx = await authOrSilent(env, tg, msg);
  if (!ctx) return true;
  const targets = await db.getTargets(env);
  if (!targets.length) {
    await tg.sendMessage(msg.chat.id, "🎯 لیست اهداف خالی است.", { reply_to_message_id: msg.message_id });
    return true;
  }
  const groups = await db.getKnownGroups(env);
  let res = "🎯 <b>گروه‌های هدف:</b>\n\n";
  for (const tid of targets) {
    const title = groups[String(tid)] || "نامعلوم";
    res += `🔹 ${escapeHtml(title)} (<code>${tid}</code>)\n`;
    res += `🗑️ حذف: /deltarget_${encodeGroupIdForCallback(tid)}\n`;
    res += "───────────────────────\n";
  }
  await sendPaginated(env, tg, msg.chat.id, res, msg.message_id);
  return true;
}

async function handleDeltarget(env, tg, msg) {
  const ctx = await authOrSilent(env, tg, msg);
  if (!ctx) return true;
  try {
    const raw = msg.text.split("_")[1].split(/\s/)[0];
    const tid = decodeGroupIdFromCallback(raw);
    await db.removeTarget(env, tid);
    await tg.sendMessage(msg.chat.id, `🗑️ گروه <code>${tid}</code> از لیست حذف شد.`, {
      reply_to_message_id: msg.message_id, parse_mode: "HTML",
    });
  } catch {
    await tg.sendMessage(msg.chat.id, getMsg("invalid_idx", ctx.config.language, ctx.custom), {
      reply_to_message_id: msg.message_id, parse_mode: "HTML",
    });
  }
  return true;
}

// ═══════════════ /lockreply ═══════════════
async function handleLockReply(env, tg, msg) {
  const ctx = await authOrSilent(env, tg, msg);
  if (!ctx) return true;
  try {
    const parts = msg.text.split(/\s+/);
    const uId = parseInt(parts[1]);
    const gId = parseInt(parts[2]);
    await db.addReplyLock(env, uId, gId);
    await tg.sendMessage(msg.chat.id, `🎯 قفل فعال:\n👤 ${uId} ➔ 👥 ${gId}`, {
      reply_to_message_id: msg.message_id, parse_mode: "HTML",
    });
  } catch {
    await tg.sendMessage(msg.chat.id, "❌ <code>/lockreply [user] [group]</code>", {
      reply_to_message_id: msg.message_id, parse_mode: "HTML",
    });
  }
  return true;
}

async function handleListLocks(env, tg, msg) {
  const ctx = await authOrSilent(env, tg, msg);
  if (!ctx) return true;
  const locks = await db.getReplyLocks(env);
  if (!locks.length) {
    await tg.sendMessage(msg.chat.id, "🔒 قفلی نیست.", { reply_to_message_id: msg.message_id });
    return true;
  }
  let res = "🔒 <b>لیست قفل‌ها:</b>\n\n";
  for (const l of locks) {
    res += `👤 <code>${l.user_id}</code> ➔ 👥 <code>${l.group_id}</code>\n`;
    res += `🗑️ /unlock_${l.user_id}_${encodeGroupIdForCallback(l.group_id)}\n────────────\n`;
  }
  await sendPaginated(env, tg, msg.chat.id, res, msg.message_id);
  return true;
}

async function handleDynamicUnlock(env, tg, msg) {
  const ctx = await authOrSilent(env, tg, msg);
  if (!ctx) return true;
  try {
    const parts = msg.text.split("_");
    const uId = parseInt(parts[1]);
    const raw = parts[2].split(/\s/)[0];
    const gId = decodeGroupIdFromCallback(raw);
    await db.removeReplyLock(env, uId, gId);
    await tg.sendMessage(msg.chat.id, `🗑️ قفل <code>${uId}</code> لغو شد.`, {
      reply_to_message_id: msg.message_id, parse_mode: "HTML",
    });
  } catch {
    await tg.sendMessage(msg.chat.id, getMsg("invalid_idx", ctx.config.language, ctx.custom), {
      reply_to_message_id: msg.message_id, parse_mode: "HTML",
    });
  }
  return true;
}

// ═══════════════ /listmsg & /setmsg ═══════════════
async function handleListMsg(env, tg, msg) {
  const ctx = await authOrSilent(env, tg, msg);
  if (!ctx) return true;
  let res = "⚙️ <b>لیست متن‌های خروجی ربات:</b>\n\n";
  for (const k of VALID_MSG_KEYS) {
    const cur = ctx.custom[k] || getMsg(k, ctx.config.language, {});
    res += `🔑 <code>${k}</code>\n💬 ${escapeHtml(cur)}\n\n`;
  }
  await sendPaginated(env, tg, msg.chat.id, res, msg.message_id);
  return true;
}

async function handleSetMsg(env, tg, msg) {
  const ctx = await authOrSilent(env, tg, msg);
  if (!ctx) return true;
  try {
    const parts = msg.text.split(/\s+/);
    const key = parts[1];
    const newTxt = msg.text.slice(msg.text.indexOf(key) + key.length).trimStart();
    if (!VALID_MSG_KEYS.includes(key)) {
      await tg.sendMessage(msg.chat.id, `❌ کلید نامعتبر. کلیدهای مجاز:\n<code>${VALID_MSG_KEYS.join(", ")}</code>`, {
        reply_to_message_id: msg.message_id, parse_mode: "HTML",
      });
      return true;
    }
    await db.setCustomMsg(env, key, newTxt);
    await tg.sendMessage(msg.chat.id, `✅ کلید <code>${key}</code> تغییر کرد.`, {
      reply_to_message_id: msg.message_id, parse_mode: "HTML",
    });
  } catch {
    await tg.sendMessage(msg.chat.id, "❌ ساختار: <code>/setmsg key متن_جدید</code>", {
      reply_to_message_id: msg.message_id, parse_mode: "HTML",
    });
  }
  return true;
}

// ═══════════════ Clipboard commands ═══════════════
async function handleAddToClipboardStart(env, tg, msg) {
  const ctx = await authOrSilent(env, tg, msg);
  if (!ctx) return true;
  await db.setSession(env, msg.from_user.id, { mode: "add_to_clipboard" });
  await tg.sendMessage(msg.chat.id, "📥 دریافت رگباری فعال.\n⏹️ برای اتمام: <code>/stopadding</code>", {
    reply_to_message_id: msg.message_id, parse_mode: "HTML",
  });
  return true;
}

async function handleListText(env, tg, msg) {
  const ctx = await authOrSilent(env, tg, msg);
  if (!ctx) return true;
  const items = await db.getClipboard(env);
  if (!items.length) {
    await tg.sendMessage(msg.chat.id, "📂 کلیپ‌بورد خالی است.", { reply_to_message_id: msg.message_id });
    return true;
  }
  let res = "📋 <b>لیست کلیپ‌بورد:</b>\n\n";
  for (const it of items) {
    const snippet =
      it.type === "text"
        ? escapeHtml((it.content || "").slice(0, 30))
        : escapeHtml((it.caption || "بدون زیرنویس").slice(0, 30));
    res += `🎬 <b>${it.type.toUpperCase()}:</b> ${snippet}...\n`;
    res += `👁️ /view_${it.id}  |  🗑️ /del_${it.id}\n`;
    res += "───────────────────────\n";
  }
  await sendPaginated(env, tg, msg.chat.id, res, msg.message_id);
  return true;
}

async function handleViewItem(env, tg, msg) {
  const ctx = await authOrSilent(env, tg, msg);
  if (!ctx) return true;
  try {
    const id = msg.text.slice(6).split(/\s/)[0];
    const items = await db.getClipboard(env);
    const item = items.find((i) => i.id === id);
    if (item) {
      await sendClipboardItem(tg, msg.chat.id, item, "", msg.message_id);
    }
  } catch {}
  return true;
}

async function handleDelItem(env, tg, msg) {
  const ctx = await authOrSilent(env, tg, msg);
  if (!ctx) return true;
  try {
    const id = msg.text.slice(5).split(/\s/)[0];
    await db.removeClipboardItem(env, id);
    await tg.sendMessage(msg.chat.id, `🗑️ آیتم <code>${id}</code> حذف شد.`, {
      reply_to_message_id: msg.message_id, parse_mode: "HTML",
    });
  } catch {}
  return true;
}

// ═══════════════ Hidden chat ═══════════════
async function handleHiddenChatStart(env, tg, msg) {
  const ctx = await authOrSilent(env, tg, msg);
  if (!ctx) return true;
  try {
    const gId = parseInt(msg.text.split(/\s+/)[1]);
    await db.setSession(env, msg.from_user.id, {
      mode: "hidden_chat",
      target_group: gId,
      hidden_reply_id: null,
    });
    await tg.sendMessage(msg.chat.id,
      `🕵️ <b>چت ناشناس فعال شد</b>\nگروه: <code>${gId}</code>\n\n🔻 <code>/Replyhidden [link]</code>\n🔻 <code>/stophidden</code>`,
      { parse_mode: "HTML", reply_to_message_id: msg.message_id });
  } catch {
    await tg.sendMessage(msg.chat.id, "❌ <code>/hiddenchat -10012345678</code>", {
      parse_mode: "HTML", reply_to_message_id: msg.message_id,
    });
  }
  return true;
}

async function handleStopHidden(env, tg, msg) {
  await db.clearSession(env, msg.from_user.id);
  await tg.sendMessage(msg.chat.id, "🚪 خارج شدید.", { reply_to_message_id: msg.message_id });
  return true;
}

// ═══════════════ Flows (imported from flows.js) ═══════════════
import {
  handleTagflowStart as _tagflowStart,
  handleCancelFlow as _cancelFlow,
  handleLinkReplyStart as _linkReplyStart,
} from "./flows.js";

export async function handleTagflowStart(env, tg, msg) {
  const ctx = await authOrSilent(env, tg, msg);
  if (!ctx) return true;
  return _tagflowStart(env, tg, msg, ctx);
}
export async function handleCancelFlow(env, tg, msg) {
  const ctx = await authOrSilent(env, tg, msg);
  if (!ctx) return true;
  return _cancelFlow(env, tg, msg, ctx);
}
export async function handleLinkReplyStart(env, tg, msg) {
  const ctx = await authOrSilent(env, tg, msg);
  if (!ctx) return true;
  return _linkReplyStart(env, tg, msg, ctx);
}
