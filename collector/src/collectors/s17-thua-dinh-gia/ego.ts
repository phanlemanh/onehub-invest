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
import { RunStopped, type Caps, type Transport, type TransportMany } from "./client.js";
import type { S17Config } from "./config.js";
import type { Response } from "./client.js";
import { buildExecOptions, executePhase, type ExecResult } from "./runner.js";
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
};

type InPageResult = { status: number; contentType: string | null; body: string; bytes?: number; networkError?: string };
type InPageInput = { url: string; headerJson: string; cookieName: string; timeoutMs: number };

/** Trình duyệt (ego) hủy một lần chạy trong trang sau 15 s (đo 24/11). */
export const EGO_EVALUATE_LIMIT_MS = 15_000;
/**
 * Hạn chờ của MỘT lời trong trang — thấp hơn hạn của trình duyệt. Lời chậm hơn hạn này dứt bằng lỗi mạng của riêng
 * nó và lớp gọi thử lại theo luật; để trang tự chờ lâu hơn thì trình duyệt hủy cả lần chạy (lượt quét thấp tầng
 * 24/11: đợt hai treo 15 s rồi cả lượt vỡ).
 */
export const IN_PAGE_TIMEOUT_MS = 10_000;

/** Tự chứa (chạy trong trang, không được tham chiếu biến ngoài). Chữ giữ thân; nhị phân chỉ giữ số byte. */
export const IN_PAGE_FETCH = async (input: InPageInput): Promise<InPageResult> => {
  const g = globalThis as unknown as {
    fetch(url: string, init: object): Promise<{ status: number; headers: { get(k: string): string | null }; text(): Promise<string>; arrayBuffer(): Promise<ArrayBuffer> }>;
    document: { cookie: string };
    AbortSignal: { timeout(ms: number): unknown };
  };
  const headers = JSON.parse(input.headerJson) as Record<string, string>;
  // Tên cookie đến từ cấu hình local; giá trị chỉ đi thẳng vào header của chính lời gọi này.
  const m = new RegExp(`(?:^|;\\s*)${input.cookieName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]+)`).exec(g.document.cookie);
  if (m) headers.Authorization = `Bearer ${decodeURIComponent(m[1])}`;
  try {
    const res = await g.fetch(input.url, { headers, credentials: "omit", signal: g.AbortSignal.timeout(input.timeoutMs) });
    const contentType = res.headers.get("content-type") ?? "";
    if (/json|text|javascript|xml|form/i.test(contentType)) return { status: res.status, contentType, body: await res.text() };
    const buf = await res.arrayBuffer();
    return { status: res.status, contentType, body: "", bytes: buf.byteLength };
  } catch (e) {
    return { status: 0, contentType: null, body: "", networkError: String(e).slice(0, 160) };
  }
};

/**
 * Nhiều lời trong MỘT lần chạy trong trang: các fetch cùng chạy, lời i bắt đầu sau i × staggerMs (đo 24/11: hai
 * lời đồng thời xong sau 4,9 s thay vì 8,4 s). Tự chứa; phiên chỉ đi thẳng vào header của chính lời gọi.
 */
export const IN_PAGE_FETCH_MANY = async (input: { items: InPageInput[]; staggerMs: number }): Promise<InPageResult[]> => {
  const g = globalThis as unknown as {
    fetch(url: string, init: object): Promise<{ status: number; headers: { get(k: string): string | null }; text(): Promise<string>; arrayBuffer(): Promise<ArrayBuffer> }>;
    document: { cookie: string };
    AbortSignal: { timeout(ms: number): unknown };
  };
  const mot = async (it: InPageInput, delayMs: number): Promise<InPageResult> => {
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
    const headers = JSON.parse(it.headerJson) as Record<string, string>;
    const m = new RegExp(`(?:^|;\\s*)${it.cookieName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]+)`).exec(g.document.cookie);
    if (m) headers.Authorization = `Bearer ${decodeURIComponent(m[1])}`;
    try {
      const res = await g.fetch(it.url, { headers, credentials: "omit", signal: g.AbortSignal.timeout(it.timeoutMs) });
      const contentType = res.headers.get("content-type") ?? "";
      if (/json|text|javascript|xml|form/i.test(contentType)) return { status: res.status, contentType, body: await res.text() };
      const buf = await res.arrayBuffer();
      return { status: res.status, contentType, body: "", bytes: buf.byteLength };
    } catch (e) {
      return { status: 0, contentType: null, body: "", networkError: String(e).slice(0, 160) };
    }
  };
  return Promise.all(input.items.map((it, i) => mot(it, i * input.staggerMs)));
};

/**
 * Hai đường vận chuyển chạy trong một tab: một lời, và nhiều lời một đợt. Mỗi lời xin hạn chờ IN_PAGE_TIMEOUT_MS.
 * Đợt mà lần chạy trong trang vẫn bị hủy thì mỗi lời của đợt nhận một Error — lớp gọi phân loại là lỗi mạng của
 * từng lời theo đúng luật; không để một lần chạy chậm làm vỡ cả lượt.
 */
export function makeTransports(page: EgoPage, cookieName: string): { transport: Transport; transportMany: TransportMany } {
  const xuLy = (r: InPageResult): Response => {
    if (r.networkError) throw new TypeError(r.networkError);
    return { status: r.status, contentType: r.contentType ?? "", body: r.body, bytes: r.bytes };
  };
  const transport: Transport = async (url, headers) =>
    xuLy((await page.evaluate(IN_PAGE_FETCH, { url, headerJson: JSON.stringify(headers), cookieName, timeoutMs: IN_PAGE_TIMEOUT_MS })) as InPageResult);
  const transportMany: TransportMany = async (requests, staggerMs) => {
    let rs: InPageResult[];
    try {
      rs = (await page.evaluate(IN_PAGE_FETCH_MANY, {
        items: requests.map((r) => ({ url: r.url, headerJson: JSON.stringify(r.headers), cookieName, timeoutMs: IN_PAGE_TIMEOUT_MS })),
        staggerMs,
      })) as InPageResult[];
    } catch (e) {
      const loi = e instanceof Error ? e.message : String(e);
      return requests.map(() => new TypeError(`lần chạy trong trang lỗi (cả đợt): ${loi}`));
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
  const writeResult = (r: unknown): Promise<void> => fs.writeFile(opts.resultPath, JSON.stringify(r));
  const env = { sleep: (ms: number): Promise<void> => new Promise<void>((r) => setTimeout(r, ms)), now: () => new Date() };

  let task: EgoTask;
  try {
    const entry = (await api.listTaskSpaces()).find((s) => s.id === opts.spaceId);
    if (!entry) {
      await writeResult({ ok: false, message: `không thấy task space ${opts.spaceId}` });
      return 4;
    }
    task = entry.ownership === "user" ? await api.claimTaskSpace(opts.spaceId) : await api.takeOverTaskSpace(opts.spaceId);
  } catch (e) {
    await writeResult({ ok: false, browserStop: true, message: String(e).slice(0, 400) });
    return 4;
  }

  const tabs = await task.tabs();
  const tab = tabs.find((t) => t.url.startsWith(opts.config.hosts.web));
  if (!tab) {
    await writeResult({ ok: false, message: `task space ${opts.spaceId} không có tab nào của nguồn để gọi trong trang` });
    return 4;
  }
  const page = tab.label ? task.page(tab.label) : await task.adopt(tab.page);
  const { transport, transportMany } = makeTransports(page, opts.cookieName ?? "");

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
