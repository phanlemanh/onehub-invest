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
import { RunStopped, type Caps, type Transport } from "./client.js";
import type { S17Config } from "./config.js";
import { executePhase, type ExecResult } from "./runner.js";
import type { GridEntry, Phase } from "./run.js";

type EgoPage = {
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
};

type InPageResult = { status: number; contentType: string | null; body: string; bytes?: number; networkError?: string };

/** Tự chứa (chạy trong trang, không được tham chiếu biến ngoài). Chữ giữ thân; nhị phân chỉ giữ số byte. */
const IN_PAGE_FETCH = async (input: { url: string; headerJson: string; cookieName: string }): Promise<InPageResult> => {
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
    const res = await g.fetch(input.url, { headers, credentials: "omit", signal: g.AbortSignal.timeout(30_000) });
    const contentType = res.headers.get("content-type") ?? "";
    if (/json|text|javascript|xml|form/i.test(contentType)) return { status: res.status, contentType, body: await res.text() };
    const buf = await res.arrayBuffer();
    return { status: res.status, contentType, body: "", bytes: buf.byteLength };
  } catch (e) {
    return { status: 0, contentType: null, body: "", networkError: String(e).slice(0, 160) };
  }
};

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

  const transport: Transport = async (url, headers) => {
    const r = (await page.evaluate(IN_PAGE_FETCH, { url, headerJson: JSON.stringify(headers), cookieName: opts.cookieName ?? "" })) as InPageResult;
    if (r.networkError) throw new TypeError(r.networkError);
    return { status: r.status, contentType: r.contentType ?? "", body: r.body, bytes: r.bytes };
  };

  try {
    const r = await executePhase({
      phase: opts.phase,
      config: opts.config,
      transport,
      snapshotRoot: opts.snapshotRoot,
      statePath: opts.statePath,
      logPath: opts.logPath,
      caps: opts.caps,
      paceMs: opts.paceMs,
      batchItems: opts.batchItems,
      checkBalance: opts.checkBalance,
      grid: opts.grid,
      listSize: opts.listSize,
      tileZoom: opts.tileZoom,
      env,
    });
    await writeResult(r satisfies ExecResult);
    return r.ok ? 0 : 3;
  } catch (e) {
    await writeResult({ ok: false, message: e instanceof RunStopped ? e.message : String(e) });
    return 1;
  }
}
