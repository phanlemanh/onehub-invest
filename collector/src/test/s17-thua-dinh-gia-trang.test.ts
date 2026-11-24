import { strict as assert } from "node:assert";
import { test } from "node:test";
import { runInNewContext } from "node:vm";

import { EGO_EVALUATE_LIMIT_MS, IN_PAGE_COLLECT, IN_PAGE_START, IN_PAGE_TIMEOUT_MS, makeTransports, type EgoPage } from "../collectors/s17-thua-dinh-gia/ego.js";

/**
 * S17 mốc ngày 2: LỜI GỌI TRONG TRANG và hạn của trình duyệt. Đo 24/11 (lượt quét thấp tầng): đợt 50 id đầu xong
 * sau 29 s; sang đợt hai, lần chạy trong trang treo đủ 15 s thì bị trình duyệt hủy («page.evaluate timed out after
 * 15000ms») và CẢ LƯỢT vỡ. Chặn lời gọi ở 10 s thì lượt không vỡ nữa nhưng bản ghi trả chậm (id 52, lặp lại cả hai
 * lượt) thành lỗi vĩnh viễn. Vậy KHÔNG lần chạy trong trang nào được chờ lời gọi: bắt đầu rồi hỏi kết quả bằng các
 * lần chạy ngắn. Máy chủ và trang ở đây đều GIẢ.
 */

type InPageResult = { status: number; contentType: string | null; body: string; bytes?: number; networkError?: string };
type InPageInput = { url: string; headerJson: string; cookieName: string; timeoutMs: number };
type DaCollect = { done: number; tong: number; rs?: InPageResult[] } | null;
type Tro = { ms: number; addEventListener(type: "abort", fn: () => void): void };
type LoiGoi = { url: string; init: { signal: Tro; headers: Record<string, string> } };

const ngoai = (url: string) => ({ status: 200, headers: { get: () => "application/json" }, text: async () => `{"ok":"${url}"}` });
const nghi = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Trang giả. `treoUrl`: lời không bao giờ trả, chỉ dứt khi có tín hiệu hủy; tín hiệu hủy ném lỗi mang số ms đã xin
 * («SIG-ABORT:<ms>») — test đọc số đó để biết lời trong trang thực sự chờ bao lâu. `chamUrl`: lời trả ĐÚNG nhưng
 * sau `treoMs` (bản ghi lớn, chậm), hoặc sau `treoRieng[url]` nếu có. Còn lại trả ngay.
 */
function trangGia(o: { treoUrl?: string[]; chamUrl?: string[]; treoMs?: number; treoRieng?: Record<string, number> } = {}): { sandbox: object; daXinCho: number[] } {
  const daXinCho: number[] = [];
  const sandbox = {
    document: { cookie: "sid=phi%20en" },
    setTimeout,
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
        const treo = (o.treoUrl ?? []).includes(url);
        if (!treo && !(o.chamUrl ?? []).includes(url)) {
          resolve(ngoai(url));
          return;
        }
        if (!treo) setTimeout(() => resolve(ngoai(url)), o.treoRieng?.[url] ?? o.treoMs ?? 60);
        init.signal.addEventListener("abort", () => reject(new Error(`SIG-ABORT:${init.signal.ms}`)));
      }),
  };
  return { sandbox, daXinCho };
}

const dau = (sandbox: object) => runInNewContext(`(${IN_PAGE_START.toString()})`, sandbox) as (input: { items: InPageInput[]; staggerMs: number }) => number;
const lay = (sandbox: object) => runInNewContext(`(${IN_PAGE_COLLECT.toString()})`, sandbox) as () => DaCollect;
const mot = (url: string, timeoutMs = 40): InPageInput => ({ url, headerJson: "{}", cookieName: "sid", timeoutMs });

test("hạn chờ một lời trong trang không còn bị buộc dưới hạn của trình duyệt: bản ghi chậm 15–60 s vẫn nằm trong hạn", () => {
  assert.ok(IN_PAGE_TIMEOUT_MS > EGO_EVALUATE_LIMIT_MS, `hạn chờ ${IN_PAGE_TIMEOUT_MS} ms phải dài hơn ${EGO_EVALUATE_LIMIT_MS} ms của trình duyệt`);
  assert.ok(IN_PAGE_TIMEOUT_MS <= 120_000, "vẫn là hạn chờ hữu hạn");
});

test("bắt đầu lời trong trang trả về NGAY số lời đã nhận, không chờ lời gọi; mỗi lời xin đúng hạn chờ được đưa", () => {
  const { sandbox, daXinCho } = trangGia({ treoUrl: ["https://api.gia.test/treo"] });
  const n = dau(sandbox)({ items: [mot("https://api.gia.test/treo", 40), mot("https://api.gia.test/treo", 55)], staggerMs: 0 });
  assert.equal(n, 2, "hai lời treo vĩnh viễn mà lần bắt đầu vẫn trả ngay");
  assert.deepEqual(daXinCho, [40, 55]);
});

