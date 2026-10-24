import * as db from "./db.js";
import { getMsg } from "./i18n.js";
import { escapeHtml, parseTelegramLink, sleep } from "./utils.js";
import { sendClipboardItem } from "./clipboard_sender.js";

// ════════════ TAGFLOW ════════════
export async function handleTagflowStart(env, tg, msg, ctx) {
  await db.setCancel(env, msg.from_user.id, false);
  await db.setSession(env, msg.from_user.id, { mode: "flow_ids" });
  await tg.sendMessage(msg.chat.id, getMsg("flow_step1", ctx.config.language, ctx.custom), {
    parse_mode: "HTML", reply_to_message_id: msg.message_id,
  });
  return true;
}

export async function handleCancelFlow(env, tg, msg, ctx) {
  await db.setCancel(env, msg.from_user.id, true);
  await db.clearSession(env, msg.from_user.id);
  await tg.sendMessage(msg.chat.id, getMsg("flow_cancel_requested", ctx.config.language, ctx.custom), {
    parse_mode: "HTML", reply_to_message_id: msg.message_id,
  });
  return true;
}

// ════════════ LINKREPLY ════════════
export async function handleLinkReplyStart(env, tg, msg, ctx) {
  await db.setSession(env, msg.from_user.id, { mode: "linkreply_url" });
  await tg.sendMessage(msg.chat.id, "🔗 لینک پیام یا پست را بفرستید:", {
    parse_mode: "HTML", reply_to_message_id: msg.message_id,
  });
  return true;
}

// ════════════ SESSION MESSAGE HANDLER ════════════
export async function handleSessionMessage(env, tg, msg, session) {
  const uid = msg.from_user.id;
  const text = msg.text || "";
  const config = await db.getConfig(env);
  const custom = await db.getCustomMsgs(env);
  const lang = config.language || "fa";

  // global cancel command
  if (text === "/cancelflow") {
    await db.setCancel(env, uid, true);
    await db.clearSession(env, uid);
    await tg.sendMessage(msg.chat.id, getMsg("flow_cancelled", lang, custom), {
      parse_mode: "HTML", reply_to_message_id: msg.message_id,
    });
    return true;
  }

  // ignore other commands except during hidden_chat mode
  if (text.startsWith("/") && session.mode !== "hidden_chat") {
    if (text !== "/stopadding" && text !== "/Replyhidden") {
      return false; // let commands module handle
    }
  }

  switch (session.mode) {
    case "add_to_clipboard":
      return handleAddToClipboardStep(env, tg, msg, session);
    case "flow_ids":
      return handleFlowIds(env, tg, msg, session, config, custom);
    case "flow_count":
      return handleFlowCount(env, tg, msg, session, config, custom);
    case "flow_choice":
      return handleFlowChoice(env, tg, msg, session, config, custom);
    case "flow_custom":
      return handleFlowCustom(env, tg, msg, session, config, custom);
    case "linkreply_url":
      return handleLinkUrl(env, tg, msg, session, config, custom);
    case "linkreply_count":
      return handleLinkCount(env, tg, msg, session, config, custom);
    case "linkreply_choice":
      return handleLinkChoice(env, tg, msg, session, config, custom);
    case "linkreply_custom":
      return handleLinkCustom(env, tg, msg, session, config, custom);
    case "hidden_chat":
      return handleHiddenChatMessage(env, tg, msg, session, config);
    case "db_pending":
      return false; // handled in db_panel.js via its own session mode check
  }
  return false;
}

// ═══════════ Add to clipboard ═══════════
async function handleAddToClipboardStep(env, tg, msg, session) {
  if (msg.text && msg.text.trim() === "/stopadding") {
    await db.clearSession(env, msg.from_user.id);
    await tg.sendMessage(msg.chat.id, "⏹️ متوقف شد.", { reply_to_message_id: msg.message_id });
    return true;
  }
  const item = buildClipboardItemFromMessage(msg);
  if (!item) {
    await tg.sendMessage(msg.chat.id, "❌ فرمت پشتیبانی نمی‌شود.", { reply_to_message_id: msg.message_id });
    return true;
  }
  await db.addClipboardItem(env, item);
  await tg.sendMessage(msg.chat.id,
    `✅ ذخیره شد (<code>${item.id}</code>).\nبعدی یا /stopadding`,
    { parse_mode: "HTML", reply_to_message_id: msg.message_id });
  return true;
}

