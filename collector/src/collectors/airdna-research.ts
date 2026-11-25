import { spawn } from "node:child_process";
import { chromium, type Page } from "playwright-core";
import type { Collector, RawItem, CoverageReport } from "../core/types.js";

/**
 * AirDNA Market Research collector v2 (E2 C1 — market → submarket → listing một cây).
 *
 * Khác v1 (passive XHR khi duyệt web): v2 đọc Bearer token từ profile đã login
 * (collector/.airdna-profile/) rồi gọi thẳng explorer API theo đúng cây đã RE
 * trong docs/research/airdna-listing-api.md (survey 7-9). Giới hạn ADR-0009:
 * tài khoản trả phí của user, cap ~500 request/ngày, không phân phối lại raw.
 *
 * Env:
 *   AIRDNA_MARKETS=47,48   — override danh sách market id (mặc định theo city)
 *   AIRDNA_SUB_LISTINGS=0  — bỏ POST /submarket/{sid}/listings (đủ map_listings)
 *   AIRDNA_SUB_LIMIT=1     — giới hạn số submarket (smoke test)
 *   AIRDNA_PROFILE_DIR=…   — thư mục profile (mặc định .airdna-profile/ cạnh mã bộ thu)
 *   AIRDNA_CHROME_BIN=…    — tệp chạy Chrome cho lệnh login (mặc định Chrome ổn định của macOS)
 */
/** 2511-s02: thư mục profile — AIRDNA_PROFILE_DIR thắng (chạy từ worktree, hoặc profile gom về một gốc
 * ngoài kho theo ROADMAP mục 60); thiếu thì giữ `.airdna-profile/` cạnh mã bộ thu như trước. */
export function thuMucProfile(env: Record<string, string | undefined>, macDinh: string): string {
  return env.AIRDNA_PROFILE_DIR || macDinh;
}
const PROFILE_DIR = thuMucProfile(process.env, new URL("../../.airdna-profile/", import.meta.url).pathname);
/** Chỉ tên thư mục profile — phần đường dẫn đầy đủ không cần in ra manifest hay log. */
const TEN_PROFILE = PROFILE_DIR.replace(/\/+$/, "").split("/").pop() ?? PROFILE_DIR;
const API = "https://api.airdna.co/api/explorer";

/**
 * 2511-s02: ỨNG DỤNG TỰ CẤP LẠI PHIÊN — bộ thu chỉ ĐỌC token còn hạn từ localStorage của profile.
 * Mở đúng route dữ liệu bị trang thử thách chặn trình duyệt có kết nối gỡ lỗi (đo 24–25/11: tài liệu
 * chính trả 403 kèm cf-mitigated: challenge, `navigator.webdriver = true` cả khi bỏ --enable-automation).
 * Còn mọi đường dẫn KHÔNG phải tệp tĩnh trả bộ khung SPA (404) mà không qua thử thách; ứng dụng khởi động
 * đủ để tự gọi fetch_id_token → fetch_app_token rồi ghi token mới vào localStorage.auth. Bộ thu không tự
 * gọi API xác thực, không đọc refresh token.
 */
const APP_ORIGIN = "https://app.airdna.co";
/** Route dữ liệu của ứng dụng: bị trang thử thách với trình duyệt tự động, nhưng Chrome thường + Mạnh thì qua. */
export const DUONG_DANG_NHAP = "/data/vn";
/** Ứng viên đường dẫn để nạp bộ khung ứng dụng, theo thứ tự; route dữ liệu bị thử thách nên đứng cuối.
 * Kiểm bằng token còn hạn, không tin mã trạng thái — tệp tĩnh có thể xuất hiện sau này. */
