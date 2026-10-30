// enrich-cli.itest.ts — hồ sơ enrich-chay-sau-nap: CLI enrich-run THẬT (tiến trình con) trên DB thử, với máy chủ LLM
// giả kiểu OpenAI chạy trong tiến trình test. Đuôi .itest.ts: `npm test` không quét — chạy qua executor
// enrich_cli_thu (dựng DB thử bằng db/db-thu.sh rồi trỏ ENRICH_DB_THU vào nó).
// Ghi THẬT vào DB thử (bản sao bỏ đi); từ chối mọi DB không mang tên oneinvest_<…> — không bao giờ :5433/oneinvest.
// Chiều đỏ: chép agent/ (node_modules symlink) ra thư mục tạm, đột biến một chỗ, chạy cùng ca → phải đỏ đúng thông điệp.
import { test, after, before } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import pg from "pg";

import { insertOffer } from "./helpers/db.js";

const DB = process.env.ENRICH_DB_THU ?? "";
const TEN_DB = DB.match(/\/([^/?]+)(\?.*)?$/)?.[1] ?? "";
if (!/^oneinvest_[a-z0-9_]+$/.test(TEN_DB)) {
  throw new Error(`từ chối: DB thử phải khác oneinvest (ENRICH_DB_THU=${DB || "<trống>"})`);
}
const AGENT = join(import.meta.dirname, "..");
const FIXTURES: { output: string }[] = JSON.parse(
  readFileSync(join(import.meta.dirname, "fixtures/llm-outputs.json"), "utf8"),
);
const TIEN_TO = `ecli${Date.now().toString(36)}`;
const MA = new RegExp(`${TIEN_TO}_\\d+_\\d+`);

// ── Máy chủ LLM giả ───────────────────────────────────────────────────────────────────────────────────────
type CheDo = { tra500: (ma: string | null) => boolean; soi?: (ma: string | null) => Promise<void> };
let cheDo: CheDo = { tra500: () => false };
let server: Server;
let port = 0;
let soi: pg.Client;

function traLoi(content: string) {
  return {
    id: "chatcmpl-gia", object: "chat.completion", created: Math.floor(Date.now() / 1000), model: "qwen3.8-27b-local",
    choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: "stop" }],
    usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
  };
}

before(async () => {
  soi = new pg.Client({ connectionString: DB, application_name: "enrich-cli-itest" });
  await soi.connect();
  server = createServer((req, res) => {
    let body = "";
    req.on("data", (d) => (body += d));
    req.on("end", async () => {
      const ma = body.match(MA)?.[0] ?? null;
      try {
        await cheDo.soi?.(ma);
      } catch (e) {
        loiSoi.push(String(e));
      }
      if (cheDo.tra500(ma)) {
        res.writeHead(500, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: { message: "giả: máy chủ hỏng", type: "server_error" } }));
        return;
      }
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(traLoi(FIXTURES[0].output)));
    });
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  port = (server.address() as AddressInfo).port;
});
after(async () => {
  server?.close();
  await soi?.end();
});
const loiSoi: string[] = [];

// ── Gieo dữ liệu trên DB thử (commit thật) ─────────────────────────────────────────────────────────────────
let soCa = 0;
async function gieo(n: number): Promise<string[]> {
  const ca = ++soCa;
  await soi.query(
    `INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ('ecli', 'test', 'S03', '{}')
     ON CONFLICT (snapshot_id) DO NOTHING`,
  );
  const ids: string[] = [];
  for (let i = 1; i <= n; i++) {
    const id = `${TIEN_TO}_${ca}_${i}`;
    await soi.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, text, group_name) VALUES ($1, 'ecli', $2, 'Nhóm thử')`, [
      `p_${id}`, `Bán gấp căn 2pn tầng trung phố Ba Đình, sẵn sổ, giá thương lượng — mã ${id}`,
    ]);
    await insertOffer(soi, { offer_id: id, post_ids: [`p_${id}`], property_type: "unknown" });
    ids.push(id);
  }
  return ids;
}

const so = async (sql: string, p: unknown[]) => Number((await soi.query(sql, p)).rows[0].n);
const deXuatTin = (id: string) => so(`SELECT count(*) n FROM enrichment_proposals WHERE offer_id=$1`, [id]);

// ── Chạy CLI (bất đồng bộ — máy chủ giả sống cùng tiến trình) ──────────────────────────────────────────────
type KetQua = { code: number | null; out: string; runId: string };
function cli(agentDir: string, args: string[], limit = 50): Promise<KetQua> {
  return new Promise((resolve, reject) => {
    const p = spawn(process.execPath, ["--import", "tsx", "scripts/enrich-run.ts", ...args], {
      cwd: agentDir,
      env: { ...process.env, DATABASE_URL: DB, MTPLX_URL: `http://127.0.0.1:${port}/v1`, LIMIT: String(limit) },
    });
    let out = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (out += d));
    const hen = setTimeout(() => p.kill("SIGKILL"), 240_000);
    p.on("error", reject);
    p.on("close", (code) => {
      clearTimeout(hen);
      resolve({ code, out, runId: out.match(/· (enrich-\S+) ═══/)?.[1] ?? "" });
    });
  });
}
const soTrong = (out: string, nhan: string) => Number(out.match(new RegExp(`${nhan}: (\\d+)`))?.[1] ?? NaN);

