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
  /** Mã của lượt này (từ bản kê): ghi vào tệp kết quả để phía Node không nhận nhầm kết quả của lượt trước. */
  runId?: string;
};

type InPageResult = { status: number; contentType: string | null; body: string; bytes?: number; networkError?: string };
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
 */
export const IN_PAGE_START = (input: { items: InPageInput[]; staggerMs: number; token: string }): number => {
  const g = globalThis as unknown as InPageGlobal;
  const cu = g.__s17Job;
  if (cu && cu.done < cu.rs.length && Date.now() - cu.t0 < 90000) return -1;
  const job: InPageJob = { token: input.token, t0: Date.now(), done: 0, rs: new Array(input.items.length) };
  g.__s17Job = job;
  const mot = async (it: InPageInput, delayMs: number, index: number): Promise<void> => {
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
    let out: InPageResult;
    try {
      const headers = JSON.parse(it.headerJson) as Record<string, string>;
      // Tên cookie đến từ cấu hình local; giá trị chỉ đi thẳng vào header của chính lời gọi này.
      const m = new RegExp(`(?:^|;\\s*)${it.cookieName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]+)`).exec(g.document.cookie);
      if (m) headers.Authorization = `Bearer ${decodeURIComponent(m[1])}`;
      const res = await g.fetch(it.url, { headers, credentials: "omit", signal: g.AbortSignal.timeout(it.timeoutMs) });
      const contentType = res.headers.get("content-type") ?? "";
      // Chữ giữ thân; nhị phân chỉ giữ số byte.
      if (/json|text|javascript|xml|form/i.test(contentType)) out = { status: res.status, contentType, body: await res.text() };
      else out = { status: res.status, contentType, body: "", bytes: (await res.arrayBuffer()).byteLength };
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
): { transport: Transport; transportMany: TransportMany } {
  const gio = cho.now ?? (() => Date.now());
  const xuLy = (r: InPageResult): Response => {
    if (r.networkError) throw new TypeError(r.networkError);
    return { status: r.status, contentType: r.contentType ?? "", body: r.body, bytes: r.bytes };
  };
  const chay = async (requests: Array<{ url: string; headers: Record<string, string> }>, staggerMs: number): Promise<InPageResult[]> => {
    const items = requests.map((r) => ({ url: r.url, headerJson: JSON.stringify(r.headers), cookieName, timeoutMs: IN_PAGE_TIMEOUT_MS }));
    const token = randomBytes(8).toString("hex");
    const han = gio() + IN_PAGE_STALE_MS;
    for (;;) {
      const nhan = (await page.evaluate(IN_PAGE_START, { items, staggerMs, token })) as number;
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
  const { transport, transportMany } = makeTransports(page, opts.cookieName ?? "", { sleep: env.sleep, pollMs: IN_PAGE_POLL_MS });

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
