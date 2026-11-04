// node --test scripts/quet-ten-nguon-html.test.mjs
// Hồ sơ chu-nguon-tren-cong: hai thước tên nguồn trên cổng Invest. Tên thật lấy lúc chạy từ db/migrations, tệp này không chứa tên nào.
// Tên ca mở đầu bằng mã AC.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, describe, test } from "node:test";
import { checkInvestTierA, ENTRY } from "./check-invest-tier-a.mjs";
import { sourceRegistrySeeds } from "./lib/tier-a-source-names.mjs";
import { chuHien, PHAI_CO, quetHtml, quetTrang, TRANG } from "./quet-ten-nguon-html.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SEEDS = sourceRegistrySeeds();
const S01 = SEEDS.find((s) => s.code === "S01").realName;
const S02 = SEEDS.find((s) => s.code === "S02").realName;
const TMP = realpathSync(mkdtempSync(path.join(tmpdir(), "chu-nguon-")));
after(() => rmSync(TMP, { recursive: true, force: true }));

const CHU_DU = [...new Set(Object.values(PHAI_CO).flat())].join(" · ");
const trang = (than = `<p>${CHU_DU}</p>`, dau = "") => `<!doctype html><html><head>${dau}</head><body><h1>Tiêu đề</h1>${than}</body></html>`;

describe("CN-AC-1 ma trận chỗ chứa tên", () => {
  // Viết trước mã: mỗi hàng một chỗ tên có thể nằm, [chữ hiện, toàn HTML] của S01.
  const MA_TRAN = [
    ["chữ trong thân", (t) => trang(`<p>${t}</p>`), 1, 1],
    ["<title>", (t) => trang("", `<title>${t}</title>`), 1, 1],
    ["meta description", (t) => trang("", `<meta name="description" content="${t}"/>`), 1, 1],
    ["thẻ OG", (t) => trang("", `<meta property="og:title" content="${t}"/>`), 1, 1],
    ["aria-label", (t) => trang(`<button aria-label="${t}">x</button>`), 1, 1],
    ["title", (t) => trang(`<span title="${t}">x</span>`), 1, 1],
    ["alt", (t) => trang(`<img alt="${t}"/>`), 1, 1],
    ["dữ liệu nhúng trong script", (t) => trang(`<script>self.__next_f.push([1,"{\\"snapshotId\\":\\"hanoi__${t}-discovery\\"}"])</script>`), 0, 1],
    ["id của phần tử", (t) => trang(`<div id="${t}">x</div>`), 0, 1],
    ["href", (t) => trang(`<a href="https://www.${t}.com/rooms/1">x</a>`), 0, 1],
    ["viết hoa", (t) => trang(`<p>${t.toUpperCase()}</p>`), 1, 1],
  ];
  assert.equal(MA_TRAN.length, 11);
  for (const [ten, dung, hien, html] of MA_TRAN) {
    test(`CN-AC-1 ${ten}`, () => {
      const r = quetHtml(dung(S01), SEEDS);
      assert.equal(r.hien.S01 ?? 0, hien, `${ten}: chữ hiện`);
      assert.equal(r.html.S01 ?? 0, html, `${ten}: toàn HTML`);
    });
  }
  test("CN-AC-1 đối chứng: trang sạch ra 0, bỏ <script>, <style> khỏi chữ hiện", () => {
    assert.deepEqual(quetHtml(trang(), SEEDS), { hien: {}, html: {}, tieuDeTin: {}, linkGoc: {} });
    assert.equal(chuHien(`<script>${S01}</script><style>${S01}</style>`).includes(S01), false);
    assert.deepEqual(quetHtml(trang(`<p>${S02}</p>`), SEEDS).hien, { S02: 1 });
  });
  test("CN-AC-1 link trang gốc: chỉ đúng khuôn trên trang khai là ngoại lệ, chỗ khác vẫn đỏ", () => {
    const ten = S01.toLowerCase();
    const nut = `<a href="https://www.${ten}.com/rooms/123">Mở trang gốc</a><script>x="https://www.${ten}.com/rooms/123"</script>`;
    assert.deepEqual(quetHtml(trang(nut), SEEDS, { coLinkGoc: true }), { hien: {}, html: {}, tieuDeTin: {}, linkGoc: { S01: 2 } });
    assert.deepEqual(quetHtml(trang(nut), SEEDS).html, { S01: 2 }, "trang không khai: link vẫn đỏ");
    for (const [ten_, moi] of [
      ["đường khác trên miền", `<a href="https://www.${ten}.com/users/1">x</a>`],
      ["miền khác mang tên", `<a href="https://${ten}.example/rooms/1">x</a>`],
      ["chữ trên nút", `<a href="https://www.${ten}.com/rooms/1">Mở trên ${S01}</a>`],
      ["mã khác trong link", `<a href="https://www.${S02.toLowerCase()}.com/rooms/1">x</a>`],
    ]) {
      const r = quetHtml(trang(moi), SEEDS, { coLinkGoc: true });
      assert.ok(Object.keys(r.html).length > 0, `${ten_}: phải đỏ`);
    }
  });
  test("CN-AC-1 tiêu đề được miễn cộng chữ thân có tên: thân vẫn tính ở chữ hiện", () => {
    const hai = `<p>${S01} tự thu</p><script>x="\\"name\\":\\"Phòng ${S01}\\""</script>`;
    const r = quetHtml(trang(hai), SEEDS, { coTieuDeTin: true });
    assert.deepEqual(r.hien, { S01: 1 });
    assert.deepEqual(r.tieuDeTin, { S01: 1 });
    assert.deepEqual(r.html, { S01: 1 });
  });
  test("CN-AC-1 tiêu đề tin chỉ đếm riêng khi trang được khai, chữ của cổng trên cùng trang vẫn đỏ", () => {
    const tieuDe = `<script>x="\\"name\\":\\"Phòng đẹp ${S01} gần hồ\\",\\"roomType\\":\\"r\\""</script>`;
    assert.deepEqual(quetHtml(trang(tieuDe), SEEDS, { coTieuDeTin: true }).html, {});
    assert.deepEqual(quetHtml(trang(tieuDe), SEEDS, { coTieuDeTin: true }).tieuDeTin, { S01: 1 });
    assert.deepEqual(quetHtml(trang(tieuDe), SEEDS).html, { S01: 1 }, "trang không khai: tiêu đề tin vẫn đỏ");
    const moTa = `<script>x="\\"description\\":\\"${S01} tự thu\\""</script>`;
    assert.deepEqual(quetHtml(trang(moTa), SEEDS, { coTieuDeTin: true }).html, { S01: 1 }, "khoá khác name không được miễn");
  });
});

