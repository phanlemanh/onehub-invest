// song-song.mjs — hồ sơ app-test-chiu-song-song. Postgres local :5433, mọi ghi trong giao dịch ROLLBACK, không Supabase.
//   chan (AC-1): trên DB THỬ riêng — phiên chặn A giữ khoá tư vấn 33033 + khoá dòng sale_offer_records/dq_check_results →
//        ba tệp test xanh dưới 30 s; phiên chặn B giữ ACCESS EXCLUSIVE trên ba bảng nguồn 3 s rồi nhả → xanh, ≥ 2,5 s; bản
//        merge-base của từng tệp dưới A2 → treo tới khi bị giết. Phiên chặn mở-đo-đóng, không chồng nhau.
//   khoa (AC-2): dựng đúng lược đồ riêng mà từng tệp khai (BANG + view tin + 034 + 060) rồi chạy phần việc của ca
//        (refresh-bait-gap, đọc view tin/thước/sellers, đọc dq_check_results) — phiên không giữ khoá tư vấn, không khoá nào
//        mạnh hơn ACCESS SHARE trên public, không khoá nào trên view public.
//   assert (AC-3): thông điệp assert ở merge-base và HEAD bằng nhau, trừ đúng các câu thước đã khai.
//   lib (AC-4): test của lib xanh 3/3 trên bản thật; ba bản đột biến (giữ 33033, bỏ ràng buộc, dãy dùng chung) đều đỏ có tên.
import { spawn, spawnSync, execFileSync } from "node:child_process";
import { readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import assert from "node:assert/strict";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const PIPE = path.join(ROOT, "pipeline");
const APP = path.join(ROOT, "app");
const TEP = {
  dealsApp: "app/tests/deals-phi-ly.test.tsx",
  dq: "app/tests/dq-moi-nhat.test.tsx",
  dealsPipe: "pipeline/scripts/deals-phi-ly.test.mjs",
};
const pg = createRequire(path.join(PIPE, "package.json"))("pg");
const MODE = process.argv[2];
const DB_THU = `oneinvest_p4_atss_${process.pid}`;
const DB_URL = `postgres://oneinvest:oneinvest@localhost:5433/${MODE === "chan" ? DB_THU : "oneinvest"}`;

// Mọi phiên probe đặt hạn PHÍA MÁY CHỦ — Postgres tự huỷ giao dịch dù tiến trình này chết hay bị giết; cả probe có trần.
const HAN_PHIEN = ["SET idle_in_transaction_session_timeout = '30s'", "SET statement_timeout = '60s'", "SET lock_timeout = '3s'"];
const MO = [];
const moPhien = async () => {
  const k = new pg.Client({ connectionString: DB_URL });
  MO.push(k);
  await k.connect();
  for (const q of HAN_PHIEN) await k.query(q);
  return k;
};
const TAM = [];
const TRAN_PROBE_MS = 900_000; // gồm dựng DB thử (pg_dump)
setTimeout(() => {
  console.error(`PROBE VUOT TRAN ${TRAN_PROBE_MS / 1000} s — thoát, máy chủ tự huỷ giao dịch`);
  for (const f of TAM) try { unlinkSync(f); } catch {}
  process.exit(3);
}, TRAN_PROBE_MS).unref();

// Đường nền ghim: đỉnh nhánh chính lúc hàng rẽ (cha của commit mã đầu tiên) — không trôi khi nhánh gộp main hay CI nông.
const base = "d96640c67c8889d4e9203860b8cd1ebd5d6c30ad";
if (spawnSync("git", ["cat-file", "-e", `${base}^{commit}`], { cwd: ROOT }).status !== 0) {
  console.error(`KHONG CO SHA DUONG NEN ${base} (clone nông?) — probe không chạy, không tính là xanh`);
  process.exit(2);
}
const doc = (f) => readFileSync(path.join(ROOT, f), "utf8");
const cuCua = (f) => execFileSync("git", ["show", `${base}:${f}`], { cwd: ROOT, encoding: "utf8" });
for (const f of Object.values(TEP)) assert.notEqual(cuCua(f), doc(f), `${f} chưa đổi so merge-base`);

/** Lệnh chạy một tệp test như bộ của nó: app qua tsx (thư mục app), pipeline node --test (thư mục pipeline). */
const lenh = (f, tranMs) => (f.startsWith("app/")
  ? { cwd: APP, args: ["--import", "tsx", "--test", `--test-timeout=${tranMs}`, path.relative("app", f)] }
  : { cwd: PIPE, args: ["--test", `--test-timeout=${tranMs}`, path.relative("pipeline", f)] });

/** Chạy một tệp test nền, cả tiến trình bị giết sau `tranTienTrinhMs`; trả { f, code, giay, out, biGiet }. */
function chayNen(f, tranMs, tranTienTrinhMs) {
  const { cwd, args } = lenh(f, tranMs);
  const t0 = Date.now();
  return new Promise((res) => {
    // PGAPPNAME: node-pg đặt application_name — phiên quan sát nhận ra backend của từng tệp.
    const ch = spawn("node", args, { cwd, env: { ...process.env, DATABASE_URL: DB_URL, PGAPPNAME: nhanTep(f) } });
    let out = "";
    let biGiet = false;
    const g = setTimeout(() => { biGiet = true; ch.kill("SIGKILL"); }, tranTienTrinhMs);
    ch.stdout.on("data", (d) => (out += d));
    ch.stderr.on("data", (d) => (out += d));
    ch.on("close", (code) => { clearTimeout(g); res({ f, code, out, biGiet, giay: (Date.now() - t0) / 1000 }); });
  });
}
const nhanTep = (f) => `atss-${path.basename(f).replace(/\..*$/, "")}-${f.startsWith("app/") ? "app" : "pipe"}`;
/** Phiên quan sát lấy mẫu pg_stat_activity mỗi 300 ms: backend nào của ba tệp (application_name atss-…) đã kết nối, và
 * backend nào đang chờ khoá (wait_event_type Lock) mà phiên `pidChan` giữ (pg_blocking_pids chứa nó). */
async function quanSat(pidChan) {
  const qs = await moPhien();
  const coMat = new Set();
  const biChan = new Set();
  let chay = true;
  const vong = (async () => {
    while (chay) {
      const { rows } = await qs.query(`SELECT application_name n,
          coalesce(wait_event_type = 'Lock' AND $1 = ANY(pg_blocking_pids(pid)), false) chan
        FROM pg_stat_activity WHERE application_name LIKE 'atss-%'`, [pidChan]);
      for (const { n, chan } of rows) { coMat.add(n); if (chan) biChan.add(n); }
      await new Promise((x) => setTimeout(x, 300));
    }
  })();
  return { coMat, biChan, dung: async () => { chay = false; await vong; } };
}
const pidCua = async (k) => (await k.query("SELECT pg_backend_pid() p")).rows[0].p;
// Treo = tiến trình bị giết ở trần hoặc node:test báo hết giờ ca — không khớp dòng tổng kết «ℹ cancelled 0».
const treo = (r) => r.biGiet || /test timed out after \d+ms/.test(r.out);
const SO_CA = { [TEP.dealsApp]: 5, [TEP.dq]: 6, [TEP.dealsPipe]: 4 };
const xanh = (r, ten) => {
  console.log(`# ${ten} ${r.f}: thoát ${r.code}, ${r.giay.toFixed(1)} s`);
  assert.equal(r.code, 0, `${ten}: ${r.f} đỏ:\n${r.out.slice(-1500)}`);
  assert.match(r.out, new RegExp(`ℹ pass ${SO_CA[r.f]}\\b`), `${ten}: ${r.f} không đủ ${SO_CA[r.f]} ca xanh`);
};

if (MODE === "chan") {
  const moChan = async () => {
    const k = await moPhien();
    await k.query("BEGIN");
    await k.query("SELECT pg_advisory_xact_lock(33033)");
    await k.query("SELECT 1 FROM sale_offer_records ORDER BY offer_id LIMIT 200 FOR UPDATE");
    await k.query("SELECT 1 FROM dq_check_results LIMIT 200 FOR UPDATE");
    return k;
  };
  const dong = async (k) => { await k.query("ROLLBACK").catch(() => {}); await k.end().catch(() => {}); };
  const dung = spawnSync("bash", [path.join(ROOT, "_acceptance/sdt-luu-goc-e164/probes/db-thu-chac.sh"), DB_THU],
    { cwd: ROOT, encoding: "utf8", timeout: 600_000 });
  assert.equal(dung.status, 0, `không dựng được DB thử ${DB_THU}:\n${dung.stderr}`);
  console.log(`# DB thử: ${DB_THU}`);
  try {
    // Phiên chặn A: như ca dài của bộ khác — giữ 33033 + khoá dòng trên hai bảng mà ba tệp từng ghi.
    let a = await moChan();
    console.log("# phiên chặn A: 33033 + khoá dòng 200 tin + 200 dòng dq_check_results");
    const ra = await Promise.all(Object.values(TEP).map((f) => chayNen(f, 30_000, 60_000)));
    await dong(a);
    for (const r of ra) { xanh(r, "HEAD dưới A"); assert.ok(r.giay < 30, `${r.f} chạy ${r.giay} s ≥ 30 s dưới A`); }

    // Phiên chặn B (sau khi A đóng): ca DDL ngắn giữ ACCESS EXCLUSIVE 3 s rồi nhả — ba tệp chờ đúng lúc đó (NOWAIT thử lại).
    const b = await moPhien();
    await b.query("BEGIN");
    await b.query("LOCK TABLE public.sale_offer_records, public.dq_check_results, public.properties IN ACCESS EXCLUSIVE MODE")
      .catch(async (e) => { await dong(b); throw new Error(`PHIEN CHAN B KHONG LAY DUOC KHOA (DB bận): ${e.message}`); });
    // Đồng hồ 3 s chạy từ lúc cả ba tệp đã có backend (đang thử lấy khoá) — khởi động tsx/node không ăn vào thời gian chặn.
    const qsB = await quanSat(await pidCua(b));
    const pRb = Promise.all(Object.values(TEP).map((f) => chayNen(f, 30_000, 60_000)));
    const canTen = Object.values(TEP).map(nhanTep);
    for (let i = 0; i < 100 && !canTen.every((n) => qsB.coMat.has(n)); i++) await new Promise((x) => setTimeout(x, 100));
    await qsB.dung();
    console.log(`# phiên B: backend đã kết nối trước khi đếm 3 s: ${JSON.stringify([...qsB.coMat].sort())}`);
    const nha = setTimeout(() => dong(b), 3000);
    const rb = await pRb;
    clearTimeout(nha);
    await dong(b);
    for (const [i, r] of rb.entries()) {
      xanh(r, "HEAD dưới B (DDL 3 s)");
      assert.ok(r.giay >= 2.5 && r.giay < 30, `${r.f} dưới B ${r.giay} s — không chờ hết DDL hoặc vượt trần`);
      // So đường nền: lượt dưới A không bị chặn (A không tranh khoá với bản riêng) — B phải dài hơn ít nhất 2 s.
      assert.ok(r.giay - ra[i].giay >= 2, `${r.f} dưới B ${r.giay} s so nền ${ra[i].giay} s — không thấy đã chờ DDL`);
    }

    // Phiên chặn C: ACCESS SHARE suốt lượt trên MỌI quan hệ public mà ba tệp nhắc tên (bảng lẫn view) — câu nào của tệp
    // còn xin ACCESS EXCLUSIVE trên public (DROP/ALTER/CREATE OR REPLACE ghi thẳng public, hay rơi về public qua search_path)
    // sẽ treo. Đối chứng dương: bản deals app đột biến DROP thẳng public.stg_zalo_posts → treo.
    const QUAN_HE = ["sale_offer_records", "sale_offers", "sellers", "v_ruler_p2_area", "v_ruler_p2", "stg_zalo_posts", "areas",
      "properties", "property_offers", "registry_aliases", "parties", "ref_lookup", "ops_audit", "dq_check_results"];
    const coMat = (await (await moPhien()).query(
      `SELECT array_agg(t) a FROM unnest($1::text[]) t WHERE to_regclass('public.' || t) IS NOT NULL`, [QUAN_HE])).rows[0].a;
    const cc = await moPhien();
    await cc.query("BEGIN");
    await cc.query(`LOCK TABLE ${coMat.map((t) => `public.${t}`).join(", ")} IN ACCESS SHARE MODE`);
    const dotC = TEP.dealsApp.replace(/\.test\.tsx$/, `.dotc-${process.pid}.tsx`);
    const thanApp = doc(TEP.dealsApp);
    assert.ok(thanApp.includes("DROP TABLE stg_zalo_posts CASCADE"), "đối chứng C: không thấy câu DROP stg_zalo_posts để đột biến");
    writeFileSync(path.join(ROOT, dotC), thanApp.replace("DROP TABLE stg_zalo_posts CASCADE", "DROP TABLE public.stg_zalo_posts CASCADE"));
    TAM.push(path.join(ROOT, dotC));
    // Tuần tự: ACCESS EXCLUSIVE đang xếp hàng của bản đột biến sẽ chặn cả ACCESS SHARE mới của bản HEAD.
    const rC = await Promise.all(Object.values(TEP).map((f) => chayNen(f, 30_000, 60_000)));
    const qsC = await quanSat(await pidCua(cc));
    const rDot = await chayNen(dotC, 5_000, 20_000);
    await qsC.dung();
    await dong(cc);
    console.log(`# phiên C giữ ACCESS SHARE trên ${coMat.length} quan hệ public`);
    for (const r of rC) { xanh(r, "HEAD dưới C"); assert.ok(r.giay < 30, `${r.f} dưới C ${r.giay} s`); }
    console.log(`# đột biến DROP public.stg_zalo_posts dưới C: thoát ${rDot.code}, ${rDot.giay.toFixed(1)} s, bị giết: ${rDot.biGiet}`);
    assert.ok(rDot.code !== 0 && treo(rDot) && qsC.biChan.has(nhanTep(dotC)),
      `DOI CHUNG KHONG BAT (C): bản đột biến không treo chờ khoá của phiên C (thấy chờ: ${JSON.stringify([...qsC.biChan])}):\n${rDot.out.slice(-800)}`);

    // Đối chứng: bản merge-base của từng tệp (tên không khớp glob *.test.* của npm test) dưới A2 phải treo tới trần.
    const cu = Object.values(TEP).map((f) => {
      const tam = f.replace(/\.test\.(tsx|mjs)$/, `.cu-${process.pid}.$1`);
      writeFileSync(path.join(ROOT, tam), cuCua(f));
      TAM.push(path.join(ROOT, tam));
      return tam;
    });
    a = await moChan();
    const pidA2 = await pidCua(a);
    // Phiên quan sát: ghim lý do treo — backend của tệp nào đang chờ khoá mà A2 giữ (pg_blocking_pids chứa pid A2).
    const qsA2 = await quanSat(pidA2);
    const biChan = qsA2.biChan;
    const rc = await Promise.all(cu.map((f) => chayNen(f, 5_000, 20_000)));
    await qsA2.dung();
    await dong(a);
    console.log(`# backend bị A2 (pid ${pidA2}) chặn: ${JSON.stringify([...biChan].sort())}`);
    for (const r of rc) {
      console.log(`# merge-base dưới A2 ${r.f}: thoát ${r.code}, ${r.giay.toFixed(1)} s, bị giết: ${r.biGiet}`);
      assert.notEqual(r.code, 0, `DOI CHUNG KHONG BAT: ${r.f} vẫn xanh dưới phiên chặn`);
      assert.ok(treo(r), `${r.f} đỏ mà không vì treo:\n${r.out.slice(-800)}`);
      assert.ok(biChan.has(nhanTep(r.f)), `DOI CHUNG KHONG BAT: ${r.f} treo mà không thấy chờ khoá của A2`);
    }
    console.log("CHAN OK");
  } finally {
    for (const f of TAM) try { unlinkSync(f); } catch {}
    for (const k of MO) await dong(k);
    spawnSync("bash", [path.join(ROOT, "db/db-thu.sh"), DB_THU, "--xoa"], { cwd: ROOT, timeout: 120_000 });
  }
} else if (MODE === "khoa") {
  const { luocDoRieng } = await import(pathToFileURL(path.join(PIPE, "lib/luoc-do-rieng.mjs")).href);
  const { MIG_060 } = await import(pathToFileURL(path.join(PIPE, "lib/nap-060.mjs")).href);
  const { refreshBaitGap } = await import(pathToFileURL(path.join(PIPE, "refresh-bait-gap.mjs")).href);
  const SQL_034 = doc("db/migrations/034_ruler_p2_views.sql");
  /** Danh sách bảng mà tệp khai cho lược đồ riêng — rút nguyên văn, không chép tay. */
  const bangCua = (f) => {
    const s = doc(f);
    const m = s.match(/const BANG\s*=\s*\[([\s\S]*?)\]/) ?? s.match(/luocDoRieng\(c,\s*\[([^\]]*)\]/);
    assert.ok(m, `${f}: không thấy danh sách bảng của lược đồ riêng`);
    return [...m[1].matchAll(/"([a-z_]+)"/g)].map((x) => x[1]);
  };
  const VIEW_TIN = "CREATE VIEW sale_offers AS SELECT * FROM sale_offer_records WHERE retired_at IS NULL";
  const ca = [
    { f: TEP.dealsPipe, xem: true, viec: async (c) => { await refreshBaitGap(c); } },
    { f: TEP.dealsApp, xem: true, viec: async (c) => {
      await c.query(`SELECT o.offer_id, r.m, sel.n_ads, a.name FROM sale_offers o JOIN v_ruler_p2_area r ON r.area_id = o.area_id
        LEFT JOIN areas a ON a.id = o.area_id LEFT JOIN sellers sel ON sel.phone_hash = o.seller_phone_hash
        LEFT JOIN LATERAL (SELECT text FROM stg_zalo_posts z WHERE z.post_id = ANY(o.post_ids) LIMIT 1) z ON TRUE`);
    } },
    { f: TEP.dq, xem: false, viec: async (c) => {
      await c.query(`INSERT INTO dq_check_results (check_name, entity, status) VALUES ('t_atss', 't_atss', 'pass')`);
      await c.query(`SELECT * FROM dq_check_results`);
    } },
  ];
  for (const { f, xem, viec } of ca) {
    const s = doc(f);
    if (xem) for (const dong of [VIEW_TIN, "SQL_034", "MIG_060"]) assert.ok(s.includes(dong), `${f}: dựng lược đồ riêng không còn «${dong}»`);
    const bang = bangCua(f);
    const c = await moPhien();
    try {
      await c.query("BEGIN");
      const sc = await luocDoRieng(c, bang, { tienTo: "atss_khoa" });
      if (xem) { await c.query(VIEW_TIN); await c.query(SQL_034); await c.query(MIG_060); }
      await c.query("SAVEPOINT viec");
      await viec(c);
      const manh = (await c.query(`SELECT c.relname, l.mode FROM pg_locks l JOIN pg_class c ON c.oid = l.relation
        WHERE l.pid = pg_backend_pid() AND c.relnamespace = 'public'::regnamespace AND l.mode <> 'AccessShareLock' ORDER BY 1`)).rows;
      const khoaView = (await c.query(`SELECT c.relname FROM pg_locks l JOIN pg_class c ON c.oid = l.relation
        WHERE l.pid = pg_backend_pid() AND c.relnamespace = 'public'::regnamespace AND c.relkind = 'v'`)).rows.map((r) => r.relname);
      const tv = (await c.query(`SELECT count(*)::int AS n FROM pg_locks WHERE pid = pg_backend_pid() AND locktype = 'advisory'`)).rows[0].n;
      console.log(`# ${f} (${sc}, ${bang.length} bảng): khoá mạnh trên public ${JSON.stringify(manh)} · view public ${JSON.stringify(khoaView)} · tư vấn ${tv}`);
      assert.deepEqual(manh, [], `KHOA MANH TREN PUBLIC: ${f}`);
      assert.deepEqual(khoaView, [], `KHOA VIEW PUBLIC: ${f}`);
      assert.equal(tv, 0, `CON KHOA TU VAN: ${f}`);
      // Đối chứng: một ghi lên bảng public (khoá RowExclusive) và một lần đọc view public thì hai phép đếm thấy — không mù.
      await c.query("ROLLBACK TO SAVEPOINT viec");
      await c.query("SELECT 1 FROM public.sale_offers LIMIT 0");
      const thayView = (await c.query(`SELECT count(*)::int n FROM pg_locks l JOIN pg_class c ON c.oid = l.relation
        WHERE l.pid = pg_backend_pid() AND c.relnamespace = 'public'::regnamespace AND c.relkind = 'v'`)).rows[0].n;
      assert.ok(thayView >= 1, `DOI CHUNG KHONG BAT (view): ${f}`);
      await c.query(`UPDATE public.${bang[0]} SET ${bang[0] === "dq_check_results" ? "status = status" : "offer_id = offer_id"} WHERE false`);
      const thay = (await c.query(`SELECT count(*)::int n FROM pg_locks l JOIN pg_class c ON c.oid = l.relation
        WHERE l.pid = pg_backend_pid() AND c.relnamespace = 'public'::regnamespace AND l.mode <> 'AccessShareLock'`)).rows[0].n;
      assert.ok(thay >= 1, `DOI CHUNG KHONG BAT: ${f}`);
    } finally {
      await c.query("ROLLBACK").catch(() => {});
      await c.end();
    }
  }
  console.log("KHOA OK");
} else if (MODE === "assert") {
  const thongDiep = (s) => [...s.matchAll(/["`]((?:DP|DQ)[^"`$]*)["`]/g)].map((m) => m[1]).sort();
  // Đổi đã khai: câu «không phường nào có thước» (đọc thước thật) thành câu kiểm thước bịa.
  const BO = {
    [TEP.dealsApp]: ["DP không phường nào có thước (v_ruler_p2_area rỗng) — ca không chạy được"],
    [TEP.dealsPipe]: ["DP-AC-2 không phường nào có thước (v_ruler_p2_area rỗng) — ca không chạy được"],
    [TEP.dq]: [],
  };
  const THEM = { [TEP.dealsApp]: ["DP thước bịa không ra đúng một phường"], [TEP.dealsPipe]: ["DP thước bịa không ra đúng một phường"], [TEP.dq]: [] };
  const hieu = (a, b) => { const r = [...a]; for (const x of b) { const i = r.indexOf(x); if (i >= 0) r.splice(i, 1); } return r; };
  const so = (f, cu, moi) => {
    const a = thongDiep(cu), b = thongDiep(moi);
    assert.ok(a.length >= 4, `${f}: đọc được quá ít thông điệp — bộ rút hỏng`);
    assert.deepEqual([hieu(a, b), hieu(b, a)], [BO[f], THEM[f]], `THONG DIEP ASSERT DOI: ${f}`);
    return [a.length, b.length];
  };
  for (const f of Object.values(TEP)) console.log(`# ${f}: ${so(f, cuCua(f), doc(f)).join(" → ")} thông điệp`);
  // Ba đối chứng trong ca phải còn nguyên.
  for (const [f, m] of [[TEP.dealsApp, "DP-AC-4 đối chứng không phân biệt"], [TEP.dealsApp, "DP-AC-5 bản đầy đủ vẫn chạy trên lược đồ đã xoá"],
    [TEP.dealsPipe, "DP-AC-2 đối chứng không phân biệt"]]) assert.ok(doc(f).includes(m), `${f} mất đối chứng «${m}»`);
  // Đối chứng đỏ: xoá một thông điệp → bộ so bắt.
  assert.throws(() => so(TEP.dq, cuCua(TEP.dq), doc(TEP.dq).replace("DQ-AC-1", "x")), /THONG DIEP ASSERT DOI/);
  console.log("ASSERT OK");
} else if (MODE === "lib") {
  const LIB = "pipeline/lib/luoc-do-rieng.mjs";
  const TEST = "pipeline/scripts/luoc-do-rieng.test.mjs";
  const chayTest = (tepTest) => spawnSync("node", ["--test", "--test-timeout=60000", tepTest],
    { cwd: PIPE, encoding: "utf8", timeout: 180_000 });
  const that = chayTest(path.relative("pipeline", TEST));
  const outThat = `${that.stdout}${that.stderr}`;
  console.log(`# bản thật: thoát ${that.status}`);
  assert.equal(that.status, 0, `test lib đỏ trên bản thật:\n${outThat.slice(-1500)}`);
  assert.match(outThat, /ℹ pass 3\b/, "test lib không đủ 3 ca xanh");
  const lib = doc(LIB);
  const DOT = [
    ["giữ 33033", "await c.query(`CREATE SCHEMA ${sc}`);", "await c.query(`CREATE SCHEMA ${sc}`); await c.query(\"SELECT pg_advisory_xact_lock(33033)\");", /LDR phiên dựng lược đồ riêng vẫn giữ khoá 33033|canceling statement due to lock timeout/],
    ["bỏ ràng buộc", "WHERE conrelid = $1 AND contype IN ('c', 'p', 'u')", "WHERE conrelid = $1 AND false", /LDR \S+ lệch ràng buộc/],
    ["dãy dùng chung", "md = `nextval('${ten}'::regclass)`;", "day.pop();", /LDR dãy riêng không bắt đầu từ 1|LDR chèn vào bản riêng đẩy dãy dùng chung/],
  ];
  for (const [ten, tu, thanh, mong] of DOT) {
    assert.ok(lib.includes(tu), `đột biến «${ten}»: không thấy chỗ cần đổi trong lib`);
    const libTam = LIB.replace(".mjs", `.dot-${process.pid}.mjs`);
    const testTam = TEST.replace(".test.mjs", `.dot-${process.pid}.mjs`);
    TAM.push(path.join(ROOT, libTam), path.join(ROOT, testTam));
    writeFileSync(path.join(ROOT, libTam), lib.replace(tu, thanh));
    writeFileSync(path.join(ROOT, testTam), doc(TEST).replace("../lib/luoc-do-rieng.mjs", `../lib/${path.basename(libTam)}`));
    const r = chayTest(path.relative("pipeline", testTam));
    const out = `${r.stdout}${r.stderr}`;
    for (const f of [libTam, testTam]) try { unlinkSync(path.join(ROOT, f)); } catch {}
    console.log(`# đột biến «${ten}»: thoát ${r.status}`);
    assert.notEqual(r.status, 0, `DOI CHUNG KHONG BAT: đột biến «${ten}» vẫn xanh`);
    assert.match(out, mong, `đột biến «${ten}» đỏ mà không vì lý do mong đợi:\n${out.slice(-1200)}`);
  }
  console.log("LIB OK");
} else {
  console.error("dùng: song-song.mjs chan|khoa|assert|lib");
  process.exit(2);
}
