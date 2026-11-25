/**
 * Điểm vào của bộ thu S17 (mốc ngày 1 và 2, claudedp-2411-20 và -21).
 *
 *   node collector/dist/collectors/s17-thua-dinh-gia/main.js --phase <reference|tile-mask|projects|session-check|apartments|parcels|lowrise>
 *        --snapshots-root <thư mục snapshot> --caps-calls <số> --caps-minutes <số> [--pace-ms 150..400] [--space <id>] [--luong-song 1..4]
 *
 * - Trần lời gọi và trần thời gian PHẢI khai mỗi lần chạy; nhịp kẹp trong mức nguồn đã chịu được.
 * - Pha công khai (reference, tile-mask) chạy ngay trong tiến trình này bằng fetch của Node, không mang phiên.
 * - Pha cần phiên (projects, session-check) sinh tiến trình `ego-browser nodejs` và gọi TRONG TRANG của
 *   hồ sơ đăng nhập (ego.ts): phiên không rời trình duyệt, không chép cookie, không in giá trị phiên.
 * - Mã thoát: 0 xong · 3 dừng cả lượt (bị chặn, hết phiên, quá trần, số dư giảm) · 1 lỗi khác · 4 trình duyệt từ chối.
 */
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { realpathSync } from "node:fs";
import { ConfigError, loadConfig, PHASE_ROLES, rolePath, type Role, type S17Config } from "./config.js";
import { MAX_CONCURRENCY, type Caps } from "./client.js";
import { DEFAULT_PACE_MS, MIN_PACE_MS, buildExecOptions, executePhase, type ExecResult } from "./runner.js";
import type { GridEntry, ParcelArea, Phase } from "./run.js";
import { nodeTransport } from "./transport-node.js";

