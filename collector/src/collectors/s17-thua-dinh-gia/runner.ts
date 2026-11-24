/**
 * Trình điều khiển một pha của bộ thu S17: dựng khách với vận chuyển đã cho, đọc số dư trước và sau
 * lượt (bằng chứng lượt không tiêu điểm nào trên tài khoản), chạy pha, chốt snapshot, lưu trạng thái
 * và log Ở MÁY. Dùng chung cho hai đường vận chuyển: fetch của Node (phần công khai) và fetch trong
 * trang của hồ sơ đăng nhập (phần cần phiên — ego.ts).
 */
import { appendFileSync } from "node:fs";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { S17Client, RunStopped, type Caps, type Response, type StopReason, type Transport, type TransportMany } from "./client.js";
import { ConfigError, type S17Config } from "./config.js";
import { assertBalanceUnchanged } from "./kinds.js";
import { emptyState, runPhase, type GridEntry, type ParcelArea, type Phase, type PhaseSummary, type RunState } from "./run.js";
import { BatchWriter } from "./store.js";

export type Env = { sleep: (ms: number) => Promise<void>; now: () => Date };
const realEnv: Env = { sleep: (ms) => new Promise((r) => setTimeout(r, ms)), now: () => new Date() };

export type ExecOptions = {
  phase: Phase;
  config: S17Config;
  transport: Transport;
  snapshotRoot: string;
  statePath: string;
  logPath: string;
  caps: Caps;
  paceMs: number;
  batchItems: number;
  /** Pha có đụng tới tài khoản (cần phiên) thì đọc số dư trước và sau. */
  checkBalance: boolean;
  grid?: GridEntry[];
  listSize?: number;
  tileZoom?: number;
  emptyTileBytes?: number;
  projects?: string[];
  proveBuilding?: string;
  apartmentPageSize?: number;
  listOnly?: boolean;
  /** Mốc ngày 2 — các khu thí điểm của pha thửa. */
  parcels?: ParcelArea[];
  /** Số lời một đợt cho đường nhiều lời (1 = tuần tự). Mặc định 1. */
  concurrency?: number;
  transportMany?: TransportMany;
  /** Mốc ngày 2 — từ khoá gợi ý để khám phá dự án thấp tầng. */
  lowriseTerms?: string[];
  /** Mốc ngày 2 — quét dự án thấp tầng theo id. */
  lowriseSweep?: { from: number; to: number };
  env?: Env;
};

/** Nhịp mặc định — mức nguồn đã chịu được (0 lần bị chặn ở 350 ms suốt 24/11). */
export const DEFAULT_PACE_MS = 350;
/** Nhịp nhanh nhất được phép khi tăng tốc (Mạnh 24/11). */
export const MIN_PACE_MS = 150;

export type ExecResult = {
  ok: boolean;
  stopReason?: StopReason;
  message?: string;
  summary?: PhaseSummary;
  snapshots: string[];
  calls: number;
  blocks: number;
  balanceBefore?: number;
  balanceAfter?: number;
};

/** Những gì bản kê chạy quy định cho một lượt — trừ pha, vận chuyển và đồng hồ (nơi gọi đặt). */
export type ExecSpec = Omit<ExecOptions, "phase" | "transport" | "transportMany" | "env">;
const CAC_TRUONG_KE = [
  "config", "snapshotRoot", "statePath", "logPath", "caps", "paceMs", "batchItems", "checkBalance", "grid", "listSize",
  "tileZoom", "emptyTileBytes", "projects", "proveBuilding", "apartmentPageSize", "listOnly", "parcels", "lowriseTerms",
  "lowriseSweep", "concurrency",
] as const satisfies readonly (keyof ExecSpec)[];

/**
 * Dựng tuỳ chọn của trình điều khiển từ bản kê chạy: chỉ giữ các trường đã biết, MỌI trường đi nguyên vẹn.
 * Dùng chung cho đường Node và đường tiến trình trình duyệt, để không trường nào bị bỏ lại ở ranh giới tiến
 * trình (lỗi thật 24/11: ba lần thiếu tham số khi chuyển sang tiến trình trình duyệt — thư mục snapshot,
 * cờ đọc số dư, dải id thấp tầng).
 */
export function buildExecOptions(spec: ExecSpec): ExecSpec {
  const out: Record<string, unknown> = {};
  for (const k of CAC_TRUONG_KE) if (spec[k] !== undefined) out[k] = spec[k];
  return out as ExecSpec;
}

export async function loadState(path: string): Promise<RunState> {
  let text: string;
  try {
    text = await readFile(path, "utf8");
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return emptyState();
    throw e;
  }
  return { ...emptyState(), ...(JSON.parse(text) as Partial<RunState>) };
}

