/**
 * Phần keo chạy TRONG tiến trình `ego-browser nodejs` của ego lite (mốc ngày 1, claudedp-2411-20).
 *
 * Pha cần phiên gọi API ngay trong tab của hồ sơ nơi Mạnh đã đăng nhập: hàm dưới đọc phiên từ cookie
 * của chính trang, gắn Bearer rồi gọi URL — giá trị phiên KHÔNG rời trang, không in, không ghi ra tệp.
 *
 * Luật với trình duyệt (ego): task space của Mạnh chỉ được nhận lại qua claimTaskSpace sau khi Mạnh nói
 * «tiếp tục»; bị từ chối là ĐIỂM DỪNG CỨNG — không thử lại, không đi đường vòng, báo lại (mã 4).
 * KHÔNG tải lại hay điều hướng tab: URL tra cứu có sẵn kết quả làm ứng dụng tự gọi biến thể trả phí.
 */
import { randomBytes } from "node:crypto";
import { RunStopped, type Caps, type Transport, type TransportMany } from "./client.js";
import type { S17Config } from "./config.js";
import type { Response } from "./client.js";
import { buildExecOptions, executePhase, type ExecResult } from "./runner.js";
import { duongKhoaPhienMacDinh, khoaPhien } from "./khoa-phien.js";
import type { GridEntry, ParcelArea, Phase } from "./run.js";

export type EgoPage = {
  label: string;
  evaluate(fn: (...args: never[]) => unknown, arg?: unknown): Promise<unknown>;
};
type EgoTask = {
  spaceId: number;
  page(label: string): EgoPage;
  tabs(): Promise<Array<{ label?: string; page: unknown; url: string }>>;
  adopt(page: unknown): Promise<EgoPage>;
};
export type EgoApi = {
  claimTaskSpace(id: number): Promise<EgoTask>;
  takeOverTaskSpace(id: number): Promise<EgoTask>;
  /** Lấy lại task space vẫn trong tay agent (không chiếm của ai). */
  taskSpace?(id: number): Promise<EgoTask>;
  listTaskSpaces(): Promise<Array<{ id: number; ownership: string }>>;
};

export type EgoOptions = {
  config: S17Config;
  phase: Phase;
  snapshotRoot: string;
  statePath: string;
  logPath: string;
  resultPath: string;
  caps: Caps;
  paceMs: number;
  batchItems: number;
  checkBalance: boolean;
  grid?: GridEntry[];
  listSize: number;
  tileZoom: number;
  spaceId: number;
  /** Tên cookie phiên trong tab của nguồn (từ cấu hình local). */
  cookieName?: string;
  /** Mốc ngày 2 — pha căn hộ. */
  projects?: string[];
  proveBuilding?: string;
  listOnly?: boolean;
  /** Mốc ngày 2 — số lời một đợt (1 = tuần tự) và tệp lưới khu thí điểm của pha thửa. */
  concurrency?: number;
  parcelsGrid?: string;
  lowriseTermsFile?: string;
  /** Mốc ngày 2 — dải id quét dự án thấp tầng. */
  lowriseSweep?: { from: number; to: number };
  /** Mã của lượt này (từ bản kê): ghi vào tệp kết quả để phía Node không nhận nhầm kết quả của lượt trước. */
  runId?: string;
  /** Mốc mở rộng — pha căn hộ toàn bộ dự án (đi qua trình điều khiển cùng các trường khác). */
  tatCaDuAn?: { tuSoCan?: number; denSoCan?: number; gioiHan?: number; ids?: string[] };
  /** Nhãn trang gọi trong trang (vd `p2`): mặc định là tab đầu tiên của nguồn; ghi nhãn thì chỉ chạy ở trang ấy — để đổi
   *  trang khi tab đầu bị treo. KHÔNG dùng để chạy hai pha cần phiên đồng thời (nguồn trả 429; có khoá chung). */
  tabLabel?: string;
  /** Đường tệp khoá chung mọi pha cần phiên (mặc định ở thư mục tạm của người dùng; test đưa đường tạm riêng). */
  khoaPhien?: string;
};

