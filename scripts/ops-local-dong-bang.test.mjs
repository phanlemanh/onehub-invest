// ops-local-dong-bang.test.mjs — hồ sơ _acceptance/dong-bang-stage-b-resolve E4b, E6: thẻ Ghép căn đóng băng (V7).
// E4b (cần DB, chạy dưới db-thu --chay): bản tin cloud, báo cáo ngày, HD11 không đếm/nạp thẻ Ghép căn đang chờ; chiều đỏ là
//   câu của cây gốc vòng GOC_VONG (git show, ghim sha — đứng yên sau khi gộp) trên CÙNG mồi. Lược đồ tạm `dbs_mjs_<pid>` (review_queue LIKE public), xoá cuối lượt.
// E6 (không DB): mọi chuỗi vị từ chép bằng nhau; quét mọi câu FROM/JOIN review_queue của kho — mỗi câu có vị từ đóng băng
//   hoặc nằm trong danh sách miễn có lý do.
// Chạy: bash db/db-thu.sh oneinvest_suite_dbs_mjs --chay node --test scripts/ops-local-dong-bang.test.mjs
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { REVIEW_QUEUE_COUNT_SQL, THE_DONG_BANG_SQL as VI_TU_OPS, readReviewQueue } from "./lib/ops-local.mjs";
import { CONG_NGUOI_SQL, THE_DONG_BANG_SQL as VI_TU_BAO_CAO } from "./bao-cao-ngay.mjs";
import { CAU_THE, LOAI_THE, THE_DONG_BANG_SQL as VI_TU_HD11, docDuLieu } from "../pipeline/do-the-duyet.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const VI_TU_TS = /THE_DONG_BANG_SQL\s*=\s*"([^"]+)"/.exec(readFileSync(path.join(REPO, "app/src/lib/ops/review-dong-bang.ts"), "utf8"))?.[1];

// ───────────────────────── E6 — một vị từ, quét toàn kho ─────────────────────────

const GOC_QUET = ["app/src", "scripts", "pipeline", "agent/src", "agent/scripts", "data-api/src"];
const BO_QUA = (rel) => /(^|\/)(node_modules|tests?|\.next)(\/|$)|\.(test|itest)\.[a-z]+$|^scripts\/smoke-/.test(rel);
const DUOI = /\.(ts|tsx|mjs|js|cjs|sql)$/;

/** Danh sách miễn: tệp + mẫu nhận câu + lý do. Câu đọc thẻ của một loại khác, hay đọc theo mã thẻ, miễn tự động (dưới). */
export const MIEN = [
  { tep: "app/src/lib/ops/review-cho-ghep.ts", mau: /entity_match/, ly_do: "đóng băng ở hàm (GHEP_CAN_DONG_BANG trả rỗng, không truy vấn); câu giữ cho lúc gỡ" },
  { tep: "agent/scripts/judge-run.ts", mau: /./, ly_do: "judge-run đóng băng ở main (V7): không mở DB" },
  { tep: "pipeline/lib/nap-lai-matrix.mjs", mau: /./, ly_do: "thước nạp lại PL14 đếm thẻ theo khoá trên DB thử, không phải hàng chờ" },
  { tep: "pipeline/lib/the-duyet-nguoi.mjs", mau: /LOAI_THE/, ly_do: "thẻ Người (data_quality), loại khác Ghép căn" },
  { tep: "pipeline/scripts/nap-lai-nguoi.mjs", mau: /data_quality/, ly_do: "thước danh bạ Người, thẻ data_quality" },
];

const coViTu = (cau) => /NOT \$\{THE_DONG_BANG_SQL\}|\$\{KHONG_DONG_BANG_SQL\}/.test(cau) || (VI_TU_TS && cau.includes(`NOT ${VI_TU_TS}`));
const loaiKhac = (cau) => /item_type\s*=\s*'(?!entity_match')[a-z_]+'/.test(cau);
const theoMa = (cau) => /\b(\w+\.)?id\s*=\s*(\$\d|ANY|\(|ep\.)/.test(cau);

/** Mọi câu FROM/JOIN review_queue trong danh sách tệp `{ rel, src }` → [{ rel, cau, ket }]. Câu = đoạn giữa hai dấu backtick. */
export function quet(tepList) {
  const ma = [];
  for (const { rel, src } of tepList) {
    for (const m of src.matchAll(/\b(FROM|JOIN)\s+review_queue\b/g)) {
      const dauDong = src.lastIndexOf("\n", m.index) + 1;
      const dong = src.slice(dauDong, src.indexOf("\n", m.index));
      if (/^\s*(\/\/|\*|--)/.test(dong)) continue; // chú thích
      const a = src.lastIndexOf("`", m.index), b = src.indexOf("`", m.index);
      const cau = a >= 0 && b > m.index ? src.slice(a + 1, b) : dong;
      const mien = MIEN.find((x) => x.tep === rel && x.mau.test(cau));
      const ket = coViTu(cau) ? "co-vi-tu" : mien ? `mien: ${mien.ly_do}` : loaiKhac(cau) ? "mien: loại khác" : theoMa(cau) ? "mien: theo mã thẻ" : "THIEU";
      ma.push({ rel, cau: cau.replace(/\s+/g, " ").trim().slice(0, 90), ket });
    }
  }
  return ma;
}
const kiemQuet = (ma) => {
  const thieu = ma.find((x) => x.ket === "THIEU");
  if (thieu) throw new Error(`DBS-AC-6 câu đọc chờ thiếu vị từ: ${thieu.rel}`);
};
function tepCuaKho() {
  const out = [];
  const di = (d) => {
    for (const f of readdirSync(path.join(REPO, d))) {
      const rel = `${d}/${f}`;
      if (BO_QUA(rel)) continue;
      const st = statSync(path.join(REPO, rel));
      if (st.isDirectory()) di(rel);
      else if (DUOI.test(f)) out.push({ rel, src: readFileSync(path.join(REPO, rel), "utf8") });
    }
  };
  for (const g of GOC_QUET) di(g);
  return out;
}
const kiemViTu = (map) => {
  for (const [tep, v] of Object.entries(map)) if (v !== VI_TU_TS) throw new Error(`DBS-AC-6 vị từ lệch: ${tep}`);
};

test("DBS-AC-6 một vị từ cho mọi bên đọc, mọi câu đọc review_queue có vị từ hoặc được miễn có lý do", () => {
  assert.equal(VI_TU_TS, "(item_type = 'entity_match' AND status = 'pending')");
  const map = { "scripts/lib/ops-local.mjs": VI_TU_OPS, "scripts/bao-cao-ngay.mjs": VI_TU_BAO_CAO, "pipeline/do-the-duyet.mjs": VI_TU_HD11 };
  assert.doesNotThrow(() => kiemViTu(map));
  assert.throws(() => kiemViTu({ ...map, "scripts/lib/ops-local.mjs": VI_TU_OPS.replace("pending", "pendinG") }),
    /^Error: DBS-AC-6 vị từ lệch: scripts\/lib\/ops-local\.mjs$/);

  const tep = tepCuaKho();
  const ma = quet(tep);
  // Ma trận in ra để người ký đọc: mỗi câu một dòng.
  for (const x of ma) console.log(`${x.ket.padEnd(10)} ${x.rel} · ${x.cau}`);
  assert.ok(ma.length >= 10, `quét phải thấy các câu đã biết, thấy ${ma.length}`);
  const PHAI_CO = ["app/src/lib/ops/review-nap.ts", "app/src/lib/ops/review-dau-trang.ts", "app/src/components/ops/review-content.tsx",
    "app/src/lib/data-flow-queries.ts", "scripts/lib/ops-local.mjs", "scripts/bao-cao-ngay.mjs", "pipeline/do-the-duyet.mjs"];
  for (const r of PHAI_CO) assert.ok(ma.some((x) => x.rel === r && x.ket === "co-vi-tu"), `DBS-AC-6 ${r} phải có câu mang vị từ`);
  assert.doesNotThrow(() => kiemQuet(ma));

  // Chiều đỏ: thêm một câu đếm chờ không vị từ vào một tệp app.
  const hong = [...tep, { rel: "app/src/lib/ops/review-moi.ts", src: "export const X = `SELECT count(*) FROM review_queue WHERE status = 'pending'`;\n" }];
  assert.throws(() => kiemQuet(quet(hong)), /^Error: DBS-AC-6 câu đọc chờ thiếu vị từ: app\/src\/lib\/ops\/review-moi\.ts$/);
});

// ───────────────────────── E4b — bản tin cloud, báo cáo ngày, HD11 trên DB ─────────────────────────

const URL_DB = process.env.DATABASE_URL;
const coDb = !!URL_DB && /\/oneinvest_suite_/.test(URL_DB);
const S = `dbs_mjs_${process.pid}`;
let admin, c;

/** Gốc của vòng (origin/main lúc mở nhánh): bản trước đóng băng. Job scripts của CI checkout đủ lịch sử. */
const GOC_VONG = "773a0040dc5ac65bfafbc0e3cb8ba5eea7d877df";

function cauNhanhChinh(tep, mau) {
  const src = execFileSync("git", ["show", `${GOC_VONG}:${tep}`], { cwd: REPO, encoding: "utf8" });
  const m = mau.exec(src);
  assert.ok(m, `không rút được câu từ ${GOC_VONG.slice(0, 8)}:${tep}`);
  return m[1];
}

before(async () => {
  if (!coDb) return;
  const pg = createRequire(new URL("../app/package.json", import.meta.url))("pg");
  admin = new pg.Client({ connectionString: URL_DB });
  await admin.connect();
  await admin.query(`DROP SCHEMA IF EXISTS "${S}" CASCADE`);
  await admin.query(`CREATE SCHEMA "${S}"`);
  await admin.query(`CREATE TABLE "${S}".review_queue (LIKE public.review_queue INCLUDING DEFAULTS INCLUDING CONSTRAINTS)`);
  const u = new URL(URL_DB);
  u.searchParams.set("options", `-c search_path=${S},public`);
  c = new pg.Client({ connectionString: u.toString() });
  await c.connect();
  const ev = (a, b) => JSON.stringify({ offer_a: { offer_id: a }, offer_b: { offer_id: b } });
  for (const [t, item, st, a, b] of [
    ["entity_match", "pair:oA|oB", "pending", "oA", "oB"], ["entity_match", "pair:oC|oD", "pending", "oC", "oD"],
    ["entity_match", "pair:oE|oF", "approved", "oE", "oF"], ["agent_output", "enrich:offer_k1", "pending", "x", "y"],
    ["data_quality", "dq:k2", "pending", "x", "y"],
  ]) {
    await c.query(`INSERT INTO review_queue (item_type, item_id, title, evidence, status, decided_at)
                   VALUES ($1, $2, 'thẻ', $3::jsonb, $4, ${st === "pending" ? "NULL" : "now()"})`, [t, item, ev(a, b), st]);
  }
});

after(async () => {
  await c?.end();
  await admin?.query(`DROP SCHEMA IF EXISTS "${S}" CASCADE`).catch(() => {});
  await admin?.end();
});

test("DBS-AC-4b bản tin cloud, báo cáo ngày, HD11 bỏ thẻ Ghép căn đang chờ", { skip: !coDb && "cần DB của riêng lượt (db-thu --chay)" }, async () => {
  const rq = await readReviewQueue(c);
  assert.deepEqual({ loai: rq.byType.map((x) => x.type).sort(), total: rq.total }, { loai: ["agent_output", "data_quality"], total: 2 }, "bản tin cloud");
  const { rows: [h] } = await c.query(CONG_NGUOI_SQL);
  assert.equal(h.cho, 2, "báo cáo ngày H1");
  const du = await docDuLieu(c);
  assert.equal(du.the.length, 0, "HD11 nạp thẻ Ghép căn đang chờ");

  // Chiều đỏ trên cùng mồi, mỗi bên đọc một ca, thông điệp ghim.
  const kiem = (dk, msg) => { if (dk) throw new Error(msg); };
  const cuRq = (await c.query(cauNhanhChinh("scripts/lib/ops-local.mjs", /readReviewQueue\(client\) \{\s*const \{ rows \} = await client\.query\(\s*`([^`]+)`/))).rows;
  assert.throws(() => kiem(cuRq.some((r) => r.type === "entity_match"), "DBS-AC-4b bản tin cloud còn đếm Ghép căn"), /^Error: DBS-AC-4b bản tin cloud còn đếm Ghép căn$/);
  const { rows: [cuH] } = await c.query(cauNhanhChinh("scripts/bao-cao-ngay.mjs", /const \[h\] = await q\(`([^`]+)`\)/));
  assert.equal(cuH.cho, 4);
  assert.throws(() => kiem(cuH.cho !== 2, "DBS-AC-4b báo cáo ngày còn đếm Ghép căn"), /^Error: DBS-AC-4b báo cáo ngày còn đếm Ghép căn$/);
  const { rows: cuThe } = await c.query(cauNhanhChinh("pipeline/do-the-duyet.mjs", /const \{ rows: the \} = await client\.query\(\s*`([^`]+)`/), [LOAI_THE]);
  assert.equal(cuThe.length, 2);
  assert.throws(() => kiem(cuThe.length > 0, "DBS-AC-4b HD11 còn nạp Ghép căn"), /^Error: DBS-AC-4b HD11 còn nạp Ghép căn$/);
  // Câu mới có mặt vị từ (đối chứng chuỗi cho bên đọc).
  for (const cau of [REVIEW_QUEUE_COUNT_SQL, CONG_NGUOI_SQL, CAU_THE]) assert.ok(cau.includes(`NOT ${VI_TU_TS}`));
});