/** Ghi trạng thái nguyên tử (ghi tệp tạm rồi đổi tên) để gãy giữa chừng không hỏng tệp. */
export async function saveState(path: string, state: RunState): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.tmp`;
  await writeFile(tmp, JSON.stringify(state));
  await rename(tmp, path);
}

/** Log một dòng JSON mỗi sự kiện, chỉ ở máy. Không ghi URL thật, không ghi giá trị phiên. */
export function makeLogger(path: string): (event: Record<string, unknown>) => void {
  return (event) => {
    try {
      appendFileSync(path, `${JSON.stringify({ at: new Date().toISOString(), ...event })}\n`);
    } catch {
      /* log hỏng không được làm dừng lượt thu */
    }
  };
}

/** Đọc số dư; không đọc được thì dừng cả lượt NGAY — thiếu bằng chứng số dư thì không chạy pha. */
async function readBalanceOrStop(client: S17Client, when: "trước" | "sau"): Promise<number> {
  try {
    return await client.readBalance();
  } catch (e) {
    if (e instanceof RunStopped) throw e;
    throw new RunStopped("balance-unreadable", `không đọc được số dư ${when} lượt: ${e instanceof Error ? e.message : String(e)}`);
  }
}

export async function executePhase(o: ExecOptions): Promise<ExecResult> {
  const env = o.env ?? realEnv;
  const state = await loadState(o.statePath);
  const log = makeLogger(o.logPath);
  // Tăng tốc có khoá (Mạnh 24/11: «gặp 429/403 thì lùi ngay về nhịp cũ, lần hai thì dừng»): đã bị chặn
  // hai lần thì không chạy nữa, chờ người quyết; đã bị chặn một lần thì chỉ còn nhịp cũ, một luồng.
  const concurrency = o.concurrency ?? 1;
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 4) throw new ConfigError("concurrency phải là số nguyên từ 1 đến 4");
  const fast = concurrency > 1 || o.paceMs < DEFAULT_PACE_MS;
  const khoaTangToc: RunStopped | null =
    state.blockedRuns >= 2
      ? new RunStopped("blocked-twice", `nguồn đã chặn hai lần (${state.blockedRuns}) — dừng hẳn, chờ người quyết`)
      : fast && state.blockedRuns >= 1
        ? new RunStopped("fast-after-block", `nguồn đã chặn một lần — chỉ được chạy nhịp ${DEFAULT_PACE_MS} ms, một luồng`)
        : null;

  const client = new S17Client({
    config: o.config,
    transport: o.transport,
    ...(o.transportMany ? { transportMany: o.transportMany } : {}),
    sleep: env.sleep,
    now: () => env.now().getTime(),
    caps: o.caps,
    paceMs: o.paceMs,
  });
  const writer = new BatchWriter({ root: o.snapshotRoot, maxItems: o.batchItems, phase: o.phase });
  const save = () => saveState(o.statePath, state);
  const started = env.now().toISOString();
  const base = () => ({ snapshots: [...writer.snapshotIds], calls: client.calls, blocks: client.blocks });
  let balanceBefore: number | undefined;
  let balanceAfter: number | undefined;
  try {
    if (khoaTangToc) throw khoaTangToc; // trả về như mọi lần dừng khác, không gửi lời nào
    if (o.checkBalance) balanceBefore = await readBalanceOrStop(client, "trước");
    const summary = await runPhase({
      phase: o.phase,
      client,
      writer,
      state,
      save,
      log,
      now: env.now,
      grid: o.grid,
      listSize: o.listSize,
      tileZoom: o.tileZoom,
      emptyTileBytes: o.emptyTileBytes,
      projects: o.projects,
      proveBuilding: o.proveBuilding,
      apartmentPageSize: o.apartmentPageSize,
      listOnly: o.listOnly,
      parcels: o.parcels,
      concurrency: o.concurrency,
      lowriseTerms: o.lowriseTerms,
      lowriseSweep: o.lowriseSweep,
    });
    if (o.checkBalance) {
      balanceAfter = await readBalanceOrStop(client, "sau");
      assertBalanceUnchanged(balanceBefore ?? NaN, balanceAfter);
    }
    await writer.flush();
    log({ suKien: "ket-qua", ok: true, started, finished: env.now().toISOString(), ...summary, calls: client.calls, blocks: client.blocks, balanceBefore, balanceAfter });
    return { ok: true, summary, ...base(), balanceBefore, balanceAfter };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await writer.flush(`dừng: ${message}`);
    log({
      suKien: "ket-qua",
      phase: o.phase,
      ok: false,
      started,
      finished: env.now().toISOString(),
      reason: e instanceof RunStopped ? e.reason : "loi",
      message,
      calls: client.calls,
      blocks: client.blocks,
      balanceBefore,
      balanceAfter,
    });
    if (e instanceof RunStopped) {
      // Một lần bị chặn (403, 429) được ghi vào trạng thái để khoá tăng tốc ở các lượt sau.
      if (e.reason === "blocked") {
        state.blockedRuns = (state.blockedRuns ?? 0) + 1;
        await saveState(o.statePath, state);
      }
      return { ok: false, stopReason: e.reason, message, ...base(), balanceBefore, balanceAfter };
    }
    throw e;
  }
}

export type { Response };
