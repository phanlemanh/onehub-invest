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
/** Gửi nhiều lời trong MỘT đợt (vd nhiều fetch đồng thời trong trang), lời i bắt đầu sau i × staggerMs. Mỗi phần tử: phản hồi hoặc lỗi mạng. */
export type TransportMany = (requests: Array<{ url: string; headers: Record<string, string> }>, staggerMs: number) => Promise<Array<Response | Error>>;
export type ManyResult<T> = { ok: true; value: T } | { ok: false; error: Error };
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
  | "source-error";

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

  private phanLoaiKiem(role: Role, res: Response | null): "ok" | "fail" | "unknown" {
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
        for (let k = 0; k < wave.length; k++) {
          const idx = wave[k];
          const role = String(reqs[idx].role);
          const goc = raw[k];
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