/** Máy chủ giả trả `tra(path)`; trả cổng và hàm đóng. */
async function mayChu(tra) {
  const s = createServer((req, res) => {
    const { status = 200, body = trang(), type = "text/html; charset=utf-8" } = tra(req.url);
    res.writeHead(status, { "content-type": type });
    res.end(body);
  });
  await new Promise((r) => s.listen(0, r));
  return { base: `http://127.0.0.1:${s.address().port}`, dong: () => new Promise((r) => s.close(r)) };
}

const chayLenh = (base) =>
  new Promise((res) => {
    const p = spawn(process.execPath, [path.join(REPO, "scripts/quet-ten-nguon-html.mjs"), "--base", base]);
    let out = "";
    p.stdout.on("data", (d) => (out += d));
    p.on("close", (code) => res({ code, out }));
  });

describe("CN-AC-1 lệnh quét trên máy chủ", () => {
  test("CN-AC-1 danh sách trang", () => {
    assert.equal(TRANG.length, 12);
    for (const p of ["/", "/vn", "/vn/hanoi", "/vn/hanoi/listings/sale", "/vn/hanoi/listings/rent", "/vn/hanoi/listings/rent?term=short", "/listing/:mau", "/register", "/methodology"]) {
      assert.ok(TRANG.includes(p), p);
    }
  });
  test("CN-AC-1 sạch thì thoát 0; tên ở một trang thì thoát 1, gọi tên trang và mã, không in tên", async () => {
    let dirty = null;
    const m = await mayChu((u) => ({ body: u === dirty ? trang(`<p>${S01}</p><script>"${S02}"</script>`) : trang(`<p>${CHU_DU}</p><a href="/listing/abnb_1">x</a>`) }));
    try {
      const sach = await chayLenh(m.base);
      assert.equal(sach.code, 0, sach.out);
      assert.match(sach.out, /tổng: 12 trang · còn tên 0 · không đo được 0/);
      dirty = "/vn/hanoi/listings/sale";
      const do_ = await chayLenh(m.base);
      assert.equal(do_.code, 1, do_.out);
      assert.match(do_.out, /CÒN-TÊN \/vn\/hanoi\/listings\/sale: chữ hiện S01=1 · toàn HTML S01=1 S02=1/);
      assert.ok(!do_.out.toLowerCase().includes(S01.toLowerCase()) && !do_.out.toLowerCase().includes(S02.toLowerCase()), "báo cáo không được in tên thật");
    } finally {
      await m.dong();
    }
  });
  test("CN-AC-4 câu sai, thiếu chữ, vượt trần tiêu đề đều thoát 1 và ghim thông điệp; đối chứng cùng máy chủ sạch thoát 0", async () => {
    const lanh = trang(`<p>${CHU_DU}</p><a href="/listing/abnb_1">x</a>`);
    const nhieuTieuDe = Array.from({ length: 6 }, () => `\\"name\\":\\"Phòng ${S01}\\"`).join(",");
    for (const [u, than, ghim] of [
      ["/", `<p>${CHU_DU} tin rao giả lập</p>`, /CÂU-SAI \/: /],
      ["/vn/hanoi", `<p>${CHU_DU} DỮ LIỆU MÔ PHỎNG</p>`, /CÂU-SAI \/vn\/hanoi: /],
      ["/methodology", "<p>không có chữ nào</p>", /THIẾU-CHỮ \/methodology: nền tảng thuê ngắn hạn/],
      ["/vn/hanoi/listings/rent?term=short", `<p>${CHU_DU}</p><a href="/listing/abnb_1">x</a><script>x="${nhieuTieuDe}"</script>`, /VƯỢT-TRẦN \/vn\/hanoi\/listings\/rent\?term=short/],
    ]) {
      const m = await mayChu((p) => ({ body: p === u ? trang(than) : lanh }));
      try {
        const r = await chayLenh(m.base);
        assert.equal(r.code, 1, r.out);
        assert.match(r.out, ghim);
      } finally {
        await m.dong();
      }
    }
    const m = await mayChu(() => ({ body: lanh }));
    try {
      assert.equal((await chayLenh(m.base)).code, 0);
    } finally {
      await m.dong();
    }
  });
  test("CN-AC-1 không đo được thì thoát 2, không tính là sạch: mã 500, trang không có h1, không tới được", async () => {
    for (const [tra, ghim] of [
      [() => ({ status: 500 }), /KHONG-DO \/: mã 500/],
      [() => ({ body: "<html><body>trống</body></html>" }), /KHONG-DO \/: không có <h1>/],
      [() => ({ type: "application/json", body: "{}" }), /KHONG-DO \/: kiểu application\/json/],
    ]) {
      const m = await mayChu(tra);
      try {
        const r = await chayLenh(m.base);
        assert.equal(r.code, 2, r.out);
        assert.match(r.out, ghim);
      } finally {
        await m.dong();
      }
    }
    assert.equal(await quetTrang({ base: "http://127.0.0.1:1", trang: ["/"], log: () => {} }), 2);
    const khongMau = await mayChu(() => ({}));
    try {
      const r = await chayLenh(khongMau.base);
      assert.equal(r.code, 2, r.out);
      assert.match(r.out, /KHONG-DO \/listing\/:mau: không lấy được mã listing mẫu/);
    } finally {
      await khongMau.dong();
    }
  });
});

