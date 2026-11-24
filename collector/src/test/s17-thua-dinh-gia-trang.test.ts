import { strict as assert } from "node:assert";
import { test } from "node:test";
import { runInNewContext } from "node:vm";

import { EGO_EVALUATE_LIMIT_MS, IN_PAGE_FETCH, IN_PAGE_FETCH_MANY, IN_PAGE_TIMEOUT_MS, makeTransports, type EgoPage } from "../collectors/s17-thua-dinh-gia/ego.js";

/**
 * S17 mốc ngày 2: LỜI GỌI TRONG TRANG và hạn của trình duyệt. Đo 24/11 (lượt quét thấp tầng): đợt 50 id đầu xong
 * sau 29 s; sang đợt hai, lần chạy trong trang treo đủ 15 s thì bị trình duyệt hủy («page.evaluate timed out after
 * 15000ms») và CẢ LƯỢT vỡ — lời trong trang đang tự chờ tới 60 s, dài hơn hạn đó. Máy chủ và trang ở đây đều GIẢ.
 */

type InPageResult = { status: number; contentType: string | null; body: string; bytes?: number; networkError?: string };
type LoiGoi = { url: string; init: { signal: { addEventListener(type: "abort", fn: () => void): void }; headers: Record<string, string> } };

/**
 * Trang giả: `treoUrl` là những lời không bao giờ trả, chỉ dứt khi có tín hiệu hủy; tín hiệu hủy ném lỗi mang số
 * ms đã xin («SIG-ABORT:<ms>») — test đọc số đó để biết lời trong trang thực sự chờ bao lâu.
 */
function trangGia(treoUrl: string[] = []): { sandbox: object; daXinCho: number[] } {
  const daXinCho: number[] = [];
  const sandbox = {
    document: { cookie: "sid=phi%20en" },
    setTimeout,
    AbortSignal: {
      timeout(ms: number): LoiGoi["init"]["signal"] {
        daXinCho.push(ms);
        let fn: (() => void) | null = null;
        setTimeout(() => fn?.(), 0);
        return { addEventListener: (_type, f) => (fn = f) };
      },
    },
    fetch: (url: string, init: LoiGoi["init"]) =>
      new Promise((resolve, reject) => {
        const can = setTimeout(() => reject(new Error("harness: lời treo không bị hủy trong 3 s")), 3_000);
        init.signal.addEventListener("abort", () => {
          clearTimeout(can);
          const ms = daXinCho[daXinCho.length - 1];
          reject(new Error(`SIG-ABORT:${ms}`));
        });
        if (treoUrl.includes(url)) return;
        clearTimeout(can);
        resolve({ status: 200, headers: { get: () => "application/json" }, text: async () => `{"ok":"${url}"}` });
      }),
  };
  return { sandbox, daXinCho };
}

const loiTrinhDuyet = () => new Error("page.evaluate timed out after 15000ms while waiting for page JavaScript. The Page is responsive, but the evaluation is still pending and may produce late side effects.");

test("hạn chờ một lời trong trang thấp hơn hạn 15 s của trình duyệt (đo 24/11: 60 s làm vỡ cả lượt)", () => {
  assert.ok(IN_PAGE_TIMEOUT_MS > 0, "phải có hạn chờ dương");
  assert.ok(IN_PAGE_TIMEOUT_MS + 2_000 <= EGO_EVALUATE_LIMIT_MS, `hạn chờ ${IN_PAGE_TIMEOUT_MS} ms phải chừa ít nhất 2 s dưới ${EGO_EVALUATE_LIMIT_MS} ms`);
});

test("lời trong trang chờ đúng số ms đã xin rồi trả lỗi mạng cho RIÊNG lời chậm; lời khác trong cùng đợt vẫn về", async () => {
  const { sandbox, daXinCho } = trangGia(["https://api.gia.test/treo"]);
  const nhieu = runInNewContext(`(${IN_PAGE_FETCH_MANY.toString()})`, sandbox) as (input: { items: Array<{ url: string; headerJson: string; cookieName: string; timeoutMs: number }>; staggerMs: number }) => Promise<InPageResult[]>;
  const rs = await nhieu({
    items: [
      { url: "https://api.gia.test/ve", headerJson: "{}", cookieName: "sid", timeoutMs: 40 },
      { url: "https://api.gia.test/treo", headerJson: "{}", cookieName: "sid", timeoutMs: 40 },
    ],
    staggerMs: 0,
  });
  assert.deepEqual(daXinCho, [40, 40], "mỗi lời xin hạn chờ đúng như phía Node đưa");
  assert.equal(rs[0].status, 200);
  assert.equal(rs[0].body, `{"ok":"https://api.gia.test/ve"}`);
  assert.match(String(rs[1].networkError), /SIG-ABORT:40/, "lời treo phải dứt bằng tín hiệu hủy của chính nó");
  assert.equal(rs[1].status, 0);
});