/**
 * Trang có thuộc nguồn không: so theo CỐNG (giao thức + máy chủ + cổng), không phải theo tiền tố chữ — kẻ khác mua
 * tên có cùng tiền tố (`web.gia.test.evil.example`) thì `startsWith` vẫn nhận. Cấu hình `web` có đường thì trang phải
 * nằm trong đường ấy, khớp theo đoạn (`/app` và `/application` là hai chuyện khác nhau).
 */
export function laTrangCuaNguon(web: URL, url: string): boolean {
  try {
    const u = new URL(url);
    if (u.origin !== web.origin) return false;
    const duongDan = web.pathname.replace(/\/+$/, "");
    return duongDan === "" || u.pathname === duongDan || u.pathname.startsWith(`${duongDan}/`);
  } catch {
    return false;
  }
}

/**
 * Chọn trang để gọi trong trang. Bản kê ghi nhãn thì chỉ nhận đúng trang ấy và trang ấy phải là của nguồn — KHÔNG lùi
 * về tab đầu (chọn nhầm trang là đưa phiên tới nơi sai). Không ghi thì lấy tab đầu tiên của nguồn (tab Mạnh đã đăng nhập).
 */
export function chonTrangGoi(tabs: Array<{ label?: string; url: string }>, web: string, tabLabel?: string): { loi: string } | { label?: string; url: string } {
  let gocWeb: URL;
  try {
    gocWeb = new URL(web);
  } catch {
    return { loi: "cấu hình web không phải URL" };
  }
  if (tabLabel === undefined) {
    const tab = tabs.find((t) => laTrangCuaNguon(gocWeb, t.url));
    return tab ? { ...(tab.label ? { label: tab.label } : {}), url: tab.url } : { loi: "không có tab nào của nguồn" };
  }
  const tab = tabs.find((t) => t.label === tabLabel);
  if (!tab) return { loi: `không có trang ${tabLabel}` };
  if (!laTrangCuaNguon(gocWeb, tab.url)) return { loi: `trang ${tabLabel} không phải trang của nguồn` };
  return { label: tab.label, url: tab.url };
}

type InPageResult = {
  status: number;
  contentType: string | null;
  body: string;
  bytes?: number;
  networkError?: string;
  /** Thời gian chờ tới khi có câu trả lời (ms) — chỉ có khi nguồn đã trả lời. */
  ms?: number;
  /** Các header ĐƯỢC CHỌN của câu trả lời (hạn mức, retry-after, giờ máy chủ, mã lần chạy) — chỉ có khi nguồn đã trả lời và có ít nhất một cái. */
  headers?: Record<string, string>;
};
type InPageInput = { url: string; headerJson: string; cookieName: string; timeoutMs: number };
type InPageJob = { token: string; t0: number; done: number; rs: InPageResult[] };

/** Trình duyệt (ego) hủy một lần chạy trong trang sau 15 s (đo 24/11). */
export const EGO_EVALUATE_LIMIT_MS = 15_000;
/**
 * Hạn chờ của MỘT lời trong trang. Không lần chạy trong trang nào chờ lời gọi (xem IN_PAGE_START) nên hạn này không
 * bị buộc dưới hạn của trình duyệt: bản ghi máy chủ trả chậm — đo 24/11: id 52 và 1705 của namespace thấp tầng về
 * sau khoảng 12 s, thân chỉ vài KB — vẫn nằm trong hạn. Lời chậm hơn hạn chờ dứt bằng lỗi mạng của riêng nó, lớp
 * gọi thử lại theo luật.
 */
export const IN_PAGE_TIMEOUT_MS = 60_000;
/** Nhịp hỏi kết quả của một đợt — mỗi lần hỏi là một lần chạy trong trang rất ngắn. */
export const IN_PAGE_POLL_MS = 250;
/**
 * Một việc bắt đầu mà quá bấy lâu vẫn chưa xong là việc MỒ CÔI (lượt đã chết): lượt khác được đè. Con số này phải
 * viết sẵn `90000` trong IN_PAGE_START (hàm chạy trong trang không tham chiếu được biến ngoài).
 */
