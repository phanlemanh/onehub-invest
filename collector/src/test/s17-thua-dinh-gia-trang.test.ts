import { strict as assert } from "node:assert";
import { test } from "node:test";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runInNewContext } from "node:vm";

import { loadConfig } from "../collectors/s17-thua-dinh-gia/config.js";
import { RunStopped } from "../collectors/s17-thua-dinh-gia/client.js";
import { khoaPhien } from "../collectors/s17-thua-dinh-gia/khoa-phien.js";
import { chonTrangGoi, EGO_EVALUATE_LIMIT_MS, IN_PAGE_COLLECT, IN_PAGE_START, IN_PAGE_STALE_MS, IN_PAGE_TIMEOUT_MS, makeTransports, main as egoMain, type EgoApi, type EgoPage } from "../collectors/s17-thua-dinh-gia/ego.js";

/**
 * S17 mốc ngày 2: LỜI GỌI TRONG TRANG và hạn của trình duyệt. Đo 24/11 (lượt quét thấp tầng): đợt 50 id đầu xong
 * sau 29 s; sang đợt hai, lần chạy trong trang treo đủ 15 s thì bị trình duyệt hủy («page.evaluate timed out after
 * 15000ms») và CẢ LƯỢT vỡ. Chặn lời gọi ở 10 s thì lượt không vỡ nữa nhưng bản ghi máy chủ trả chậm (id 52 và 1705,
 * lặp lại ở cả hai lượt) thành lỗi vĩnh viễn. Vậy KHÔNG lần chạy trong trang nào được chờ lời gọi: bắt đầu rồi hỏi
 * kết quả bằng các lần chạy ngắn.
 *
 * Chỗ việc trong trang chỉ có MỘT: 18:09 cùng ngày hai lượt tranh tab (lượt «đã giết» còn sống trong dịch vụ trình
 * duyệt) nên lượt này nhận kết quả của lượt kia. Vậy việc phải mang MÃ RIÊNG, tab bận thì không ghi đè, và số kết quả
 * phải đối chiếu với số lời đã gửi. Máy chủ và trang ở đây đều GIẢ.
 */

type InPageResult = { status: number; contentType: string | null; body: string; bytes?: number; networkError?: string };
type InPageInput = { url: string; headerJson: string; cookieName: string; timeoutMs: number };
type DaCollect = { mat: true } | { done: number; tong: number; rs?: InPageResult[] };
type Tro = { ms: number; addEventListener(type: "abort", fn: () => void): void };
type LoiGoi = { url: string; init: { signal: Tro; headers: Record<string, string> } };

const U = "https://api.gia.test/";
const nghi = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const ngoai = (url: string) => ({ status: 200, headers: { get: () => "application/json" }, text: async () => `{"ok":"${url}"}` });
const tiLe = (kq: DaCollect) => ("done" in kq ? `${kq.done}/${kq.tong}` : "mất");
const rsCua = (kq: DaCollect): InPageResult[] | undefined => ("rs" in kq ? kq.rs : undefined);

/**
 * Trang giả. `treoUrl`: lời không bao giờ trả, chỉ dứt khi có tín hiệu hủy; tín hiệu hủy ném lỗi mang số ms đã xin
 * («SIG-ABORT:<ms>»). `chamUrl`: lời trả ĐÚNG nhưng sau `treoMs`, hoặc sau `treoRieng[url]` nếu có. Còn lại trả ngay.
 * `doi` ghi mọi mili giây trang được bảo chờ; `xacThuc` ghi header Authorization của mỗi lời; `now` giả đồng hồ của trang.
 */
function trangGia(o: { treoUrl?: string[]; loiUrl?: string[]; chamUrl?: string[]; treoMs?: number; treoRieng?: Record<string, number>; cookie?: string; doi?: number[]; now?: () => number; goc?: string } = {}): { sandbox: Record<string, unknown>; daXinCho: number[]; xacThuc: Array<string | undefined> } {
  const daXinCho: number[] = [];
  const xacThuc: Array<string | undefined> = [];
  const sandbox: Record<string, unknown> = {
    document: { cookie: o.cookie ?? "sid=phi%20en" },
    setTimeout: (fn: () => void, ms: number) => {
      (o.doi ??= []).push(ms);
      return setTimeout(fn, ms);
    },
    AbortSignal: {
      timeout(ms: number): Tro {
        daXinCho.push(ms);
        let fn: (() => void) | null = null;
        setTimeout(() => fn?.(), ms);
        return { ms, addEventListener: (_type, f) => (fn = f) };
      },
    },
    fetch: (url: string, init: LoiGoi["init"]) =>
      new Promise((resolve, reject) => {
        xacThuc.push(init.headers.Authorization);
        if ((o.loiUrl ?? []).includes(url)) {
          reject(new TypeError("Failed to fetch"));
          return;
        }
        const treo = (o.treoUrl ?? []).includes(url);
        if (!treo && !(o.chamUrl ?? []).includes(url)) {
          resolve(ngoai(url));
          return;
        }
        if (!treo) setTimeout(() => resolve(ngoai(url)), o.treoRieng?.[url] ?? o.treoMs ?? 60);
        init.signal.addEventListener("abort", () => reject(new Error(`SIG-ABORT:${init.signal.ms}`)));
      }),
  };
  if (o.now) sandbox.Date = { now: o.now };
  if (o.goc) sandbox.location = { origin: o.goc };
  return { sandbox, daXinCho, xacThuc };
}

