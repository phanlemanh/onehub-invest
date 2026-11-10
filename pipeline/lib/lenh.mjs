// lenh.mjs — Lệnh có khuôn (TV4 `so-lenh-bo-ap`, ADR-0015). Hai phần:
//   - kiemLenh: hàm thuần kiểm khuôn — bản TS chẵn ở app/src/lib/lenh.ts (test SL-AC-5b so từng ô);
//   - apLenh: áp một lệnh vào source_registry ở máy thu trong MỘT giao dịch, chống lặp bằng sổ áp.
// Danh sách loại (§4), khoá cấm (§7) là nguyên văn ADR-0015; test rút lại từ ADR và so.
import { LOAI_LENH } from "./loai-lenh.mjs";
import { isRunnable } from "./vong-doi.mjs";

/** 14 loại lệnh của ADR-0015 §4 — bằng CHECK change_requests_type_chk của 091 (danh sách ở loai-lenh.mjs). */
export { LOAI_LENH };

/** Loại đã có bộ áp ở vòng này. Loại khác trong 14 vẫn bị từ chối tới hàng của nó (TV5–TV8). */
export const LOAI_CO_BO_AP = Object.freeze(["source.pause", "source.resume"]);

/** 11 khoá cấm của ADR-0015 §7 (an toàn Zalo, luật 8) — nguyên dạng văn bản; `x.*` cấm x và mọi khoá con. */
export const KHOA_CAM = Object.freeze([
  "bindings", "channels.zalo", "plugins.entries.zalo", "agents.*", "talk", "commands.*",
  "hooks.internal.*", "pluginHooks", "groupPolicy", "groupAllowFrom", "requireMention",
]);

/** Khoá payload cho phép theo loại. */
const KHOA_PAYLOAD = Object.freeze({ "source.pause": ["reason", "resume_when"], "source.resume": [] });

const laDoiTuong = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

/** Khoá cấm đầu tiên (theo thứ tự KHOA_CAM) khớp một dãy đoạn liên tiếp của đường khoá, ở bất kỳ cấp nào. */
function khoaCamCua(duong) {
  for (const k of KHOA_CAM) {
    const doan = k.replace(/\.\*$/, "").split(".");
    for (let i = 0; i + doan.length <= duong.length; i++) {
      if (doan.every((d, j) => duong[i + j] === d)) return k;
    }
  }
  return null;
}

/** Đi mọi đối tượng/mảng của `v`; trả khoá cấm đầu tiên gặp (theo duyệt sâu trước), hoặc null. */
function timKhoaCam(v, duong = []) {
  if (Array.isArray(v)) {
    for (const x of v) {
      const k = timKhoaCam(x, duong);
      if (k) return k;
    }
    return null;
  }
  if (!laDoiTuong(v)) return null;
  for (const [ten, x] of Object.entries(v)) {
    const d = [...duong, ten];
    const k = khoaCamCua(d) ?? timKhoaCam(x, d);
    if (k) return k;
  }
  return null;
}

/**
 * Kiểm khuôn một lệnh. Thứ tự: loại → target → khoá cấm (mọi độ sâu của cả lệnh) → payload là đối tượng → khoá thừa →
 * reason (pause).
 * @param {{type?: unknown, target?: unknown, payload?: unknown}} cmd
 * @returns {{ok: true} | {ok: false, ly_do: string}}
 */
export function kiemLenh(cmd) {
  const type = cmd?.type;
  if (typeof type !== "string" || !LOAI_LENH.includes(type)) return { ok: false, ly_do: `loai-la:${String(type)}` };
  if (!LOAI_CO_BO_AP.includes(type)) return { ok: false, ly_do: `loai-chua-co-bo-ap:${type}` };
  if (typeof cmd.target !== "string" || !/^S\d{2}$/.test(cmd.target)) return { ok: false, ly_do: "target-sai-khuon" };
  const cam = timKhoaCam(cmd);
  if (cam) return { ok: false, ly_do: `khoa-cam:${cam}` };
  const payload = cmd.payload === undefined ? {} : cmd.payload;
  if (!laDoiTuong(payload)) return { ok: false, ly_do: "payload-sai-khuon" };
  const thua = Object.keys(payload).find((k) => !KHOA_PAYLOAD[type].includes(k));
  if (thua) return { ok: false, ly_do: `khoa-thua:${thua}` };
  if (type === "source.pause" && (typeof payload.reason !== "string" || payload.reason.trim() === "")) {
    return { ok: false, ly_do: "thieu-reason" };
  }
  return { ok: true };
}

const trangThaiNguon = (r) => (r ? { status: r.status, reason: r.reason ?? null, resume_when: r.resume_when ?? null } : null);

/** Kiểm sau áp mặc định: trạng thái đọc lại đúng đích và isRunnable khớp (pause → không chạy, resume → chạy). */
async function kiemSauMacDinh(client, cmd, sau) {
  const r = (await client.query(`SELECT status FROM source_registry WHERE code = $1`, [cmd.target])).rows[0];
  const quyet = isRunnable(r ?? null);
  const muon = cmd.type === "source.pause" ? { status: "paused", run: false } : { status: "active", run: true };
  if (r?.status !== muon.status || quyet.run !== muon.run || sau.status !== muon.status) {
    throw new Error(`${cmd.target} ${r?.status} run=${quyet.run}`);
  }
}

