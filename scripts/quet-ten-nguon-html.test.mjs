// node --test scripts/quet-ten-nguon-html.test.mjs
// Hồ sơ chu-nguon-tren-cong: hai thước tên nguồn trên cổng Invest. Tên thật lấy lúc chạy từ db/migrations, tệp này không chứa tên nào.
// Tên ca mở đầu bằng mã AC.
import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, describe, test } from "node:test";
import { checkInvestTierA, loiVao, quetChuoi } from "./check-invest-tier-a.mjs";
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
    assert.deepEqual(quetHtml(trang(), SEEDS), { hien: {}, html: {}, tieuDeTin: {}, linkGoc: {}, soTieuDe: 0 });
    assert.equal(chuHien(`<script>${S01}</script><style>${S01}</style>`).includes(S01), false);
    assert.deepEqual(quetHtml(trang(`<p>${S02}</p>`), SEEDS).hien, { S02: 1 });
  });
  test("CN-AC-1 link trang gốc: chỉ đúng khuôn trên trang khai là ngoại lệ, chỗ khác vẫn đỏ", () => {
    const ten = S01.toLowerCase();
    const nut = `<a href="https://www.${ten}.com/rooms/123">Mở trang gốc</a><script>x="https://www.${ten}.com/rooms/123"</script>`;
    assert.deepEqual(quetHtml(trang(nut), SEEDS, { coLinkGoc: true }), { hien: {}, html: {}, tieuDeTin: {}, linkGoc: { S01: 2 }, soTieuDe: 0 });
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
  test("CN-AC-2 tiêu đề tin: miễn ở mọi dạng của đúng chuỗi trong danh sách; chữ của cổng trên cùng trang vẫn đỏ", () => {
    const td = `Phòng đẹp ${S01} "xịn" gần hồ & phố`;
    const nhung = (t) => `<script>self.__next_f.push(${JSON.stringify([1, JSON.stringify({ name: t })]).replace(/&/g, "\\u0026")})</script>`;
    const thoat = td.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
    const ve = `<h2 class="x">${thoat}</h2><img alt="${thoat}"/>`;
    const dau = `<title>${thoat} · One Invest</title>`;
    const r = quetHtml(trang(ve + nhung(td), dau), SEEDS, { tieuDe: [td] });
    assert.deepEqual(r.hien, {}, "tiêu đề hiện ra đã khai thì không đỏ");
    assert.deepEqual(r.html, {});
    assert.deepEqual(r.tieuDeTin, { S01: 4 });
    assert.equal(r.soTieuDe, 1);
    assert.deepEqual(quetHtml(trang(ve + nhung(td), dau), SEEDS).html, { S01: 4 }, "không có danh sách: vẫn đỏ");
    const hai = quetHtml(trang(`<p>${S01} tự thu</p>` + nhung(td)), SEEDS, { tieuDe: [td] });
    assert.deepEqual(hai.hien, { S01: 1 }, "chữ của cổng trên cùng trang vẫn đỏ");
    assert.deepEqual(hai.html, { S01: 1 });
    assert.deepEqual(quetHtml(trang(`<h2>Phòng ${S01} khác</h2>` + nhung(td)), SEEDS, { tieuDe: [td] }).hien, { S01: 1 }, "chuỗi ngoài danh sách không được miễn");
    assert.deepEqual(quetHtml(trang(`<p>${S01} tự thu</p>` + nhung(S01)), SEEDS).html, { S01: 2 }, "giá trị name đúng bằng tên, không trong danh sách: đỏ");
    const lenh = `<script>x="\\"name\\":\\"${S01}\\""</script><p>${S01} tự thu</p>`;
    assert.deepEqual(quetHtml(trang(lenh), SEEDS, { tieuDe: [td] }).html, { S01: 2 }, "khoá name ngoài danh sách không được miễn");
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
    const dsTieuDe = Array.from({ length: 6 }, (_, i) => ({ id: `abnb_${i}`, name: `Phòng ${i} ${S01}` }));
    for (const [u, than, ghim] of [
      ["/", `<p>${CHU_DU} tin rao giả lập</p>`, /CÂU-SAI \/: /],
      ["/vn/hanoi", `<p>${CHU_DU} DỮ LIỆU MÔ PHỎNG</p>`, /CÂU-SAI \/vn\/hanoi: /],
      ["/methodology", "<p>không có chữ nào</p>", /THIẾU-CHỮ \/methodology: nền tảng thuê ngắn hạn/],
      ["/vn/hanoi/listings/rent?term=short", `<p>${CHU_DU}</p><a href="/listing/abnb_1">x</a><script>x="${dsTieuDe.map((l) => l.name).join(",")}"</script>`, /VƯỢT-TRẦN \/vn\/hanoi\/listings\/rent\?term=short: 6 tiêu đề/],
    ]) {
      const m = await mayChu((p) => ({ body: p === u ? trang(than) : lanh }));
      try {
        const dong = [];
        const ma = await quetTrang({ base: m.base, entries: SEEDS, listings: dsTieuDe, log: (l) => dong.push(l) });
        assert.equal(ma, 1, dong.join("\n"));
        assert.match(dong.join("\n"), ghim);
      } finally {
        await m.dong();
      }
    }
    const m = await mayChu(() => ({ body: lanh }));
    try {
      assert.equal(await quetTrang({ base: m.base, entries: SEEDS, listings: dsTieuDe, log: () => {} }), 0);
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
      const dong = [];
      assert.equal(await quetTrang({ base: khongMau.base, entries: SEEDS, listings: [], log: (l) => dong.push(l) }), 2);
      assert.match(dong.join("\n"), /KHONG-DO \/listing\/:mau: không lấy được mã listing mẫu/);
    } finally {
      await khongMau.dong();
    }
  });
});