const dau = (sandbox: Record<string, unknown>) => runInNewContext(`(${IN_PAGE_START.toString()})`, sandbox) as (input: { items: InPageInput[]; staggerMs: number; token: string }) => number;
const lay = (sandbox: Record<string, unknown>) => runInNewContext(`(${IN_PAGE_COLLECT.toString()})`, sandbox) as (input: { token: string }) => DaCollect;
const mot = (url: string, timeoutMs = 40): InPageInput => ({ url, headerJson: "{}", cookieName: "sid", timeoutMs });

test("hạn chờ một lời trong trang không còn bị buộc dưới hạn của trình duyệt; hạn việc mồ côi nằm nguyên văn trong hàm tự chứa", () => {
  assert.ok(IN_PAGE_TIMEOUT_MS > EGO_EVALUATE_LIMIT_MS, `hạn chờ ${IN_PAGE_TIMEOUT_MS} ms phải dài hơn ${EGO_EVALUATE_LIMIT_MS} ms của trình duyệt`);
  assert.ok(IN_PAGE_TIMEOUT_MS <= 120_000, "vẫn là hạn chờ hữu hạn");
  assert.equal(IN_PAGE_STALE_MS, IN_PAGE_TIMEOUT_MS + EGO_EVALUATE_LIMIT_MS + 15_000);
  assert.ok(IN_PAGE_START.toString().includes(String(IN_PAGE_STALE_MS)), "hàm chạy trong trang không tham chiếu được biến ngoài nên hạn phải là số viết sẵn");
});

test("bắt đầu lời trong trang trả về NGAY số lời đã nhận, không chờ lời gọi; mỗi lời xin đúng hạn chờ được đưa", () => {
  const { sandbox, daXinCho } = trangGia({ treoUrl: [`${U}treo`] });
  const n = dau(sandbox)({ items: [mot(`${U}treo`, 40), mot(`${U}treo`, 55)], staggerMs: 0, token: "a" });
  assert.equal(n, 2, "hai lời treo vĩnh viễn mà lần bắt đầu vẫn trả ngay");
  assert.deepEqual(daXinCho, [40, 55]);
});

test("lời i bắt đầu sau i × staggerMs, không dồn hết vào một lúc", () => {
  const doi: number[] = [];
  const { sandbox } = trangGia({ doi });
  dau(sandbox)({ items: [mot(`${U}a`), mot(`${U}b`), mot(`${U}c`)], staggerMs: 250, token: "a" });
  assert.deepEqual(doi, [250, 500]);
});

test("hỏi kết quả: chưa xong thì chỉ báo số đã xong, xong hết thì trả kết quả, lần sau thì trang không giữ việc nữa", async () => {
  const { sandbox } = trangGia({ chamUrl: [`${U}cham`] });
  dau(sandbox)({ items: [mot(`${U}ve`), mot(`${U}cham`, 200)], staggerMs: 0, token: "a" });
  await nghi(5);
  const chua = lay(sandbox)({ token: "a" });
  assert.equal(tiLe(chua), "1/2", "lời trả ngay đã xong, lời chậm chưa");
  assert.equal("rs" in chua, false, "chưa xong thì chưa thấy thân nào");
  await nghi(120);
  const xong = lay(sandbox)({ token: "a" });
  assert.equal(tiLe(xong), "2/2");
  assert.equal(rsCua(xong)?.map((r) => r.body).join(" | "), `{"ok":"${U}ve"} | {"ok":"${U}cham"}`, "lời chậm vẫn về đủ thân, đúng thứ tự");
  assert.equal(JSON.stringify(lay(sandbox)({ token: "a" })), '{"mat":true}', "đã lấy rồi thì trang bỏ việc");
});

test("lời treo quá hạn chờ thì dứt bằng tín hiệu hủy của chính nó, lời khác trong cùng đợt vẫn về", async () => {
  const { sandbox } = trangGia({ treoUrl: [`${U}treo`], chamUrl: [`${U}cham`] });
  dau(sandbox)({ items: [mot(`${U}treo`, 40), mot(`${U}cham`, 200)], staggerMs: 0, token: "a" });
  await nghi(120);
  const rs = rsCua(lay(sandbox)({ token: "a" }));
  assert.equal(rs?.length, 2);
  assert.match(String(rs?.[0].networkError), /SIG-ABORT:40/, "lời treo dứt đúng lúc hết hạn chờ");
  assert.equal(rs?.[0].status, 0);
  assert.equal(rs?.[1].status, 200, "lời chậm trong hạn chờ vẫn thành công");
});

test("việc mang MÃ RIÊNG: lấy bằng mã khác thì báo mất, không lộ kết quả và không tiêu dùng việc", async () => {
  const { sandbox } = trangGia({ chamUrl: [`${U}rieng`], treoMs: 80 });
  dau(sandbox)({ items: [mot(`${U}rieng`, 300)], staggerMs: 0, token: "cua-toi" });
  await nghi(100);
  assert.equal(JSON.stringify(lay(sandbox)({ token: "cua-nguoi-khac" })), '{"mat":true}', "không trả kết quả cho kẻ giữ mã khác");
  assert.equal(rsCua(lay(sandbox)({ token: "cua-toi" }))?.[0].body, `{"ok":"${U}rieng"}`, "chủ việc vẫn lấy được đủ");
});

