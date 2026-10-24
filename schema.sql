-- تنظیمات کلی (key/value)
CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- ادمین‌ها
CREATE TABLE IF NOT EXISTS admins (
  user_id INTEGER PRIMARY KEY
);

-- اهداف (گروه‌های هدف برای tagflow)
CREATE TABLE IF NOT EXISTS target_chats (
  chat_id INTEGER PRIMARY KEY
);

-- کلیپ‌بورد
CREATE TABLE IF NOT EXISTS clipboard (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  content TEXT,
  file_id TEXT,
  caption TEXT,
  timestamp REAL NOT NULL
);

-- قفل‌های ریپلای
CREATE TABLE IF NOT EXISTS reply_locks (
  user_id INTEGER NOT NULL,
  group_id INTEGER NOT NULL,
  PRIMARY KEY (user_id, group_id)
);

-- متن‌های سفارشی
CREATE TABLE IF NOT EXISTS custom_msgs (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- گروه‌های شناخته‌شده
CREATE TABLE IF NOT EXISTS known_groups (
  chat_id TEXT PRIMARY KEY,
  title TEXT NOT NULL
);

-- سشن کاربران (next_step_handler معادل)
CREATE TABLE IF NOT EXISTS sessions (
  user_id INTEGER PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at REAL NOT NULL
);

-- وضعیت کنسل flow
CREATE TABLE IF NOT EXISTS cancel_flags (
  user_id INTEGER PRIMARY KEY,
  cancelled INTEGER NOT NULL DEFAULT 0
);

-- صفحه‌بندی
CREATE TABLE IF NOT EXISTS pages (
  key TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at REAL NOT NULL
);

-- پین زبان (برای /start)
CREATE TABLE IF NOT EXISTS pinned_lang_msgs (
  chat_id TEXT PRIMARY KEY,
  message_id INTEGER NOT NULL
);

-- اشاره‌گرهای چرخه کلیپ‌بورد
CREATE TABLE IF NOT EXISTS pointers (
  key TEXT PRIMARY KEY,
  value INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_clipboard_ts ON clipboard(timestamp);
CREATE INDEX IF NOT EXISTS idx_pages_created ON pages(created_at);