test("hỏi kết quả: chưa xong thì chỉ báo số đã xong, xong hết thì trả kết quả, lần sau thì trang không giữ việc nữa", async () => {
  const { sandbox } = trangGia({ chamUrl: ["https://api.gia.test/cham"] });
  dau(sandbox)({ items: [mot("https://api.gia.test/ve"), mot("https://api.gia.test/cham", 200)], staggerMs: 0 });
  await nghi(5);
  const chua = lay(sandbox)();
  assert.equal(`${chua?.done}/${chua?.tong}`, "1/2", "lời trả ngay đã xong, lời chậm chưa");
  assert.equal("rs" in (chua ?? {}), false, "chưa xong thì chưa thấy thân nào");
  await nghi(120);
  const xong = lay(sandbox)();
  assert.equal(xong?.done, 2);
  assert.equal(xong?.rs?.length, 2);
  assert.equal(xong?.rs?.[0].body, `{"ok":"https://api.gia.test/ve"}`);
  assert.equal(xong?.rs?.[1].body, `{"ok":"https://api.gia.test/cham"}`, "lời chậm vẫn về đủ thân");
  assert.equal(lay(sandbox)(), null, "đã lấy rồi thì trang bỏ việc");
});

test("lời treo quá hạn chờ thì dứt bằng tín hiệu hủy của chính nó, lời khác trong cùng đợt vẫn về", async () => {
  const { sandbox } = trangGia({ treoUrl: ["https://api.gia.test/treo"], chamUrl: ["https://api.gia.test/cham"] });
  dau(sandbox)({ items: [mot("https://api.gia.test/treo", 40), mot("https://api.gia.test/cham", 200)], staggerMs: 0 });
  await nghi(120);
  const rs = lay(sandbox)()?.rs;
  assert.equal(rs?.length, 2);
  assert.match(String(rs?.[0].networkError), /SIG-ABORT:40/, "lời treo dứt đúng lúc hết hạn chờ");
  assert.equal(rs?.[0].status, 0);
  assert.equal(rs?.[1].status, 200, "lời chậm trong hạn chờ vẫn thành công");
});

test("lời của việc CŨ xong sau khi việc mới đã bắt đầu thì không lẫn vào việc mới (lượt cũ bị giết giữa chừng)", async () => {
  const { sandbox } = trangGia({ chamUrl: ["https://api.gia.test/cu", "https://api.gia.test/moi"], treoRieng: { "https://api.gia.test/cu": 20, "https://api.gia.test/moi": 80 } });
  dau(sandbox)({ items: [mot("https://api.gia.test/cu", 300)], staggerMs: 0 }); // việc cũ, không ai lấy kết quả
  await nghi(5);
  dau(sandbox)({ items: [mot("https://api.gia.test/moi", 300)], staggerMs: 0 }); // việc mới đè việc cũ
  await nghi(30); // việc cũ xong sau khi việc mới bắt đầu
  const chua = lay(sandbox)();
  assert.equal(`${chua?.done}/${chua?.tong}`, "0/1", "lời của việc mới chưa xong — kết quả việc cũ không làm việc mới báo xong");
  assert.equal("rs" in (chua ?? {}), false);
  await nghi(60);
  const rs = lay(sandbox)()?.rs;
  assert.equal(rs?.length, 1);
  assert.equal(rs?.[0].body, `{"ok":"https://api.gia.test/moi"}`);
});

function pageGia(tra: { start?: number | Error; collect: Array<unknown | null | Error> }): { page: EgoPage; buoc: Array<{ ham: string; arg: Record<string, unknown> }> } {
  const buoc: Array<{ ham: string; arg: Record<string, unknown> }> = [];
  let i = 0;
  const page: EgoPage = {
    label: "tab-nguon",
    evaluate: (fn, arg) => {
      const ham = fn.name;
      const a = arg as Record<string, unknown>;
      buoc.push({ ham, arg: a });
      const kq = ham === "IN_PAGE_START" ? (tra.start ?? (a.items as unknown[]).length) : tra.collect[Math.min(i++, tra.collect.length - 1)];
      return kq instanceof Error ? Promise.reject(kq) : Promise.resolve(kq);
    },
  };
  return { page, buoc };
}

const choNhanh = () => {
  const daCho: number[] = [];
  return { daCho, cho: { sleep: async (ms: number) => { daCho.push(ms); }, pollMs: 250 } };
};
const KQ_LOI = { status: 0, contentType: null, body: "", networkError: "TypeError: Failed to fetch" };

