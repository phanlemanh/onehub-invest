// goi-thang-anthropic.test.mjs — hồ sơ _acceptance/goi-thang-anthropic (E7, E8): bước đêm doc-gop-hang-ngay.sh và bước mau-soat
// dừng sớm khi đọc gộp thoát 4 (hết tiền); nháp PL35 (label-nhap-ghep) gọi thẳng API Anthropic theo bảng chọn và dừng lát khi 402.
// Không DB: node giả (DOC_GOP_NODE) ghi đối số và trả mã dựng sẵn; máy chủ Anthropic giả qua ANTHROPIC_BASE_URL; client pg giả.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

/** Node giả: ghi đối số mỗi lần gọi, trả mã theo thứ tự `ma`. */
function nodeGia(ma) {
  const thuMuc = mkdtempSync(path.join(tmpdir(), "gta-node-"));
  const so = path.join(thuMuc, "goi.txt");
  const gia = path.join(thuMuc, "node-gia.sh");
  writeFileSync(gia, `#!/bin/bash\necho "$*" >> "${so}"\nn=$(wc -l < "${so}" | tr -d ' ')\nma=(${ma.join(" ")})\nexit "\${ma[$((n-1))]:-0}"\n`);
  chmodSync(gia, 0o755);
  const goi = () => { try { return readFileSync(so, "utf8").trim().split("\n"); } catch { return []; } };
  return { gia, goi };
}

function chayBuocDem(ma) {
  const n = nodeGia(ma);
  const r = spawnSync("bash", [path.join(ROOT, "pipeline/doc-gop-hang-ngay.sh")], {
    env: { ...process.env, DOC_GOP_NODE: n.gia, DOC_GOP_BAY_GIO: "2026-11-15T01:00:00+07:00" }, encoding: "utf8",
  });
  return { status: r.status, stderr: r.stderr, goi: n.goi() };
}

test("GTA-AC-7 bước đêm: hôm qua thoát 4 (hết tiền) → bỏ hôm kia, thoát 4, dòng JOB FAIL het-tien; thoát 3 giữ hành vi cũ", () => {
  const a = chayBuocDem([4, 0]);
  assert.equal(a.status, 4, `HET TIEN KHONG THOAT 4: ${a.stderr}`);
  assert.equal(a.goi.length, 1, `HET TIEN VAN CHAY HOM KIA: ${a.goi.join(" | ")}`);
  assert.match(a.goi[0], /hang-ngay --ngay 2026-11-14 /);
  assert.ok(a.stderr.includes("JOB FAIL [doc-gop-hang-ngay] bước hom-qua mã 4"), a.stderr);
  assert.ok(a.stderr.includes("JOB FAIL [doc-gop-hang-ngay] het-tien"), a.stderr);
  const b = chayBuocDem([3, 0]);
  assert.equal(b.status, 3);
  assert.equal(b.goi.length, 2, "CHAM TRAN MA BO HOM KIA");
  const c = chayBuocDem([5, 0]);
  assert.equal(c.status, 5);
  assert.equal(c.goi.length, 1, "THIEU KHOA VAN CHAY HOM KIA");
  assert.ok(c.stderr.includes("JOB FAIL [doc-gop-hang-ngay] thieu-khoa"), c.stderr);
});