export const IN_PAGE_STALE_MS = IN_PAGE_TIMEOUT_MS + EGO_EVALUATE_LIMIT_MS + 15_000;

type InPageGlobal = {
  fetch(url: string, init: object): Promise<{ status: number; headers: { get(k: string): string | null }; text(): Promise<string>; arrayBuffer(): Promise<ArrayBuffer> }>;
  document: { cookie: string };
  AbortSignal: { timeout(ms: number): unknown };
  /** Gốc của trang — kiểm mỗi lần bắt đầu để phiên không bao giờ được dùng ở trang lạ. */
  location?: { origin: string };
  /** Việc đang chạy: tab chỉ giữ MỘT việc tại một thời điểm. Việc mới chỉ đè việc đã xong hoặc việc mồ côi. */
  __s17Job?: InPageJob;
};

/**
 * BẮT ĐẦU các lời trong trang rồi trả về NGAY số lời đã nhận — không chờ kết quả, vì trình duyệt hủy lần chạy
 * trong trang sau 15 s. Các fetch cùng chạy, lời i bắt đầu sau i × staggerMs (đo 24/11: hai lời đồng thời xong sau
 * 4,9 s thay vì 8,4 s). Tự chứa (không tham chiếu biến ngoài); phiên chỉ đi thẳng vào header của chính lời gọi,
 * không cất lại trong việc. Kết quả lấy lại bằng IN_PAGE_COLLECT, bằng đúng `token` của đợt mình.
 *
 * Tab đang giữ một việc CHƯA XONG của đợt khác thì trả -1 và không làm gì (đo 24/11 18:09: hai lượt tranh tab, lượt
 * này nhận kết quả của lượt kia và ghi payload này dưới sourceId kia) — phía Node chờ rồi hỏi lại. Việc quá 90000 ms
 * (hạn chờ một lời + hai lần chạy trong trang) mà vẫn chưa xong là việc mồ côi: được đè.
 *
 * Gốc của trang được kiểm lại ở MỖI lần (lượt soát 25/11): lượt chạy nhiều giờ mà tab bị điều hướng sang nơi khác
 * (Mạnh dùng tab, ứng dụng nhảy ra ngoài) thì lần chạy kế tiếp sẽ gửi URL của API nguồn và tên cookie vào trang lạ.
 * Không đúng gốc (`input.goc`) thì trả -2 và không làm gì; phía Node dừng cả lượt.
 */
