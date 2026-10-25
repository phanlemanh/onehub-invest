// ops-flow.mjs — phần số «ống Zalo» của push-ops-facts.mjs tách ra để đo được (ON8 `gio-ops-gio-vn`):
// push-ops-facts.mjs chạy main() (đẩy lên cloud) ngay khi nạp nên phép đo không import nó.
// Ngày theo giờ VN: funnel «hôm nay» và số Zalo theo ngày cùng khoá với «Luồng 7 ngày» của app.
import { VN_DAY_SQL, vnDayKey, vnDayStart } from "./vn-day.mjs";

const EMPTY = { messages: 0, passed: 0, skipped: 0, accepted: 0, media: 0 };

// ---- 1. Funnel cổng + health từ hook log ----
export function parseLog(text, { now = Date.now() } = {}) {
  const lines = text.split("\n").filter(Boolean);
  // «Hôm nay» theo ngày VN (ON8) — hook ghi mốc ISO «Z» (collector/openclaw/handler.js).
  const todayKey = vnDayKey(now);
  const cutoff = now - 7 * 86400000;
  const funnel = { today: { ...EMPTY }, last7: { ...EMPTY }, lastEventAt: null };
  const health = {
    connected: null, uptime24h: null, heartbeatAgeMin: null,
    lastHeartbeatAt: null, lastPostAt: null, silentAlert24h: false, driftAlert24h: false,
  };
  const groups = new Map();
  let up = 0, total = 0;
  for (const line of lines) {
    const ts = line.slice(0, 24);
    if (!/^\d{4}-\d{2}-\d{2}T/.test(ts)) continue;
    const t = new Date(ts).getTime();
    if (!Number.isFinite(t)) continue; // mốc hỏng/cắt cụt: bỏ dòng, không làm hỏng cả lượt đẩy số (ON8 AC-10)
    if (line.includes(" heartbeat ")) {
      health.lastHeartbeatAt = ts;
      if (now - t <= 86400000) {
        total++;
        if (line.includes(" up ")) up++;
      }
    } else if (line.includes(" post 202")) {
      health.lastPostAt = ts;
    } else if (line.includes(" alert silent-gate") && now - t <= 86400000) health.silentAlert24h = true;
    else if (line.includes(" alert drift") && now - t <= 86400000) health.driftAlert24h = true;
    if (/ (heartbeat|alert) /.test(line)) continue;
    funnel.lastEventAt = ts;
    for (const b of [t >= cutoff ? funnel.last7 : null, vnDayKey(t) === todayKey ? funnel.today : null]) {
      if (!b) continue;
      b.messages++;
      if (line.includes(" post 202")) {
        b.passed++;
        b.accepted += Number(line.match(/"accepted":(\d+)/)?.[1] ?? 0);
      } else if (/ skip /.test(line)) b.skipped++;
      if (/media/i.test(line)) b.media++;
    }
    const g = line.match(/group=(.+?)(?:\s+p=|\s+account=|$)/)?.[1];
    const acc = line.match(/account=([a-z0-9-]+)/)?.[1];
    if (g) {
      const r = groups.get(g) ?? { name: g, seen: 0, passed: 0, skipped: 0, accepted: 0, acceptedSeen: false, ownerAccount: acc ?? null, lastEventAt: ts };
      r.seen++;
      if (line.includes(" post 202")) {
        r.passed++;
        r.ownerAccount = r.ownerAccount ?? acc ?? null;
        // ON4: «Vào bảng thô» theo nhóm — cùng luật với funnel tổng và gateByGroup của trang máy thu.
        const n = line.match(/"accepted":(\d+)/)?.[1];
        if (n != null) { r.accepted += Number(n); r.acceptedSeen = true; }
      } else if (/ skip /.test(line)) r.skipped++;
      r.lastEventAt = ts;
      groups.set(g, r);
    }
  }
  health.uptime24h = total > 0 ? up / total : null;
  health.connected = health.lastHeartbeatAt
    ? lines.filter((l) => l.includes(" heartbeat ")).at(-1)?.includes(" up ") ?? false
    : null;
  health.heartbeatAgeMin = health.lastHeartbeatAt
    ? Math.round((now - new Date(health.lastHeartbeatAt).getTime()) / 60000)
    : null;
  // Nhóm đã qua cổng mà không dòng nào mang `accepted` (khuôn cũ của handler): không biết số tin vào → null, không 0.
  const groupRows = [...groups.values()].map(({ acceptedSeen, ...r }) => ({ ...r, accepted: r.passed > 0 && !acceptedSeen ? null : r.accepted }));
  return { funnel, health, groups: groupRows };
}

