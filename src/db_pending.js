import * as db from "./db.js";
import { VALID_MSG_KEYS } from "./i18n.js";
import { escapeHtml } from "./utils.js";

// Called from router when session.mode === "db_pending"
// but since handlers.js checks session first, we implement it here
// and call from flows.js handleSessionMessage if needed.
// Simplest: put db_pending handling in router directly (see below).

export async function handleDbPendingInput(env, tg, msg, session, ctx) {
  const uid = msg.from_user.id;
  const action = session.action;
  const chatId = msg.chat.id;

  if (msg.text && msg.text.startsWith("/")) {
    await db.clearSession(env, uid);
    await tg.sendMessage(chatId, "❌ لغو شد. لطفاً دستور را دوباره بفرستید.", {
      reply_to_message_id: msg.message_id,
    });
    return true;
  }

  try {
    if (action === "add_clip") {
      const id = String(Math.floor(10000000 + Math.random() * 89999999));
      const base = { id, timestamp: Date.now() / 1000 };
      let item;
      if (msg.text) item = { ...base, type: "text", content: msg.text };
      else if (msg.photo) item = { ...base, type: "photo", file_id: msg.photo[msg.photo.length - 1].file_id, caption: msg.caption || "" };
      else if (msg.video) item = { ...base, type: "video", file_id: msg.video.file_id, caption: msg.caption || "" };
      else if (msg.animation) item = { ...base, type: "animation", file_id: msg.animation.file_id, caption: msg.caption || "" };
      else if (msg.sticker) item = { ...base, type: "sticker", file_id: msg.sticker.file_id };
      else {
        await tg.sendMessage(chatId, "❌ فرمت پشتیبانی نمی‌شود.", { reply_to_message_id: msg.message_id });
        return true;
      }
      await db.addClipboardItem(env, item);
      await tg.sendMessage(chatId, `✅ ذخیره شد: <code>${id}</code>`, {
        parse_mode: "HTML", reply_to_message_id: msg.message_id,
      });
    } else if (action === "add_tgt") {
      const id = parseInt(msg.text.trim());
      await db.addTarget(env, id);
      await tg.sendMessage(chatId, `✅ هدف اضافه شد: <code>${id}</code>`, {
        parse_mode: "HTML", reply_to_message_id: msg.message_id,
      });
    } else if (action === "add_adm") {
      const id = parseInt(msg.text.trim());
      await db.addAdmin(env, id);
      await tg.sendMessage(chatId, `✅ ادمین اضافه شد: <code>${id}</code>`, {
        parse_mode: "HTML", reply_to_message_id: msg.message_id,
      });
    } else if (action === "add_lok") {
      const parts = msg.text.split(/\s+/);
      await db.addReplyLock(env, parseInt(parts[0]), parseInt(parts[1]));
      await tg.sendMessage(chatId, "✅ قفل اضافه شد.", { reply_to_message_id: msg.message_id });
    } else if (action === "add_msg") {
      const parts = msg.text.split(/\s+/);
      const key = parts[0];
      const val = msg.text.slice(msg.text.indexOf(key) + key.length).trimStart();
      if (!VALID_MSG_KEYS.includes(key)) {
        await tg.sendMessage(chatId, `❌ کلید نامعتبر. کلیدهای مجاز:\n<code>${VALID_MSG_KEYS.join(", ")}</code>`, {
          parse_mode: "HTML", reply_to_message_id: msg.message_id,
        });
      } else {
        await db.setCustomMsg(env, key, val);
        await tg.sendMessage(chatId, `✅ <code>${key}</code> تنظیم شد.`, {
          parse_mode: "HTML", reply_to_message_id: msg.message_id,
        });
      }
    } else if (action === "set_speed") {
      const speed = parseFloat(msg.text.trim());
      await db.setConfig(env, "speed", speed);
      await tg.sendMessage(chatId, `✅ سرعت: ${speed}s`, {
        parse_mode: "HTML", reply_to_message_id: msg.message_id,
      });
    } else if (action === "set_reaction") {
      const emoji = msg.text.trim();
      await db.setConfig(env, "default_reaction", emoji);
      await tg.sendMessage(chatId, `✅ ریکشن: ${emoji}`, {
        parse_mode: "HTML", reply_to_message_id: msg.message_id,
      });
    }
    await db.clearSession(env, uid);
  } catch (e) {
    await tg.sendMessage(chatId, `❌ خطا: ${e.message || e}`, {
      reply_to_message_id: msg.message_id,
    });
    await db.clearSession(env, uid);
  }
  return true;
}
