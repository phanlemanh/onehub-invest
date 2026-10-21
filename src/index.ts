import { serve } from "@hono/node-server";

import app from "./app.js";

const port = Number(process.env.PORT ?? 3001);

console.log(`🚀 OneHub Data API running on :${port}`);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Listening on http://localhost:${info.port}`);
});