function buildClipboardItemFromMessage(msg) {
  const id = String(Math.floor(10000000 + Math.random() * 89999999));
  const base = { id, timestamp: Date.now() / 1000 };
  if (msg.text) return { ...base, type: "text", content: msg.text };
  if (msg.photo) return { ...base, type: "photo", file_id: msg.photo[msg.photo.length - 1].file_id, caption: msg.caption || "" };
  if (msg.video) return { ...base, type: "video", file_id: msg.video.file_id, caption: msg.caption || "" };
  if (msg.animation) return { ...base, type: "animation", file_id: msg.animation.file_id, caption: msg.caption || "" };
  if (msg.sticker) return { ...base, type: "sticker", file_id: msg.sticker.file_id };
  return null;
}

// ═══════════ TAGFLOW STEPS ═══════════
async function handleFlowIds(env, tg, msg, session, config, custom) {
  try {
    const ids = msg.text.split(/\s+/).map((x) => parseInt(x)).filter((x) => !isNaN(x));
    if (!ids.length) throw new Error();
    await db.setSession(env, msg.from_user.id, { mode: "flow_count", ids });
    await tg.sendMessage(msg.chat.id, getMsg("flow_step2", config.language, custom), {
      parse_mode: "HTML", reply_to_message_id: msg.message_id,
    });
  } catch {
    await tg.sendMessage(msg.chat.id, getMsg("invalid_ids", config.language, custom), {
      reply_to_message_id: msg.message_id,
    });
    await db.clearSession(env, msg.from_user.id);
  }
  return true;
}

async function handleFlowCount(env, tg, msg, session, config, custom) {
  const count = parseInt(msg.text);
  if (isNaN(count) || count <= 0) {
    await tg.sendMessage(msg.chat.id, getMsg("count_must_be_number", config.language, custom), {
      reply_to_message_id: msg.message_id,
    });
    await db.clearSession(env, msg.from_user.id);
    return true;
  }
  await db.setSession(env, msg.from_user.id, { ...session, mode: "flow_choice", count });
  const kb = {
    keyboard: [
      [{ text: getMsg("btn_custom", config.language, custom) }, { text: getMsg("btn_periodic_flow", config.language, custom) }],
    ],
    one_time_keyboard: true,
    resize_keyboard: true,
  };
  await tg.sendMessage(msg.chat.id, getMsg("flow_step3", config.language, custom), {
    parse_mode: "HTML", reply_markup: kb,
  });
  return true;
}

async function handleFlowChoice(env, tg, msg, session, config, custom) {
  const choice = msg.text;
  const btnCustom = getMsg("btn_custom", config.language, custom);
  const btnPeriodic = getMsg("btn_periodic_flow", config.language, custom);
  const removeKb = { remove_keyboard: true };

  if (choice === btnCustom) {
    await db.setSession(env, msg.from_user.id, { ...session, mode: "flow_custom" });
    await tg.sendMessage(msg.chat.id, getMsg("flow_custom_prompt", config.language, custom), {
      parse_mode: "HTML", reply_markup: removeKb,
    });
    return true;
  }
  if (choice === btnPeriodic) {
    const items = await db.getClipboard(env);
    if (!items.length) {
      await tg.sendMessage(msg.chat.id, getMsg("clipboard_empty", config.language, custom), {
        reply_markup: removeKb,
      });
      await db.clearSession(env, msg.from_user.id);
      return true;
    }
    await db.setSession(env, msg.from_user.id, { ...session, mode: "flow_running", source: "periodic" });
    await tg.sendMessage(msg.chat.id, getMsg("start_send", config.language, custom), {
      parse_mode: "HTML", reply_markup: removeKb,
    });
    // start flow asynchronously
    startTagFlow(env, tg, msg.chat.id, msg.from_user.id, { ...session, source: "periodic" }, config, custom);
    return true;
  }
  await tg.sendMessage(msg.chat.id, getMsg("cancelled", config.language, custom), {
    reply_markup: removeKb,
  });
  await db.clearSession(env, msg.from_user.id);
  return true;
}

async function handleFlowCustom(env, tg, msg, session, config, custom) {
  await db.setSession(env, msg.from_user.id, { ...session, mode: "flow_running", source: "custom", custom_text: msg.text });
  await tg.sendMessage(msg.chat.id, getMsg("start_send", config.language, custom), {
    parse_mode: "HTML",
  });
  startTagFlow(env, tg, msg.chat.id, msg.from_user.id, { ...session, source: "custom", custom_text: msg.text }, config, custom);
  return true;
}