const HERE = dirname(fileURLToPath(import.meta.url)); // dist/collectors/s17-thua-dinh-gia
const COLLECTOR_ROOT = join(HERE, "..", "..", "..");
const PHASES: Phase[] = ["reference", "tile-mask", "projects", "session-check", "apartments", "parcels", "lowrise", "apartments-all", "images"];
/** Pha không cần phiên đăng nhập (chạy bằng fetch của Node ngay trong tiến trình này). */
const PUBLIC_PHASES: Phase[] = ["reference", "tile-mask", "images"];
/** Mốc mở rộng — pha ảnh có thư mục trạng thái RIÊNG để chạy song song với pha cần phiên (khoá một lượt một thư mục). */
const STATE_DIR_ANH = "s17-thua-dinh-gia-anh";
/**
 * Nhịp: mặc định 350 ms — mức nguồn đã chịu được (0 lần bị chặn suốt 24/11). Mạnh cho tăng tốc thận trọng
 * 24/11 («2 luồng hoặc nhịp ngắn hơn; gặp 429/403 thì lùi ngay về nhịp cũ, lần hai thì dừng»): nhịp nhanh nhất
 * MIN_PACE_MS, tối đa MAX_CONCURRENCY lời một đợt. Khoá theo số lần bị chặn nằm ở trình điều khiển (runner).
 */
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
  /** Mốc ngày 2 — pha căn hộ: dự án mẫu và toà chứng minh. */
  projects?: string[];
  proveBuilding?: string;
  listOnly?: boolean;
  /** Số lời một đợt (1 = tuần tự). */
  concurrency: number;
  /** Mốc ngày 2 — tệp lưới toạ độ các khu thí điểm của pha thửa. */
  parcelsGrid?: string;
  /** Mốc ngày 2 — tệp JSON mảng các từ khoá gợi ý để khám phá dự án thấp tầng. */
  lowriseTermsFile?: string;
  /** Mốc ngày 2 — nội dung tệp từ khoá (đã đọc). */
  lowriseTerms?: string[];
  /** Mốc ngày 2 — dải id quét dự án thấp tầng. */
  lowriseSweep?: { from: number; to: number };
  /** Mốc mở rộng — lựa chọn của pha căn hộ toàn bộ dự án. */
  tatCaDuAn?: { tuSoCan?: number; denSoCan?: number; gioiHan?: number; ids?: string[] };
  /** Mốc mở rộng — lựa chọn của pha ảnh. */
  anh?: { luongSong: number; soFile: number };
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
      project: { type: "string", multiple: true },
      "prove-building": { type: "string" },
      "chi-liet-ke": { type: "boolean" },
      "luong-song": { type: "string" },
      "parcels-grid": { type: "string" },
      "thap-tang-terms": { type: "string" },
      "thap-tang-id-tu": { type: "string" },
      "thap-tang-id-den": { type: "string" },
      "tu-so-can": { type: "string" },
      "den-so-can": { type: "string" },
      "gioi-han": { type: "string" },
      "anh-luong-song": { type: "string" },
      "anh-so-file": { type: "string" },
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
  if (paceMs < MIN_PACE_MS || paceMs > PACE_MAX_MS) throw new UsageError(`--pace-ms phải trong ${MIN_PACE_MS}–${PACE_MAX_MS} ms (${DEFAULT_PACE_MS} là nhịp nguồn đã chịu được; dưới ${DEFAULT_PACE_MS} là tăng tốc và bị khoá sau lần bị chặn)`);
  const concurrency = values["luong-song"] === undefined ? 1 : positive("--luong-song", values["luong-song"]);
  if (concurrency > MAX_CONCURRENCY) throw new UsageError(`--luong-song phải từ 1 đến ${MAX_CONCURRENCY}`);
  const isPublic = PUBLIC_PHASES.includes(phase);
  const spaceId = values.space === undefined ? undefined : positive("--space", values.space);
  if (!isPublic && spaceId === undefined) throw new UsageError(`pha ${phase} cần phiên: khai --space <id task space nơi Mạnh đã đăng nhập>`);
  const projects = values.project?.map((x) => x.trim()).filter(Boolean);
  if (phase === "apartments" && !projects?.length) throw new UsageError("pha apartments cần ít nhất một --project <id dự án mẫu>");
  if (phase === "parcels" && !values["parcels-grid"]) throw new UsageError("pha parcels cần --parcels-grid <tệp lưới toạ độ các khu thí điểm>");
  const idTu = values["thap-tang-id-tu"] === undefined ? undefined : positive("--thap-tang-id-tu", values["thap-tang-id-tu"]);
  const idDen = values["thap-tang-id-den"] === undefined ? undefined : positive("--thap-tang-id-den", values["thap-tang-id-den"]);
  if ((idTu === undefined) !== (idDen === undefined)) throw new UsageError("quét thấp tầng theo id cần đủ --thap-tang-id-tu và --thap-tang-id-den");
  if (phase === "lowrise" && !values["thap-tang-terms"] && idTu === undefined) throw new UsageError("pha lowrise cần dải id quét (--thap-tang-id-tu … --thap-tang-id-den …) hoặc --thap-tang-terms <tệp JSON mảng các từ khoá gợi ý>");
  // Mốc mở rộng.
  const tuSoCan = values["tu-so-can"] === undefined ? undefined : positive("--tu-so-can", values["tu-so-can"]);
  const denSoCan = values["den-so-can"] === undefined ? undefined : positive("--den-so-can", values["den-so-can"]);
  if (tuSoCan !== undefined && denSoCan !== undefined && tuSoCan > denSoCan) throw new UsageError("--tu-so-can phải nhỏ hơn hoặc bằng --den-so-can");
  const anhLuongSong = values["anh-luong-song"] === undefined ? 4 : positive("--anh-luong-song", values["anh-luong-song"]);
  if (anhLuongSong > MAX_CONCURRENCY) throw new UsageError(`--anh-luong-song phải từ 1 đến ${MAX_CONCURRENCY}`);
  return {
    phase,
    via: isPublic ? "node" : "ego",
    config: values.config ?? join(homedir(), ".oneinvest", "s17-thua-dinh-gia.json"),
    snapshotsRoot: values["snapshots-root"],
    stateDir: values["state-dir"] ?? join(COLLECTOR_ROOT, "state", phase === "images" ? STATE_DIR_ANH : "s17-thua-dinh-gia"),
    caps: { calls: positive("--caps-calls", values["caps-calls"]), minutes: positive("--caps-minutes", values["caps-minutes"]) },
    paceMs,
    batchItems: values["batch-items"] === undefined ? 50 : positive("--batch-items", values["batch-items"]),
    grid: values.grid,
    tileZoom: values["tile-zoom"] === undefined ? 17 : positive("--tile-zoom", values["tile-zoom"]),
    listSize: values["list-size"] === undefined ? 100 : positive("--list-size", values["list-size"]),
    spaceId,
    projects,
    proveBuilding: values["prove-building"],
    listOnly: values["chi-liet-ke"] === true ? true : undefined,
    concurrency,
    parcelsGrid: values["parcels-grid"],
    lowriseTermsFile: values["thap-tang-terms"],
    lowriseSweep: idTu === undefined ? undefined : { from: idTu, to: idDen as number },
    ...(phase === "apartments-all" ? { tatCaDuAn: { ...(tuSoCan !== undefined ? { tuSoCan } : {}), ...(denSoCan !== undefined ? { denSoCan } : {}), ...(values["gioi-han"] === undefined ? {} : { gioiHan: positive("--gioi-han", values["gioi-han"]) }), ...(projects?.length ? { ids: projects } : {}) } } : {}),
    ...(phase === "images" ? { anh: { luongSong: anhLuongSong, soFile: values["anh-so-file"] === undefined ? 100 : positive("--anh-so-file", values["anh-so-file"]) } } : {}),
  };
}