test("GTA-AC-7 mau-soat: con doc-gop thoát 4 → lỗi het_tien, main in JOB FAIL [cloud-sync] … het-tien và thoát 4; thoát 3 là chạm trần như cũ", async () => {
  const m = await import("../mau-soat-cuon-chieu.mjs");
  const cu = process.env.DOC_GOP_NODE;
  try {
    const bon = nodeGia([4]);
    process.env.DOC_GOP_NODE = bon.gia;
    const loi = await m.goiDocGopThat(["p1", "p2"], 0.05, { runId: "gta-test" }).then(() => null, (e) => e);
    assert.ok(loi?.het_tien, `MAU SOAT KHONG NHAN HET TIEN: ${loi?.message}`);
    assert.equal(bon.goi().length, 1);
    const x = m.xuLyLoiMain(loi);
    assert.equal(x.ma, 4);
    assert.ok(x.dong.includes("JOB FAIL [cloud-sync] bước mau-soat-cuon-chieu het-tien"), x.dong.join("\n"));
    const ba = nodeGia([3]);
    process.env.DOC_GOP_NODE = ba.gia;
    assert.deepEqual(await m.goiDocGopThat(["p1"], 0.05, { runId: "gta-test" }), { goi: 1, cham_tran: true });
    assert.equal(m.xuLyLoiMain(new Error("khác")).ma, 1);
  } finally {
    if (cu === undefined) delete process.env.DOC_GOP_NODE; else process.env.DOC_GOP_NODE = cu;
  }
});

/** Máy chủ Anthropic giả: ghi từng lời gọi (đường, header, thân), trả theo `tra(i)` → { status, body }. */
async function mayChuGia(tra) {
  const ghi = [];
  const sv = createServer((req, res) => {
    let b = "";
    req.on("data", (d) => (b += d));
    req.on("end", () => {
      ghi.push({ url: req.url, auth: req.headers.authorization, body: b ? JSON.parse(b) : null });
      const { status, body } = tra(ghi.length - 1);
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(body));
    });
  });
  await new Promise((r) => sv.listen(0, "127.0.0.1", r));
  return { url: `http://127.0.0.1:${sv.address().port}`, ghi, dong: () => new Promise((r) => sv.close(r)) };
}
const tinNhan = (text) => ({
  id: "msg_gia", type: "message", role: "assistant", model: "claude-haiku-5-5", content: [{ type: "text", text }],
  stop_reason: "end_turn", stop_sequence: null, usage: { input_tokens: 300, output_tokens: 40 },
});
const HET_TIEN = { status: 402, body: { type: "error", error: { type: "billing_error", message: "chữ máy chủ giả không được chép" } } };

/** Client pg giả cho nhapLat: danh bạ rỗng, ba bài của khu op1, ghi lại mọi UPDATE. */
function clientGia() {
  const ghi = [];
  return {
    ghi,
    query: async (sql) => {
      if (/FROM eval_label_items i/.test(sql)) {
        return { rows: [1, 2, 3].map((i) => ({ item_id: i, ref_id: `p${i}`, co_nhap: false, text: `Bán căn S1.01-12${i}0`, group_name: "Cư dân OCP1", co_nguoi: false })) };
      }
      if (/^\s*UPDATE/i.test(sql)) { ghi.push(sql); return { rows: [], rowCount: 1 }; }
      return { rows: [] };
    },
  };
}

