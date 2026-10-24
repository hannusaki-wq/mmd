import { TelegramAPI } from "./telegram.js";
import { routeUpdate } from "./router.js";
import { handleDbPendingInput } from "./db_pending.js";
import * as db from "./db.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ── Health
    if (url.pathname === "/" || url.pathname === "/ping") {
      return jsonResponse({ ok: true, service: "sso-bot", time: new Date().toISOString() });
    }

    // ── Set webhook
    if (url.pathname === "/set-webhook") {
      const tg = new TelegramAPI(env.BOT_TOKEN);
      const webhookUrl = `${url.origin}/webhook`;
      const res = await tg.setWebhook(webhookUrl);
      return jsonResponse(res);
    }

    // ── Delete webhook
    if (url.pathname === "/delete-webhook") {
      const tg = new TelegramAPI(env.BOT_TOKEN);
      const res = await tg.deleteWebhook();
      return jsonResponse(res);
    }

    // ── Webhook
    if (url.pathname === "/webhook" && request.method === "POST") {
      try {
        const update = await request.json();
        const tg = new TelegramAPI(env.BOT_TOKEN);
        ctx.waitUntil(processUpdate(env, tg, update));
        return new Response("OK");
      } catch (e) {
        console.error("Webhook error:", e);
        return new Response("Error", { status: 500 });
      }
    }

    return new Response("Not found", { status: 404 });
  },
};

async function processUpdate(env, tg, update) {
  try {
    // Intercept db_pending sessions BEFORE full routing
    if (update.message && update.message.from_user) {
      const uid = update.message.from_user.id;
      const session = await db.getSession(env, uid);
      if (session && session.mode === "db_pending") {
        const admins = await db.getAdmins(env);
        if (admins.includes(uid)) {
          const handled = await handleDbPendingInput(env, tg, update.message, session, {});
          if (handled) return;
        }
      }
    }
    await routeUpdate(env, tg, update);
  } catch (e) {
    console.error("processUpdate error:", e);
  }
}

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj, null, 2), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