/** Chép agent/ ra thư mục tạm (node_modules symlink), thay một chuỗi trong một tệp; trả thư mục. */
function dotBien(tep: string, cu: string, moi: string): string {
  const d = mkdtempSync(join(tmpdir(), "enrich-cli-dot-bien-"));
  for (const x of ["src", "scripts", "package.json", "tsconfig.json"]) cpSync(join(AGENT, x), join(d, x), { recursive: true });
  symlinkSync(join(AGENT, "node_modules"), join(d, "node_modules"));
  const p = join(d, tep);
  const src = readFileSync(p, "utf8");
  assert.ok(src.includes(cu), `đột biến không khớp chuỗi trong ${tep}: ${cu}`);
  writeFileSync(p, src.replace(cu, moi));
  return d;
}
async function voiDotBien(tep: string, cu: string, moi: string, fn: (d: string) => Promise<void>) {
  const d = dotBien(tep, cu, moi);
  try { await fn(d); } finally { rmSync(d, { recursive: true, force: true }); }
}

// ── EC-AC-1 ─────────────────────────────────────────────────────────────────────────────────────────────────
async function kiemGiaoDichNgan(agentDir: string) {
  const ids = await gieo(3);
  const xact: (string | null)[] = [];
  const thayTinTruoc: boolean[] = [];
  loiSoi.length = 0;
  cheDo = {
    tra500: () => false,
    soi: async (ma) => {
      const { rows } = await soi.query(
        `SELECT xact_start FROM pg_stat_activity WHERE application_name='enrich-run' AND datname=current_database()`,
      );
      assert.equal(rows.length, 1, "phải thấy đúng một phiên enrich-run");
      xact.push(rows[0].xact_start === null ? null : String(rows[0].xact_start));
      const i = ma ? ids.indexOf(ma) : -1;
      if (i > 0) thayTinTruoc.push((await deXuatTin(ids[i - 1])) > 0);
    },
  };
  const r = await cli(agentDir, ["--offers", ids.join(",")]);
  assert.deepEqual(loiSoi, [], "lỗi trong lúc soi");
  assert.equal(r.code, 0, r.out);
  assert.equal(xact.length, 3, `EC-AC-1 máy chủ giả phải nhận 3 lời gọi — ${r.out}`);
  assert.ok(xact.every((x) => x === null), `EC-AC-1 LLM gọi trong giao dịch mở: ${JSON.stringify(xact)}`);
  assert.deepEqual(thayTinTruoc, [true, true], "EC-AC-1 phiên khác không đọc thấy đề xuất của tin trước");
}

test("EC-AC-1 giao dịch ngắn", () => kiemGiaoDichNgan(AGENT));
test("EC-AC-1 chiều đỏ: gọi LLM bên trong giaoDich → đỏ", () =>
  voiDotBien(
    "src/enrich/run.ts",
    "const llmRes = canLLM ? await opts.llm(text, ctx) : null;",
    "const llmRes = canLLM ? await giaoDich(() => opts.llm(text, ctx)) : null;",
    (d) => assert.rejects(kiemGiaoDichNgan(d), /EC-AC-1 LLM gọi trong giao dịch mở/),
  ));

// ── EC-AC-3 ─────────────────────────────────────────────────────────────────────────────────────────────────
test("EC-AC-3 LLM chết trên CLI: 500 mọi lời gọi → thoát 3; đối chứng sống → thoát 0", async () => {
  cheDo = { tra500: () => true };
  const chet = await cli(AGENT, ["--offers", (await gieo(3)).join(",")]);
  assert.equal(chet.code, 3, `EC-AC-3 LLM chết mà không thoát 3 — ${chet.out}`);
  assert.match(chet.out, /LLM hỏng 3\/3 \(lỗi 3 · không đọc được 0\)/);
  cheDo = { tra500: () => false };
  const song = await cli(AGENT, ["--offers", (await gieo(3)).join(",")]);
  assert.equal(song.code, 0, song.out);
  assert.match(song.out, /LLM hỏng 0\/3 \(lỗi 0 · không đọc được 0\)/);
});

