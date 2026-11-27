/**
 * Lớp gọi có khoá của bộ thu S17 (mốc ngày 1, claudedp-2411-20).
 *
 * Mọi lời gọi đi qua một vai đã khai (config.ts) với đúng tham số được nhận. Lớp này giữ:
 * - trần lời gọi và trần thời gian của cả lượt (tính cả lời thử lại và lời đối chiếu);
 * - dừng cả lượt: 403, 429, trang thử thách (HTML thay JSON), hết phiên, quá trần, mạng hỏng liền nhau.
 *   Đã dừng thì mọi lời sau bị từ chối ngay, không gửi gì nữa;
 * - thử lại lỗi mạng và 5xx sau 5s, 15s, 30s rồi trả lỗi tạm (không dừng lượt);
 * - lời cần phiên gặp lỗi mạng được đối chiếu với một lời công khai: công khai chạy mà phiên không
 *   chạy là hết phiên (nguồn trả 401 không kèm CORS nên trong trang chỉ thấy lỗi mạng).
 *
 * Vận chuyển (transport) được tiêm vào: test dùng hàm giả; chạy thật dùng fetch của Node cho phần
 * công khai và fetch trong trang của hồ sơ đăng nhập cho phần cần phiên (phiên không rời trình duyệt).
 */
import { ConfigError, PROBE_ROLE, ROLES, SESSION_PROBE_ROLE, rolePath, type Role, type S17Config } from "./config.js";

export type Response = {
  status: number;
  contentType: string;
  body: string;
  /** Số byte của thân khi vận chuyển không trả thân chữ (tile ảnh). */
  bytes?: number;
  /** Thời gian chờ câu trả lời (ms) — chỉ có ở đường trong trang. */
  ms?: number;
  /** Các header được chọn của câu trả lời (retry-after, hạn mức, giờ máy chủ…) — chỉ có ở đường trong trang. */
  headers?: Record<string, string>;
};
/**
 * Thân câu trả lời đã CHE: chỉ có số đo (độ dài, loại) và các trường chẩn đoán được chọn lọc — không có chữ tự do nào
 * của thân. `daBo` = số trường của thân không được giữ lại.
 */
export type ThanDaChe = { dai: number; kieu: "json" | "html" | "xml" | "text" | "khac"; chanDoan: Record<string, unknown>; daBo: number };
/**
 * Một câu trả lời của nguồn, đủ để đo: vai, trạng thái, thời gian chờ, các header được chọn. Khi câu trả lời KHÔNG phải
 * 200: `than` là phần thân đã che, và `thanTho` là phần thân gốc (tối đa TOI_DA_THAN_THO ký tự) — CHỈ để trình điều
 * khiển ghi vào tệp riêng ở máy, không bao giờ vào nhật ký (claudedp-2611-19: thân câu 401/403/429 có thể lặp lại mã
 * phiên, định danh tài khoản thu, khoá, cookie). Lỗi mạng (không có câu trả lời) báo với `status: 0`.
 */
export type PhanHoi = { vai: string; status: number; ms?: number; contentType?: string; headers?: Record<string, string>; bytes?: number; than?: ThanDaChe; thanTho?: string };
export type Transport = (url: string, headers: Record<string, string>) => Promise<Response>;
/** Gửi nhiều lời trong MỘT đợt (vd nhiều fetch đồng thời trong trang), lời i bắt đầu sau i × staggerMs. Mỗi phần tử: phản hồi hoặc lỗi mạng. */
export type TransportMany = (requests: Array<{ url: string; headers: Record<string, string> }>, staggerMs: number) => Promise<Array<Response | Error>>;
export type ManyResult<T> = { ok: true; value: T } | { ok: false; error: Error };
/** Trần phần thân gốc đưa cho trình điều khiển ghi vào tệp riêng ở máy. */
export const TOI_DA_THAN_THO = 64 * 1024;
const KIEU_THAN: Array<[RegExp, ThanDaChe["kieu"]]> = [
  [/json/i, "json"],
  [/html/i, "html"],
  [/xml/i, "xml"],
  [/text|javascript|form/i, "text"],
];
/**
 * Trường CHẨN ĐOÁN của thân JSON được xem xét (so không phân biệt hoa thường, bỏ gạch nối và gạch dưới): mã lỗi, mã
 * yêu cầu, hạn mức… Giá trị chỉ được giữ khi là số, cờ, mã viết hoa, hay định danh lời gọi. Chữ tự do (lời báo, tên
 * trường, đường dẫn) không bao giờ vào nhật ký: nó có thể chứa định danh tài khoản thu, đường API, mã phiên.
 */