test("vận chuyển một đợt: bắt đầu, hỏi tới khi xong, đưa hạn chờ và tên cookie vào trang; phiên không đi qua Node", async () => {
  const { page, buoc } = pageGia({ collect: [{ done: 1, tong: 2 }, { done: 2, tong: 2, rs: [{ status: 200, contentType: "application/json", body: "{\"a\":1}" }, KQ_LOI] }] });
  const { daCho, cho } = choNhanh();
  const { transportMany } = makeTransports(page, "sid", cho);
  const rs = await transportMany([{ url: "https://api.gia.test/a", headers: { accept: "application/json" } }, { url: "https://api.gia.test/b", headers: { accept: "application/json" } }], 250);
  assert.deepEqual(buoc.map((b) => b.ham), ["IN_PAGE_START", "IN_PAGE_COLLECT", "IN_PAGE_COLLECT"]);
  assert.deepEqual(daCho, [250], "chưa xong thì nghỉ một nhịp hỏi rồi hỏi lại");
  assert.deepEqual(
    buoc[0].arg.items,
    [
      { url: "https://api.gia.test/a", headerJson: '{"accept":"application/json"}', cookieName: "sid", timeoutMs: IN_PAGE_TIMEOUT_MS },
      { url: "https://api.gia.test/b", headerJson: '{"accept":"application/json"}', cookieName: "sid", timeoutMs: IN_PAGE_TIMEOUT_MS },
    ],
  );
  assert.equal(buoc[0].arg.staggerMs, 250);
  const tot = rs[0] as { status: number; contentType: string; body: string; bytes?: number };
  assert.equal(`${tot.status}|${tot.contentType}|${tot.body}|${tot.bytes}`, "200|application/json|{\"a\":1}|undefined");
  assert.ok(rs[1] instanceof Error, "lỗi mạng của một lời thành Error của riêng nó");
  assert.match((rs[1] as Error).message, /Failed to fetch/);
});

test("vận chuyển lời đơn đi đúng một lời, cùng đường bắt đầu rồi hỏi", async () => {
  const { page, buoc } = pageGia({ collect: [{ done: 1, tong: 1, rs: [{ status: 200, contentType: "application/json", body: "{\"a\":1}" }] }] });
  const { cho } = choNhanh();
  const { transport } = makeTransports(page, "sid", cho);
  const r = (await transport("https://api.gia.test/mot", {})) as { status: number; body: string };
  assert.deepEqual(buoc.map((b) => b.ham), ["IN_PAGE_START", "IN_PAGE_COLLECT"]);
  assert.deepEqual(buoc[0].arg.items, [{ url: "https://api.gia.test/mot", headerJson: "{}", cookieName: "sid", timeoutMs: IN_PAGE_TIMEOUT_MS }]);
  assert.equal(`${r.status}|${r.body}`, "200|{\"a\":1}");
});

test("lần chạy trong trang bị trình duyệt hủy: mỗi lời của đợt nhận một Error, đợt không ném (lượt thật 24/11 vỡ ở đây)", async () => {
  const loi = new Error("page.evaluate timed out after 15000ms while waiting for page JavaScript. The Page is responsive, but the evaluation is still pending and may produce late side effects.");
  const { page } = pageGia({ start: loi, collect: [loi] });
  const { cho } = choNhanh();
  const { transport, transportMany } = makeTransports(page, "sid", cho);
  const rs = await transportMany([{ url: "https://api.gia.test/a", headers: {} }, { url: "https://api.gia.test/b", headers: {} }, { url: "https://api.gia.test/c", headers: {} }], 250);
  assert.equal(rs.length, 3);
  for (const r of rs) {
    assert.ok(r instanceof Error, `mỗi lời nhận một Error, nhận được ${JSON.stringify(r)}`);
    assert.match(r.message, /page\.evaluate timed out after 15000ms/, "giữ nguyên lời của trình duyệt để nhận diện");
  }
  await assert.rejects(() => transport("https://api.gia.test/mot", {}), /timed out after 15000ms/);
});

test("trang không còn giữ việc (đã điều hướng hay tải lại): mỗi lời của đợt nhận một Error nói rõ việc đã mất", async () => {
  const { page, buoc } = pageGia({ collect: [null] });
  const { daCho, cho } = choNhanh();
  const { transportMany } = makeTransports(page, "sid", cho);
  const rs = await transportMany([{ url: "https://api.gia.test/a", headers: {} }, { url: "https://api.gia.test/b", headers: {} }], 0);
  assert.deepEqual(buoc.map((b) => b.ham), ["IN_PAGE_START", "IN_PAGE_COLLECT"], "việc đã mất thì không hỏi lặp");
  assert.deepEqual(daCho, []);
  for (const r of rs) {
    assert.ok(r instanceof Error);
    assert.match(r.message, /không còn giữ việc/);
  }
});

test("hỏi kết quả bị hủy giữa chừng (lần bắt đầu đã chạy): mỗi lời của đợt nhận một Error", async () => {
  const loi = new Error("page.evaluate timed out after 15000ms");
  const { page } = pageGia({ collect: [loi] });
  const { cho } = choNhanh();
  const { transportMany } = makeTransports(page, "sid", cho);
  const rs = await transportMany([{ url: "https://api.gia.test/a", headers: {} }], 0);
  assert.ok(rs[0] instanceof Error);
  assert.match((rs[0] as Error).message, /timed out after 15000ms/);
});