export const DUONG_MO_UNG_DUNG = ["/favicon.ico", "/robots.txt", DUONG_DANG_NHAP];
/** Token phải còn hạn quá LỀ này mới dùng — vừa đọc xong còn kịp gọi API. */
export const LE_HAN_TOKEN_MS = 30_000;
/** Mỗi đường dẫn chờ ứng dụng tự cấp token lâu nhất bấy nhiêu. Phải rộng hơn LỀ: ứng dụng có thể chỉ cấp lại
 * SAU khi token cũ hết hạn — xấu nhất còn 29 giây khi làm mới (đo 25/11: cấp lại ~4 giây sau khi nạp).
 * Dư ra khoảng nửa phút cho một lần nạp chậm: AUTH FAIL giả là mất cả lượt đêm, còn chờ thêm thì không mất gì. */
const TRAN_CHO_TOKEN_MS = 60_000;
const BUOC_CHO_MS = 500;
/** Một lần đọc trong trang lâu nhất bấy nhiêu — renderer treo thì trả rỗng chứ không treo lượt. */
const TRAN_DOC_MS = 15_000;
const LENH_DANG_NHAP = "cd collector && npm run collect -- login --source airdna-research";

const CITY_MARKET: Record<string, string> = {
  hanoi: "47",
  hcmc: "48",
  danang: "89491",
};

const MONTHLY_METRICS = ["adr", "occupancy", "revenue", "revpar"] as const;

/** 1911-5: giải mã phần exp của JWT appToken (KHÔNG kiểm chữ ký — chỉ đọc hạn).
 * Token rỗng/không giải mã được → exp undefined; conLaiMs âm = đã hết hạn. */
export function docExpAppToken(token: string, now: number = Date.now()): { exp?: number; conLaiMs: number } {
  const phan = token.split(".")[1];
  if (!phan) return { conLaiMs: Number.NEGATIVE_INFINITY };
  try {
    const json = JSON.parse(Buffer.from(phan, "base64url").toString("utf8")) as { exp?: number };
    return { exp: json.exp, conLaiMs: json.exp ? json.exp * 1000 - now : Number.NEGATIVE_INFINITY };
  } catch {
    return { conLaiMs: Number.NEGATIVE_INFINITY };
  }
}

/** 1911-5 (MỞ LẠI): phần QUYẾT ĐỊNH tách hàm thuần (không cần trình duyệt) để đo
 * được bằng đột biến: token rỗng / hết hạn / không giải mã được exp → NÉM với đúng
 * chẩn đoán; token còn hạn → trả dòng log 'token OK …'. Chỉ được gọi qua duyetAppToken. */
export function kiemAppToken(token: string, now: number = Date.now()): string {
  if (!token) throw new Error("không đọc được appToken từ .airdna-profile — cần login lại AirDNA");
  const { exp, conLaiMs } = docExpAppToken(token, now);
  if (exp === undefined || conLaiMs <= 0) {
    const hetLuc = exp ? new Date(exp * 1000).toISOString() : "(không giải mã được exp)";
    throw new Error(`appToken ĐÃ HẾT HẠN ${hetLuc} — phiên đăng nhập trong profile cũ/không làm mới, cần đăng nhập lại ĐÚNG profile này (localStorage còn token cũ là báo xanh giả)`);
  }
  return `token OK (${token.length} chars, hết hạn sau ${Math.round(conLaiMs / 60000)} phút)`;
}

/** 1911-10: ném lỗi auth kèm dòng «AUTH FAIL [S02] <ISO>» — bộ đo độ tươi đọc
 * dòng này. Từ 2511-s02 MỌI lối ra không có token của phiên đều đi qua đây (trong
 * phienTu), không chỉ nhánh 401 sau refresh. Hàm thuần, đo được bằng đột biến bỏ dòng log. */
export function nemAuthFail(log: (...a: unknown[]) => void, loi: unknown, now: number = Date.now()): never {
  log(`AUTH FAIL [S02] ${new Date(now).toISOString()}`);
  throw loi;
}

/** 1911-10 (MỞ LẠI): TOÀN BỘ quyết định gom MỘT hàm thuần — phiên chỉ gọi hàm này
 * KHI ĐÃ CÓ token: còn hạn → log dòng OK; hỏng → nemAuthFail (in AUTH FAIL [S02] rồi
 * ném lại). Lối không có token đi nemAuthFail trực tiếp trong phienTu. Đo được bằng
 * đột biến: bỏ bước nemAuthFail → ca duyetAppToken đỏ. */