test("tab đang giữ việc chưa xong của đợt khác thì lần bắt đầu trả -1 và KHÔNG ghi đè; việc cũ vẫn lấy được đủ", async () => {
  const { sandbox, daXinCho } = trangGia({ chamUrl: [`${U}cu`], treoRieng: { [`${U}cu`]: 60 } });
  assert.equal(dau(sandbox)({ items: [mot(`${U}cu`, 300)], staggerMs: 0, token: "cu" }), 1);
  assert.equal(dau(sandbox)({ items: [mot(`${U}moi`)], staggerMs: 0, token: "moi" }), -1, "việc cũ chưa xong: không bắt đầu việc mới");
  assert.deepEqual(daXinCho, [300], "lời của việc mới chưa được gửi");
  await nghi(90);
  assert.equal(rsCua(lay(sandbox)({ token: "cu" }))?.[0].body, `{"ok":"${U}cu"}`);
  assert.equal(dau(sandbox)({ items: [mot(`${U}moi`)], staggerMs: 0, token: "moi" }), 1, "việc cũ đã lấy xong thì bắt đầu được việc mới");
});

test("lời của việc CŨ về sau khi việc mới đã bắt đầu (việc mồ côi quá hạn bị đè) không lẫn vào việc mới", async () => {
  let gio = 1_000_000;
  const { sandbox } = trangGia({ chamUrl: [`${U}cu`, `${U}moi`], treoRieng: { [`${U}cu`]: 80, [`${U}moi`]: 200 }, now: () => gio });
  dau(sandbox)({ items: [mot(`${U}cu`, 500)], staggerMs: 0, token: "cu" }); // lượt cũ đã chết, không ai lấy kết quả
  gio += IN_PAGE_STALE_MS + 1; // đồng hồ của trang đi tiếp: lời cũ vẫn còn chạy (giả) nhưng việc coi là mồ côi
  assert.equal(dau(sandbox)({ items: [mot(`${U}moi`, 500)], staggerMs: 0, token: "moi" }), 1, "việc mồ côi quá hạn thì được đè");
  await nghi(110); // lời cũ về (80 ms), lời mới chưa (200 ms)
  const chua = lay(sandbox)({ token: "moi" });
  assert.equal(tiLe(chua), "0/1", "kết quả việc cũ không làm việc mới báo xong");
  assert.equal("rs" in chua, false);
  await nghi(150);
  assert.equal(rsCua(lay(sandbox)({ token: "moi" }))?.[0].body, `{"ok":"${U}moi"}`);
});

test("giá trị phiên chỉ đi thẳng vào header của chính lời gọi: không nằm trong việc, không nằm trong kết quả trả về", async () => {
  const { sandbox, xacThuc } = trangGia({ cookie: "sid=BIET%20MAT_9f3a" });
  const n = dau(sandbox)({ items: [mot(`${U}a`), mot(`${U}b`, 200)], staggerMs: 0, token: "a" });
  await nghi(10);
  const viec = JSON.stringify(sandbox.__s17Job); // việc còn nằm trong trang, chưa lấy
  const kq = lay(sandbox)({ token: "a" });
  assert.deepEqual(xacThuc, ["Bearer BIET MAT_9f3a", "Bearer BIET MAT_9f3a"], "phiên được dùng cho đúng hai lời");
  for (const s of [String(n), JSON.stringify(kq), String(viec)]) {
    assert.equal(s.includes("BIET MAT"), false, "giá trị phiên không được rời khỏi lời gọi");
  }
});

function pageGia(tra: { start?: number | Error | Array<number | Error>; collect: Array<unknown | Error> }): { page: EgoPage; buoc: Array<{ ham: string; arg: Record<string, unknown> }> } {
  const buoc: Array<{ ham: string; arg: Record<string, unknown> }> = [];
  let iStart = 0;
  let i = 0;
  const page: EgoPage = {
    label: "tab-nguon",
    evaluate: (fn, arg) => {
      const ham = fn.name;
      const a = arg as Record<string, unknown>;
      buoc.push({ ham, arg: a });
      const kq = ham === "IN_PAGE_START" ? (Array.isArray(tra.start) ? tra.start[Math.min(iStart++, tra.start.length - 1)] : (tra.start ?? (a.items as unknown[]).length)) : tra.collect[Math.min(i++, tra.collect.length - 1)];
      return kq instanceof Error ? Promise.reject(kq) : Promise.resolve(kq);
    },
  };
  return { page, buoc };
}

function choNhanh(gioDau = 1_000_000) {
  const daCho: number[] = [];
  let gio = gioDau;
  return { daCho, cho: { sleep: async (ms: number) => { daCho.push(ms); gio += ms; }, pollMs: 250, now: () => gio } };
}

const KQ_LOI = { status: 0, contentType: null, body: "", networkError: "TypeError: Failed to fetch" };
const YEU_CAU = [
  { url: `${U}a`, headers: { accept: "application/json" } },
  { url: `${U}b`, headers: { accept: "application/json" } },
];
const LOI_TRINH_DUYET = () => new Error("page.evaluate timed out after 15000ms while waiting for page JavaScript. The Page is responsive, but the evaluation is still pending and may produce late side effects.");

