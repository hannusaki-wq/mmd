export const LANGUAGES = {
  fa: { name: "🇮🇷 فارسی" },
  en: { name: "🇬🇧 English" },
  zh: { name: "🇨🇳 中文" },
  fr: { name: "🇫🇷 Français" },
};

export const TEXTS = {
  fa: {
    select_language: "🌐 <b>لطفاً زبان مورد نظر خود را انتخاب کنید:</b>",
    lang_changed: "✅ زبان ربات با موفقیت تغییر یافت.",
    welcome: "🤖 <b>به پنل مدیریت ربات پیشرفته خوش آمدید.</b>",
    unauthorized: "❌ شما دسترسی به مدیریت این ربات را ندارید.",
    start_send: "⏳ عملیات ارسال آغاز شد...",
    end_send: "✅ عملیات ارسال با موفقیت پایان یافت.",
    empty_target: "❌ لیست گروه‌های هدف خالی است! ابتدا با /addtarget گروه‌ها را مشخص کنید.",
    invalid_idx: "❌ شناسه یا آیدی عددی وارد شده اشتباه یا نامعتبر است.",
    flow_step1: "🎯 <b>مرحله اول:</b> لطفاً آیدی‌های عددی کاربران را با فاصله از هم بفرستید:\nمثال: <code>12345 67890</code>\n\n🛑 برای توقف: /cancelflow",
    flow_step2: "🔢 <b>مرحله دوم:</b> تعداد پیام‌های ارسالی برای فلود را وارد کنید:\n\n🛑 برای توقف: /cancelflow",
    flow_step3: "📝 <b>مرحله سوم:</b> نوع متن را مشخص کنید. یکی از دکمه‌های زیر را بزنید:",
    flow_custom_prompt: "💬 متن سفارشی خود را برای فلود ارسال کنید:",
    flow_cancelled: "🛑 عملیات تگ‌فلو متوقف شد.",
    flow_cancel_no_active: "❌ هیچ عملیات تگ‌فلو فعالی برای توقف وجود ندارد.",
    flow_already_running: "⚠️ یک عملیات تگ‌فلو برای شما در حال اجراست. ابتدا با /cancelflow متوقف کنید.",
    flow_cancel_requested: "🛑 درخواست توقف ثبت شد؛ در حال متوقف کردن...",
    btn_custom: "✍️ متن سفارشی جدید",
    btn_periodic: "🔄 استفاده دوره‌ای از کلیپ‌بورد",
    btn_periodic_flow: "🎲 انتخاب دوره‌ای از کلیپ‌بورد",
    clipboard_empty: "❌ کلیپ‌بورد شما خالی است!",
    cancelled: "❌ لغو شد.",
    count_must_be_number: "❌ تعداد وارد شده باید عدد باشد. لغو شد.",
    invalid_ids: "❌ آیدی‌ها نامعتبر بودند. لغو شد.",
    help:
      "👑 <b>تنظیمات مدیریتی:</b>\n" +
      "🔹 <code>/db</code> ➔ 🗄️ پنل مدیریت دیتابیس\n" +
      "🔹 <code>/setadminchat</code> | <code>/addadmin</code>\n\n" +
      "📋 <b>مخزن و کلیپ‌بورد:</b>\n" +
      "🔹 <code>/addtoclipboard</code> ➔ شروع دریافت رگباری\n" +
      "🔹 <code>/listtext</code> ➔ لیست کلیپ‌بورد\n\n" +
      "🎯 <b>🔒 قفل ریپلای ۱ (تعقیب زنده):</b>\n" +
      "🔹 <code>/lockreply [آیدی_کاربر] [آیدی_گروه]</code>\n" +
      "🔹 <code>/listlocks</code> ➔ مشاهده افراد تحت تعقیب\n\n" +
      "🔗 <b>💬 قفل ریپلای ۲ (اسپم روی پست):</b>\n" +
      "🔹 <code>/linkreply</code> ➔ ریپلای رگباری روی لینک\n\n" +
      "⚙️ <b>اهداف و ارسال انبوه تگ:</b>\n" +
      "🔹 <code>/listmsg</code> | <code>/setmsg</code>\n" +
      "🔹 <code>/groups</code> | <code>/addtarget</code>\n" +
      "🔹 <code>/listtarget</code> ➔ مشاهده لیست اهداف\n" +
      "🔹 <code>/setspeed [ثانیه]</code>\n" +
      "🔹 <code>/tagflow</code> ➔ شروع فلود تگ\n" +
      "🔹 <code>/cancelflow</code> ➔ 🛑 توقف عملیات تگ‌فلو",
  },
  en: {
    select_language: "🌐 <b>Please select your language:</b>",
    lang_changed: "✅ Language changed successfully.",
    welcome: "🤖 <b>Welcome to the advanced bot admin panel.</b>",
    unauthorized: "",
    start_send: "⏳ Sending operation started...",
    end_send: "✅ Operation completed successfully.",
    empty_target: "❌ Target group list is empty! Use /addtarget first.",
    invalid_idx: "❌ The entered numeric ID is invalid.",
    flow_step1: "🎯 <b>Step 1:</b> Send numeric user IDs separated by spaces:\nExample: <code>12345 67890</code>\n\n🛑 To stop: /cancelflow",
    flow_step2: "🔢 <b>Step 2:</b> Enter the number of messages:\n\n🛑 To stop: /cancelflow",
    flow_step3: "📝 <b>Step 3:</b> Choose the text source:",
    flow_custom_prompt: "💬 Send your custom text for the flow:",
    flow_cancelled: "🛑 Tagflow operation cancelled.",
    flow_cancel_no_active: "❌ No active tagflow operation to cancel.",
    flow_already_running: "⚠️ A tagflow is already running. Use /cancelflow first.",
    flow_cancel_requested: "🛑 Cancel requested; stopping...",
    btn_custom: "✍️ New custom text",
    btn_periodic: "🔄 Periodic clipboard use",
    btn_periodic_flow: "🎲 Periodic selection from clipboard",
    clipboard_empty: "❌ Your clipboard is empty!",
    cancelled: "❌ Cancelled.",
    count_must_be_number: "❌ Count must be a number. Cancelled.",
    invalid_ids: "❌ Invalid IDs. Cancelled.",
    help:
      "👑 <b>Admin Settings:</b>\n" +
      "🔹 <code>/db</code> ➔ 🗄️ Database management panel\n" +
      "🔹 <code>/setadminchat</code> | <code>/addadmin</code>\n\n" +
      "📋 <b>Clipboard:</b>\n" +
      "🔹 <code>/addtoclipboard</code> ➔ Start batch receiving\n" +
      "🔹 <code>/listtext</code> ➔ Clipboard list\n\n" +
      "🎯 <b>🔒 Reply Lock 1 (Live tracking):</b>\n" +
      "🔹 <code>/lockreply [user_id] [group_id]</code>\n" +
      "🔹 <code>/listlocks</code> ➔ View tracked users\n\n" +
      "🔗 <b>💬 Reply Lock 2 (Spam on post):</b>\n" +
      "🔹 <code>/linkreply</code> ➔ Bulk reply on a link\n\n" +
      "⚙️ <b>Targets & Bulk Tag:</b>\n" +
      "🔹 <code>/listmsg</code> | <code>/setmsg</code>\n" +
      "🔹 <code>/groups</code> | <code>/addtarget</code>\n" +
      "🔹 <code>/listtarget</code> ➔ View target list\n" +
      "🔹 <code>/setspeed [seconds]</code>\n" +
      "🔹 <code>/tagflow</code> ➔ Start tag flood\n" +
      "🔹 <code>/cancelflow</code> ➔ 🛑 Stop tagflow",
  },
  zh: {
    select_language: "🌐 <b>请选择您的语言：</b>",
    lang_changed: "✅ 语言修改成功。",
    welcome: "🤖 <b>欢迎使用高级机器人管理面板。</b>",
    unauthorized: "",
    start_send: "⏳ 发送操作已开始...",
    end_send: "✅ 操作成功完成。",
    empty_target: "❌ 目标群组列表为空！请先使用 /addtarget。",
    invalid_idx: "❌ 输入的ID无效。",
    flow_step1: "🎯 <b>第一步：</b> 发送用空格分隔的用户ID：\n例如：<code>12345 67890</code>\n\n🛑 停止：/cancelflow",
    flow_step2: "🔢 <b>第二步：</b> 输入消息数量：\n\n🛑 停止：/cancelflow",
    flow_step3: "📝 <b>第三步：</b> 选择文本来源：",
    flow_custom_prompt: "💬 请发送自定义文本：",
    flow_cancelled: "🛑 标签流操作已取消。",
    flow_cancel_no_active: "❌ 没有活跃的标签流操作。",
    flow_already_running: "⚠️ 您已有标签流正在运行。请先用 /cancelflow 取消。",
    flow_cancel_requested: "🛑 已请求取消；正在停止...",
    btn_custom: "✍️ 新建自定义文本",
    btn_periodic: "🔄 周期性使用剪贴板",
    btn_periodic_flow: "🎲 从剪贴板周期性选择",
    clipboard_empty: "❌ 您的剪贴板为空！",
    cancelled: "❌ 已取消。",
    count_must_be_number: "❌ 数量必须是数字。已取消。",
    invalid_ids: "❌ ID 无效。已取消。",
    help:
      "👑 <b>管理员设置：</b>\n" +
      "🔹 <code>/db</code> ➔ 🗄️ 数据库管理面板\n" +
      "🔹 <code>/setadminchat</code> | <code>/addadmin</code>\n\n" +
      "📋 <b>剪贴板：</b>\n" +
      "🔹 <code>/addtoclipboard</code> ➔ 开始批量接收\n" +
      "🔹 <code>/listtext</code> ➔ 剪贴板列表\n\n" +
      "🎯 <b>🔒 回复锁定 1（实时跟踪）：</b>\n" +
      "🔹 <code>/lockreply [用户ID] [群组ID]</code>\n" +
      "🔹 <code>/listlocks</code> ➔ 查看跟踪的用户\n\n" +
      "🔗 <b>💬 回复锁定 2（特定帖子刷屏）：</b>\n" +
      "🔹 <code>/linkreply</code> ➔ 特定链接批量回复\n\n" +
      "⚙️ <b>目标和批量标签：</b>\n" +
      "🔹 <code>/listmsg</code> | <code>/setmsg</code>\n" +
      "🔹 <code>/groups</code> | <code>/addtarget</code>\n" +
      "🔹 <code>/listtarget</code> ➔ 查看目标列表\n" +
      "🔹 <code>/setspeed [秒]</code>\n" +
      "🔹 <code>/tagflow</code> ➔ 开始标签洪流\n" +
      "🔹 <code>/cancelflow</code> ➔ 🛑 停止标签流",
  },
  fr: {
    select_language: "🌐 <b>Veuillez sélectionner votre langue :</b>",
    lang_changed: "✅ Langue changée avec succès.",
    welcome: "🤖 <b>Bienvenue dans le panneau d'administration avancé.</b>",
    unauthorized: "",
    start_send: "⏳ Opération d'envoi démarrée...",
    end_send: "✅ Opération terminée avec succès.",
    empty_target: "❌ La liste des groupes cibles est vide ! Utilisez /addtarget d'abord.",
    invalid_idx: "❌ L'ID numérique saisi est invalide.",
    flow_step1: "🎯 <b>Étape 1 :</b> Envoyez les ID numériques séparés par des espaces :\nExemple : <code>12345 67890</code>\n\n🛑 Pour arrêter : /cancelflow",
    flow_step2: "🔢 <b>Étape 2 :</b> Entrez le nombre de messages :\n\n🛑 Pour arrêter : /cancelflow",
    flow_step3: "📝 <b>Étape 3 :</b> Choisissez la source du texte :",
    flow_custom_prompt: "💬 Envoyez votre texte personnalisé :",
    flow_cancelled: "🛑 Opération Tagflow annulée.",
    flow_cancel_no_active: "❌ Aucune opération tagflow active.",
    flow_already_running: "⚠️ Un tagflow est déjà en cours. Utilisez /cancelflow d'abord.",
    flow_cancel_requested: "🛑 Annulation demandée ; arrêt en cours...",
    btn_custom: "✍️ Nouveau texte personnalisé",
    btn_periodic: "🔄 Utilisation périodique du presse-papiers",
    btn_periodic_flow: "🎲 Sélection périodique depuis le presse-papiers",
    clipboard_empty: "❌ Votre presse-papiers est vide !",
    cancelled: "❌ Annulé.",
    count_must_be_number: "❌ Le nombre doit être numérique. Annulé.",
    invalid_ids: "❌ ID invalides. Annulé.",
    help:
      "👑 <b>Paramètres admin :</b>\n" +
      "🔹 <code>/db</code> ➔ 🗄️ Panneau de gestion de base de données\n" +
      "🔹 <code>/setadminchat</code> | <code>/addadmin</code>\n\n" +
      "📋 <b>Presse-papiers :</b>\n" +
      "🔹 <code>/addtoclipboard</code> ➔ Démarrer la réception\n" +
      "🔹 <code>/listtext</code> ➔ Liste du presse-papiers\n\n" +
      "🎯 <b>🔒 Verrouillage 1 (Suivi en direct) :</b>\n" +
      "🔹 <code>/lockreply [user_id] [group_id]</code>\n" +
      "🔹 <code>/listlocks</code> ➔ Voir les utilisateurs suivis\n\n" +
      "🔗 <b>💬 Verrouillage 2 (Spam sur post) :</b>\n" +
      "🔹 <code>/linkreply</code> ➔ Réponse en masse sur un lien\n\n" +
      "⚙️ <b>Cibles et tag en masse :</b>\n" +
      "🔹 <code>/listmsg</code> | <code>/setmsg</code>\n" +
      "🔹 <code>/groups</code> | <code>/addtarget</code>\n" +
      "🔹 <code>/listtarget</code> ➔ Voir la liste des cibles\n" +
      "🔹 <code>/setspeed [secondes]</code>\n" +
      "🔹 <code>/tagflow</code> ➔ Démarrer le flood de tag\n" +
      "🔹 <code>/cancelflow</code> ➔ 🛑 Arrêter le tagflow",
  },
};

export const VALID_MSG_KEYS = [
  "select_language", "welcome", "unauthorized", "start_send", "end_send",
  "empty_target", "invalid_idx", "flow_step1", "flow_step2", "flow_step3",
  "flow_custom_prompt", "flow_cancelled", "help",
];

export function getMsg(key, lang, customMsgs = {}) {
  if (customMsgs && customMsgs[key]) return customMsgs[key];
  const langPack = TEXTS[lang] || TEXTS.fa;
  return langPack[key] ?? TEXTS.fa[key] ?? "";
}

export function langKeyboard(current, InlineKeyboard) {
  const kb = new InlineKeyboard();
  const row = [];
  for (const [code, info] of Object.entries(LANGUAGES)) {
    const label = (code === current ? "✅ " : "") + info.name;
    row.push({ text: label, callback_data: `lang_${code}` });
  }
  kb.add(...row);
  return kb;
}
