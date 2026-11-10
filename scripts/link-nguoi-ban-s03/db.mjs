// db.mjs — E6 (AC-6, backend-effect). Phần làn Claude: migration 080 trên DB thử trong giao dịch ROLLBACK — chạy hai lần không lỗi,
// có bảng stg hồ sơ và view dòng mới nhất, party_contacts nhận luật mới cho chat_profile, luật lạ và cặp sai bị từ chối.
// Phần bộ nạp (snapshot hồ sơ → stg, CHUA-AP-080, nạp lại) là của làn ZCode ở db-nap.mjs cùng thư mục; chưa có tệp đó thì thoát 2.
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { MIG_080, RULE_HO_SO, STG_HO_SO, daCo080 } from "../../pipeline/lib/nap-080.mjs";
import { nap079 } from "../../pipeline/lib/nap-079.mjs";
import { boKiem, trongGiaoDich } from "./chung.mjs";

async function tuChoi(c, sql, args) {
  await c.query("SAVEPOINT thu");
  try {
    await c.query(sql, args);
    await c.query("ROLLBACK TO SAVEPOINT thu");
    return false;
  } catch {
    await c.query("ROLLBACK TO SAVEPOINT thu");
    return true;
  }
}

export async function chay(argv) {
  const k = boKiem("db 080");
  await trongGiaoDich(async (c) => {
    await nap079(c);
    let loi = null;
    try { await c.query(MIG_080); await c.query(MIG_080); } catch (e) { loi = e.message; }
    k.kiem(`080 chạy hai lần không lỗi${loi ? ` (${loi})` : ""}`, loi === null);
    k.kiem("daCo080 nhận 080 đã áp", await daCo080(c));
    k.kiem("có bảng stg hồ sơ và view dòng mới nhất", (await c.query(
      "SELECT to_regclass($1) IS NOT NULL AND to_regclass('stg_s03_ho_so_moi_nhat') IS NOT NULL AS co", [STG_HO_SO])).rows[0].co);
    const p = (await c.query("SELECT party_key FROM parties WHERE status = 'active' LIMIT 1")).rows[0].party_key;
    const them = `INSERT INTO party_contacts (party_key, kind, value, evidence_tier, method, rule_id, evidence, run_id)
                  VALUES ($1, $2, $3, 'fact', 'source_field', $4, '{}', 'lnb-db')`;
    k.kiem("chat_profile + luật hồ sơ được nhận", !(await tuChoi(c, them, [p, "chat_profile", "lnb.thu", RULE_HO_SO])));
    k.kiem("luật lạ bị từ chối", await tuChoi(c, them, [p, "chat_profile", "lnb.thu2", "luat_la"]));
    k.kiem("luật hồ sơ cho liên lạc sdt bị từ chối", await tuChoi(c, them, [p, "sdt", "+84912000003", RULE_HO_SO]));
    k.kiem("luật số cho chat_profile bị từ chối", await tuChoi(c, them, [p, "chat_profile", "lnb.thu3", "so_tren_tin"]));
    k.kiem("giá trị dạng link bị từ chối", await tuChoi(c, them, [p, "chat_profile", "https://x/lnb", RULE_HO_SO]));
    // View lấy dòng mới nhất mỗi mã.
    await c.query(`INSERT INTO ${STG_HO_SO} (source_id, ma_tai_khoan, username, loai, captured_at) VALUES
      ('9__a', '9', 'cu', 'co-username', now() - interval '2 days'), ('9__b', '9', 'moi', 'co-username', now() - interval '1 day')`);
    k.kiem("view giữ dòng mới nhất mỗi mã", (await c.query(
      "SELECT username FROM stg_s03_ho_so_moi_nhat WHERE ma_tai_khoan = '9'")).rows.map((r) => r.username).join() === "moi");
  });
  const ma = k.ketThuc();
  if (ma) return ma;
  const nap = join(dirname(fileURLToPath(import.meta.url)), "db-nap.mjs");
  if (!existsSync(nap)) {
    console.error("db: CHƯA CÓ db-nap.mjs — phần bộ nạp của AC-6 (làn ZCode) chưa dựng, E6 chưa đo trọn");
    return 2;
  }
  return (await import(pathToFileURL(nap).href)).chay(argv);
}