/** Vai mà pha này sẽ gọi — kiểm đủ đường trong cấu hình local TRƯỚC khi gửi lời nào. */
export function rolesOfPhase(phase: Phase, checkBalance: boolean): Role[] {
  // Pha có phiên còn cần hai vai đối chiếu (kiểm phiên, công khai) và số dư.
  return checkBalance ? [...PHASE_ROLES[phase], "asset-type", "data-available", "balance"] : [...PHASE_ROLES[phase]];
}

/** Kiểm cấu hình đủ cho pha này TRƯỚC khi gửi lời nào: đường của mọi vai, và tên cookie phiên nếu pha cần phiên. */
export function checkConfigForPhase(config: S17Config, o: CliOptions): void {
  for (const role of rolesOfPhase(o.phase, o.via === "ego")) rolePath(config, role);
  if (o.via === "ego" && !config.session) throw new ConfigError("cấu hình local S17 thiếu session.cookieName (tên cookie phiên) cho pha cần phiên");
  if (o.phase === "images" && !config.anh?.hostSuffixes.length) {
    throw new ConfigError("cấu hình local S17 thiếu anh.hostSuffixes (đuôi máy chủ ảnh của nguồn) cho pha ảnh — không tải mò");
  }
}

/**
 * Nội dung tệp tuỳ chọn chuyển cho tiến trình ego — tách thành hàm để test được. Tiến trình ấy không chạy
 * trong thư mục của người gọi và không thấy biến môi trường của Shell, nên MỌI đường dẫn tệp phải tuyệt đối
 * (lượt thật 24/11: lưới thửa đưa bằng đường tương đối nên tiến trình không mở được). `goc` là gốc để quy đổi
 * đường tương đối: mặc định là thư mục GỌI lệnh, đúng chỗ `main()` đọc cùng tệp ấy (lượt soát 24/11: mặc định cũ là
 * gốc gói collector nên gọi từ gốc kho thì tệp đọc được ở đây mà tiến trình kia không mở được).
 */
export function egoOptions(
  o: CliOptions,
  config: S17Config,
  paths: { statePath: string; logPath: string; resultPath: string },
  goc: string = process.cwd(),
): Record<string, unknown> {
  const tuyetDoi = (p: string | undefined): string | undefined => (p === undefined ? undefined : resolve(goc, p));
  return {
    ...o, // mọi trường của bản kê đi nguyên (concurrency, listOnly, projects, proveBuilding, lowriseSweep, …)
    snapshotRoot: resolve(o.snapshotsRoot),
    config,
    ...paths,
    grid: tuyetDoi(o.grid),
    parcelsGrid: tuyetDoi(o.parcelsGrid),
    lowriseTermsFile: tuyetDoi(o.lowriseTermsFile),
    cookieName: config.session?.cookieName,
    checkBalance: o.via === "ego",
    // Mã của lượt này: tiến trình trình duyệt ghi mã ấy vào tệp kết quả; kết quả mang mã khác là của lượt trước.
    runId: randomBytes(8).toString("hex"),
  };
}