export const IN_PAGE_START = (input: { items: InPageInput[]; staggerMs: number; token: string; goc?: string }): number => {
  const g = globalThis as unknown as InPageGlobal;
  if (input.goc !== undefined && (g.location?.origin ?? "") !== input.goc) return -2;
  const cu = g.__s17Job;
  if (cu && cu.done < cu.rs.length && Date.now() - cu.t0 < 90000) return -1;
  const job: InPageJob = { token: input.token, t0: Date.now(), done: 0, rs: new Array(input.items.length) };
  g.__s17Job = job;
  const mot = async (it: InPageInput, delayMs: number, index: number): Promise<void> => {
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
    let out: InPageResult;
    const t0 = Date.now();
    try {
      const headers = JSON.parse(it.headerJson) as Record<string, string>;
      // Tên cookie đến từ cấu hình local; giá trị chỉ đi thẳng vào header của chính lời gọi này.
      const m = new RegExp(`(?:^|;\\s*)${it.cookieName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]+)`).exec(g.document.cookie);
      if (m) headers.Authorization = `Bearer ${decodeURIComponent(m[1])}`;
      const res = await g.fetch(it.url, { headers, credentials: "omit", signal: g.AbortSignal.timeout(it.timeoutMs) });
      // Đo câu trả lời (Mạnh 26/11 «gọi thử một lời và đo lường nó»): thời gian chờ tới khi có câu trả lời và các header nói về
      // hạn mức — lần 429 ngày 25/11 chỉ ghi được «nguồn trả 429», không biết nguồn bảo gì. Chỉ lấy các header được chọn,
      // không lấy cả đống (set-cookie là của riêng lời gọi). Danh sách viết sẵn trong hàm: hàm chạy trong trang.
      const doTon: Pick<InPageResult, "ms" | "headers"> = { ms: Date.now() - t0 };
      const chon: Record<string, string> = {};
      for (const k of [
        "retry-after",
        "ratelimit-limit",
        "ratelimit-remaining",
        "ratelimit-reset",
        "ratelimit-policy",
        "x-ratelimit-limit",
        "x-ratelimit-remaining",
        "x-ratelimit-reset",
        "x-ratelimit-reset-ttl",
        "x-ratelimit-used",
        "x-rate-limit-limit",
        "x-rate-limit-remaining",
        "x-rate-limit-reset",
        "x-request-id",
        "request-id",
        "x-trace-id",
        "trace-id",
        "date",
        "server",
        "age",
        "cf-ray",
        "cf-cache-status",
        "x-cache",
        "x-served-by",
        "via",
      ]) {
        const v = res.headers.get(k);
        if (v !== null) chon[k] = v;
      }
      if (Object.keys(chon).length) doTon.headers = chon;
      const contentType = res.headers.get("content-type") ?? "";
      // Chữ giữ thân; nhị phân chỉ giữ số byte.
      if (/json|text|javascript|xml|form/i.test(contentType)) out = { status: res.status, contentType, body: await res.text(), ...doTon };
      else out = { status: res.status, contentType, body: "", bytes: (await res.arrayBuffer()).byteLength, ...doTon };
    } catch (e) {
      out = { status: 0, contentType: null, body: "", networkError: String(e).slice(0, 160) };
    }
    job.rs[index] = out; // ghi vào việc của chính lời gọi này, kể cả khi việc mới đã đè việc cũ
    job.done++;
  };
  input.items.forEach((it, i) => {
    void mot(it, i * input.staggerMs, i);
  });
  return input.items.length;
};

/**
 * Hỏi kết quả của việc có đúng `token`. Không có việc, hoặc việc đang giữ mang mã khác → `{ mat: true }` và KHÔNG
 * tiêu dùng việc ấy. Chưa xong: báo số đã xong, không lộ thân nào. Xong hết: trả kết quả rồi trang bỏ việc (thân
 * phản hồi không nằm lại trong trang).
 */
export const IN_PAGE_COLLECT = (input: { token: string }): { mat: true } | { done: number; tong: number; rs?: InPageResult[] } => {
  const g = globalThis as unknown as { __s17Job?: InPageJob };
  const job = g.__s17Job;
  if (!job || job.token !== input.token) return { mat: true };
  if (job.done < job.rs.length) return { done: job.done, tong: job.rs.length };
  g.__s17Job = undefined;
  return { done: job.done, tong: job.rs.length, rs: job.rs };
};

/**
 * Hai đường vận chuyển chạy trong một tab: một lời, và nhiều lời một đợt — cùng một cách: bắt đầu lời gọi (mỗi đợt
 * một mã riêng) rồi hỏi kết quả tới khi xong; không lần chạy trong trang nào chờ lời gọi. Mỗi lời xin hạn chờ
 * IN_PAGE_TIMEOUT_MS. Tab bận (đang giữ việc chưa xong của lượt khác) thì chờ, tới quá hạn việc mồ côi mới bỏ.
 * Lần chạy trong trang bị hủy, trang đánh mất việc, hoặc trả thiếu kết quả, thì mỗi lời của đợt nhận một Error —
 * lớp gọi phân loại là lỗi mạng của từng lời theo đúng luật; một đợt chậm không làm vỡ cả lượt, và kết quả của
 * đợt khác không bao giờ bị dùng thay.
 */