/**
 * Áp một lệnh đã duyệt vào source_registry (máy thu) — đúng một lần theo idempotency_key.
 * Giao dịch: chiếm dòng sổ áp (ON CONFLICT DO NOTHING) → khoá dòng nguồn → tiền điều kiện → UPDATE → kiểm sau → nhật ký.
 * Đã có dòng sổ → trả kết quả cũ, không ghi gì. Kiểm sau ném → ROLLBACK, ghi sổ `reverted` ở giao dịch mới.
 * @param {import("pg").Client} client
 * @param {{id: string, type: string, target: string, payload?: object, idempotency_key: string, requested_by?: string, approved_by?: string}} cmd
 * @param {{kiemSau?: (client: import("pg").Client, cmd: object, sau: object) => Promise<void>}} [opts]
 */
export async function apLenh(client, cmd, { kiemSau = kiemSauMacDinh } = {}) {
  const kq = (outcome, before, after, ly_do, applied_at) => ({
    id: cmd.id, idempotency_key: cmd.idempotency_key, outcome, before, after, ...(ly_do ? { ly_do } : {}), applied_at,
  });
  const ghiSo = async (outcome, before, after, ly_do) => {
    const { rows } = await client.query(
      `UPDATE change_request_applies SET outcome = $2, before = $3::jsonb, after = $4::jsonb,
              detail = $5::jsonb, applied_at = now()
        WHERE idempotency_key = $1 RETURNING applied_at`,
      [cmd.idempotency_key, outcome, JSON.stringify(before), JSON.stringify(after), JSON.stringify(ly_do ? { ly_do } : {})],
    );
    return rows[0].applied_at;
  };
  const kiem = kiemLenh(cmd);
  await client.query("BEGIN");
  try {
    const chiem = await client.query(
      `INSERT INTO change_request_applies (idempotency_key, change_request_id, type, target)
       VALUES ($1, $2, $3, $4) ON CONFLICT (idempotency_key) DO NOTHING`,
      [cmd.idempotency_key, cmd.id, cmd.type, cmd.target],
    );
    if (chiem.rowCount === 0) {
      await client.query("ROLLBACK");
      const cu = (await client.query(`SELECT * FROM change_request_applies WHERE idempotency_key = $1`, [cmd.idempotency_key])).rows[0];
      return kq(cu.outcome, cu.before, cu.after, cu.detail?.ly_do, cu.applied_at);
    }
    if (!kiem.ok) {
      const at = await ghiSo("failed", null, null, kiem.ly_do);
      await client.query("COMMIT");
      return kq("failed", null, null, kiem.ly_do, at);
    }
    const r = (await client.query(
      `SELECT status, reason, resume_when FROM source_registry WHERE code = $1 FOR UPDATE`, [cmd.target],
    )).rows[0];
    const truoc = trangThaiNguon(r);
    const can = cmd.type === "source.pause" ? "active" : "paused";
    if (!r || r.status !== can) {
      const ly_do = `tien-dieu-kien:nguon-${r ? r.status : "khong-co"}`;
      const at = await ghiSo("failed", truoc, truoc, ly_do);
      await client.query("COMMIT");
      return kq("failed", truoc, truoc, ly_do, at);
    }
    const p = cmd.payload ?? {};
    const moi = cmd.type === "source.pause"
      ? { status: "paused", reason: p.reason.trim(), resume_when: p.resume_when?.trim() ? p.resume_when.trim() : null }
      : { status: "active", reason: null, resume_when: null };
    await client.query(
      `UPDATE source_registry SET status = $2, reason = $3, resume_when = $4 WHERE code = $1`,
      [cmd.target, moi.status, moi.reason, moi.resume_when],
    );
    const sau = trangThaiNguon((await client.query(
      `SELECT status, reason, resume_when FROM source_registry WHERE code = $1`, [cmd.target],
    )).rows[0]);
    try {
      await kiemSau(client, cmd, sau);
    } catch (e) {
      throw Object.assign(new Error(`kiem-sau: ${e?.message ?? e}`), { kiemSau: true });
    }
    await client.query(
      `INSERT INTO ops_audit (actor, action, env, detail) VALUES ('machine:ops-apply', $1, 'local', $2::jsonb)`,
      [`change_request.${cmd.type}`, JSON.stringify({
        change_request_id: cmd.id, idempotency_key: cmd.idempotency_key, target: cmd.target,
        requested_by: cmd.requested_by ?? null, approved_by: cmd.approved_by ?? null, before: truoc, after: sau,
      })],
    );
    const at = await ghiSo("applied", truoc, sau, null);
    await client.query("COMMIT");
    return kq("applied", truoc, sau, null, at);
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    if (!e?.kiemSau) throw e;
    // Kiểm sau hỏng: mọi ghi đã lùi; ghi sổ `reverted` (dòng chiếm cũng đã lùi nên chèn lại).
    const truoc = trangThaiNguon((await client.query(
      `SELECT status, reason, resume_when FROM source_registry WHERE code = $1`, [cmd.target],
    )).rows[0]);
    const { rows } = await client.query(
      `INSERT INTO change_request_applies (idempotency_key, change_request_id, type, target, outcome, before, after, detail)
       VALUES ($1, $2, $3, $4, 'reverted', $5::jsonb, $5::jsonb, $6::jsonb)
       ON CONFLICT (idempotency_key) DO NOTHING RETURNING applied_at`,
      [cmd.idempotency_key, cmd.id, cmd.type, cmd.target, JSON.stringify(truoc), JSON.stringify({ ly_do: "kiem-sau-hong" })],
    );
    return kq("reverted", truoc, truoc, "kiem-sau-hong", rows[0]?.applied_at ?? null);
  }
}