const KHOA_CHAN_DOAN = new Set(["status", "code", "errorcode", "error", "errortype", "traceid", "requestid", "correlationid", "limit", "remaining", "reset", "resetat", "retryafter", "count", "total", "max", "quota", "exceeded", "errors"]);
const KHOA_DINH_DANH_LOI_GOI = new Set(["traceid", "requestid", "correlationid"]);
const chuanHoaKhoa = (k: string): string => k.toLowerCase().replace(/[-_]/g, "");
const cheChuSo = (s: string): string => s.replace(/\d{6,}/g, "…");

type GiaTriChanDoan = string | number | boolean | { [k: string]: GiaTriChanDoan } | GiaTriChanDoan[];

/** Giá trị gốc (số, cờ, chuỗi) của một trường chẩn đoán được giữ không. `undefined` = bỏ. */
function giaTriChanDoan(khoa: string, v: unknown): string | number | boolean | undefined {
  if (typeof v === "number" || typeof v === "boolean") return v;
  if (typeof v !== "string") return undefined;
  if (KHOA_DINH_DANH_LOI_GOI.has(khoa)) return /^[A-Za-z0-9_-]{6,40}$/.test(v) ? v : undefined; // một khoá đơn ngắn, không có dấu chấm (loại JWT)
  if (/^-?\d{1,15}(\.\d+)?$/.test(v)) return v;
  if (/^[A-Z][A-Z0-9_]{0,63}$/.test(v)) return cheChuSo(v);
  return undefined;
}

/**
 * Lọc một nút của thân JSON: chỉ giữ trường chẩn đoán theo danh sách trắng, tối đa 4 lớp và 20 phần tử một mảng. Trả
 * [nút đã lọc (có thể rỗng), số trường bị bỏ] — mỗi khoá ngoài danh sách trắng tính một, mỗi giá trị không giữ được
 * tính một.
 */
function locNut(v: unknown, khoa: string | null, sau: number): [GiaTriChanDoan | undefined, number] {
  if (sau > 4) return [undefined, 1];
  if (Array.isArray(v)) {
    const ds: GiaTriChanDoan[] = [];
    let daBo = 0;
    for (const x of v.slice(0, 20)) {
      if (x && typeof x === "object") {
        const [g, b] = locNut(x, null, sau + 1);
        daBo += b;
        if (g !== undefined && !Array.isArray(g) && Object.keys(g).length) ds.push(g);
      } else daBo++; // phần tử không phải đối tượng: không giữ gì (có thể là chữ tự do)
    }
    return [ds, daBo];
  }
  if (v && typeof v === "object") {
    const out: Record<string, GiaTriChanDoan> = {};
    let daBo = 0;
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
      const kh = chuanHoaKhoa(k);
      if (!KHOA_CHAN_DOAN.has(kh)) {
        daBo++;
        continue;
      }
      if (x && typeof x === "object") {
        const [g, b] = locNut(x, kh, sau + 1);
        daBo += b;
        if (g !== undefined && (Array.isArray(g) ? g.length : Object.keys(g).length)) out[k] = g; // mảng đã lọc, hoặc đối tượng có ít nhất một trường
        continue;
      }
      const giu = giaTriChanDoan(kh, x);
      if (giu === undefined) daBo++;
      else out[k] = giu;
    }
    return [out, daBo];
  }
  return [undefined, 1]; // gốc là một giá trị đơn: không có gì để chẩn đoán
}

/**
 * Che thân một câu trả lời lỗi cho nhật ký: không giữ chữ tự do nào. Với thân JSON, chỉ giữ các trường chẩn đoán theo
 * danh sách trắng (mã trạng thái/lỗi của nguồn, mã yêu cầu, hạn mức) với giá trị đã kiểm; với trang HTML/XML thì chỉ
 * ghi loại và độ dài. Thân gốc không đi qua đây — nó vào tệp riêng ở máy.
 */