export function duyetAppToken(log: (...a: unknown[]) => void, token: string, now: number = Date.now()): string {
  try {
    const logDong = kiemAppToken(token, now);
    log(logDong);
    return logDong;
  } catch (e) {
    nemAuthFail(log, e, now);
  }
}

/** 2511-s02: lỗi XÁC THỰC (phiên chết, không cấp được token) — phải dừng CẢ LƯỢT, khác với một lời gọi
 * lỗi lẻ (mạng, 5xx). Ném từ bước làm mới thì không được để call() nuốt: không thì mỗi lời gọi nạp lại
 * ứng dụng, lượt kéo dài hàng giờ gọi vô ích. */
export class LoiXacThuc extends Error {
  constructor(nguyenNhan: unknown) {
    super(nguyenNhan instanceof Error ? nguyenNhan.message : String(nguyenNhan), { cause: nguyenNhan });
    this.name = "LoiXacThuc";
  }
}

/** 2511-s02: token đủ để dùng ngay bây giờ — còn hạn quá LỀ (hết hạn/rác → false). */
export function duDungKhong(token: string, now: number = Date.now()): boolean {
  return docExpAppToken(token, now).conLaiMs > LE_HAN_TOKEN_MS;
}

/** 2511-s02: có dùng lại token đang giữ không. Vừa bị 401 thì PHẢI ép làm mới — token trông còn hạn
 * nhưng máy chủ đã không nhận. */
export function dungLaiToken(dangGiu: string, epLamMoi: boolean, now: number = Date.now()): boolean {
  return !epLamMoi && duDungKhong(dangGiu, now);
}

export type KetQuaMo = {
  duong: string;
  /** Mã trạng thái các lời gọi xác thực mà CHÍNH ỨNG DỤNG phát ra trong lúc chờ ở đường dẫn này. */
  xacThuc: number[];
  /** Tài liệu chính của đường dẫn này có nạp được không (không bị thử thách, không lỗi đi tới). */
  khungNap: boolean;
};

/** 2511-s02b: sau một đường dẫn không có token — có thử đường kế không. Chỉ khi ứng dụng KHÔNG nạp được
 * khung ở đường dẫn này (thử thách, lỗi đi tới). Khung đã nạp mà không có token thì đường khác cũng vậy —
 * dừng để lượt thất bại ngắn và không nạp ứng dụng ba lần. */
export function thuDuongKe(ketQua: KetQuaMo): boolean {
  return !ketQua.khungNap && ketQua.xacThuc.length === 0;
}

/** 2511-s02b: chỉ nhận appToken khi là chuỗi — thiếu, số, đối tượng → rỗng; không để TypeError lọt ra
 * khỏi bước đọc rồi bị call() nuốt thành một lời gọi lỗi. */
export function chuoiAppToken(auth: unknown): string {
  const t = (auth as { appToken?: unknown } | null | undefined)?.appToken;
  return typeof t === "string" ? t : "";
}

/** 2511-s02: mọi đường dẫn đều không cho token còn hạn — nói ĐÚNG nguyên nhân để người vận hành biết
 * việc kế tiếp là đăng nhập lại (tài khoản) hay chỉ đợi (nguồn đổi phía nó).
 * `biTuChoi`: token còn hạn đã bị máy chủ từ chối mà nạp lại không nhận được token khác. */