// ═══════════ EXECUTE TAGFLOW ═══════════
async function startTagFlow(env, tg, chatId, uid, session, config, custom) {
  try {
    const targets = await db.getTargets(env);
    const clipboard = await db.getClipboard(env);
    if (!targets.length) {
      await tg.sendMessage(chatId, getMsg("empty_target", config.language, custom), { parse_mode: "HTML" });
      await db.clearSession(env, uid);
      return;
    }
    const ids = session.ids || [];
    const tagLine = "\n\n" + ids.map((i) => `<a href="tg://user?id=${i}">📌</a>`).join(" ");
    let pointer = 0;
    const getNext = () => {
      if (!clipboard.length) return null;
      if (pointer >= clipboard.length) pointer = 0;
      return clipboard[pointer++];
    };

    let cancelled = false;
    let startTime = Date.now();
    const MAX_MS = 25000; // keep under waitUntil 30s
    const delay = (config.speed || 0.4) * 1000;

    for (let i = 0; i < session.count; i++) {
      if (Date.now() - startTime > MAX_MS) break;
      if (await db.isCancelled(env, uid)) { cancelled = true; break; }
      for (const chat of targets) {
        if (await db.isCancelled(env, uid)) { cancelled = true; break; }
        try {
          const item = session.source === "custom"
            ? { type: "text", content: session.custom_text }
            : getNext();
          if (!item) continue;
          await sendClipboardItem(tg, chat, item, tagLine);
          await sleep(delay);
        } catch (e) {
          console.error("Send error:", e);
        }
      }
      if (cancelled) break;
    }

    await db.clearSession(env, uid);
    await db.setCancel(env, uid, false);
    const done = cancelled ? "flow_cancelled" : "end_send";
    await tg.sendMessage(chatId, getMsg(done, config.language, custom), { parse_mode: "HTML" });
  } catch (e) {
    console.error("TagFlow error:", e);
    await db.clearSession(env, uid);
  }
}

// ═══════════ LINKREPLY STEPS ═══════════
async function handleLinkUrl(env, tg, msg, session, config, custom) {
  const [chatId, msgId] = parseTelegramLink(msg.text || "");
  if (!chatId) {
    await tg.sendMessage(msg.chat.id, "❌ لینک نامعتبر.", { reply_to_message_id: msg.message_id });
    await db.clearSession(env, msg.from_user.id);
    return true;
  }
  await db.setSession(env, msg.from_user.id, { mode: "linkreply_count", link_chat_id: chatId, link_msg_id: msgId });
  await tg.sendMessage(msg.chat.id, "🔢 تعداد پیام‌ها را وارد کنید:", { reply_to_message_id: msg.message_id });
  return true;
}

async function handleLinkCount(env, tg, msg, session, config, custom) {
  const count = parseInt(msg.text);
  if (isNaN(count) || count <= 0) {
    await tg.sendMessage(msg.chat.id, getMsg("count_must_be_number", config.language, custom), {
      reply_to_message_id: msg.message_id,
    });
    await db.clearSession(env, msg.from_user.id);
    return true;
  }
  await db.setSession(env, msg.from_user.id, { ...session, mode: "linkreply_choice", count });
  const kb = {
    keyboard: [
      [{ text: getMsg("btn_custom", config.language, custom) }, { text: getMsg("btn_periodic", config.language, custom) }],
    ],
    one_time_keyboard: true,
    resize_keyboard: true,
  };
  await tg.sendMessage(msg.chat.id, "📝 منبع را انتخاب کنید:", { reply_markup: kb });
  return true;
}

async function handleLinkChoice(env, tg, msg, session, config, custom) {
  const choice = msg.text;
  const btnCustom = getMsg("btn_custom", config.language, custom);
  const btnPeriodic = getMsg("btn_periodic", config.language, custom);
  const removeKb = { remove_keyboard: true };

  if (choice === btnCustom) {
    await db.setSession(env, msg.from_user.id, { ...session, mode: "linkreply_custom" });
    await tg.sendMessage(msg.chat.id, "💬 متن سفارشی را بفرستید:", { reply_markup: removeKb });
    return true;
  }
  if (choice === btnPeriodic) {
    const items = await db.getClipboard(env);
    if (!items.length) {
      await tg.sendMessage(msg.chat.id, getMsg("clipboard_empty", config.language, custom), { reply_markup: removeKb });
      await db.clearSession(env, msg.from_user.id);
      return true;
    }
    await tg.sendMessage(msg.chat.id, getMsg("start_send", config.language, custom), {
      parse_mode: "HTML", reply_markup: removeKb,
    });
    await runLinkReply(env, tg, msg.chat.id, msg.from_user.id, session, "periodic", null, config, custom);
    return true;
  }
  await tg.sendMessage(msg.chat.id, getMsg("cancelled", config.language, custom), { reply_markup: removeKb });
  await db.clearSession(env, msg.from_user.id);
  return true;
}