export function cheThanPhanHoi(than: string, contentType: string): ThanDaChe {
  let kieu: ThanDaChe["kieu"] = "khac";
  for (const [re, k] of KIEU_THAN) {
    if (re.test(contentType)) {
      kieu = k;
      break;
    }
  }
  const out: ThanDaChe = { dai: than.length, kieu, chanDoan: {}, daBo: 0 };
  const thu = than.trim();
  // Trang HTML/XML không phân tích (mã kịch bản, khoá ký trong trang không được đọc); kiểu khác chỉ thử khi thân giống JSON.
  if (kieu !== "json" && ((kieu === "html" || kieu === "xml") || !(thu.startsWith("{") || thu.startsWith("[")))) return out;
  try {
    const j = JSON.parse(than) as unknown;
    const [g, b] = j && typeof j === "object" ? locNut(j, null, 0) : [undefined, 0];
    out.daBo = b;
    if (g !== undefined && !Array.isArray(g)) out.chanDoan = g as Record<string, unknown>;
  } catch {
    out.kieu = "khac"; // khai là JSON nhưng không phân tích được: không đọc gì thêm
  }
  return out;
}

/**
 * Số lời tối đa một đợt — HẰNG SỐ CHUNG của cả bộ thu (lớp gọi, dòng lệnh, trình điều khiển, các pha).
 * Mạnh cho tăng tốc thận trọng 24/11 («2 luồng»), trần bốn; 25/11 Mạnh chốt «tiếp tục tăng tốc» cho mốc mở rộng
 * (claudedp-2411-73) nên trần nâng lên tám. Trần là mức TRÊN CÙNG; tốc độ thật đi theo nấc, bị chặn một lần thì
 * lùi về nhịp cũ một luồng (khoá ở trình điều khiển).
 */
export const MAX_CONCURRENCY = 8;
export type Caps = { calls: number; minutes: number };
export type StopReason =
  | "blocked"
  | "session-expired"
  | "call-cap"
  | "time-cap"
  | "network-down"
  | "balance-spent"
  | "balance-unreadable"
  | "proof-failed"
  | "fast-after-block"
  | "blocked-twice"
  | "operator-stop"
  | "another-run"
  | "source-error"
  /** Trang gọi trong trang không còn ở gốc của nguồn (bị điều hướng đi chỗ khác giữa lượt). */
  | "page-origin";

export class RunStopped extends Error {
  constructor(
    readonly reason: StopReason,
    message: string,
  ) {
    super(message);
    this.name = "RunStopped";
  }
}

/** Lỗi tạm thời sau khi đã thử lại hết — không dừng lượt; lời gọi tính là thất bại và đi tiếp. */
export class TemporaryFailure extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TemporaryFailure";
  }
}

/** Nguồn trả 4xx khác (vd 404): bản ghi đó không có — tính thất bại của riêng nó, không dừng lượt. */
export class HttpStatusError extends Error {
  constructor(
    readonly status: number,
    readonly role: string,
  ) {
    super(`nguồn trả HTTP ${status} ở vai "${role}"`);
    this.name = "HttpStatusError";
  }
}

const RETRY_WAITS_MS = [5_000, 15_000, 30_000];
/** Câu chữ của lỗi vận chuyển (không kèm cause) — đủ nhận diện «Failed to fetch», «signal timed out», việc trong trang đã mất. */
const loiVanChuyen = (e: unknown): string => (e instanceof Error ? e.message : String(e)).slice(0, 160);
const MAX_CONSECUTIVE_FAILURES = 10;

export type ClientOptions = {
  config: S17Config;
  transport: Transport;
  sleep: (ms: number) => Promise<void>;
  now: () => number;
  caps: Caps;
  /** Nhịp nghỉ trước mỗi lời gửi (ms) — trong mức nguồn đã chịu được (0,3–0,4 s/lời). */
  paceMs: number;
  /** Vận chuyển theo đợt cho đường nhiều lời; thiếu thì gửi tuần tự bằng `transport`. */
  transportMany?: TransportMany;
  /**
   * Yêu cầu dừng từ người vận hành (tệp DUNG trong thư mục trạng thái). Trả true thì từ lời kế trở đi lượt dừng như
   * mọi lần dừng khác — không phải bị chặn, không gửi thêm lời nào.
   */
  shouldStop?: () => boolean;
  /** Báo MỖI câu trả lời của nguồn (xem PhanHoi) — trình điều khiển ghi lại để đo; thiếu thì không báo. */
  onResponse?: (r: PhanHoi) => void;
};