test("vận chuyển một đợt: bắt đầu (kèm mã riêng), hỏi tới khi xong, đưa hạn chờ và tên cookie vào trang", async () => {
  const { page, buoc } = pageGia({ collect: [{ done: 1, tong: 2 }, { done: 2, tong: 2, rs: [{ status: 200, contentType: "application/json", body: "{\"a\":1}" }, KQ_LOI] }] });
  const { daCho, cho } = choNhanh();
  const { transportMany } = makeTransports(page, "sid", cho);
  const rs = await transportMany(YEU_CAU, 250);
  assert.deepEqual(buoc.map((b) => b.ham), ["IN_PAGE_START", "IN_PAGE_COLLECT", "IN_PAGE_COLLECT"]);
  assert.deepEqual(daCho, [250], "chưa xong thì nghỉ một nhịp hỏi rồi hỏi lại");
  const batDau = buoc[0].arg as { items: unknown[]; staggerMs: number; token: string };
  assert.equal(batDau.staggerMs, 250);
  assert.match(String(batDau.token), /^[0-9a-f]{16}$/, "mỗi đợt một mã riêng");
  assert.deepEqual(batDau.items, [
    { url: `${U}a`, headerJson: '{"accept":"application/json"}', cookieName: "sid", timeoutMs: IN_PAGE_TIMEOUT_MS },
    { url: `${U}b`, headerJson: '{"accept":"application/json"}', cookieName: "sid", timeoutMs: IN_PAGE_TIMEOUT_MS },
  ]);
  assert.deepEqual(buoc.slice(1).map((b) => b.arg), [{ token: batDau.token }, { token: batDau.token }], "lấy kết quả bằng đúng mã của đợt mình");
  const tot = rs[0] as { status: number; contentType: string; body: string; bytes?: number };
  assert.equal(`${tot.status}|${tot.contentType}|${tot.body}|${tot.bytes}`, "200|application/json|{\"a\":1}|undefined");
  assert.ok(rs[1] instanceof Error, "lỗi mạng của một lời thành Error của riêng nó");
  assert.match((rs[1] as Error).message, /Failed to fetch/);
});

test("vận chuyển lời đơn đi đúng một lời, cùng đường bắt đầu rồi hỏi", async () => {
  const { page, buoc } = pageGia({ collect: [{ done: 1, tong: 1, rs: [{ status: 200, contentType: "application/json", body: "{\"a\":1}" }] }] });
  const { cho } = choNhanh();
  const { transport } = makeTransports(page, "sid", cho);
  const r = (await transport(`${U}mot`, {})) as { status: number; body: string };
  assert.deepEqual(buoc.map((b) => b.ham), ["IN_PAGE_START", "IN_PAGE_COLLECT"]);
  const batDau = buoc[0].arg as { items: unknown[]; token: string };
  assert.deepEqual(batDau.items, [{ url: `${U}mot`, headerJson: "{}", cookieName: "sid", timeoutMs: IN_PAGE_TIMEOUT_MS }]);
  assert.deepEqual(buoc[1].arg, { token: batDau.token });
  assert.equal(`${r.status}|${r.body}`, "200|{\"a\":1}");
});

test("tab bận (lần bắt đầu trả -1): chờ một nhịp rồi bắt đầu lại, không coi là lỗi", async () => {
  const { page, buoc } = pageGia({ start: [-1, 1], collect: [{ done: 1, tong: 1, rs: [{ status: 200, contentType: "application/json", body: "{}" }] }] });
  const { daCho, cho } = choNhanh();
  const { transport } = makeTransports(page, "sid", cho);
  assert.equal(((await transport(`${U}mot`, {})) as { status: number }).status, 200);
  assert.deepEqual(buoc.map((b) => b.ham), ["IN_PAGE_START", "IN_PAGE_START", "IN_PAGE_COLLECT"]);
  assert.deepEqual(daCho, [250]);
});

test("tab bận quá hạn (việc mồ côi của lượt khác không bao giờ xong): mỗi lời nhận một Error nói rõ", async () => {
  const { page, buoc } = pageGia({ start: -1, collect: [] });
  const { cho } = choNhanh(0);
  const { transportMany } = makeTransports(page, "sid", cho);
  const rs = await transportMany(YEU_CAU, 0);
  assert.ok(buoc.length > 4 && buoc.every((b) => b.ham === "IN_PAGE_START"), "chỉ hỏi bắt đầu, không bao giờ gửi lời nào");
  for (const r of rs) {
    assert.ok(r instanceof Error);
    assert.match(r.message, /đang giữ một việc gọi chưa xong/);
  }
});

test("trang trả THIẾU kết quả so với số lời đã gửi: không dùng, mỗi lời nhận một Error", async () => {
  const { page } = pageGia({ collect: [{ done: 1, tong: 1, rs: [{ status: 200, contentType: "application/json", body: "{\"cua-nguoi-khac\":1}" }] }] });
  const { transportMany } = makeTransports(page, "sid", choNhanh().cho);
  const rs = await transportMany(YEU_CAU, 0);
  assert.equal(rs.length, 2);
  for (const r of rs) {
    assert.ok(r instanceof Error);
    assert.match(r.message, /1 kết quả cho 2 lời/);
  }
});

test("trang không còn giữ việc (đã điều hướng, tải lại, hoặc bị ghi đè): mỗi lời nhận một Error nói rõ việc đã mất", async () => {
  const { page, buoc } = pageGia({ collect: [{ mat: true }, null] });
  const { daCho, cho } = choNhanh();
  const { transport, transportMany } = makeTransports(page, "sid", cho);
  const rs = await transportMany(YEU_CAU, 0);
  assert.deepEqual(buoc.map((b) => b.ham), ["IN_PAGE_START", "IN_PAGE_COLLECT"], "việc đã mất thì không hỏi lặp");
  assert.deepEqual(daCho, []);
  for (const r of rs) {
    assert.ok(r instanceof Error);
    assert.match(r.message, /không còn giữ việc/);
  }
  await assert.rejects(() => transport(`${U}mot`, {}), /không còn giữ việc/);
});