export function makeTransports(
  page: EgoPage,
  cookieName: string,
  cho: { sleep: (ms: number) => Promise<void>; pollMs: number; now?: () => number },
  goc?: string,
): { transport: Transport; transportMany: TransportMany } {
  const gio = cho.now ?? (() => Date.now());
  const xuLy = (r: InPageResult): Response => {
    if (r.networkError) throw new TypeError(r.networkError);
    return { status: r.status, contentType: r.contentType ?? "", body: r.body, bytes: r.bytes, ...(r.ms !== undefined ? { ms: r.ms } : {}), ...(r.headers ? { headers: r.headers } : {}) };
  };
  const chay = async (requests: Array<{ url: string; headers: Record<string, string> }>, staggerMs: number): Promise<InPageResult[]> => {
    const items = requests.map((r) => ({ url: r.url, headerJson: JSON.stringify(r.headers), cookieName, timeoutMs: IN_PAGE_TIMEOUT_MS }));
    const token = randomBytes(8).toString("hex");
    const han = gio() + IN_PAGE_STALE_MS;
    const dauVao = { items, staggerMs, token, ...(goc !== undefined ? { goc } : {}) }; // gốc của trang được kiểm lại ở mỗi lần bắt đầu
    for (;;) {
      const nhan = (await page.evaluate(IN_PAGE_START, dauVao)) as number;
      if (nhan === -2) throw new RunStopped("page-origin", "trang gọi trong trang không còn ở gốc của nguồn — dừng cả lượt, không gửi lời nào kèm phiên");
      if (nhan === items.length) break;
      if (gio() > han) throw new TypeError("tab đang giữ một việc gọi chưa xong của lượt khác");
      await cho.sleep(cho.pollMs);
    }
    for (;;) {
      const kq = (await page.evaluate(IN_PAGE_COLLECT, { token })) as ReturnType<typeof IN_PAGE_COLLECT>;
      if (!kq || "mat" in kq) throw new TypeError("trang không còn giữ việc gọi của lượt này (đã điều hướng, tải lại, hoặc bị lượt khác ghi đè)");
      if (kq.rs) {
        if (kq.rs.length !== items.length) throw new TypeError(`trang trả ${kq.rs.length} kết quả cho ${items.length} lời — không dùng`);
        return kq.rs;
      }
      await cho.sleep(cho.pollMs);
    }
  };
  const loiDot = (requests: Array<{ url: string }>, e: unknown): Array<Error> => {
    const cau = `lần chạy trong trang lỗi (cả đợt): ${e instanceof Error ? e.message : String(e)}`;
    return requests.map(() => new TypeError(cau)); // mỗi lời một lỗi riêng
  };
  const transport: Transport = async (url, headers) => xuLy((await chay([{ url, headers }], 0))[0]);
  const transportMany: TransportMany = async (requests, staggerMs) => {
    let rs: InPageResult[];
    try {
      rs = await chay(requests, staggerMs);
    } catch (e) {
      // Trang không còn ở gốc của nguồn: MỌI lời nhận đúng lỗi dừng (giữ nguyên kiểu, không đổi thành lỗi mạng rồi thử
      // lại) — hợp đồng «mỗi lời một lỗi, không ném giữa đợt» giữ nguyên; lớp gọi thấy RunStopped thì dừng cả lượt.
      if (e instanceof RunStopped) return requests.map(() => e);
      return loiDot(requests, e);
    }
    return rs.map((r) => {
      try {
        return xuLy(r);
      } catch (e) {
        return e instanceof Error ? e : new Error(String(e));
      }
    });
  };
  return { transport, transportMany };
}

export async function main(api: EgoApi, optionsPath: string): Promise<number> {
  const fs = await import("node:fs/promises");
  const opts = JSON.parse(await fs.readFile(optionsPath, "utf8")) as EgoOptions;
  const writeResult = (r: Record<string, unknown>): Promise<void> => fs.writeFile(opts.resultPath, JSON.stringify({ runId: opts.runId, ...r }));
  const env = { sleep: (ms: number): Promise<void> => new Promise<void>((r) => setTimeout(r, ms)), now: () => new Date() };

  // KHOÁ CHUNG mọi pha cần phiên (khoa-phien.ts): hai pha cần phiên chạy đồng thời thì nguồn trả 429 (25/11). Lấy
  // khoá TRƯỚC khi nhận task space hay chọn trang — pha khác đang giữ thì chưa gọi gì, chưa đụng trình duyệt.
  let moKhoa: () => void;
  try {
    moKhoa = khoaPhien(opts.khoaPhien ?? duongKhoaPhienMacDinh());
  } catch (e) {
    if (e instanceof RunStopped) {
      await writeResult({ ok: false, stopReason: e.reason, message: e.message });
      return 3;
    }
    throw e;
  }
  try {
    return await chayPhien(api, opts, writeResult, env, fs);
  } finally {
    moKhoa(); // xong, dừng hay văng đều nhả khoá chung
  }
}