export class S17Client {
  /** Số lời đã gửi tới nguồn (kể cả thử lại và lời đối chiếu). */
  calls = 0;
  /** Số lần gặp chặn (403, 429, trang thử thách). */
  blocks = 0;
  retries = 0;
  private stopped: RunStopped | null = null;
  private consecutiveFailures = 0;
  private readonly startedAt: number;
  private readonly headers: Record<string, string>;

  constructor(private readonly o: ClientOptions) {
    this.startedAt = o.now();
    this.headers = {
      accept: "application/json",
      "content-type": "application/json",
      // Nguồn chỉ chặn theo Origin ngoài lớp phiên: gửi như trang web của nguồn
      origin: o.config.hosts.web,
      referer: `${o.config.hosts.web}/`,
    };
  }

  /** Dùng URL của một vai với tham số được khai. Ném ConfigError khi tham số hoặc đường không hợp lệ. */
  url(role: Role, params: Record<string, string | number | undefined> = {}): string {
    const spec = ROLES[role];
    const template = rolePath(this.o.config, role);
    const pathParams: Record<string, string> = {};
    const query: string[] = [];
    for (const key of Object.keys(params).sort()) {
      const v = params[key];
      if (v === undefined) continue;
      if (spec.path?.includes(key)) pathParams[key] = String(v);
      else if (spec.query.includes(key)) query.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`);
      else throw new ConfigError(`vai "${role}" không nhận tham số "${key}"`);
    }
    const missing = (spec.path ?? []).filter((k) => !(k in pathParams));
    if (missing.length) throw new ConfigError(`vai "${role}" thiếu tham số đường "${missing[0]}"`);
    const path = template.replace(/\{(\w+)\}/g, (_m, k: string) => encodeURIComponent(pathParams[k]));
    const base = this.o.config.hosts[spec.host].replace(/\/+$/, "");
    return `${base}${path}${query.length ? `?${query.join("&")}` : ""}`;
  }

  private stop(reason: StopReason, message: string): RunStopped {
    this.stopped ??= new RunStopped(reason, message);
    return this.stopped;
  }

  private assertRunning(): void {
    if (this.stopped) throw this.stopped;
    if (this.o.shouldStop?.()) throw this.stop("operator-stop", "có tệp DUNG trong thư mục trạng thái — dừng theo yêu cầu");
    if (this.o.now() - this.startedAt > this.o.caps.minutes * 60_000) {
      throw this.stop("time-cap", `quá trần thời gian ${this.o.caps.minutes} phút`);
    }
    if (this.calls >= this.o.caps.calls) {
      throw this.stop("call-cap", `quá trần ${this.o.caps.calls} lời gọi`);
    }
  }

  /**
   * Gửi một lời đối chiếu, tính vào trần lời gọi. "ok": nguồn trả JSON bình thường (2xx–4xx); "fail": lỗi mạng;
   * "unknown": 5xx, không kết luận được gì về phiên. Phản hồi của lời kiểm phiên CŨNG được phân loại — 403, 429, trang
   * thử thách là bị chặn, 401 là hết phiên (lượt soát 24/11: lời kiểm phiên trả 403 vẫn bị coi là «phiên còn sống»,
   * lượt gửi thêm 40 lời sau khi nguồn bắt đầu từ chối, và khoá tăng tốc không bao giờ bật).
   */
  private async sendProbe(role: Role): Promise<"ok" | "fail" | "unknown"> {
    this.assertRunning();
    await this.o.sleep(this.o.paceMs);
    this.assertRunning(); // nghỉ nhịp xong có thể đã có yêu cầu dừng hoặc đã quá trần
    this.calls++;
    let res: Response | null = null;
    try {
      res = await this.o.transport(this.url(role, {}), this.headers);
    } catch {
      res = null;
    }
    return this.phanLoaiKiem(role, res);
  }

  /**
   * Báo câu trả lời qua `onResponse` (nếu có) TRƯỚC mọi phân loại — kể cả câu gây dừng (403, 429, 401) và lỗi mạng.
   * Lời 429 ngày 25/11 chỉ để lại «nguồn trả 429»; từ đây câu trả lời lỗi mang thời gian chờ, các header được chọn và
   * phần thân ĐÃ CHE (số đo + trường chẩn đoán), kèm thân gốc để trình điều khiển cất ở tệp riêng trong máy — thân gốc
   * không bao giờ vào nhật ký. Header chỉ đọc được khi nguồn lộ qua CORS: gọi trong trang là gọi tới máy chủ khác gốc,
   * đo 26/11 câu trả lời 200 của máy chủ API không đọc được header nào (kể cả date).
   */
  private baoPhanHoi(role: string, res: Response | null): void {
    if (!this.o.onResponse) return;
    const r: PhanHoi = { vai: role, status: res?.status ?? 0 };
    if (res) {
      if (res.ms !== undefined) r.ms = res.ms;
      if (res.contentType) r.contentType = res.contentType;
      if (res.headers && Object.keys(res.headers).length) r.headers = res.headers;
      if (res.bytes !== undefined) r.bytes = res.bytes;
      if (res.status !== 200 && res.body) {
        r.than = cheThanPhanHoi(res.body, res.contentType); // phần đã che: an toàn để trích dẫn
        r.thanTho = res.body.slice(0, TOI_DA_THAN_THO); // thân gốc: CHỈ để trình điều khiển ghi vào tệp riêng ở máy
      }
    }
    this.o.onResponse(r);
  }

  private phanLoaiKiem(role: Role, res: Response | null): "ok" | "fail" | "unknown" {
    this.baoPhanHoi(role, res);
    if (!res) return "fail";
    if (res.status === 403 || res.status === 429) {
      this.blocks++;
      throw this.stop("blocked", `nguồn trả ${res.status} ở lời kiểm phiên "${role}"`);
    }
    if (res.status === 401) throw this.stop("session-expired", `nguồn trả 401 ở lời kiểm phiên "${role}"`);
    if (!/json/i.test(res.contentType)) {
      this.blocks++;
      throw this.stop("blocked", `lời kiểm phiên "${role}" trả trang không phải JSON (${res.contentType || "không rõ kiểu"})`);
    }
    return res.status < 500 ? "ok" : "unknown";
  }

  /**
   * Khi một lời cần phiên gặp lỗi mạng, phải hỏi chính một lời cần phiên: nguồn trả 401 không kèm CORS nên
   * trong trang chỉ thấy lỗi mạng. Lời kiểm phiên chạy được → phiên còn sống, lỗi là của riêng bản ghi.
   * Lời kiểm phiên cũng lỗi → hỏi tiếp một lời công khai: công khai chạy mà phiên không chạy là HẾT PHIÊN;
   * cả hai lỗi là mạng hỏng. (Lượt thật 24/11: hỏi mỗi lời công khai nên đoán nhầm hết phiên ở 1.690/2.508.)
   */
  private async classifySessionFailure(roleLabel: string): Promise<"session-alive" | "network" | RunStopped> {
    const phien = await this.sendProbe(SESSION_PROBE_ROLE);
    if (phien === "ok") return "session-alive";
    if (phien === "unknown") return "network"; // 5xx ở lời kiểm phiên: không nói được gì về phiên, đi thang thử lại như mạng hỏng
    if ((await this.sendProbe(PROBE_ROLE)) === "ok") return this.stop("session-expired", `lời cần phiên "${roleLabel}" và lời kiểm phiên đều lỗi mạng trong khi lời công khai vẫn chạy`);
    return "network";
  }

  /**
   * Phân loại kết quả thô của MỘT lời (dùng chung cho đường một lời và đường nhiều lời):
   * - "ok": 2xx–4xx (4xx do người gọi xử lý);
   * - { ownRecord }: lỗi mạng hoặc 5xx. Lời cần phiên được đối chiếu phiên trước (classifySessionFailure);
   *   ownRecord = phiên còn sống nên lỗi thuộc về riêng bản ghi;
   * - ném RunStopped: bị chặn (403, 429), hết phiên (401), hoặc do lời đối chiếu phát hiện.
   */
  private async classify(res: Response | null, needsSession: boolean, role: string): Promise<"ok" | { ownRecord: boolean }> {
    this.baoPhanHoi(role, res);
    if (res && res.status === 403) {
      this.blocks++;
      throw this.stop("blocked", `nguồn trả 403 ở vai "${role}"`);
    }
    if (res && res.status === 429) {
      this.blocks++;
      throw this.stop("blocked", `nguồn trả 429 ở vai "${role}"`);
    }
    if (res && res.status === 401) throw this.stop("session-expired", `nguồn trả 401 ở vai "${role}"`);
    if (res && res.status < 500) return "ok";
    let ownRecord = false; // phiên vẫn sống: lỗi thuộc về riêng bản ghi này
    if (!res && needsSession) {
      const verdict = await this.classifySessionFailure(role);
      if (verdict instanceof RunStopped) throw verdict;
      ownRecord = verdict === "session-alive";
    }
    return { ownRecord };
  }

  /**
   * Quyết định sau một lần thất bại (mạng hoặc 5xx): còn lượt thử thì trả null (kể một lần thử lại); hết lượt thì
   * trả lỗi tạm; mười lỗi tạm liền nhau thì dừng cả lượt. Lỗi của riêng bản ghi (phiên sống) chỉ thử lại MỘT lần
   * sau 5 s; mạng hỏng thì ba lần (5 s, 15 s, 30 s).
   */
  /**
   * Trả lỗi tạm sau khi thử lại hết. Lời lỗi gốc của vận chuyển đi theo (`loiMang`) — lượt thật 24/11 18:09: không đọc
   * được số dư trước lượt mà trong lỗi không có gì để tra vì sao. Chỉ câu chữ của lỗi (tối đa 160 ký tự), không kèm cause.
   */
  private retryOrFail(ownRecord: boolean, res: Response | null, role: string, attempt: number, loiMang = ""): TemporaryFailure | null {
    const retriesAllowed = ownRecord ? 1 : RETRY_WAITS_MS.length;
    if (attempt < retriesAllowed) {
      this.retries++;
      return null;
    }
    this.consecutiveFailures++;
    if (this.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      throw this.stop("network-down", `${MAX_CONSECUTIVE_FAILURES} lời thất bại liền nhau`);
    }
    return new TemporaryFailure(`vai "${role}" lỗi ${res ? `HTTP ${res.status}` : `mạng «${loiMang || "không rõ"}»`} sau ${attempt} lần thử lại`);
  }

  /** Đợi trước một lời: lượt thử lại thì nghỉ theo thang, rồi luôn nghỉ nhịp. */
  private async waitBefore(attempt: number): Promise<void> {
    if (attempt > 0) await this.o.sleep(RETRY_WAITS_MS[Math.min(attempt - 1, RETRY_WAITS_MS.length - 1)]);
    await this.o.sleep(this.o.paceMs);
  }

  /** Thời điểm gọi `attempt` tính từ 0. Giữ trần, nhịp, dừng cả lượt; thử lại theo classify/retryOrFail. */
  private async sendWithRetry(needsSession: boolean, role: string, url: string): Promise<Response> {
    for (let attempt = 0; ; attempt++) {
      this.assertRunning();
      await this.waitBefore(attempt);
      this.assertRunning(); // nghỉ thử lại xong có thể đã quá trần thời gian hoặc đã có yêu cầu dừng
      this.calls++;
      let res: Response | null = null;
      let loiMang = "";
      try {
        res = await this.o.transport(url, this.headers);
      } catch (e) {
        if (e instanceof RunStopped) {
          // Vận chuyển bảo dừng cả lượt (vd trang không còn ở gốc của nguồn): CHỐT vào lớp gọi — mọi lời sau bị từ chối
          // ngay, không thử lại. Không chốt thì lượt vẫn gửi tiếp, mỗi lần là thêm một lần chạy trong trang lạ (lượt
          // xét vòng 1).
          this.stopped ??= e;
          throw e;
        }
        res = null;
        loiMang = loiVanChuyen(e);
      }
      const verdict = await this.classify(res, needsSession, role);
      if (verdict === "ok") {
        this.consecutiveFailures = 0;
        return res as Response;
      }
      const failure = this.retryOrFail(verdict.ownRecord, res, role, attempt, loiMang);
      if (failure) throw failure;
    }
  }

  /** Gửi một đợt: nhiều lời mới đi qua vận chuyển theo đợt; một lời thì đi đường một lời. Mỗi phần tử: phản hồi hoặc lỗi mạng. */
  private async sendWave(list: Array<{ url: string; headers: Record<string, string> }>, staggerMs: number): Promise<Array<Response | Error>> {
    if (list.length > 1 && this.o.transportMany) return this.o.transportMany(list, staggerMs);
    const out: Array<Response | Error> = [];
    for (const r of list) {
      try {
        out.push(await this.o.transport(r.url, r.headers));
      } catch (e) {
        out.push(e instanceof Error ? e : new Error(String(e)));
      }
    }
    return out;
  }

  /** Đổi một phản hồi thành JSON: HTML thay JSON là trang thử thách (dừng cả lượt); 4xx là lỗi của riêng bản ghi. */
  private parseJson<T>(res: Response, role: string): T {
    if (!/json/i.test(res.contentType)) {
      this.blocks++;
      throw this.stop("blocked", `nguồn trả trang không phải JSON (${res.contentType || "không rõ kiểu"}) ở vai "${role}"`);
    }
    if (res.status < 200 || res.status >= 300) throw new HttpStatusError(res.status, role);
    try {
      return JSON.parse(res.body) as T;
    } catch {
      throw new TemporaryFailure(`thân phản hồi không phải JSON ở vai "${role}"`);
    }
  }

  /** Gọi và trả phản hồi gốc (trạng thái, kiểu nội dung, thân chữ). */
  getRaw(role: Role, params: Record<string, string | number | undefined> = {}): Promise<Response> {
    return this.sendWithRetry(ROLES[role].needsSession, role, this.url(role, params));
  }

  /**
   * Một tile ảnh tĩnh dưới cơ sở lấy từ cấu hình của chính nguồn. Chỉ nhận địa chỉ z/x/y toàn số —
   * không ghép được đường khác, cũng không ghép được biến thể trả phí.
   */
  getTile(base: string, zxy: string): Promise<Response> {
    if (!/^\d{1,2}\/\d{1,8}\/\d{1,8}$/.test(zxy)) throw new ConfigError(`địa chỉ tile không hợp lệ: "${zxy}"`);
    return this.sendWithRetry(false, "tile", `${base.replace(/\/+$/, "")}/${zxy}.png`);
  }

  /** Gọi và phân tích JSON. HTML thay cho JSON là trang thử thách → dừng cả lượt; 4xx → lỗi của bản ghi đó. */
  async getJson<T = unknown>(role: Role, params: Record<string, string | number | undefined> = {}): Promise<T> {
    return this.parseJson<T>(await this.getRaw(role, params), role);
  }

  /**
   * Gửi NHIỀU lời, tối đa `concurrency` lời một đợt (đo 24/11: hai lời đồng thời trong trang rút được một nửa
   * thời gian). Mọi khoá của lớp gọi vẫn giữ: kiểm đủ URL trước khi gửi gì; trần và nhịp tính cho TỪNG lời; bị
   * chặn hay hết phiên thì dừng cả lượt, phần chưa gửi nhận lỗi dừng; lỗi mạng/5xx của một lời chỉ làm chính lời
   * đó thử lại theo đúng luật. Kết quả về đúng thứ tự lời vào; hàm không ném RunStopped giữa chừng.
   */
  async getJsonMany<T = unknown>(
    tasks: ReadonlyArray<{ role: Role; params?: Record<string, string | number | undefined> }>,
    concurrency = 1,
  ): Promise<Array<ManyResult<T>>> {
    if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > MAX_CONCURRENCY) {
      throw new ConfigError(`concurrency phải là số nguyên từ 1 đến ${MAX_CONCURRENCY}`);
    }
    const reqs = tasks.map((t) => ({ role: t.role, url: this.url(t.role, t.params ?? {}) })); // sai cấu hình → không gửi gì
    const out: Array<ManyResult<T> | undefined> = new Array(reqs.length);
    const attempts = new Map<number, number>();
    let pending = reqs.map((_, i) => i);
    for (let round = 0; pending.length; round++) {
      for (let i = 0; i < pending.length; i += concurrency) {
        const wave: number[] = [];
        for (const idx of pending.slice(i, i + concurrency)) {
          if (this.stopped) {
            out[idx] = { ok: false, error: this.stopped };
            continue;
          }
          try {
            this.assertRunning();
            await this.waitBefore(attempts.get(idx) ?? 0);
            this.assertRunning(); // nghỉ thử lại xong có thể đã quá trần thời gian hoặc đã có yêu cầu dừng
          } catch (e) {
            out[idx] = { ok: false, error: e as Error };
            continue;
          }
          this.calls++;
          wave.push(idx);
        }
        if (!wave.length) continue;
        const list = wave.map((idx) => ({ url: reqs[idx].url, headers: this.headers }));
        const raw = await this.sendWave(list, this.o.paceMs);
        // Khoá dừng TRƯỚC khi phân loại từng lời: đợt đã về mà có 403/429/401 hay trang thử thách thì mọi lời của
        // đợt nhận lỗi dừng ngay — lời lỗi mạng đứng trước không kịp hỏi đối chiếu (lượt soát 25/11).
        for (let k = 0; k < wave.length; k++) {
          const g = raw[k];
          if (g instanceof Error) continue;
          const vai = String(reqs[wave[k]].role);
          if (g.status === 403 || g.status === 429) {
            this.blocks++;
            this.stop("blocked", `nguồn trả ${g.status} ở vai "${vai}"`);
          } else if (g.status === 401) this.stop("session-expired", `nguồn trả 401 ở vai "${vai}"`);
          else if (g.status < 500 && !/json/i.test(g.contentType)) {
            this.blocks++;
            this.stop("blocked", `nguồn trả trang không phải JSON (${g.contentType || "không rõ kiểu"}) ở vai "${vai}"`);
          }
        }
        for (let k = 0; k < wave.length; k++) {
          const idx = wave[k];
          // Lời KHÔNG thành công trong đợt có khoá dừng nhận lỗi dừng ngay (không hỏi đối chiếu); lời đã về với
          // phản hồi JSON hợp lệ vẫn được xử lý — dữ liệu ấy đã có, không cần gọi thêm.
          const g0 = raw[k];
          if (this.stopped && !(g0 instanceof Error === false && g0.status < 400 && /json/i.test(g0.contentType))) {
            out[idx] = { ok: false, error: this.stopped };
            continue;
          }
          const role = String(reqs[idx].role);
          const goc = raw[k];
          if (goc instanceof RunStopped) {
            // Vận chuyển bảo dừng cả lượt: mỗi lời nhận đúng lỗi dừng, không thử lại; và CHỐT để các đợt sau của cùng
            // lời gọi (và mọi lời sau) không còn gửi, không nghỉ nhịp, không vống số lời (lượt xét vòng 1).
            this.stopped ??= goc;
            out[idx] = { ok: false, error: goc };
            continue;
          }
          const res = goc instanceof Error ? null : goc;
          const loiMang = goc instanceof Error ? goc.message : "";
          try {
            const verdict = await this.classify(res, ROLES[reqs[idx].role].needsSession, role);
            if (verdict === "ok") {
              this.consecutiveFailures = 0;
              out[idx] = { ok: true, value: this.parseJson<T>(res as Response, role) };
            } else {
              const failure = this.retryOrFail(verdict.ownRecord, res, role, attempts.get(idx) ?? 0, loiMang);
              if (failure) out[idx] = { ok: false, error: failure };
              else attempts.set(idx, (attempts.get(idx) ?? 0) + 1);
            }
          } catch (e) {
            out[idx] = { ok: false, error: e as Error };
          }
        }
      }
      pending = pending.filter((idx) => out[idx] === undefined);
      if (round >= RETRY_WAITS_MS.length + 1) {
        for (const idx of pending) out[idx] = { ok: false, error: new TemporaryFailure("quá số vòng thử lại") };
        break;
      }
    }
    return out as Array<ManyResult<T>>;
  }

  /**
   * Số dư điểm trên tài khoản — đọc ở máy để đối chiếu trước và sau lượt; không vào snapshot.
   * Hình dạng đo 24/11: `data.available` là số dư; các số khác trong phản hồi (đã rút, đã hết hạn, đã
   * nạp) không phải số dư. Không có trường số dư thì trả lỗi tạm, không đoán.
   */
  async readBalance(): Promise<number> {
    const body = await this.getJson<{ data?: { available?: unknown } }>("balance", {});
    const v = body?.data?.available;
    if (typeof v === "number" && Number.isFinite(v)) return v;
    throw new TemporaryFailure("không đọc được số dư (body thiếu data.available là số)");
  }
}