async function handleLinkCustom(env, tg, msg, session, config, custom) {
  await tg.sendMessage(msg.chat.id, getMsg("start_send", config.language, custom), { parse_mode: "HTML" });
  await runLinkReply(env, tg, msg.chat.id, msg.from_user.id, session, "custom", msg.text, config, custom);
  return true;
}

async function runLinkReply(env, tg, chatId, uid, session, mode, customText, config, custom) {
  try {
    const clipboard = await db.getClipboard(env);
    const opKey = `link_run_${session.link_chat_id}_${session.link_msg_id}`;
    const delay = (config.speed || 0.4) * 1000;
    const startTime = Date.now();
    const MAX_MS = 25000;

    for (let i = 0; i < session.count; i++) {
      if (Date.now() - startTime > MAX_MS) break;
      try {
        let item;
        if (mode === "custom") {
          item = { type: "text", content: customText };
        } else {
          item = await db.getNextClipboardItem(env, opKey);
        }
        if (!item) continue;
        await sendClipboardItem(tg, session.link_chat_id, item, "", session.link_msg_id);
        await sleep(delay);
      } catch (e) {
        console.error("Link reply error:", e);
      }
    }
    await db.clearSession(env, uid);
    await tg.sendMessage(chatId, getMsg("end_send", config.language, custom), { parse_mode: "HTML" });
  } catch (e) {
    console.error("runLinkReply error:", e);
  }
}

// ═══════════ HIDDEN CHAT ═══════════
async function handleHiddenChatMessage(env, tg, msg, session, config) {
  const uid = msg.from_user.id;
  const targetGroup = session.target_group;
  const text = msg.text || "";

  if (text === "/stophidden") {
    await db.clearSession(env, uid);
    await tg.sendMessage(msg.chat.id, "🚪 خارج شدید.", { reply_to_message_id: msg.message_id });
    return true;
  }

  if (text.startsWith("/Replyhidden")) {
    const parts = text.split(/\s+/);
    if (parts[1]) {
      const [_, mId] = parseTelegramLink(parts[1]);
      if (mId) {
        await db.setSession(env, uid, { ...session, hidden_reply_id: mId });
        try {
          await tg.setMessageReaction(targetGroup, mId, [
            { type: "emoji", emoji: config.default_reaction || "👍" },
          ]);
        } catch {}
        await tg.sendMessage(msg.chat.id, "🎯 پیام هدف ست شد. حالا پیام خود را بفرستید:", {
          reply_to_message_id: msg.message_id,
        });
      } else {
        await tg.sendMessage(msg.chat.id, "❌ لینک نامعتبر.", { reply_to_message_id: msg.message_id });
      }
    } else {
      await tg.sendMessage(msg.chat.id, "🔗 لینک پیام گروه را بفرستید:", { reply_to_message_id: msg.message_id });
    }
    return true;
  }

  if (text.startsWith("/")) {
    await tg.sendMessage(msg.chat.id, "⚠️ در حالت چت ناشناس هستید. برای خروج: /stophidden", {
      parse_mode: "HTML", reply_to_message_id: msg.message_id,
    });
    return true;
  }

  try {
    await tg.copyMessage(targetGroup, msg.chat.id, msg.message_id, {
      reply_to_message_id: session.hidden_reply_id || undefined,
    });
    if (session.hidden_reply_id) {
      await db.setSession(env, uid, { ...session, hidden_reply_id: null });
    }
    await tg.sendMessage(msg.chat.id, "🚀 فرستاده شد.", { reply_to_message_id: msg.message_id });
  } catch (e) {
    await tg.sendMessage(msg.chat.id, `❌ خطا: ${e}`, { reply_to_message_id: msg.message_id });
  }
  return true;
}

// ═══════════ GROUP TRACKING ═══════════
export async function handleGroupTracking(env, tg, msg) {
  const chatId = String(msg.chat.id);
  const title = msg.chat.title || "Unknown";
  const groups = await db.getKnownGroups(env);
  if (groups[chatId] !== title) {
    await db.setKnownGroup(env, chatId, title);
  }

  const locks = await db.getReplyLocks(env);
  const matched = locks.some(
    (l) => l.user_id === msg.from_user.id && l.group_id === msg.chat.id
  );
  if (!matched) return;

  const config = await db.getConfig(env);
  const item = await db.getNextClipboardItem(env, `hunt_${msg.chat.id}`);
  if (!item) return;

  try {
    await sleep((config.speed || 0.4) * 1000);
    await sendClipboardItem(tg, msg.chat.id, item, "", msg.message_id);
  } catch (e) {
    console.error("Hunt error:", e);
  }
}
