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

export type Response = { status: number; contentType: string; body: string; /** Số byte của thân khi vận chuyển không trả thân chữ (tile ảnh). */ bytes?: number };
export type Transport = (url: string, headers: Record<string, string>) => Promise<Response>;
export type Caps = { calls: number; minutes: number };
export type StopReason = "blocked" | "session-expired" | "call-cap" | "time-cap" | "network-down" | "balance-spent" | "balance-unreadable";

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
const MAX_CONSECUTIVE_FAILURES = 10;

export type ClientOptions = {
  config: S17Config;
  transport: Transport;
  sleep: (ms: number) => Promise<void>;
  now: () => number;
  caps: Caps;
  /** Nhịp nghỉ trước mỗi lời gửi (ms) — trong mức nguồn đã chịu được (0,3–0,4 s/lời). */
  paceMs: number;
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
    if (this.o.now() - this.startedAt > this.o.caps.minutes * 60_000) {
      throw this.stop("time-cap", `quá trần thời gian ${this.o.caps.minutes} phút`);
    }
    if (this.calls >= this.o.caps.calls) {
      throw this.stop("call-cap", `quá trần ${this.o.caps.calls} lời gọi`);
    }
  }

  /** Gửi một lời đối chiếu, tính vào trần lời gọi. Trả phản hồi hoặc null khi lỗi mạng. */
  private async sendProbe(role: Role): Promise<Response | null> {
    this.assertRunning();
    await this.o.sleep(this.o.paceMs);
    this.calls++;
    try {
      return await this.o.transport(this.url(role, {}), this.headers);
    } catch {
      return null;
    }
  }

  /**
   * Khi một lời cần phiên gặp lỗi mạng, phải hỏi chính một lời cần phiên: nguồn trả 401 không kèm CORS nên
   * trong trang chỉ thấy lỗi mạng. Lời kiểm phiên chạy được → phiên còn sống, lỗi là của riêng bản ghi.
   * Lời kiểm phiên cũng lỗi → hỏi tiếp một lời công khai: công khai chạy mà phiên không chạy là HẾT PHIÊN;
   * cả hai lỗi là mạng hỏng. (Lượt thật 24/11: hỏi mỗi lời công khai nên đoán nhầm hết phiên ở 1.690/2.508.)
   */
  private async classifySessionFailure(roleLabel: string): Promise<"session-alive" | "network" | RunStopped> {
    if (await this.sendProbe(SESSION_PROBE_ROLE)) return "session-alive";
    if (await this.sendProbe(PROBE_ROLE)) return this.stop("session-expired", `lời cần phiên "${roleLabel}" và lời kiểm phiên đều lỗi mạng trong khi lời công khai vẫn chạy`);
    return "network";
  }

  /**
   * Gửi một lời, giữ trần và nhịp, phân loại kết quả:
   * - 403, 429 → dừng cả lượt (bị chặn); 401 → hết phiên; 2xx–4xx còn lại → trả cho người gọi xử lý;
   * - lỗi mạng hoặc 5xx: lời cần phiên được đối chiếu phiên trước (classifySessionFailure). Phiên còn sống
   *   thì lỗi là của RIÊNG bản ghi: thử lại một lần sau 5 s rồi trả lỗi tạm. Mạng hỏng thì thử lại ba lần
   *   (5 s, 15 s, 30 s). Mười lỗi tạm liền nhau → dừng cả lượt.
   */
  private async sendWithRetry(needsSession: boolean, role: string, url: string): Promise<Response> {
    for (let attempt = 0; ; attempt++) {
      this.assertRunning();
      if (attempt > 0) await this.o.sleep(RETRY_WAITS_MS[Math.min(attempt - 1, RETRY_WAITS_MS.length - 1)]);
      await this.o.sleep(this.o.paceMs);
      this.calls++;
      let res: Response | null = null;
      try {
        res = await this.o.transport(url, this.headers);
      } catch {
        res = null;
      }
      if (res && res.status === 403) {
        this.blocks++;
        throw this.stop("blocked", `nguồn trả 403 ở vai "${role}"`);
      }
      if (res && res.status === 429) {
        this.blocks++;
        throw this.stop("blocked", `nguồn trả 429 ở vai "${role}"`);
      }
      if (res && res.status === 401) throw this.stop("session-expired", `nguồn trả 401 ở vai "${role}"`);
      if (res && res.status < 500) {
        this.consecutiveFailures = 0;
        return res;
      }
      // Lỗi mạng hoặc 5xx
      let ownRecord = false; // phiên vẫn sống: lỗi thuộc về riêng bản ghi này
      if (!res && needsSession) {
        const verdict = await this.classifySessionFailure(role);
        if (verdict instanceof RunStopped) throw verdict;
        ownRecord = verdict === "session-alive";
      }
      const retriesAllowed = ownRecord ? 1 : RETRY_WAITS_MS.length;
      if (attempt >= retriesAllowed) {
        this.consecutiveFailures++;
        if (this.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
          throw this.stop("network-down", `${MAX_CONSECUTIVE_FAILURES} lời thất bại liền nhau`);
        }
        throw new TemporaryFailure(`vai "${role}" lỗi ${res ? `HTTP ${res.status}` : "mạng"} sau ${attempt} lần thử lại`);
      }
      this.retries++;
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
    const res = await this.getRaw(role, params);
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