describe("CN-AC-3 thước tĩnh trên mã các trang", () => {
  test("CN-AC-3 lối vào: mọi tệp Next nạp theo quy ước của cổng, gồm layout đăng ký, trang lỗi, trang không tìm thấy; không có ops, api", () => {
    const vao = loiVao(REPO);
    for (const f of [
      "app/src/app/layout.tsx",
      "app/src/app/global-error.tsx",
      "app/src/app/not-found.tsx",
      "app/src/app/(auth)/layout.tsx",
      "app/src/app/(auth)/error.tsx",
      "app/src/app/(auth)/register/page.tsx",
      "app/src/app/(app)/error.tsx",
      "app/src/app/(app)/not-found.tsx",
      "app/src/app/(app)/yield/page.tsx",
      "app/src/app/(app)/compare/page.tsx",
      "app/src/app/(app)/listing/[id]/page.tsx",
      "app/src/app/(app)/[country]/page.tsx",
      "app/src/app/(app)/[country]/[market]/page.tsx",
      "app/src/app/(app)/[country]/[market]/map/page.tsx",
      "app/src/app/(app)/[country]/[market]/[submarket]/page.tsx",
      "app/src/app/(app)/[country]/[market]/listings/sale/page.tsx",
      "app/src/app/(app)/[country]/[market]/listings/rent/page.tsx",
      "app/src/app/(marketing)/layout.tsx",
      "app/src/app/(marketing)/error.tsx",
      "app/src/app/(marketing)/page.tsx",
      "app/src/app/(marketing)/methodology/page.tsx",
    ]) {
      assert.ok(vao.includes(f), `thiếu lối vào ${f}`);
    }
    assert.deepEqual(vao.filter((f) => /^app\/src\/app\/(ops|api)\//.test(f)), []);
  });
  test("CN-AC-3 cây thật: 0 chỗ trúng, đi tới các tệp dùng chung", () => {
    const { files, hits } = checkInvestTierA({ root: REPO });
    assert.deepEqual(hits, []);
    assert.ok(files.length >= 200, `tập quét quá nhỏ: ${files.length}`);
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
      "app/src/components/states/not-found-state.tsx",
    ]) {
      assert.ok(files.includes(f), `thước phải đi tới ${f}`);
    }
  });
  test("CN-AC-3 hồi quy: mã trước khi sửa của hai chỗ từng lọt bị bắt đúng dòng", () => {
    const goc = "daccb40340558dd819beca8927d897ba90bfeddf";
    for (const [f, dong] of [
      ["app/src/app/(app)/yield/page.tsx", 168],
      ["app/src/components/listing/listing-hero.tsx", 43],
    ]) {
      const hits = quetChuoi(f, execFileSync("git", ["show", `${goc}:${f}`], { cwd: REPO, encoding: "utf8", maxBuffer: 1 << 24 }), SEEDS);
      assert.ok(hits.some((h) => h.line === dong && h.code === "S01"), `${f}:${dong} phải trúng`);
    }
  });
  // Viết trước mã: dạng chứa tên, tệp, dòng trúng.
  const DO = [
    ["chữ JSX", "a.tsx", (t) => `export function A() { return <p>Dữ liệu ${t}</p>; }\n`, 1],
    ["aria-label", "a.tsx", (t) => `export function A() { return <b aria-label="${t}" />; }\n`, 1],
    ["khoá object", "a.tsx", (t) => `export const Q = [{ question: "${t} là gì" }];\nexport const A = () => null;\n`, 1],
    ["khoá value", "a.tsx", (t) => `export const Q = { value: "${t} là gì" };\nexport const A = () => null;\n`, 1],
    ["template khoá value", "a.tsx", (t) => "export const Q = (n) => ({ value: `${n} đánh giá trên " + t + "` });\nexport const A = () => null;\n", 1],
    ["biến chuỗi", "a.tsx", (t) => `export function A() {\n  const source = "${t} tự thu";\n  return <p>{source}</p>;\n}\n`, 2],
    ["biến template", "a.tsx", (t) => "export function A({ id }) {\n  const d = `" + t + " · ${id}`;\n  return <p>{d}</p>;\n}\n", 2],
    ["biến ternary", "a.tsx", (t) => `export function A({ x }) {\n  const d = x ? "${t} tự thu" : "b";\n  return <p>{d}</p>;\n}\n`, 2],
    ["mảng trong biến", "a.tsx", (t) => `export function A() {\n  const a = ["${t} nói"];\n  return <p>{a[0]}</p>;\n}\n`, 2],
    ["hằng trong tệp .ts", "b.ts", (t) => `export const B = "${t} tự thu";\n`, 1],
    ["return trong tệp .ts", "b.ts", (t) => `export function B() { return "${t} tự thu"; }\n`, 1],
  ];
  // Cùng fixture phải xanh: chú thích, định danh, câu SQL, tên bảng và cột, trường liền khối, phép so.
  const XANH = [
    ["chú thích", "a.tsx", (t) => `// ${t} trong chú thích\nexport function A() { return <p>sạch</p>; }\n`],
    ["định danh", "a.tsx", (t) => { const id = t.toLowerCase().replace(/\W/g, ""); return `const ${id}Url = 1;\nexport function A() { return <p>{${id}Url}</p>; }\n`; }],
    ["câu SQL", "b.ts", (t) => "export const B = `SELECT 1 FROM " + t + "_snapshots`;\n"],
    ["tên bảng trần", "b.ts", (t) => `export const B = "${t.toLowerCase()}_snapshots.collected_at";\n`],
    ["trường liền khối", "b.ts", (t) => `export const B = ["${t.toLowerCase().replace(/\W/g, "")}Value"];\n`],
    ["phép so", "b.ts", (t) => `export const B = (x) => x === "${t}";\n`],
  ];
  assert.equal(DO.length, 11);
  assert.equal(XANH.length, 6);
  const dung = (ten, tep, noiDung) => {
    const root = path.join(TMP, ten.replace(/\W/g, "-"));
    mkdirSync(path.join(root, "app/src/c"), { recursive: true });
    writeFileSync(path.join(root, "app/src/p.tsx"), 'import { A } from "@/c/a";\nimport { B } from "@/c/b";\nimport "./khong-co";\nexport default function P() { return <A b={B} />; }\n');
    writeFileSync(path.join(root, "app/src/c/a.tsx"), "export const A = () => null;\n");
    writeFileSync(path.join(root, "app/src/c/b.ts"), "export const B = 1;\n");
    writeFileSync(path.join(root, `app/src/c/${tep}`), noiDung);
    return checkInvestTierA({ root, entries: ["app/src/p.tsx"], seeds: SEEDS });
  };
  for (const [ten, tep, f, dong] of DO) {
    test(`CN-AC-3 chiều đỏ: ${ten}`, () => {
      assert.deepEqual(dung(ten, tep, f(S01)).hits, [{ code: "S01", file: `app/src/c/${tep}`, line: dong }]);
    });
  }
  for (const [ten, tep, f] of XANH) {
    test(`CN-AC-3 đối chứng xanh: ${ten}`, () => {
      assert.deepEqual(dung(ten, tep, f(S01)).hits, []);
    });
  }
  test("CN-AC-3 tệp mà trang không import thì ngoài phạm vi; trang mới tự vào lối vào", () => {
    const root = path.join(TMP, "ngoai");
    mkdirSync(path.join(root, "app/src/app/ops"), { recursive: true });
    mkdirSync(path.join(root, "app/src/app/moi"), { recursive: true });
    writeFileSync(path.join(root, "app/src/app/layout.tsx"), "export default function L() { return null; }\n");
    writeFileSync(path.join(root, "app/src/app/ops/page.tsx"), `export default function O() { return <p>${S01}</p>; }\n`);
    writeFileSync(path.join(root, "app/src/app/rieng.tsx"), `export const R = "${S01}";\n`);
    assert.deepEqual(checkInvestTierA({ root, seeds: SEEDS }).hits, [], "ops và tệp không import ngoài phạm vi");
    writeFileSync(path.join(root, "app/src/app/moi/page.tsx"), `export default function M() { return <p>${S01}</p>; }\n`);
    assert.deepEqual(checkInvestTierA({ root, seeds: SEEDS }).hits, [{ code: "S01", file: "app/src/app/moi/page.tsx", line: 1 }], "trang mới tự vào lối vào");
  });
  test("CN-AC-7 mã trang không đọc bảng, hàm số S02; chiều đỏ trên fixture", () => {
    assert.deepEqual(checkInvestTierA({ root: REPO }).s02, []);
    const root = path.join(TMP, "cay-s02");
    mkdirSync(path.join(root, "app/src"), { recursive: true });
    writeFileSync(path.join(root, "app/src/p.tsx"), `export default async function P() { return get${S02.replace(/\W/g, "")}Comparison('x'); }\n`);
    assert.deepEqual(checkInvestTierA({ root, entries: ["app/src/p.tsx"], seeds: SEEDS }).s02, ["app/src/p.tsx"]);
  });
});