// ---- Luồng 7 ngày, hai cột S03 (ON5 `luong-7-ngay-dung-so`) ----
// MỘT định nghĩa cho bên ghi (khối `luong7` của bản tin) và `getFlowDays` của app ở máy thu — app chép nguyên văn hai câu
// SQL này (app/src/lib/collections-queries.ts); app/tests/luong-7-ngay-dung-so.test.tsx (ON5-AC-4) giữ hai bên khớp.
// Cùng đồng hồ «ngày đăng»: bài theo posted_at, tin theo first_seen (= giờ đăng bài sớm nhất) — tin không vượt bài.
/** Bài S03 thật (tác tử thu `zalo-agent`, không mock) theo ngày VN của `posted_at`. $1 = mốc 00:00 giờ VN ngày cũ nhất. */
export const S03_POSTS_SQL = `SELECT ${VN_DAY_SQL("posted_at")} d, count(*)::int n FROM stg_zalo_posts WHERE posted_at >= $1 AND snapshot_id LIKE '%zalo-agent%' GROUP BY 1`;
/** Tin rao nguồn S03 theo ngày VN của `first_seen`. $1 như trên. */
export const S03_OFFERS_SQL = `SELECT ${VN_DAY_SQL("first_seen")} d, count(*)::int n FROM sale_offers WHERE first_seen >= $1 AND source = 'S03' GROUP BY 1`;

/** Hai cột S03 cho `n` ngày VN tính tới `now`, cũ → mới, ngày không có dòng = 0: [{ day, s03Posts, s03Offers }]. */
export async function luong7(client, { now = Date.now(), n = 7 } = {}) {
  const since = vnDayStart(vnDayKey(now - (n - 1) * 86400000));
  const [posts, offers] = await Promise.all([client.query(S03_POSTS_SQL, [since]), client.query(S03_OFFERS_SQL, [since])]);
  const P = new Map(posts.rows.map((r) => [r.d, r.n]));
  const O = new Map(offers.rows.map((r) => [r.d, r.n]));
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const day = vnDayKey(now - i * 86400000);
    days.push({ day, s03Posts: P.get(day) ?? 0, s03Offers: O.get(day) ?? 0 });
  }
  return days;
}

/** Số Zalo theo ngày VN cho 7 ngày VN gần nhất (tính tới `now`): { "YYYY-MM-DD": { posts?, offers? } }.
 * Khoá cũ `zaloFlow` của bản tin — giữ cho bản app đang chạy; app từ ON5 đọc khối `luong7`. */
export async function zaloFlow(client, { now = Date.now(), n = 7 } = {}) {
  const since = vnDayStart(vnDayKey(now - (n - 1) * 86400000));
  const [offerRows, postRows] = await Promise.all([
    client.query(`SELECT ${VN_DAY_SQL("first_seen")} d, count(*)::int offers FROM sale_offers WHERE first_seen >= $1 GROUP BY 1`, [since]),
    client.query(
      `SELECT ${VN_DAY_SQL("captured_at")} d, count(*)::int posts FROM stg_zalo_posts WHERE captured_at >= $1 AND snapshot_id LIKE '%zalo-agent%' GROUP BY 1`,
      [since],
    ),
  ]);
  const flow = {};
  for (const r of offerRows.rows) flow[r.d] = { offers: r.offers };
  for (const r of postRows.rows) flow[r.d] = { ...(flow[r.d] ?? {}), posts: r.posts };
  return flow;
}