test("lời đơn trong trang cũng chờ đúng số ms đã xin rồi trả lỗi mạng (không để trình duyệt hủy cả lần chạy)", async () => {
  const { sandbox, daXinCho } = trangGia(["https://api.gia.test/treo"]);
  const mot = runInNewContext(`(${IN_PAGE_FETCH.toString()})`, sandbox) as (input: { url: string; headerJson: string; cookieName: string; timeoutMs: number }) => Promise<InPageResult>;
  const r = await mot({ url: "https://api.gia.test/treo", headerJson: "{}", cookieName: "sid", timeoutMs: 40 });
  assert.deepEqual(daXinCho, [40]);
  assert.match(String(r.networkError), /SIG-ABORT:40/);
});

function pageGia(ketQua: unknown | Error): { page: EgoPage; daTruyen: Array<{ ham: string; arg: Record<string, unknown> }> } {
  const daTruyen: Array<{ ham: string; arg: Record<string, unknown> }> = [];
  const page: EgoPage = {
    label: "tab-nguon",
    evaluate: (fn, arg) => {
      daTruyen.push({ ham: fn.name, arg: arg as Record<string, unknown> });
      if (ketQua instanceof Error) return Promise.reject(ketQua);
      // Kết quả giả là mảng: lời đơn nhận mục đầu, lời theo đợt nhận cả mảng.
      return Promise.resolve(Array.isArray(ketQua) && !("items" in (arg as object)) ? ketQua[0] : ketQua);
    },
  };
  return { page, daTruyen };
}

test("vận chuyển đưa hạn chờ vào trang cho cả lời đơn và lời theo đợt; phiên chỉ đi qua tên cookie", async () => {
  const { page, daTruyen } = pageGia([{ status: 200, contentType: "application/json", body: "{}" }]);
  const { transport, transportMany } = makeTransports(page, "sid");
  await transport("https://api.gia.test/mot", { accept: "application/json" });
  await transportMany(
    [
      { url: "https://api.gia.test/a", headers: { accept: "application/json" } },
      { url: "https://api.gia.test/b", headers: { accept: "application/json" } },
    ],
    250,
  );
  assert.equal(daTruyen.length, 2, "một lần chạy cho lời đơn, một lần cho cả đợt");
  assert.equal(daTruyen[0].arg.timeoutMs, IN_PAGE_TIMEOUT_MS);
  assert.equal((daTruyen[1].arg.items as Array<{ timeoutMs: number }>).map((i) => i.timeoutMs).join(","), `${IN_PAGE_TIMEOUT_MS},${IN_PAGE_TIMEOUT_MS}`);
  assert.equal(daTruyen[1].arg.staggerMs, 250);
  assert.equal(daTruyen[0].arg.cookieName, "sid");
});

test("lần chạy trong trang bị trình duyệt hủy: mỗi lời của đợt nhận một Error, đợt không ném (lượt thật 24/11 vỡ ở đây)", async () => {
  const { page } = pageGia(loiTrinhDuyet());
  const { transportMany } = makeTransports(page, "sid");
  const rs = await transportMany(
    [
      { url: "https://api.gia.test/a", headers: {} },
      { url: "https://api.gia.test/b", headers: {} },
      { url: "https://api.gia.test/c", headers: {} },
    ],
    250,
  );
  assert.equal(rs.length, 3);
  for (const r of rs) {
    assert.ok(r instanceof Error, `mỗi lời nhận một Error, nhận được ${JSON.stringify(r)}`);
    assert.match(r.message, /page\.evaluate timed out after 15000ms/, "giữ nguyên lời của trình duyệt để nhận diện");
  }
});

test("lời đơn: lần chạy trong trang bị hủy thì vận chuyển ném lại lỗi (lớp gọi phân loại là lỗi mạng)", async () => {
  const { page } = pageGia(loiTrinhDuyet());
  const { transport } = makeTransports(page, "sid");
  await assert.rejects(() => transport("https://api.gia.test/mot", {}), /timed out after 15000ms/);
});

test("trang trả kết quả: lỗi mạng của một lời thành Error, lời còn lại thành phản hồi", async () => {
  const { page } = pageGia([
    { status: 200, contentType: "application/json", body: "{\"a\":1}" },
    { status: 0, contentType: null, body: "", networkError: "TypeError: Failed to fetch" },
  ]);
  const { transport, transportMany } = makeTransports(page, "sid");
  const rs = await transportMany([{ url: "https://api.gia.test/a", headers: {} }, { url: "https://api.gia.test/b", headers: {} }], 0);
  const tot = rs[0] as { status: number; contentType: string; body: string; bytes?: number };
  assert.equal(`${tot.status}|${tot.contentType}|${tot.body}|${tot.bytes}`, "200|application/json|{\"a\":1}|undefined");
  assert.ok(rs[1] instanceof Error);
  assert.match((rs[1] as Error).message, /Failed to fetch/);
  const mot = (await transport("https://api.gia.test/a", {})) as { status: number; contentType: string; body: string; bytes?: number };
  assert.equal(`${mot.status}|${mot.contentType}|${mot.body}|${mot.bytes}`, "200|application/json|{\"a\":1}|undefined");
});