type MoiTruong = { sleep: (ms: number) => Promise<void>; now: () => Date };

/** Phần còn lại của lượt, sau khi đã giữ khoá chung: nhận task space, chọn trang, chạy pha, ghi kết quả. */
async function chayPhien(api: EgoApi, opts: EgoOptions, writeResult: (r: Record<string, unknown>) => Promise<void>, env: MoiTruong, fs: typeof import("node:fs/promises")): Promise<number> {
  let task: EgoTask;
  try {
    const entry = (await api.listTaskSpaces()).find((s) => s.id === opts.spaceId);
    if (!entry) {
      await writeResult({ ok: false, message: `không thấy task space ${opts.spaceId}` });
      return 4;
    }
    // Thuộc về người dùng: chỉ nhận lại (luật ở đầu tệp). Người dùng ủy quyền tạm: chiếm lại. Còn trong tay agent: LẤY
    // LẠI bằng taskSpace — lấy lại là đủ, không chiếm của ai.
    task =
      entry.ownership === "user"
        ? await api.claimTaskSpace(opts.spaceId)
        : entry.ownership === "agentDelegatedToUser" || !api.taskSpace
          ? await api.takeOverTaskSpace(opts.spaceId)
          : await api.taskSpace(opts.spaceId);
  } catch (e) {
    await writeResult({ ok: false, browserStop: true, message: String(e).slice(0, 400) });
    return 4;
  }

  const tabs = await task.tabs();
  const chon = chonTrangGoi(tabs, opts.config.hosts.web, opts.tabLabel);
  if ("loi" in chon) {
    await writeResult({ ok: false, message: `task space ${opts.spaceId} ${chon.loi} — không gọi gì trong trang` });
    return 4;
  }
  // Tab Mạnh mở chưa có nhãn: nhận quản lý (adopt). Trang đã có nhãn mà bản kê chỉ định (khi tab đầu bị treo): dùng
  // thẳng, không đụng trang khác. Hai pha cần phiên KHÔNG chạy đồng thời — có khoá chung ở đầu hàm main.
  const page = chon.label ? task.page(chon.label) : await task.adopt(tabs.find((t) => t.url === chon.url)?.page);
  // Gốc của trang được kiểm lại ở mỗi lần bắt đầu lời trong trang (IN_PAGE_START): tab bị điều hướng đi chỗ khác giữa
  // lượt thì dừng cả lượt, không gửi URL của API nguồn và tên cookie vào trang lạ.
  const { transport, transportMany } = makeTransports(page, opts.cookieName ?? "", { sleep: env.sleep, pollMs: IN_PAGE_POLL_MS }, new URL(opts.config.hosts.web).origin);

  try {
    // Bản kê đi qua buildExecOptions chung với đường Node: không trường nào bị bỏ lại ở ranh giới tiến trình.
    const r = await executePhase({
      ...buildExecOptions({
        ...opts,
        parcels: opts.parcelsGrid === undefined ? undefined : (JSON.parse(await fs.readFile(opts.parcelsGrid, "utf8")) as ParcelArea[]),
        lowriseTerms: opts.lowriseTermsFile === undefined ? undefined : (JSON.parse(await fs.readFile(opts.lowriseTermsFile, "utf8")) as string[]),
      }),
      phase: opts.phase,
      transport,
      transportMany,
      env,
    });
    await writeResult(r satisfies ExecResult);
    return r.ok ? 0 : 3;
  } catch (e) {
    // Mang dấu vết (cắt ngắn) để lỗi của bộ thu thấy được chỗ; dấu vết chỉ có đường tệp của máy này.
    await writeResult({ ok: false, message: (e instanceof Error ? `${e.message}\n${e.stack ?? ""}` : String(e)).slice(0, 1200) });
    return 1;
  }
}
