import { serve } from "@hono/node-server";

import app from "./app.js";
import { authConfig, MISSING_KEYS_MESSAGE } from "./middleware/auth.js";

// Môi trường đóng mà thiếu khoá: không khởi động (PB3). Middleware vẫn đóng mọi lời gọi cho lối vào không qua tệp này (Vercel).
const { open, keys } = authConfig();
if (!open && keys.length === 0) {
  console.error(MISSING_KEYS_MESSAGE);
  process.exit(1);
}

const port = Number(process.env.PORT ?? 3001);

console.log(`🚀 OneHub Data API running on :${port}`);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Listening on http://localhost:${info.port}`);
});
