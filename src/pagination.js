import * as db from "./db.js";
import { splitText } from "./utils.js";
import { InlineKeyboard } from "./router.js";

function pageMarkup(key, idx, total) {
  const kb = new InlineKeyboard();
  const row = [];
  if (idx > 0) row.push({ text: "◀️", callback_data: `pg_${key}_p` });
  row.push({ text: `${idx + 1}/${total}`, callback_data: "pg_noop" });
  if (idx < total - 1) row.push({ text: "▶️", callback_data: `pg_${key}_n` });
  kb.row(...row);
  return kb.build();
}

export async function sendPaginated(env, tg, chatId, text, replyTo = null, parseMode = "HTML") {
  const pages = splitText(text);
  if (pages.length === 1) {
    return tg.sendMessage(chatId, pages[0], {
      parse_mode: parseMode,
      ...(replyTo ? { reply_to_message_id: replyTo } : {}),
    });
  }
  const key = await db.storePages(env, pages);
  const body = pages[0] + `\n\n<i>📄 1/${pages.length}</i>`;
  return tg.sendMessage(chatId, body, {
    parse_mode: "HTML",
    reply_markup: pageMarkup(key, 0, pages.length),
    ...(replyTo ? { reply_to_message_id: replyTo } : {}),
  });
}

export async function handlePaginationCallback(env, tg, call) {
  if (call.data === "pg_noop") {
    await tg.answerCallbackQuery(call.id).catch(() => {});
    return;
  }
  try {
    const parts = call.data.split("_");
    // pg_<uuid>_<p|n> — uuid itself has dashes, no underscores
    const direction = parts[parts.length - 1];
    const key = parts.slice(1, -1).join("_");
    const pages = await db.getPages(env, key);
    if (!pages) {
      await tg.answerCallbackQuery(call.id, "❌ صفحه منقضی شده").catch(() => {});
      return;
    }
    const currentText = call.message.text || "";
    const match = currentText.match(/📄 (\d+)\/(\d+)/);
    let idx = match ? parseInt(match[1]) - 1 : 0;
    if (direction === "p") idx = Math.max(0, idx - 1);
    else if (direction === "n") idx = Math.min(pages.length - 1, idx + 1);
    const body = pages[idx] + `\n\n<i>📄 ${idx + 1}/${pages.length}</i>`;
    await tg.editMessageText(call.message.chat.id, call.message.message_id, body, {
      reply_markup: pageMarkup(key, idx, pages.length),
      parse_mode: "HTML",
    }).catch(() => {});
    await tg.answerCallbackQuery(call.id).catch(() => {});
  } catch (e) {
    console.error("Pagination error:", e);
    await tg.answerCallbackQuery(call.id).catch(() => {});
  }
}
