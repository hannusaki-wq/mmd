import { escapeHtml } from "./utils.js";

export async function sendClipboardItem(tg, chatId, item, extraTag = "", forcedReplyId = null) {
  const type = item.type || "text";
  const baseOpts = forcedReplyId ? { reply_to_message_id: forcedReplyId } : {};

  if (type === "text") {
    const fullText = escapeHtml(item.content || "") + extraTag;
    await tg.sendMessage(chatId, fullText, { parse_mode: "HTML", ...baseOpts });
  } else if (type === "photo") {
    await tg.sendPhoto(chatId, item.file_id, {
      caption: escapeHtml(item.caption || "") + extraTag,
      parse_mode: "HTML", ...baseOpts,
    });
  } else if (type === "video") {
    await tg.sendVideo(chatId, item.file_id, {
      caption: escapeHtml(item.caption || "") + extraTag,
      parse_mode: "HTML", ...baseOpts,
    });
  } else if (type === "animation") {
    await tg.sendAnimation(chatId, item.file_id, {
      caption: escapeHtml(item.caption || "") + extraTag,
      parse_mode: "HTML", ...baseOpts,
    });
  } else if (type === "sticker") {
    await tg.sendSticker(chatId, item.file_id, baseOpts);
    if (extraTag && extraTag.trim()) {
      await tg.sendMessage(chatId, extraTag, { parse_mode: "HTML", ...baseOpts });
    }
  }
}