// ── EC-AC-4 ─────────────────────────────────────────────────────────────────────────────────────────────────
test("EC-AC-4 tổng kết CLI khớp DB thử; chạy lại → đề xuất mới 0", async () => {
  cheDo = { tra500: () => false };
  const ids = (await gieo(3)).join(",");
  const r1 = await cli(AGENT, ["--offers", ids]);
  assert.equal(r1.code, 0, r1.out);
  const dem = (them: string) => so(`SELECT count(*) n FROM enrichment_proposals WHERE run_id=$1 ${them}`, [r1.runId]);
  assert.ok(soTrong(r1.out, "đề xuất mới") > 0, `EC-AC-4 lượt một không ghi gì — ${r1.out}`);
  assert.equal(soTrong(r1.out, "đề xuất mới"), await dem(""), "EC-AC-4 đề xuất mới ≠ DB");
  assert.equal(soTrong(r1.out, "đã áp"), await dem("AND status='applied'"), "EC-AC-4 đã áp ≠ DB");
  assert.equal(soTrong(r1.out, "chờ duyệt"), await dem("AND status='queued' AND route='review'"), "EC-AC-4 chờ duyệt ≠ DB");
  const r2 = await cli(AGENT, ["--offers", ids]);
  assert.equal(soTrong(r2.out, "đề xuất mới"), 0, `EC-AC-4 lượt hai: ${r2.out}`);
});

// ── EC-AC-2 ─────────────────────────────────────────────────────────────────────────────────────────────────
async function kiemLoiGhiCli(agentDir: string) {
  const [t1, t2, t3] = await gieo(3);
  await soi.query(`CREATE OR REPLACE FUNCTION ecli_hong() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN IF NEW.offer_id = '${t2}' THEN RAISE EXCEPTION 'ecli: thử lỗi ghi %', NEW.offer_id; END IF; RETURN NEW; END $$`);
  await soi.query(`CREATE TRIGGER ecli_hong BEFORE INSERT ON enrichment_proposals FOR EACH ROW EXECUTE FUNCTION ecli_hong()`);
  try {
    cheDo = { tra500: () => false };
    const r = await cli(agentDir, ["--offers", [t1, t2, t3].join(",")]);
    assert.ok((await deXuatTin(t3)) > 0, `EC-AC-2 tin sau tin hỏng không ghi được — ${r.out}`);
    assert.equal(r.code, 2, `EC-AC-2 mã thoát — ${r.out}`);
    assert.match(r.out, new RegExp(`ghi lỗi 1 tin: ${t2}\\(`), "EC-AC-2 stdout phải gọi tên tin hai");
    assert.ok((await deXuatTin(t1)) > 0, "EC-AC-2 tin một không có đề xuất");
    assert.equal(await deXuatTin(t2), 0, "EC-AC-2 tin hai còn đề xuất");
    assert.equal(await so(`SELECT count(*) n FROM review_queue WHERE item_id=$1 AND status='pending'`, [`enrich:${t2}`]), 0,
      "EC-AC-2 tin hai còn thẻ chờ");
    assert.equal(await so(`SELECT count(*) n FROM ops_audit WHERE action='enrich:thu' AND detail->>'offer_id'=$1`, [t2]), 0,
      "EC-AC-2 tin hai có dấu đã thử");
  } finally {
    await soi.query(`DROP TRIGGER IF EXISTS ecli_hong ON enrichment_proposals`);
  }
}

test("EC-AC-2 lỗi ghi trên CLI: trigger hỏng tin hai → thoát 2, tin một và ba còn", () => kiemLoiGhiCli(AGENT));
test("EC-AC-2 chiều đỏ: giaoDich không ROLLBACK → tin sau tin hỏng không ghi được", () =>
  voiDotBien(
    "scripts/enrich-run.ts",
    `await c.query("ROLLBACK").catch(() => {});`,
    "",
    (d) => assert.rejects(kiemLoiGhiCli(d), /EC-AC-2 tin sau tin hỏng không ghi được/),
  ));

// ── EC-AC-9 ─────────────────────────────────────────────────────────────────────────────────────────────────
const daThuCua = async (runId: string) =>
  new Set((await soi.query(`SELECT detail->>'offer_id' AS id FROM ops_audit WHERE action='enrich:thu' AND actor=$1`, [
    `enrich-run:${runId}`,
  ])).rows.map((r) => r.id as string));