/**
 * Kết quả của ĐÚNG lượt này. Tệp kết quả còn sót của lượt trước (tiến trình trình duyệt chết trước khi ghi) không
 * được nhận làm kết quả lượt mới (lượt soát 24/11) — trả null khi không có tệp hoặc mã lượt không khớp.
 */
export async function readRunResult(resultPath: string, runId: string): Promise<ExecResult | null> {
  try {
    const r = JSON.parse(await readFile(resultPath, "utf8")) as (ExecResult & { runId?: string }) | null;
    return r && typeof r === "object" && r.runId === runId ? r : null;
  } catch {
    return null;
  }
}

/** Dòng tóm tắt in ra màn: chỉ số đếm và lý do, không URL, không số dư. */
export function summarize(r: ExecResult): Record<string, unknown> {
  return {
    ok: r.ok,
    stopReason: r.stopReason,
    message: r.message,
    calls: r.calls ?? 0,
    blocks: r.blocks ?? 0,
    snapshots: r.snapshots?.length ?? 0,
    // Lượt dừng giữa chừng không đọc được số dư sau → để trống, không kết luận «đổi».
    soDuKhongDoi: r.balanceBefore === undefined || r.balanceAfter === undefined ? undefined : r.balanceBefore === r.balanceAfter,
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
  const parcels = o.parcelsGrid === undefined ? undefined : (JSON.parse(await readFile(o.parcelsGrid, "utf8")) as ParcelArea[]);
  const lowriseTerms = o.lowriseTermsFile === undefined ? undefined : (JSON.parse(await readFile(o.lowriseTermsFile, "utf8")) as string[]);
  if (lowriseTerms !== undefined && (!Array.isArray(lowriseTerms) || lowriseTerms.some((t) => typeof t !== "string"))) {
    io.err("--thap-tang-terms phải là mảng các chuỗi");
    return 2;
  }
  if (parcels !== undefined && (!Array.isArray(parcels) || parcels.some((k) => !k || typeof k.khuVucId !== "string" || !Array.isArray(k.diem)))) {
    io.err("--parcels-grid phải là mảng các khu { khuVucId, ten, dienTichKm2, buocM, diem: [[lat, lng], …] }");
    return 2;
  }
  const statePath = join(o.stateDir, "state.json");
  const logPath = join(o.stateDir, "run.log.jsonl");
  await mkdir(o.stateDir, { recursive: true });

  if (o.via === "node") {
    const r = await executePhase({
      ...buildExecOptions({
        config, snapshotRoot: o.snapshotsRoot, statePath, logPath, caps: o.caps, paceMs: o.paceMs, batchItems: o.batchItems,
        checkBalance: false, grid, listSize: o.listSize, tileZoom: o.tileZoom, parcels, concurrency: o.concurrency, lowriseTerms,
      }),
      phase: o.phase,
      transport: nodeTransport(),
    });
    io.out(JSON.stringify(summarize(r)));
    return r.ok ? 0 : 3;
  }

  // Pha cần phiên: sinh tiến trình ego-browser nodejs; script trong trang do ego.ts giữ.
  const optionsPath = join(o.stateDir, "ego-options.json");
  const resultPath = join(o.stateDir, "ego-result.json");
  const egoKe = egoOptions(o, config, { statePath, logPath, resultPath });
  await writeFile(optionsPath, JSON.stringify(egoKe));
  await rm(resultPath, { force: true }); // tệp kết quả của lượt trước không được đọc làm kết quả lượt này
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
  const result = await readRunResult(resultPath, String(egoKe.runId));
  if (result) io.out(JSON.stringify(summarize(result)));
  else io.err(`tiến trình trình duyệt kết thúc (mã ${code}) mà không ghi được kết quả của lượt này`);
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