export function chanDoanKhongCoToken(ketQua: KetQuaMo[], biTuChoi = false): string {
  const daThu = ketQua.map((k) => k.duong).join(", ") || "(chưa thử đường dẫn nào)";
  if (biTuChoi) {
    return (
      "máy chủ từ chối token còn hạn; nạp lại ứng dụng mà không nhận được token khác — dừng cả lượt" +
      ` (lặp lại ở lượt sau thì đăng nhập lại: ${LENH_DANG_NHAP})`
    );
  }
  if (ketQua.some((k) => k.xacThuc.some((s) => s === 401 || s === 403))) {
    return (
      "ứng dụng tự cấp lại nhưng BỊ TỪ CHỐI (401/403) — phiên nhiều khả năng đã hết; cần Mạnh đăng nhập lại ĐÚNG profile này" +
      ` (${LENH_DANG_NHAP})`
    );
  }
  if (ketQua.some((k) => k.xacThuc.length > 0)) {
    return `ứng dụng chạy nhưng không cấp token còn hạn trong ${TRAN_CHO_TOKEN_MS / 1000} giây (đã thử ${daThu})`;
  }
  if (ketQua.some((k) => k.khungNap)) {
    return (
      "ứng dụng nạp được khung nhưng không có token (profile chưa đăng nhập, hoặc phiên đã hết mà ứng dụng không cấp lại)" +
      ` — đăng nhập lại: ${LENH_DANG_NHAP}`
    );
  }
  return (
    `ứng dụng KHÔNG nạp được khung ở đường dẫn nào (trang thử thách hoặc lỗi mạng; đã thử ${daThu}). ` +
    `Phiên đã lâu thì đăng nhập lại: ${LENH_DANG_NHAP}`
  );
}

/** 2511-s02b: không mở được profile — thường vì còn một cửa sổ Chrome (ví dụ của lệnh login) đang giữ nó.
 * Nói thẳng việc phải làm; lỗi này đi ra dưới dạng AUTH FAIL [S02] chứ không phải một lỗi Playwright thô. */
export function chanDoanKhongMoDuocProfile(loi: unknown, tenProfile: string): string {
  const chiTiet = loi instanceof Error ? loi.message : String(loi);
  return (
    `không mở được profile ${tenProfile} — có cửa sổ Chrome nào còn mở dùng profile này không ` +
    `(ví dụ cửa sổ của lệnh login)? Đóng lại rồi chạy lượt sau (${LENH_DANG_NHAP}) · chi tiết: ${chiTiet}`
  );
}

const CHROME_MAC = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

/** 2511-s02b: tệp chạy Chrome cho lệnh login — AIRDNA_CHROME_BIN thắng (đo được, và không lệch khi đổi
 * trình duyệt theo ROADMAP mục 60); thiếu thì Chrome ổn định của macOS. */
export function duongChrome(env: Record<string, string | undefined>, macDinh: string): string {
  return env.AIRDNA_CHROME_BIN || macDinh;
}

/** 2511-s02: tham số mở Chrome THƯỜNG — không qua Playwright, không cờ tự động hoá, không kết nối gỡ lỗi —
 * với ĐÚNG profile của bộ thu, tới route dữ liệu. */
