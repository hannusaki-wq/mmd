export class TelegramAPI {
  constructor(token) {
    this.token = token;
    this.base = `https://api.telegram.org/bot${token}`;
  }

  async call(method, params = {}) {
    try {
      const res = await fetch(`${this.base}/${method}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (!data.ok) {
        console.error(`TG ${method} error:`, data.description || data);
      }
      return data;
    } catch (e) {
      console.error(`TG ${method} fetch error:`, e);
      return { ok: false, description: String(e) };
    }
  }

  sendMessage(chat_id, text, opts = {}) {
    return this.call("sendMessage", { chat_id, text, ...opts });
  }
  editMessageText(chat_id, message_id, text, opts = {}) {
    return this.call("editMessageText", { chat_id, message_id, text, ...opts });
  }
  sendPhoto(chat_id, photo, opts = {}) {
    return this.call("sendPhoto", { chat_id, photo, ...opts });
  }
  sendVideo(chat_id, video, opts = {}) {
    return this.call("sendVideo", { chat_id, video, ...opts });
  }
  sendAnimation(chat_id, animation, opts = {}) {
    return this.call("sendAnimation", { chat_id, animation, ...opts });
  }
  sendSticker(chat_id, sticker, opts = {}) {
    return this.call("sendSticker", { chat_id, sticker, ...opts });
  }
  copyMessage(chat_id, from_chat_id, message_id, opts = {}) {
    return this.call("copyMessage", { chat_id, from_chat_id, message_id, ...opts });
  }
  answerCallbackQuery(id, text) {
    return this.call("answerCallbackQuery", { callback_query_id: id, text });
  }
  pinChatMessage(chat_id, message_id, opts = {}) {
    return this.call("pinChatMessage", { chat_id, message_id, ...opts });
  }
  unpinChatMessage(chat_id, message_id) {
    return this.call("unpinChatMessage", { chat_id, message_id });
  }
  setMessageReaction(chat_id, message_id, reaction) {
    return this.call("setMessageReaction", { chat_id, message_id, reaction });
  }
  setWebhook(url) {
    return this.call("setWebhook", {
      url,
      allowed_updates: ["message", "callback_query"],
      drop_pending_updates: false,
    });
  }
  deleteWebhook() {
    return this.call("deleteWebhook");
  }
  getMe() {
    return this.call("getMe");
  }
}
