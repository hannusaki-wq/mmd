# SSO Telegram Bot — Cloudflare Workers + D1

ربات مدیریت گروه تلگرام که از پایتون به JavaScript تبدیل شده و روی Cloudflare Workers اجرا می‌شود.

## 🚀 پیش‌نیازها

- Node.js 18+
- حساب Cloudflare (Free tier کافی است)
- `wrangler` CLI (`npm i -g wrangler`)
- یک ربات تلگرام و توکن آن (از [@BotFather](https://t.me/BotFather))

## 📦 نصب و راه‌اندازی

### ۱. نصب وابستگی‌ها

```bash
npm install
```

### ۲. لاگین به Cloudflare

```bash
wrangler login
```

### ۳. ساخت D1 Database

```bash
wrangler d1 create sso-bot-db
```

خروجی شامل `database_id` است. آن را در `wrangler.toml` جایگزین کنید:

```toml
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### ۴. اجرای schema

```bash
wrangler d1 execute sso-bot-db --file=./schema.sql --remote
```

### ۵. تنظیم BOT_TOKEN به عنوان secret

```bash
wrangler secret put BOT_TOKEN
# سپس توکن ربات را paste کنید
```

### ۶. Deploy

```bash
wrangler deploy
```

### ۷. تنظیم Webhook

آدرس Worker خود را در مرورگر باز کنید:

```
https://<your-worker>.workers.dev/set-webhook
```

پاسخ `{"ok":true,...}` را باید ببینید.

### ۸. تست

به ربات پیام `/start` بدهید. اولین کاربری که پیام می‌دهد به عنوان **ادمین اصلی** تعیین می‌شود.

## ⚙️ دستورات ربات

| دستور | توضیح |
|-------|-------|
| `/start` | شروع + انتخاب زبان |
| `/db` | پنل مدیریت دیتابیس (مشاهده، افزودن، حذف) |
| `/addtoclipboard` | شروع دریافت رگباری محتوا |
| `/listtext` | لیست کلیپ‌بورد |
| `/setadminchat` | ست کردن گروه ادمین‌ها |
| `/addadmin [id]` | افزودن ادمین |
| `/setspeed [sec]` | تغییر سرعت ارسال |
| `/setreaction [emoji]` | تغییر ریکشن پیش‌فرض |
| `/groups` | گروه‌های شناخته‌شده |
| `/addtarget [id]` | افزودن گروه هدف |
| `/listtarget` | لیست گروه‌های هدف |
| `/lockreply [uid] [gid]` | قفل ریپلای کاربر در گروه |
| `/listlocks` | لیست قفل‌ها |
| `/linkreply` | ارسال انبوه روی یک پست خاص |
| `/tagflow` | شروع فلود تگ (multi-step) |
| `/cancelflow` | توقف فلود |
| `/listmsg` / `/setmsg` | متن‌های خروجی ربات |
| `/hiddenchat [gid]` | چت ناشناس به یک گروه |
| `/stophidden` | خروج از چت ناشناس |

## ⚠️ محدودیت‌های Cloudflare Workers

- **TagFlow و LinkReply** از `ctx.waitUntil()` استفاده می‌کنند که محدودیت **~30 ثانیه** دارد. اگر `count × target_count × speed` از این تجاوز کند، عملیات نیمه‌کاره متوقف می‌شود.
  - راه‌حل: تعداد را کمتر کنید یا `speed` را کاهش دهید.
  - برای flows بسیار طولانی، از **Cloudflare Queues** استفاده کنید (پلن Paid).
- **CPU Time**: نسخه Free دارای 10ms CPU per request است (I/O زمان‌بند جدا از CPU است).
- **Sub-requests**: حداکثر 50 subrequest per invocation (برای Free). هر پیام تلگرام = 1 subrequest.

## 🔧 دیباگ

مشاهده لاگ‌های زنده:

```bash
wrangler tail
```

تست روی سرور محلی (با D1 لوکال):

```bash
npm run db:init:local
wrangler dev
# سپس به http://localhost:8787/set-webhook با ngrok یا cloudflared tunnel نیاز دارید
# یا از polling برای تست استفاده کنید
```

## 📊 ساختار دیتابیس

جدول‌های D1:
- `config` — تنظیمات کلید/مقدار
- `admins` — ادمین‌ها
- `target_chats` — گروه‌های هدف
- `clipboard` — محتوای کلیپ‌بورد
- `reply_locks` — قفل‌های ریپلای
- `custom_msgs` — متن‌های سفارشی
- `known_groups` — گروه‌های شناسایی‌شده
- `sessions` — وضعیت مکالمات چندمرحله‌ای
- `cancel_flags` — پرچم کنسل flow
- `pages` — صفحه‌بندی
- `pinned_lang_msgs` — پیام‌های پین‌شده
- `pointers` — اشاره‌گرهای چرخه کلیپ‌بورد

## 📝 تغییرات نسبت به نسخه Python

1. **Polling → Webhook**: Workers از polling پشتیبانی نمی‌کند، بنابراین از webhook استفاده می‌شود.
2. **JSON file → D1**: تمام state در D1 ذخیره می‌شود.
3. **`register_next_step_handler` → sessions table**: مکالمات چندمرحله‌ای از طریق `sessions` D1 پیاده‌سازی شده.
4. **`in-memory dicts` → D1**: `user_sessions`, `cancel_flags`, `page_store`, `db_pending_actions` همه در D1 ذخیره می‌شوند (چون Workers stateless است).
5. **فلودها**: با `ctx.waitUntil` اجرا می‌شوند (محدودیت ۳۰ ثانیه).

## 🆘 عیب‌یابی

**ربات جواب نمی‌دهد:**
```bash
wrangler tail
# و آدرس /set-webhook را باز کنید و مجدد بررسی کنید
```

**خطای `no such table`:**
```bash
wrangler d1 execute sso-bot-db --file=./schema.sql --remote
```

**خطای callback_data too long:**
اگر روی برخی عملیات حذف آیتم خطا گرفتید، آیتم را از CLI پاک کنید:
```bash
wrangler d1 execute sso-bot-db --command="DELETE FROM clipboard WHERE id='xxx'" --remote
```

## 📄 License

MIT
