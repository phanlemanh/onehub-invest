/**
 * Điểm vào của bộ thu S17 (mốc ngày 1, claudedp-2411-20).
 *
 *   node collector/dist/collectors/s17-thua-dinh-gia/main.js --phase <reference|tile-mask|projects|session-check>
 *        --snapshots-root <thư mục snapshot> --caps-calls <số> --caps-minutes <số> [--pace-ms 300..400] [--space <id>]
 *
 * - Trần lời gọi và trần thời gian PHẢI khai mỗi lần chạy; nhịp kẹp trong mức nguồn đã chịu được.
 * - Pha công khai (reference, tile-mask) chạy ngay trong tiến trình này bằng fetch của Node, không mang phiên.
 * - Pha cần phiên (projects, session-check) sinh tiến trình `ego-browser nodejs` và gọi TRONG TRANG của
 *   hồ sơ đăng nhập (ego.ts): phiên không rời trình duyệt, không chép cookie, không in giá trị phiên.
 * - Mã thoát: 0 xong · 3 dừng cả lượt (bị chặn, hết phiên, quá trần, số dư giảm) · 1 lỗi khác · 4 trình duyệt từ chối.
 */
import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { realpathSync } from "node:fs";
import { ConfigError, loadConfig, PHASE_ROLES, rolePath, type Role, type S17Config } from "./config.js";
import type { Caps } from "./client.js";
import { executePhase, type ExecResult } from "./runner.js";
import type { GridEntry, Phase } from "./run.js";
import { nodeTransport } from "./transport-node.js";

const HERE = dirname(fileURLToPath(import.meta.url)); // dist/collectors/s17-thua-dinh-gia
const COLLECTOR_ROOT = join(HERE, "..", "..", "..");
const PHASES: Phase[] = ["reference", "tile-mask", "projects", "session-check"];
const PUBLIC_PHASES: Phase[] = ["reference", "tile-mask"];
/** Nhịp đã đo trên nguồn: 0,3–0,4 s/lời. Không cho chạy nhanh hơn bằng cách truyền tham số. */
const PACE_MIN_MS = 300;
const PACE_MAX_MS = 400;

export class UsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UsageError";
  }
}

export type CliOptions = {
  phase: Phase;
  via: "node" | "ego";
  config: string;
  snapshotsRoot: string;
  stateDir: string;
  caps: Caps;
  paceMs: number;
  batchItems: number;
  grid?: string;
  tileZoom: number;
  listSize: number;
  spaceId?: number;
};

export function parseCli(argv: string[]): CliOptions {
  const { values } = parseArgs({
    args: argv,
    strict: true,
    options: {
      phase: { type: "string" },
      config: { type: "string" },
      "snapshots-root": { type: "string" },
      "state-dir": { type: "string" },
      "caps-calls": { type: "string" },
      "caps-minutes": { type: "string" },
      "pace-ms": { type: "string" },
      "batch-items": { type: "string" },
      grid: { type: "string" },
      "tile-zoom": { type: "string" },
      "list-size": { type: "string" },
      space: { type: "string" },
    },
  });
  const phase = values.phase as Phase | undefined;
  if (!phase || !PHASES.includes(phase)) throw new UsageError(`--phase phải là một trong: ${PHASES.join(", ")}`);
  const positive = (flag: string, v: string | undefined): number => {
    if (v === undefined || !/^[1-9]\d*$/.test(v)) throw new UsageError(`${flag} phải là số nguyên dương`);
    return Number(v);
  };
  if (!values["snapshots-root"]) throw new UsageError("thiếu --snapshots-root (thư mục snapshot thô — ghi vào đó, không có mặc định)");
  if (values["snapshots-root"].endsWith("/")) throw new UsageError("--snapshots-root không được kết thúc bằng /");
  const paceMs = values["pace-ms"] === undefined ? 350 : positive("--pace-ms", values["pace-ms"]);
  if (paceMs < PACE_MIN_MS || paceMs > PACE_MAX_MS) throw new UsageError(`--pace-ms phải trong ${PACE_MIN_MS}–${PACE_MAX_MS} (mức nguồn đã chịu được)`);
  const isPublic = PUBLIC_PHASES.includes(phase);
  const spaceId = values.space === undefined ? undefined : positive("--space", values.space);
  if (!isPublic && spaceId === undefined) throw new UsageError(`pha ${phase} cần phiên: khai --space <id task space nơi Mạnh đã đăng nhập>`);
  return {
    phase,
    via: isPublic ? "node" : "ego",
    config: values.config ?? join(homedir(), ".oneinvest", "s17-thua-dinh-gia.json"),
    snapshotsRoot: values["snapshots-root"],
    stateDir: values["state-dir"] ?? join(COLLECTOR_ROOT, "state", "s17-thua-dinh-gia"),
    caps: { calls: positive("--caps-calls", values["caps-calls"]), minutes: positive("--caps-minutes", values["caps-minutes"]) },
    paceMs,
    batchItems: values["batch-items"] === undefined ? 50 : positive("--batch-items", values["batch-items"]),
    grid: values.grid,
    tileZoom: values["tile-zoom"] === undefined ? 17 : positive("--tile-zoom", values["tile-zoom"]),
    listSize: values["list-size"] === undefined ? 100 : positive("--list-size", values["list-size"]),
    spaceId,
  };
}