test("lần chạy trong trang bị trình duyệt hủy: mỗi lời của đợt nhận một Error RIÊNG, đợt không ném (lượt thật 24/11 vỡ ở đây)", async () => {
  const loi = LOI_TRINH_DUYET();
  const { page } = pageGia({ start: loi, collect: [loi] });
  const { transport, transportMany } = makeTransports(page, "sid", choNhanh().cho);
  const yeuCau = [{ url: `${U}a`, headers: {} }, { url: `${U}b`, headers: {} }, { url: `${U}c`, headers: {} }];
  const rs = await transportMany(yeuCau, 250);
  assert.equal(rs.length, 3);
  assert.equal(new Set(rs).size, 3, "mỗi lời một lỗi riêng");
  for (const r of rs) {
    assert.ok(r instanceof Error);
    assert.match(r.message, /page\.evaluate timed out after 15000ms/, "giữ nguyên lời của trình duyệt để nhận diện");
  }
  await assert.rejects(() => transport(`${U}mot`, {}), /timed out after 15000ms/);
});

test("hỏi kết quả bị hủy giữa chừng (lần bắt đầu đã chạy): mỗi lời của đợt nhận một Error", async () => {
  const { page } = pageGia({ collect: [LOI_TRINH_DUYET()] });
  const { transportMany } = makeTransports(page, "sid", choNhanh().cho);
  const rs = await transportMany([{ url: `${U}a`, headers: {} }], 0);
  assert.ok(rs[0] instanceof Error);
  assert.match((rs[0] as Error).message, /timed out after 15000ms/);
});