export function argsMoChromeDangNhap(profileDir: string): string[] {
  return [
    `--user-data-dir=${profileDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    `${APP_ORIGIN}${DUONG_DANG_NHAP}`,
  ];
}

/** 2511-s02: mở cửa sổ để Mạnh TỰ đăng nhập một lần khi phiên hết. Trước đây đăng nhập ba lần đều vào
 * profile khác (ROADMAP mục 60). Agent chỉ mở cửa sổ — không gõ mật khẩu, không đọc phiên. */
export async function dangNhapS02(): Promise<void> {
  await new Promise<void>((xong, loi) => {
    const tienTrinh = spawn(duongChrome(process.env, CHROME_MAC), argsMoChromeDangNhap(PROFILE_DIR), { detached: true, stdio: "ignore" });
    tienTrinh.once("error", loi);
    tienTrinh.once("spawn", () => {
      tienTrinh.unref();
      xong();
    });
  });
  console.log(`Đã mở Chrome với profile bộ thu: ${PROFILE_DIR}`);
  console.log("Mạnh tự đăng nhập trong cửa sổ đó (tick ô xác minh nếu nguồn hỏi), rồi ĐÓNG cửa sổ.");
  console.log("Bộ thu đọc phiên ở đúng profile này ở lượt kế. Chrome báo profile đang dùng → đợi lượt thu xong rồi chạy lại.");
}

type TrinhLayToken = {
  /** Token còn hạn; hết hạn hoặc bị ép thì nạp lại bộ khung ứng dụng. Không có → in AUTH FAIL [S02] rồi ném
   * LoiXacThuc (dừng cả lượt). */
  token(epLamMoi?: boolean): Promise<string>;
};

type Phien = TrinhLayToken & {
  dong(): Promise<void>;
};

/** Nạp một đường dẫn rồi chờ ứng dụng TỰ ghi token còn hạn vào localStorage. `loaiBo` là token vừa bị máy chủ
 * từ chối: còn nó thì chưa tính (cần một token KHÁC). Trả "" khi không có. Ghi quan sát vào `ketQua`. */
export type MoMotDuong = (duong: string, ketQua: KetQuaMo, loaiBo: string) => Promise<string>;

/** 2511-s02b: thử từng đường dẫn ứng viên tới khi có token. Sau một đường dẫn không có token chỉ đi tiếp khi
 * ứng dụng KHÔNG nạp được khung ở đường dẫn ấy (thử thách, lỗi đi tới): khung đã nạp mà không có token thì
 * đường khác cũng vậy — dừng để lượt thất bại ngắn và không nạp ứng dụng ba lần. Tách khỏi trình duyệt
 * để đo được hành vi. */
export async function thuDuongUngVien(
  mo: MoMotDuong,
  loaiBo = "",
  soDuong: number = DUONG_MO_UNG_DUNG.length,
): Promise<{ token: string; ketQua: KetQuaMo[] }> {
  const ketQua: KetQuaMo[] = [];
  let token = "";
  for (const duong of DUONG_MO_UNG_DUNG.slice(0, soDuong)) {
    const k: KetQuaMo = { duong, xacThuc: [], khungNap: false };
    ketQua.push(k);
    token = await mo(duong, k, loaiBo);
    if (token && token !== loaiBo) break;
    token = "";
    if (!thuDuongKe(k)) break;
  }
  return { token, ketQua };
}

/** 2511-s02b: trình lấy token, không biết gì về trình duyệt — `mo` nạp một đường dẫn. Mọi lối ra không có
 * token đều là lỗi XÁC THỰC dừng cả lượt: lỗi thường từ bước nạp cũng đổi thành LoiXacThuc, và log in đúng
 * MỘT dòng AUTH FAIL [S02]. Sau 401 (ép làm mới) chỉ nạp lại MỘT đường dẫn — đã có token là ứng dụng nạp
 * được rồi — và loại đúng token vừa bị từ chối. */
export function phienTu(mo: MoMotDuong, log: (...a: unknown[]) => void): TrinhLayToken {
  let dangGiu = "";
  return {
    async token(epLamMoi = false) {
      if (dungLaiToken(dangGiu, epLamMoi)) return dangGiu;
      const biTuChoi = epLamMoi ? dangGiu : "";
      try {
        const { token, ketQua } = await thuDuongUngVien(mo, biTuChoi, biTuChoi ? 1 : DUONG_MO_UNG_DUNG.length);
        dangGiu = token;
        // 1911-5 + 1911-10: không có token thì qua nemAuthFail (in AUTH FAIL [S02] rồi ném); có token thì
        // duyetAppToken in dòng 'token OK (… hết hạn sau n phút)'.
        if (!dangGiu) nemAuthFail(log, new LoiXacThuc(new Error(chanDoanKhongCoToken(ketQua, Boolean(biTuChoi)))));
        duyetAppToken(log, dangGiu);
        return dangGiu;
      } catch (e) {
        throw e instanceof LoiXacThuc ? e : nemAuthFail(log, new LoiXacThuc(e));
      }
    },
  };
}

/** 2511-s02: mở profile MỘT lần cho cả lượt. Giữa hai lần lấy token trang đứng ở about:blank để ứng dụng
 * không chạy nền; đến lúc cần token mới mới nạp bộ khung ứng dụng. */
async function moPhien(log: (...a: unknown[]) => void): Promise<Phien> {
  const browser = await chromium.launchPersistentContext(PROFILE_DIR, {
    channel: "chrome",
    headless: false, // Turnstile chặn headless (AGENTS.md)
    viewport: { width: 1440, height: 900 },
    locale: "en-US",
  });
  // dùng tab sẵn có của profile — không mở tab thứ hai; không lấy được tab thì đóng trình duyệt rồi ném lại
  let page: Page;
  try {
    page = browser.pages()[0] ?? (await browser.newPage());
  } catch (err) {
    await browser.close().catch(() => {});
    throw err;
  }
  /** Đọc chuỗi JSON `auth` trong trang; renderer treo thì hết giờ trả "{}" chứ không treo lượt. Giá trị phiên
   * chỉ đi trong bộ nhớ tiến trình — không in, không ghi. */
  const docAuth = () =>
    Promise.race([
      page.evaluate(() => localStorage.getItem("auth") ?? "{}").catch(() => "{}"),
      new Promise<string>((r) => setTimeout(() => r("{}"), TRAN_DOC_MS)),
    ]);
  const docToken = async (): Promise<string> => {
    try {
      return chuoiAppToken(JSON.parse(await docAuth()));
    } catch {
      return "";
    }
  };
  const moMotDuong: MoMotDuong = async (duong, ketQua, loaiBo) => {
    const bat = (r: { url(): string; status(): number }) => {
      if (/\/auth\/v1\/fetch_(?:id|app)_token/.test(r.url())) ketQua.xacThuc.push(r.status());
    };
    page.on("response", bat);
    try {
      const res = await page.goto(APP_ORIGIN + duong, { waitUntil: "domcontentloaded", timeout: 60_000 }).catch(
        (err: unknown) => {
          log(`  ✗ không nạp được ${duong}: ${err instanceof Error ? err.message : String(err)}`);
          return null;
        },
      );
      if (res === null) return "";
      const trangThai = res.status();
      // khung nạp được = có tài liệu không bị chặn (2xx/3xx, hoặc 404 của bộ khung SPA) và không phải trang thử thách
      ketQua.khungNap =
        ((trangThai >= 200 && trangThai < 400) || trangThai === 404) && res.headers()["cf-mitigated"] !== "challenge";
      const t0 = Date.now();
      // Ứng dụng có thể TỰ điều hướng trong lúc chờ (profile trống bị đưa sang trang đăng nhập) — lần đọc
      // lỗi là tạm thời: cứ đọc lại tới hết thời gian chờ.
      do {
        const token = await docToken();
        if (duDungKhong(token) && token !== loaiBo) return token;
        await new Promise((r) => setTimeout(r, BUOC_CHO_MS));
      } while (Date.now() - t0 < TRAN_CHO_TOKEN_MS);
      return "";
    } finally {
      page.off("response", bat);
      await page.goto("about:blank").catch(() => {}); // dừng ứng dụng — không chạy nền giữa hai lần lấy token
    }
  };
  return { ...phienTu(moMotDuong, log), dong: () => browser.close().catch(() => {}) };
}

type CallCtx = {
  rateLimit: { take(n?: number): Promise<void> };
  log: (...a: unknown[]) => void;
  failed: number;
  getToken: () => string;
  refreshToken: () => Promise<void>;
};

/** 1 call API = 1 rateLimit.take() (scheduler đã thêm jitter CCP) + RawItem.
 * JWT ngắn hạn (15 phút): sắp hết hạn thì làm mới TRƯỚC khi gọi (2511-s02); vẫn 401 thì
 * ép làm mới rồi thử lại một lần; vẫn 401 → throw để dừng cả run (scheduler ghi manifest lỗi).
 * Lỗi xác thực (LoiXacThuc) luôn dừng cả lượt. `fetchImpl` chỉ để test nối vào — mặc định fetch toàn cục. */
export async function call(
  method: "GET" | "POST",
  path: string,
  body: unknown,
  ctx: CallCtx,
  fetchImpl: typeof fetch = fetch,
): Promise<RawItem | null> {
  const url = `${API}${path}`;
  const doFetch = async (): Promise<Response> => {
    await ctx.rateLimit.take();
    // 2511-s02: token sắp hết hạn thì làm mới trước — một lời gọi rơi vào 401 là một tín hiệu thừa
    // gửi lên nguồn. Kiểm SAU rateLimit.take() để token được kiểm ngay trước lúc gửi.
    if (!duDungKhong(ctx.getToken())) await ctx.refreshToken();
    return fetchImpl(url, {
      method,
      headers: { "content-type": "application/json", authorization: `Bearer ${ctx.getToken()}` },
      body: method === "POST" ? JSON.stringify(body ?? {}) : undefined,
    });
  };
  try {
    let res = await doFetch();
    if (res.status === 401) {
      ctx.log(`  ↻ 401 ${path} — refresh token`);
      const biTuChoi = ctx.getToken();
      await ctx.refreshToken();
      // 2511-s02b: làm mới mà vẫn là đúng token vừa bị từ chối thì gửi lại chẳng có nghĩa — đi thẳng tới dừng
      if (ctx.getToken() !== biTuChoi) res = await doFetch();
      if (res.status === 401) {
        // 1711-1(a): dòng chuẩn máy đọc được khi xác thực hỏng — thước độ tươi làn
        // Claude đọc dòng này để báo đỏ (SLO 35 ngày không thấy lượt 401 liền).
        ctx.log(`AUTH FAIL [S02] ${new Date().toISOString()}`);
        throw new LoiXacThuc(new Error(`401 sau refresh token — dừng chạy (${path})`));
      }
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as unknown;
    ctx.log(`  ⚡ ${method} ${path}`);
    return {
      source: "airdna-research",
      sourceId: path,
      kind: "airdna-v2",
      fetchedAt: new Date().toISOString(),
      payload: { url, method, reqBody: body ?? null, data },
      meta: { apiPath: path },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // lỗi xác thực dừng CẢ LƯỢT (2511-s02); giữ cả dòng cũ để bản build nào đó còn ném Error thường
    if (err instanceof LoiXacThuc || msg.startsWith("401 sau refresh token")) throw err;
    ctx.failed++;
    ctx.log(`  ✗ ${method} ${path}: ${msg}`);
    return null;
  }
}

const monthlyBody = { filters: [], currency: "vnd", granularity: "monthly", period: 12 };

export const airdnaResearch: Collector = {
  id: "airdna-research",
  description: "AirDNA Market Research v2 — active explorer API (market → submarket → listing)",
  requestsPerSecond: 0.3,
  login: dangNhapS02,
  async collect(ctx) {
    const { city, rateLimit, log } = ctx;
    const markets = (process.env.AIRDNA_MARKETS ?? CITY_MARKET[city.id] ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!markets.length) throw new Error(`city ${city.id} chưa có mapping market id — dùng AIRDNA_MARKETS=<id>`);

    const subLimit = Number(process.env.AIRDNA_SUB_LIMIT ?? 0); // 0 = không giới hạn
    const wantSubListings = process.env.AIRDNA_SUB_LISTINGS !== "0";

    // 2511-s02: MỘT cửa sổ trình duyệt cho cả lượt; token hết hạn giữa lượt thì nạp lại bộ khung ứng dụng.
    // Không mở được profile (còn cửa sổ đăng nhập mở) → AUTH FAIL [S02] kèm việc phải làm, dừng cả lượt.
    let phien: Phien;
    try {
      phien = await moPhien(log);
    } catch (e) {
      nemAuthFail(log, new LoiXacThuc(new Error(chanDoanKhongMoDuocProfile(e, TEN_PROFILE))));
    }
    let token = "";
    const items: RawItem[] = [];
    const cctx: CallCtx = {
      rateLimit,
      log,
      failed: 0,
      getToken: () => token,
      refreshToken: async () => {
        token = await phien.token(true); // ép làm mới: sắp hết hạn hoặc vừa bị 401
      },
    };
    const methods: Record<string, number> = {};
    const push = (it: RawItem | null, kind: string) => {
      if (!it) return;
      items.push({ ...it, kind: `airdna-v2-${kind}` });
      methods[kind] = (methods[kind] ?? 0) + 1;
    };

    try {
      token = await phien.token();
      for (const m of markets) {
        log(`market ${m}:`);
        // ---- Cấp market ----
        push(await call("GET", `/v1/market/${m}`, null, cctx), "market");
        push(
          await call("POST", `/v2/market/${m}/overview/market_score`, {}, cctx),
          "score",
        );
        push(
          await call(
            "POST",
            `/v1/market/${m}/submarkets`,
            {
              filters: [],
              sort_order: "market_score",
              currency: "vnd",
              pagination: { page_size: 250, offset: 0 },
              include_geoms: false,
              compute_metrics: true,
              metrics: ["market_score"],
            },
            cctx,
          ),
          "submarkets",
        );
        for (const metric of MONTHLY_METRICS) {
          push(
            await call("POST", `/v1/market/${m}/metrics/${metric}`, monthlyBody, cctx),
            "timeseries",
          );
        }
        push(
          await call(
            "POST",
            `/v2/market/${m}/metrics/listing_count`,
            { filters: [], granularity: "monthly", period: 36 },
            cctx,
          ),
          "timeseries",
        );
        // map_listings: paginate tới hết (HCMC > 15k listings → 1 page bị cắt)
        for (let offset = 0; ; offset += 15000) {
          const it = await call(
            "POST",
            offset === 0 ? `/v1/market/${m}/map_listings` : `/v1/market/${m}/map_listings@${offset}`,
            { filters: [], currency: "vnd", sort_order: "revenue", pagination: { page_size: 15000, offset } },
            cctx,
          );
          push(it, "map-listings");
          const rows =
            ((it?.payload as { data?: { payload?: { listings?: unknown[] } } })?.data?.payload?.listings
              ?.length) ?? 0;
          if (rows < 15000) break;
        }

        // ---- Cấp submarket ----
        const subsItem = items.find(
          (it) => it.kind === "airdna-v2-submarkets" && it.meta?.apiPath === `/v1/market/${m}/submarkets`,
        );
        const subs = (subsItem?.payload as { data?: { payload?: { submarkets?: { id: number | string }[] } } })
          ?.data?.payload?.submarkets ?? [];
        const list = subLimit > 0 ? subs.slice(0, subLimit) : subs;
        log(`  ${subs.length} submarket (lấy ${list.length})`);
        for (const s of list) {
          const sid = String(s.id);
          push(await call("GET", `/v1/submarket/${sid}`, null, cctx), "submarket");
          for (const metric of MONTHLY_METRICS) {
            push(
              await call("POST", `/v1/submarket/${sid}/metrics/${metric}`, monthlyBody, cctx),
              "timeseries",
            );
          }
          push(
            await call(
              "POST",
              `/v2/submarket/${sid}/metrics/listing_count`,
              { filters: [], granularity: "monthly", period: 36 },
              cctx,
            ),
            "timeseries",
          );
          push(
            await call("POST", `/v2/submarket/${sid}/future/rates`, { filters: [], currency: "vnd", period: 6, granularity: "daily" }, cctx),
            "future-rates",
          );
          if (wantSubListings) {
            push(
              await call(
                "POST",
                `/v1/submarket/${sid}/listings`,
                { filters: [], sort_order: "revenue", currency: "vnd", pagination: { page_size: 50, offset: 0 } },
                cctx,
              ),
              "sub-listings",
            );
          }
        }
      }
    } finally {
      await phien.dong(); // đóng trình duyệt trong mọi trường hợp
    }

    const discovered = 9 * markets.length;
    log(`tổng: ${items.length} items, ${cctx.failed} lỗi`);
    return {
      items,
      coverage: {
        discovered,
        captured: items.length,
        failed: cctx.failed,
        methods,
        notes: [
        `markets: ${markets.join(",")}`,
        `token: profile ${TEN_PROFILE}`,
      ],
      },
    };
  },
};