/** Vai mà pha này sẽ gọi — kiểm đủ đường trong cấu hình local TRƯỚC khi gửi lời nào. */
export function rolesOfPhase(phase: Phase, checkBalance: boolean): Role[] {
  return checkBalance ? [...PHASE_ROLES[phase], "asset-type", "balance"] : [...PHASE_ROLES[phase]];
}

/** Kiểm cấu hình đủ cho pha này TRƯỚC khi gửi lời nào: đường của mọi vai, và tên cookie phiên nếu pha cần phiên. */
export function checkConfigForPhase(config: S17Config, o: CliOptions): void {
  for (const role of rolesOfPhase(o.phase, o.via === "ego")) rolePath(config, role);
  if (o.via === "ego" && !config.session) throw new ConfigError("cấu hình local S17 thiếu session.cookieName (tên cookie phiên) cho pha cần phiên");
}

/** Dòng tóm tắt in ra màn: chỉ số đếm và lý do, không URL, không số dư. */
export function summarize(r: ExecResult): Record<string, unknown> {
  return {
    ok: r.ok,
    stopReason: r.stopReason,
    message: r.message,
    calls: r.calls,
    blocks: r.blocks,
    snapshots: r.snapshots.length,
    soDuKhongDoi: r.balanceBefore === undefined ? undefined : r.balanceBefore === r.balanceAfter,
    summary: r.summary,
  };
}

export async function main(
  argv: string[],
  io: { out: (s: string) => void; err: (s: string) => void } = { out: (s) => console.log(s), err: (s) => console.error(s) },
): Promise<number> {
  let o: CliOptions;
  try {
    o = parseCli(argv);
  } catch (e) {
    io.err(e instanceof Error ? e.message : String(e));
    return 2;
  }
  const config = loadConfig(await readFile(o.config, "utf8"));
  const checkBalance = o.via === "ego";
  checkConfigForPhase(config, o);
  const grid = o.grid === undefined ? undefined : (JSON.parse(await readFile(o.grid, "utf8")) as GridEntry[]);
  const statePath = join(o.stateDir, "state.json");
  const logPath = join(o.stateDir, "run.log.jsonl");
  await mkdir(o.stateDir, { recursive: true });

  if (o.via === "node") {
    const r = await executePhase({
      phase: o.phase,
      config,
      transport: nodeTransport(),
      snapshotRoot: o.snapshotsRoot,
      statePath,
      logPath,
      caps: o.caps,
      paceMs: o.paceMs,
      batchItems: o.batchItems,
      checkBalance: false,
      grid,
      listSize: o.listSize,
      tileZoom: o.tileZoom,
    });
    io.out(JSON.stringify(summarize(r)));
    return r.ok ? 0 : 3;
  }

  // Pha cần phiên: sinh tiến trình ego-browser nodejs; script trong trang do ego.ts giữ.
  const optionsPath = join(o.stateDir, "ego-options.json");
  const resultPath = join(o.stateDir, "ego-result.json");
  await writeFile(optionsPath, JSON.stringify({ ...o, config, statePath, logPath, resultPath, grid, cookieName: config.session?.cookieName }));
  const egoModule = JSON.stringify(new URL("./ego.js", import.meta.url).href);
  const bootstrap = `const m = await import(${egoModule}); process.exit(await m.main({ claimTaskSpace, takeOverTaskSpace, taskSpace, listTaskSpaces }, ${JSON.stringify(optionsPath)}));`;
  const code = await new Promise<number>((resolve) => {
    const child = spawn("ego-browser", ["nodejs"], { stdio: ["pipe", "inherit", "inherit"] });
    child.on("error", (e) => {
      io.err(`không chạy được ego-browser: ${e.message}`);
      resolve(1);
    });
    child.on("exit", (c) => resolve(c ?? 1));
    child.stdin.on("error", () => undefined);
    child.stdin.end(bootstrap);
  });
  let result: ExecResult | null = null;
  try {
    result = JSON.parse(await readFile(resultPath, "utf8")) as ExecResult;
  } catch {
    result = null;
  }
  if (result) io.out(JSON.stringify(summarize(result)));
  return result ? (result.ok ? 0 : result.stopReason ? 3 : 4) : code || 1;
}

const isEntry = (() => {
  try {
    return !!process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
})();
if (isEntry) {
  main(process.argv.slice(2)).then(
    (c) => process.exit(c),
    (e) => {
      console.error(e instanceof Error ? e.message : e);
      process.exit(1);
    },
  );
}