test("tiến trình trình duyệt ghi kết quả kèm mã lượt của bản kê; dừng vì hết phiên thì vẫn trả kết quả có mã", async () => {
  const dir = await mkdtemp(join(tmpdir(), "s17-ego-"));
  try {
    const hosts = { api: "https://api.gia.test", agent: "https://agent.gia.test", web: "https://web.gia.test" };
    const config = loadConfig(JSON.stringify({ hosts, paths: { "data-available": "/v2.x/data-available", "asset-type": "/v2.x/asset-type" }, session: { cookieName: "sid" } }));
    const optionsPath = join(dir, "ego-options.json");
    const resultPath = join(dir, "ego-result.json");
    await writeFile(resultPath, JSON.stringify({ ok: true, runId: "lan-truoc" }), "utf8"); // kết quả cũ còn sót
    await writeFile(
      optionsPath,
      JSON.stringify({ config, phase: "session-check", snapshotRoot: join(dir, "snap"), statePath: join(dir, "s.json"), logPath: join(dir, "l.jsonl"), resultPath, caps: { calls: 5, minutes: 5 }, paceMs: 0, batchItems: 10, checkBalance: false, spaceId: 4, cookieName: "sid", runId: "abc123", khoaPhien: join(dir, "khoa-phien.lock") }),
    );
    // Trang thật sự chạy hàm trong trang (trong một ngữ cảnh giả): lời cần phiên lỗi mạng, lời công khai vẫn chạy.
    const { sandbox } = trangGia({ loiUrl: [`${hosts.api}/v2.x/data-available`], goc: hosts.web });
    const page: EgoPage = {
      label: "t",
      evaluate: (fn, arg) => {
        const f = runInNewContext(`(${fn.toString()})`, sandbox) as (a: unknown) => unknown;
        return Promise.resolve().then(() => f(arg));
      },
    };
    const api: EgoApi = {
      listTaskSpaces: async () => [{ id: 4, ownership: "user" }],
      claimTaskSpace: async () => ({
        spaceId: 4,
        tabs: async () => [{ label: "t", url: `${hosts.web}/`, page: null }],
        page: () => page,
        adopt: async () => {
          throw new Error("không được gọi");
        },
      }),
      takeOverTaskSpace: async () => {
        throw new Error("không được gọi khi task space thuộc về người dùng");
      },
    };
    const code = await egoMain(api, optionsPath);
    assert.equal(code, 3, "lượt dừng, không báo thành công");
    const kq = JSON.parse(await readFile(resultPath, "utf8")) as { runId?: string; ok: boolean; stopReason?: string };
    assert.equal(kq.runId, "abc123", "kết quả mang mã của lượt này, đè kết quả cũ");
    assert.equal(kq.ok, false);
    assert.equal(kq.stopReason, "session-expired");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

/** Chạy tiến trình trình duyệt với danh sách trang giả; trả mã thoát, kết quả và những nhãn trang đã được lấy. */
async function chayEgoTrang(o: { tabLabel?: string; cacTrang: Array<[string, string]> }): Promise<{ code: number; kq: Record<string, unknown>; daLayTrang: string[] }> {
  const dir = await mkdtemp(join(tmpdir(), "s17-ego-trang-"));
  try {
    const hosts = { api: "https://api.gia.test", agent: "https://agent.gia.test", web: "https://web.gia.test" };
    const config = loadConfig(JSON.stringify({ hosts, paths: { "data-available": "/v2.x/data-available", "asset-type": "/v2.x/asset-type" }, session: { cookieName: "sid" } }));
    const optionsPath = join(dir, "ego-options.json");
    const resultPath = join(dir, "ego-result.json");
    await writeFile(
      optionsPath,
      JSON.stringify({
        config,
        phase: "session-check",
        snapshotRoot: join(dir, "snap"),
        statePath: join(dir, "s.json"),
        logPath: join(dir, "l.jsonl"),
        resultPath,
        caps: { calls: 5, minutes: 5 },
        paceMs: 0,
        batchItems: 10,
        checkBalance: false,
        spaceId: 4,
        cookieName: "sid",
        runId: "abc123", khoaPhien: join(dir, "khoa-phien.lock"),
        ...(o.tabLabel ? { tabLabel: o.tabLabel } : {}),
      }),
    );
    const { sandbox } = trangGia({ goc: "https://web.gia.test" });
    const page: EgoPage = {
      label: "x",
      evaluate: (fn, arg) => {
        const f = runInNewContext(`(${fn.toString()})`, sandbox) as (a: unknown) => unknown;
        return Promise.resolve().then(() => f(arg));
      },
    };
    const daLayTrang: string[] = [];
    const api: EgoApi = {
      listTaskSpaces: async () => [{ id: 4, ownership: "agent" }],
      takeOverTaskSpace: async () => ({
        spaceId: 4,
        tabs: async () => o.cacTrang.map(([label, url]) => ({ label, url, page: null })),
        page: (label: string) => {
          daLayTrang.push(label);
          return page;
        },
        adopt: async () => {
          throw new Error("không được tự nhận tab");
        },
      }),
      claimTaskSpace: async () => {
        throw new Error("không được gọi khi task space thuộc về agent");
      },
    };
    const code = await egoMain(api, optionsPath);
    const kq = JSON.parse(await readFile(resultPath, "utf8")) as Record<string, unknown>;
    return { code, kq, daLayTrang };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("tiến trình trình duyệt: bản kê ghi tabLabel thì chạy ở ĐÚNG trang ấy (trang mở thêm trong cùng hồ sơ) — không đụng trang đầu", async () => {
  const r = await chayEgoTrang({ tabLabel: "p2", cacTrang: [["p1", "https://web.gia.test/"], ["p2", "https://web.gia.test/du-an"]] });
  assert.deepEqual([r.code, r.kq.ok, r.daLayTrang], [0, true, ["p2"]], JSON.stringify(r.kq).slice(0, 300));
});

test("tiến trình trình duyệt: bản kê không ghi tabLabel thì lấy tab đầu tiên của nguồn như cũ", async () => {
  const r = await chayEgoTrang({ cacTrang: [["p1", "https://web.gia.test/"], ["p2", "https://web.gia.test/du-an"]] });
  assert.deepEqual([r.code, r.kq.ok, r.daLayTrang], [0, true, ["p1"]], JSON.stringify(r.kq).slice(0, 300));
});

test("tiến trình trình duyệt: trang ghi trong bản kê mà không phải của nguồn, hoặc không tồn tại, thì dừng trước khi gọi gì", async () => {
  const sai = await chayEgoTrang({ tabLabel: "p9", cacTrang: [["p1", "https://web.gia.test/"], ["p9", "https://khac.example.org/"]] });
  assert.deepEqual([sai.code, sai.kq.ok, sai.daLayTrang], [4, false, []], "không lấy trang của nơi khác");
  assert.match(String(sai.kq.message), /không phải trang của nguồn/);
  const thieu = await chayEgoTrang({ tabLabel: "p3", cacTrang: [["p1", "https://web.gia.test/"]] });
  assert.deepEqual([thieu.code, thieu.kq.ok, thieu.daLayTrang], [4, false, []], "không lùi về tab đầu khi trang ghi không có");
  assert.match(String(thieu.kq.message), /không có trang p3/);
});

test("tiến trình trình duyệt: task space vẫn trong tay agent thì LẤY LẠI (taskSpace), không chiếm lại — lượt chạy song song không làm phiền lượt đang giữ space", async () => {
  const dir = await mkdtemp(join(tmpdir(), "s17-ego-space-"));
  try {
    const hosts = { api: "https://api.gia.test", agent: "https://agent.gia.test", web: "https://web.gia.test" };
    const config = loadConfig(JSON.stringify({ hosts, paths: { "data-available": "/v2.x/data-available", "asset-type": "/v2.x/asset-type" }, session: { cookieName: "sid" } }));
    const optionsPath = join(dir, "ego-options.json");
    const resultPath = join(dir, "ego-result.json");
    await writeFile(optionsPath, JSON.stringify({ config, phase: "session-check", snapshotRoot: join(dir, "snap"), statePath: join(dir, "s.json"), logPath: join(dir, "l.jsonl"), resultPath, caps: { calls: 5, minutes: 5 }, paceMs: 0, batchItems: 10, checkBalance: false, spaceId: 4, cookieName: "sid", runId: "abc123", khoaPhien: join(dir, "khoa-phien.lock"), tabLabel: "p2" }));
    const { sandbox } = trangGia({ goc: "https://web.gia.test" });
    const page: EgoPage = { label: "p2", evaluate: (fn, arg) => { const f = runInNewContext(`(${fn.toString()})`, sandbox) as (a: unknown) => unknown; return Promise.resolve().then(() => f(arg)); } };
    const daGoi: string[] = [];
    const api: EgoApi = {
      listTaskSpaces: async () => [{ id: 4, ownership: "agent" }],
      taskSpace: async () => {
        daGoi.push("taskSpace");
        return { spaceId: 4, tabs: async () => [{ label: "p1", url: `${hosts.web}/`, page: null }, { label: "p2", url: `${hosts.web}/static/x.css`, page: null }], page: () => page, adopt: async () => { throw new Error("không được tự nhận tab"); } };
      },
      takeOverTaskSpace: async () => {
        daGoi.push("takeOverTaskSpace");
        throw new Error("không được chiếm lại space đang trong tay agent");
      },
      claimTaskSpace: async () => {
        daGoi.push("claimTaskSpace");
        throw new Error("không được nhận space khi đã thuộc về agent");
      },
    };
    const code = await egoMain(api, optionsPath);
    assert.equal(code, 0, "lượt chạy bình thường ở trang p2");
    assert.deepEqual(daGoi, ["taskSpace"]);
    // space được người dùng ủy quyền tạm: mới chiếm lại
    const api2: EgoApi = { ...api, listTaskSpaces: async () => [{ id: 4, ownership: "agentDelegatedToUser" }], takeOverTaskSpace: async () => { daGoi.push("takeOverTaskSpace"); return { spaceId: 4, tabs: async () => [{ label: "p2", url: `${hosts.web}/static/x.css`, page: null }], page: () => page, adopt: async () => page }; } };
    await writeFile(resultPath, "{}", "utf8");
    const code2 = await egoMain(api2, optionsPath);
    assert.equal(code2, 0);
    assert.deepEqual(daGoi, ["taskSpace", "takeOverTaskSpace"]);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

// ---------- theo lượt soát lần hai (25/11): chọn trang theo gốc, kiểm lại gốc trong trang, khoá chung mọi pha cần phiên ----------

test("chonTrangGoi: chỉ nhận trang đúng CỐNG của nguồn — máy chủ khác có cùng tiền tố không được nhận; web có đường thì trang phải nằm trong đường ấy (theo đoạn, không theo chữ)", () => {
  const web = "https://web.gia.test";
  const doi: Array<{ label?: string; url: string }> = [{ label: "p9", url: `${web}.evil.example/du-an` }];
  assert.match((chonTrangGoi(doi, web) as { loi: string }).loi, /không có tab nào của nguồn/);
  assert.match((chonTrangGoi(doi, web, "p9") as { loi: string }).loi, /không phải trang của nguồn/);
  assert.ok("loi" in chonTrangGoi([{ label: "p1", url: "http://web.gia.test/" }], web, "p1"), "cổng/giao thức khác là gốc khác");
  assert.ok("loi" in chonTrangGoi([{ label: "p1", url: "https://web.gia.test:8443/" }], web, "p1"), "cổng khác là gốc khác");
  assert.deepEqual(chonTrangGoi([{ label: "p1", url: `${web}/app/du-an/3` }, { label: "p2", url: `${web}/` }], web), { label: "p1", url: `${web}/app/du-an/3` });
  const coDuong = `${web}/app`;
  assert.deepEqual(chonTrangGoi([{ label: "p1", url: `${web}/app/du-an/3` }], coDuong, "p1"), { label: "p1", url: `${web}/app/du-an/3` });
  assert.ok("loi" in chonTrangGoi([{ label: "p2", url: `${web}/` }], coDuong, "p2"), "web có đường: trang ở gốc máy chủ không nằm trong đường");
  assert.ok("loi" in chonTrangGoi([{ label: "p3", url: `${web}/application/x` }], coDuong, "p3"), "tiền tố đường khớp theo đoạn");
  assert.ok("loi" in chonTrangGoi([{ url: `${web}/khong-nhan` }], web, "p4"), "tab chưa có nhãn không отвеч nhãn");
});

test("IN_PAGE_START: trang không còn ở gốc của nguồn thì trả -2 và KHÔNG gửi lời nào — phiên không bao giờ được dùng ở trang lạ", async () => {
  const item = { url: `${U}asset-type`, headerJson: "{}", cookieName: "sid", timeoutMs: 1000 };
  const la = trangGia({ goc: "https://khac.example" });
  const fLa = runInNewContext(`(${IN_PAGE_START.toString()})`, la.sandbox) as (a: unknown) => unknown;
  assert.equal(await fLa({ items: [item], staggerMs: 0, token: "t", goc: "https://web.gia.test" }), -2);
  await nghi(20);
  assert.equal(la.xacThuc.length, 0, "không lời nào được gửi kèm phiên ở trang lạ");
  const dung = trangGia({ goc: "https://web.gia.test" });
  const fDung = runInNewContext(`(${IN_PAGE_START.toString()})`, dung.sandbox) as (a: unknown) => unknown;
  assert.equal(await fDung({ items: [item], staggerMs: 0, token: "t", goc: "https://web.gia.test" }), 1, "đúng gốc thì bắt đầu bình thường");
  const khongRangBuoc = trangGia();
  const f0 = runInNewContext(`(${IN_PAGE_START.toString()})`, khongRangBuoc.sandbox) as (a: unknown) => unknown;
  assert.equal(await f0({ items: [item], staggerMs: 0, token: "t" }), 1, "không yêu cầu kiểm gốc (lượt gọi không khai) thì không kiểm");
});

test("makeTransports: trang không còn ở gốc của nguồn → MỌI lời của đợt nhận RunStopped page-origin, không chờ thử lại như lỗi mạng", async () => {
  const { sandbox } = trangGia({ goc: "https://khac.example" });
  const page: EgoPage = {
    label: "x",
    evaluate: (fn, arg) => {
      const f = runInNewContext(`(${fn.toString()})`, sandbox) as (a: unknown) => unknown;
      return Promise.resolve().then(() => f(arg));
    },
  };
  const { daCho, cho } = choNhanh();
  const { transport, transportMany } = makeTransports(page, "sid", cho, "https://web.gia.test");
  await assert.rejects(() => transport(`${U}mot`, {}), (x: unknown) => x instanceof RunStopped && x.reason === "page-origin");
  const rs = await transportMany(YEU_CAU, 0);
  assert.equal(rs.length, 2);
  for (const r of rs) assert.ok(r instanceof RunStopped && r.reason === "page-origin");
  assert.deepEqual(daCho, [], "không chờ thử lại");
});

test("khoá chung mọi pha cần phiên: một lúc chỉ một pha giữ khoá; khoá của tiến trình đã chết được dọn; nhả khoá thì xoá tệp", async () => {
  const dir = await mkdtemp(join(tmpdir(), "s17-khoa-phien-"));
  try {
    const duong = join(dir, "s17-phien.lock");
    const nhHa = khoaPhien(duong);
    assert.throws(
      () => khoaPhien(duong),
      (x: unknown) => x instanceof RunStopped && x.reason === "another-run" && /không chạy hai pha cần phiên đồng thời/.test(x.message),
    );
    nhHa();
    khoaPhien(duong)();
    const con = spawn(process.execPath, ["-e", "process.exit(0)"]);
    await new Promise<void>((r) => con.once("exit", () => r()));
    await writeFile(duong, JSON.stringify({ pid: con.pid, luc: new Date().toISOString() }));
    khoaPhien(duong)();
    await assert.rejects(() => readFile(duong), "nhả khoá thì xoá tệp khoá");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("tiến trình trình duyệt: khoá chung đang được một pha cần phiên khác giữ thì dừng ngay với lý do another-run — chưa gọi gì, chưa nhận task space", async () => {
  const dir = await mkdtemp(join(tmpdir(), "s17-ego-khoa-"));
  try {
    const hosts = { api: "https://api.gia.test", agent: "https://agent.gia.test", web: "https://web.gia.test" };
    const config = loadConfig(JSON.stringify({ hosts, paths: { "data-available": "/v2.x/data-available", "asset-type": "/v2.x/asset-type" }, session: { cookieName: "sid" } }));
    const optionsPath = join(dir, "ego-options.json");
    const resultPath = join(dir, "ego-result.json");
    const khoa = join(dir, "s17-phien.lock");
    const nhHa = khoaPhien(khoa);
    await writeFile(optionsPath, JSON.stringify({ config, phase: "session-check", snapshotRoot: join(dir, "snap"), statePath: join(dir, "s.json"), logPath: join(dir, "l.jsonl"), resultPath, caps: { calls: 5, minutes: 5 }, paceMs: 0, batchItems: 10, checkBalance: false, spaceId: 4, cookieName: "sid", runId: "abc123", khoaPhien: khoa }));
    let goi = 0;
    const api: EgoApi = {
      listTaskSpaces: async () => {
        goi++;
        return [];
      },
      claimTaskSpace: async () => {
        throw new Error("không được gọi");
      },
      takeOverTaskSpace: async () => {
        throw new Error("không được gọi");
      },
    };
    const code = await egoMain(api, optionsPath);
    assert.deepEqual([code, goi], [3, 0]);
    const kq = JSON.parse(await readFile(resultPath, "utf8")) as { runId?: string; ok: boolean; stopReason?: string };
    assert.equal(kq.runId, "abc123");
    assert.equal(kq.ok, false);
    assert.equal(kq.stopReason, "another-run");
    nhHa();
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("tiến trình trình duyệt: tab của nguồn chưa có nhãn thì nhận quản lý (adopt) rồi gọi trong trang; xong lượt nhả khoá chung", async () => {
  const dir = await mkdtemp(join(tmpdir(), "s17-ego-adopt-"));
  try {
    const hosts = { api: "https://api.gia.test", agent: "https://agent.gia.test", web: "https://web.gia.test" };
    const config = loadConfig(JSON.stringify({ hosts, paths: { "data-available": "/v2.x/data-available", "asset-type": "/v2.x/asset-type" }, session: { cookieName: "sid" } }));
    const optionsPath = join(dir, "ego-options.json");
    const resultPath = join(dir, "ego-result.json");
    const khoa = join(dir, "s17-phien.lock");
    await writeFile(optionsPath, JSON.stringify({ config, phase: "session-check", snapshotRoot: join(dir, "snap"), statePath: join(dir, "s.json"), logPath: join(dir, "l.jsonl"), resultPath, caps: { calls: 5, minutes: 5 }, paceMs: 0, batchItems: 10, checkBalance: false, spaceId: 4, cookieName: "sid", runId: "abc123", khoaPhien: khoa }));
    const { sandbox } = trangGia({ goc: "https://web.gia.test" });
    const page: EgoPage = {
      label: "p1",
      evaluate: (fn, arg) => {
        const f = runInNewContext(`(${fn.toString()})`, sandbox) as (a: unknown) => unknown;
        return Promise.resolve().then(() => f(arg));
      },
    };
    const daGoi: string[] = [];
    const api: EgoApi = {
      listTaskSpaces: async () => [{ id: 4, ownership: "user" }],
      claimTaskSpace: async () => ({
        spaceId: 4,
        tabs: async () => [{ url: `${hosts.web}/`, page: { la: "tab-cua-manh" } }],
        page: () => {
          throw new Error("tab chưa có nhãn: không được gọi page(label)");
        },
        adopt: async (p: unknown) => {
          daGoi.push(JSON.stringify(p));
          return page;
        },
      }),
      takeOverTaskSpace: async () => {
        throw new Error("không được gọi khi task space thuộc về người dùng");
      },
    };
    const code = await egoMain(api, optionsPath);
    assert.equal(code, 0, "phiên sống, lượt kiểm phiên xong bình thường");
    assert.deepEqual(daGoi, ['{"la":"tab-cua-manh"}'], "đúng tab của nguồn được nhận quản lý");
    await assert.rejects(() => readFile(khoa), "xong lượt thì nhả khoá chung");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
