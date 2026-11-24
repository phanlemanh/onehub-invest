/**
 * Trình điều khiển một pha của bộ thu S17: dựng khách với vận chuyển đã cho, đọc số dư trước và sau
 * lượt (bằng chứng lượt không tiêu điểm nào trên tài khoản), chạy pha, chốt snapshot, lưu trạng thái
 * và log Ở MÁY. Dùng chung cho hai đường vận chuyển: fetch của Node (phần công khai) và fetch trong
 * trang của hồ sơ đăng nhập (phần cần phiên — ego.ts).
 */
import { appendFileSync } from "node:fs";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { S17Client, RunStopped, type Caps, type Response, type StopReason, type Transport } from "./client.js";
import type { S17Config } from "./config.js";
import { assertBalanceUnchanged } from "./kinds.js";
import { emptyState, runPhase, type GridEntry, type Phase, type PhaseSummary, type RunState } from "./run.js";
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
  env?: Env;
};

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
  const client = new S17Client({
    config: o.config,
    transport: o.transport,
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
    if (e instanceof RunStopped) return { ok: false, stopReason: e.reason, message, ...base(), balanceBefore, balanceAfter };
    throw e;
  }
}

export type { Response };