describe("CN-AC-2 thước tĩnh trên mã của năm trang", () => {
  test("CN-AC-2 cây thật: 0 chỗ trúng, đi tới các tệp dùng chung", () => {
    const { files, hits } = checkInvestTierA({ root: REPO });
    assert.deepEqual(hits, []);
    for (const f of [
      "app/src/components/shell/site-footer.tsx",
      "app/src/components/marketing/hero.tsx",
      "app/src/components/marketing/methodology-definitions.tsx",
      "app/src/components/insight/insight-page.tsx",
      "app/src/components/listing/listings-page-body.tsx",
      "app/src/components/yield/yield-form.tsx",
      "app/src/components/compare/comparison.tsx",
      "app/src/components/auth/register-form.tsx",
      "app/src/components/listing/listing-hero.tsx",
    ]) {
      assert.ok(files.includes(f), `thước phải đi tới ${f}`);
    }
    assert.ok(ENTRY.every((e) => files.includes(e)));
  });
  test("CN-AC-7 mã trang không đọc bảng, hàm số S02; chiều đỏ trên fixture", () => {
    assert.deepEqual(checkInvestTierA({ root: REPO }).s02, []);
    const root = path.join(TMP, "cay-s02");
    mkdirSync(path.join(root, "app/src"), { recursive: true });
    writeFileSync(path.join(root, "app/src/p.tsx"), `export default async function P() { return get${S02.replace(/\W/g, "")}Comparison('x'); }\n`);
    assert.deepEqual(checkInvestTierA({ root, entries: ["app/src/p.tsx"], seeds: SEEDS }).s02, ["app/src/p.tsx"]);
  });
  test("CN-AC-2 chiều đỏ trên fixture: chữ JSX, khoá object, biến chuỗi đều đỏ; định danh, comment, SQL không đỏ", () => {
    const root = path.join(TMP, "cay");
    mkdirSync(path.join(root, "app/src/c"), { recursive: true });
    const viet = (f, s) => writeFileSync(path.join(root, f), s);
    viet("app/src/p.tsx", 'import { A } from "@/c/a";\nimport "./khong-co";\nexport default function P() { return <A />; }\n');
    const lanh = `// ${S01} trong comment\nconst ${S01.toLowerCase().replace(/\W/g, "")}Url = 1;\nexport function A() { return <p>sạch {${S01.toLowerCase().replace(/\W/g, "")}Url}</p>; }\n`;
    viet("app/src/c/a.tsx", lanh);
    viet("app/src/c/b.ts", `export const SQL = \`SELECT 1 FROM ${S01}_snapshots\`;\n`);
    assert.deepEqual(checkInvestTierA({ root, entries: ["app/src/p.tsx"], seeds: SEEDS }).hits, [], "đối chứng dương: cùng fixture phải xanh");
    for (const [ten, phan, dong] of [
      ["chữ JSX", `export function A() { return <p>Dữ liệu ${S01}</p>; }\n`, 1],
      ["khoá object", `export const Q = [{ question: "${S01} là gì" }];\nexport function A() { return null; }\n`, 1],
      ["biến chuỗi", `export function A() {\n  const source = "${S01} tự thu";\n  return <p>{source}</p>;\n}\n`, 2],
      ["aria-label", `export function A() { return <b aria-label="${S01}" />; }\n`, 1],
    ]) {
      viet("app/src/c/a.tsx", phan);
      const { hits } = checkInvestTierA({ root, entries: ["app/src/p.tsx"], seeds: SEEDS });
      assert.deepEqual(hits, [{ code: "S01", file: "app/src/c/a.tsx", line: dong }], `chiều đỏ ${ten}`);
    }
    viet("app/src/c/a.tsx", lanh);
    viet("app/src/c/ngoai.tsx", `export function X() { return <p>${S01}</p>; }\n`);
    assert.deepEqual(checkInvestTierA({ root, entries: ["app/src/p.tsx"], seeds: SEEDS }).hits, [], "tệp trang không import thì ngoài phạm vi");
  });
});