test("GTA-AC-8 nháp PL35 đường anthropic: POST /v1/messages model claude-haiku-5-5 khoá từ ANTHROPIC_API_KEY; thiếu khoá gọi tên biến; 402 bài đầu → dừng lát", async () => {
  const l = await import("../label-nhap-ghep.mjs");
  assert.deepEqual(l.cauHinhMacDinh(), { model: "anthropic/claude-haiku-5.5", duong: "anthropic" }, "BANG CHON CHUA DAT HAIKU DUONG ANTHROPIC");
  const cu = { k: process.env.ANTHROPIC_API_KEY, u: process.env.ANTHROPIC_BASE_URL };
  const sv = await mayChuGia(() => ({ status: 200, body: tinNhan('{"building":{"v":null,"trich":""}}') }));
  try {
    delete process.env.ANTHROPIC_API_KEY;
    await assert.rejects(l.tacTuMacDinh()({ chu: "x", toa: [], truc: [] }), /ANTHROPIC_API_KEY/);
    process.env.ANTHROPIC_API_KEY = "khoa-gia-gta";
    process.env.ANTHROPIC_BASE_URL = sv.url;
    const tl = await l.tacTuMacDinh()({ chu: "Bán căn", toa: ["S1.01"], truc: [] });
    assert.deepEqual(tl, { building: { v: null, trich: "" } });
    assert.equal(sv.ghi.length, 1);
    assert.equal(sv.ghi[0].url, "/v1/messages");
    assert.equal(sv.ghi[0].body.model, "claude-haiku-5-5");
    assert.equal(sv.ghi[0].auth, "Bearer khoa-gia-gta");
    assert.equal(sv.ghi[0].body.temperature, undefined, "GUI TEMPERATURE CHO HAIKU 5.5");
    assert.equal(sv.ghi[0].body.thinking, undefined, "GUI THINKING");
    assert.equal(sv.ghi[0].body.max_tokens, 600);
    assert.match(String(sv.ghi[0].body.system), /ba ô vị trí/);
    assert.match(String(sv.ghi[0].body.messages[0].content), /Danh sách toà: S1\.01/);
  } finally {
    await sv.dong();
  }
  const sv2 = await mayChuGia(() => HET_TIEN);
  try {
    process.env.ANTHROPIC_BASE_URL = sv2.url;
    const c = clientGia();
    const kq = await l.nhapLat(c, { lat: "hai-khu-ghep", tacTu: l.tacTuMacDinh() });
    assert.equal(sv2.ghi.length, 1, `HET TIEN VAN GOI TIEP: ${sv2.ghi.length}`);
    assert.equal(kq.het_tien, true);
    assert.equal(kq.goi, 1);
    assert.equal(c.ghi.length, 0, "HET TIEN VAN GHI NHAP");
    assert.ok(!String(kq.loi_cuoi).includes("chữ máy chủ giả"), kq.loi_cuoi);
  } finally {
    await sv2.dong();
    if (cu.k === undefined) delete process.env.ANTHROPIC_API_KEY; else process.env.ANTHROPIC_API_KEY = cu.k;
    if (cu.u === undefined) delete process.env.ANTHROPIC_BASE_URL; else process.env.ANTHROPIC_BASE_URL = cu.u;
  }
});

test("GTA-AC-8 nháp PL35 đường anthropic: 400 «credit balance is too low» cũng là hết tiền, lát dừng ở bài đầu", async () => {
  const l = await import("../label-nhap-ghep.mjs");
  const cu = { k: process.env.ANTHROPIC_API_KEY, u: process.env.ANTHROPIC_BASE_URL };
  const sv = await mayChuGia(() => ({ status: 400, body: { type: "error", error: { type: "invalid_request_error", message: "Your credit balance is too low to access the Anthropic API." } } }));
  try {
    process.env.ANTHROPIC_API_KEY = "khoa-gia-gta";
    process.env.ANTHROPIC_BASE_URL = sv.url;
    const kq = await l.nhapLat(clientGia(), { lat: "hai-khu-ghep", tacTu: l.tacTuMacDinh() });
    assert.equal(kq.het_tien, true, kq.loi_cuoi);
    assert.equal(sv.ghi.length, 1);
  } finally {
    await sv.dong();
    if (cu.k === undefined) delete process.env.ANTHROPIC_API_KEY; else process.env.ANTHROPIC_API_KEY = cu.k;
    if (cu.u === undefined) delete process.env.ANTHROPIC_BASE_URL; else process.env.ANTHROPIC_BASE_URL = cu.u;
  }
});

test("GTA-AC-8 nháp PL35 qua Gateway: 402 insufficient_funds cũng là hết tiền", async () => {
  const l = await import("../label-nhap-ghep.mjs");
  process.env.AI_GATEWAY_API_KEY ??= "khoa-gia";
  const fetch402 = async () => ({ ok: false, status: 402, json: async () => ({ error: { type: "insufficient_funds", message: "x" } }) });
  const loi = await l.tacTuGateway({ model: "zai/glm-5.3-flash", fetchFn: fetch402 })({ chu: "x", toa: [], truc: [] }).then(() => null, (e) => e);
  assert.ok(loi?.het_tien, loi?.message);
});