async function kiemKhongBocLai(agentDir: string) {
  // Ba tin mới + một tin hoãn (đề xuất chờ mà thẻ đã «Để sau», và đã có dấu đã thử). Mọi tin khác trên DB thử bị gạt
  // khỏi backlog (văn bản ngắn) để tập bốc tất định: LIMIT 3 = tin hoãn + hai tin mới; lượt hai chỉ còn một tin mới.
  // Chiều đỏ tất định: bỏ điều kiện dấu thì lượt hai bốc 3 trong 4 tin — luôn trùng ít nhất một tin mới của lượt một.
  const [h, ...moi] = await gieo(4);
  const ca = h.replace(/_\d+$/, "_");
  await soi.query(`UPDATE stg_zalo_posts SET text = 'x' WHERE post_id NOT LIKE $1`, [`p_${ca}%`]);
  const { rows } = await soi.query(
    `INSERT INTO review_queue (item_type, item_id, title, ai_suggestion, status) VALUES ('agent_output', $1, 'thử hoãn', 'apply', 'deferred') RETURNING id`,
    [`enrich:${h}`],
  );
  await soi.query(
    `INSERT INTO enrichment_proposals (run_id, offer_id, field, value, value_key, source, route, review_id)
     VALUES ('ecli-hoan', $1, 'bathrooms', '2', '2', 'e2_llm', 'review', $2)`,
    [h, rows[0].id],
  );
  await soi.query(`INSERT INTO ops_audit (actor, action, detail) VALUES ('ecli', 'enrich:thu', $1)`, [{ offer_id: h }]);

  cheDo = { tra500: () => false };
  const r1 = await cli(agentDir, [], 3);
  const r2 = await cli(agentDir, [], 3);
  const [a, b] = [await daThuCua(r1.runId), await daThuCua(r2.runId)];
  // Tin hoãn đi trước dù đã có dấu đã thử; lượt một gắn đề xuất của nó vào thẻ chờ mới nên lượt hai nó thôi là tin hoãn.
  assert.ok(a.has(h), `EC-AC-9 tin hoãn không đi trước — lượt một ${[...a]}`);
  assert.ok(!b.has(h), `EC-AC-9 lượt hai bốc lại tin đã thử (tin hoãn đã lên thẻ chờ) — lượt hai ${[...b]}`);
  const aMoi = [...a].filter((x) => x !== h);
  const bMoi = [...b].filter((x) => x !== h);
  assert.equal(aMoi.length, 2, `EC-AC-9 lượt một phải bốc hai tin mới — ${r1.out}`);
  assert.ok(aMoi.every((x) => moi.includes(x)), "EC-AC-9 lượt một bốc tin ngoài ca");
  assert.deepEqual(bMoi.filter((x) => aMoi.includes(x)), [], "EC-AC-9 lượt hai bốc lại tin đã thử");
  assert.equal(bMoi.length, 1, `EC-AC-9 lượt hai phải bốc đúng tin mới còn lại — ${r2.out}`);
  for (const x of [...aMoi, ...bMoi]) {
    assert.equal(await so(`SELECT count(*) n FROM ops_audit WHERE action='enrich:thu' AND detail->>'offer_id'=$1`, [x]), 1,
      `EC-AC-9 tin ${x} phải có đúng một dấu đã thử`);
  }
  // Lượt ba: một tin mới mà LLM ném lỗi (500) → không có dấu đã thử.
  const [f] = await gieo(1);
  await soi.query(`UPDATE stg_zalo_posts SET text = 'x' WHERE post_id LIKE $1`, [`p_${ca}%`]);
  cheDo = { tra500: (ma) => ma === f };
  const r3 = await cli(agentDir, [], 3);
  assert.ok(r3.out.includes("LLM hỏng"), r3.out);
  assert.equal(await so(`SELECT count(*) n FROM ops_audit WHERE action='enrich:thu' AND detail->>'offer_id'=$1`, [f]), 0,
    `EC-AC-9 tin LLM lỗi có dấu đã thử — ${r3.out}`);
}

test("EC-AC-9 không bốc lại tin đã thử; tin hoãn vẫn đi trước; LLM lỗi thì không dấu", () => kiemKhongBocLai(AGENT));
test("EC-AC-9 chiều đỏ: selectOffers bỏ điều kiện enrich:thu → lượt hai bốc lại", () =>
  voiDotBien(
    "src/enrich/run.ts",
    "WHERE a.action = 'enrich:thu' AND",
    "WHERE a.action = 'enrich:thu-khong-co' AND",
    (d) => assert.rejects(kiemKhongBocLai(d), /EC-AC-9 lượt hai bốc lại tin đã thử/),
  ));

// ── Review Focus 4 ──────────────────────────────────────────────────────────────────────────────────────────
test("--offers id không tồn tại → 0 tin, thoát 0", async () => {
  const r = await cli(AGENT, ["--offers", `${TIEN_TO}_khong_co`]);
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /tin: 0 \|/);
});
