import { spawn } from "node:child_process";
import type { Collector, RawItem, CoverageReport } from "../core/types.js";
import { doiToken, docPhienTuProfile, khoaLocalStorage, LoiBiChan, LoiXacThuc, phanLoaiPhanHoi } from "./airdna-session.js";

/**
 * AirDNA Market Research collector v2 (E2 C1 — market → submarket → listing một cây).
 *
 * v2 đọc Bearer token từ profile đã login (collector/.airdna-profile/) rồi gọi thẳng explorer API theo
 * đúng cây đã RE trong docs/research/airdna-listing-api.md (survey 7-9). Giới hạn ADR-0009:
 * tài khoản trả phí của user, cap ~500 request/ngày, không phân phối lại raw.
 *
 * 2511-s02 — đi cửa API như các nguồn khác, KHÔNG mở trình duyệt khi thu. Phiên đọc thẳng từ kho
 * localStorage của profile trên đĩa (airdna-session.ts), rồi tra đổi lấy appToken bằng đúng hai lời ứng
 * dụng vẫn gửi. Trước đây token chỉ được cấp lại khi trình duyệt nạp được ứng dụng; route dữ liệu bị trang
 * thử thách chặn (đo 24–25/11) nên token 15 phút không cấp lại được, AUTH FAIL mỗi đêm.
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
const APP_ORIGIN = "https://app.airdna.co";
/** Khoá localStorage `auth` của ứng dụng trong profile — nơi ứng dụng giữ phiên. */
const KHOA_PHIEN = khoaLocalStorage(APP_ORIGIN, "auth");

/** Route dữ liệu của ứng dụng — lệnh login mở Chrome thường tới đây, Mạnh tự đăng nhập. */
export const DUONG_DANG_NHAP = "/data/vn";
export const LENH_DANG_NHAP = "cd collector && npm run collect -- login --source airdna-research";

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
 * dòng này; kiemAppToken ném (hết hạn/rác) phải qua đây, không chỉ nhánh 401
 * sau refresh. Hàm thuần, đo được bằng đột biến bỏ dòng log. */
export function nemAuthFail(log: (...a: unknown[]) => void, loi: unknown, now: number = Date.now()): never {
  log(`AUTH FAIL [S02] ${new Date(now).toISOString()}`);
  throw loi;
}

/** 1911-10 (MỞ LẠI): TOÀN BỘ quyết định gom MỘT hàm thuần — phiên chỉ gọi hàm này
 * KHI ĐÃ CÓ token: còn hạn → log dòng OK; hỏng → nemAuthFail (in AUTH FAIL [S02] rồi
 * ném lại). Lối không có token đi nemAuthFail trực tiếp trong trình lấy token. Đo được bằng
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

export { LoiXacThuc, LoiBiChan };

/** Token phải còn hạn quá LỀ này mới dùng — vừa đọc xong còn kịp gọi API. */
export const LE_HAN_TOKEN_MS = 30_000;

/** 2511-s02: token đủ để dùng ngay bây giờ — còn hạn quá LỀ (hết hạn/rác → false). */
export function duDungKhong(token: string, now: number = Date.now()): boolean {
  return docExpAppToken(token, now).conLaiMs > LE_HAN_TOKEN_MS;
}

/** 2511-s02: có dùng lại token đang giữ không. Vừa bị 401 thì PHẢI ép làm mới — token trông còn hạn
 * nhưng máy chủ đã không nhận. */
export function dungLaiToken(dangGiu: string, epLamMoi: boolean, now: number = Date.now()): boolean {
  return !epLamMoi && duDungKhong(dangGiu, now);
}

/** 2511-s02: profile không cho ra phiên dùng được — nói thẳng việc phải làm. */
export function chanDoanKhongCoPhien(): string {
  return `profile bộ thu chưa đăng nhập hoặc phiên đã bị xoá — Mạnh tự đăng nhập lại ĐÚNG profile này (${LENH_DANG_NHAP})`;
}

/** 2511-s02: nguồn chặn (403/429/trang thử thách) → một dòng chuẩn rồi dừng cả lượt. KHÁC AUTH FAIL: đây
 * không phải lỗi phiên, không được làm thước độ tươi báo đỏ sai việc. */
function nemBiChan(log: (...a: unknown[]) => void, thongTin: string, now: number = Date.now()): never {
  log(`BỊ CHẶN [S02] ${new Date(now).toISOString()} ${thongTin}`);
  throw new LoiBiChan(`${thongTin} — dừng cả lượt, không lách`);
}

export type TrinhLayToken = {
  /** Token còn hạn; sắp hết hạn hoặc bị ép (vừa 401) thì tra đổi mới. Không có token dùng được → in đúng MỘT dòng
   * AUTH FAIL [S02] rồi ném LoiXacThuc; bị chặn → in BỊ CHẶN [S02] rồi ném LoiBiChan; lỗi mạng → ném lỗi thường. */
  token(epLamMoi?: boolean): Promise<string>;
};

/**
 * 2511-s02: trình lấy token đi cửa API — không biết gì về đĩa hay mạng: `docPhien` đọc bản ghi phiên trên đĩa,
 * `doi` tra đổi refresh token lấy appToken. Phiên đọc đĩa MỘT lần cho cả lượt; refresh token đổi khi nguồn xoay.
 */
export function trinhTokenCuaApi(
  docPhien: () => unknown,
  doi: (refreshToken: string) => Promise<{ appToken: string; refreshToken: string }>,
  log: (...a: unknown[]) => void,
): TrinhLayToken {
  let dangGiu = "";
  let refresh: string | null = null; // null = chưa đọc đĩa lượt này
  const layMoi = async (): Promise<string> => {
    if (refresh === null) {
      let banGhi: unknown;
      try {
        banGhi = docPhien();
      } catch (e) {
        nemAuthFail(log, new LoiXacThuc(e)); // kho trên đĩa hỏng → không có phiên dùng được
      }
      const rt = (banGhi as { fusionAuthRefreshToken?: unknown } | null)?.fusionAuthRefreshToken;
      if (typeof rt !== "string" || !rt) nemAuthFail(log, new LoiXacThuc(new Error(chanDoanKhongCoPhien())));
      refresh = rt;
    }
    let kq: { appToken: string; refreshToken: string };
    try {
      kq = await doi(refresh);
    } catch (e) {
      if (e instanceof LoiBiChan) nemBiChan(log, e.message);
      if (e instanceof LoiXacThuc) nemAuthFail(log, e);
      throw e; // lỗi thường (mạng) → dừng lượt, nhưng không phải lỗi phiên
    }
    refresh = kq.refreshToken;
    // 1911-5 + 1911-10: token hết hạn/rác thì duyetAppToken in AUTH FAIL [S02] rồi ném; còn hạn thì in 'token OK (…)'
    duyetAppToken(log, kq.appToken);
    return kq.appToken;
  };
  return {
    async token(epLamMoi = false) {
      if (dungLaiToken(dangGiu, epLamMoi)) return dangGiu;
      dangGiu = ""; // token sắp hết hạn hoặc vừa bị máy chủ từ chối → không giữ nữa
      dangGiu = await layMoi();
      return dangGiu;
    },
  };
}

const CHROME_MAC = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

/** 2511-s02b: tệp chạy Chrome cho lệnh login — AIRDNA_CHROME_BIN thắng; thiếu thì Chrome ổn định của macOS. */
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

/** 2511-s02: mở cửa sổ để Mạnh TỰ đăng nhập một lần khi phiên hết. Agent chỉ mở cửa sổ — không gõ mật
 * khẩu, không đọc phiên. Sau đăng nhập, ứng dụng ghi phiên vào localStorage của profile; bộ thu đọc ở lượt kế. */
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
  console.log("Bộ thu đọc phiên ở đúng profile này ở lượt kế.");
}

type CallCtx = {
  rateLimit: { take(n?: number): Promise<void> };
  log: (...a: unknown[]) => void;
  failed: number;
  getToken: () => string;
  refreshToken: () => Promise<void>;
};

/** 1 call API = 1 rateLimit.take() (scheduler đã thêm jitter CCP) + RawItem.
 * appToken ngắn hạn (15 phút): sắp hết hạn thì làm mới TRƯỚC khi gọi; vẫn 401 thì ép làm mới rồi thử
 * lại một lần, chỉ khi đã có token KHÁC; vẫn 401 → throw để dừng cả run (scheduler ghi manifest lỗi).
 * 2511-s02: nguồn chặn (403/429/trang thử thách) → dừng cả lượt, không lách; lỗi từ bước làm mới luôn
 * dừng cả lượt (không nuốt thành một lời gọi lỗi). `fetchImpl` chỉ để test nối vào — mặc định fetch toàn cục. */
export async function call(
  method: "GET" | "POST",
  path: string,
  body: unknown,
  ctx: CallCtx,
  fetchImpl: typeof fetch = fetch,
): Promise<RawItem | null> {
  // 2511-s02: hậu tố «@offset» ở tên trang chỉ là DANH TÍNH của bản ghi (sourceId, apiPath) — không gửi lên
  // nguồn. Đo 26/11: /map_listings@15000 trả 404, trong khi cùng lời với offset nằm trong thân trả 200 và đúng
  // 15000 căn của trang kế → trang kế của mọi thị trường ≥ 15000 căn đã bị bỏ sót từ trước.
  const url = `${API}${path.replace(/@\d+$/, "")}`;
  let loiBuocLamMoi: unknown = null; // lỗi ném ra từ ctx.refreshToken() của LỜI NÀY — luôn dừng cả lượt
  const lamMoi = async (): Promise<void> => {
    try {
      await ctx.refreshToken();
    } catch (e) {
      loiBuocLamMoi = e;
      throw e;
    }
  };
  const doFetch = async (): Promise<Response> => {
    await ctx.rateLimit.take();
    // token sắp hết hạn thì làm mới trước — một lời gọi rơi vào 401 là một tín hiệu thừa gửi lên nguồn. Kiểm SAU
    // rateLimit.take() để token được kiểm ngay trước lúc gửi.
    if (!duDungKhong(ctx.getToken())) await lamMoi();
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
      await lamMoi();
      // làm mới mà vẫn là đúng token vừa bị từ chối thì gửi lại chẳng có nghĩa — đi thẳng tới dừng
      if (ctx.getToken() !== biTuChoi) res = await doFetch();
      if (res.status === 401) {
        // 1711-1(a): dòng chuẩn máy đọc được khi xác thực hỏng — thước độ tươi làn
        // Claude đọc dòng này để báo đỏ (SLO 35 ngày không thấy lượt 401 liền).
        ctx.log(`AUTH FAIL [S02] ${new Date().toISOString()}`);
        throw new LoiXacThuc(new Error(`401 sau refresh token — dừng chạy (${path})`));
      }
    }
    const loai = phanLoaiPhanHoi({
      trangThai: res.status,
      cfMitigated: res.headers.get("cf-mitigated"),
      kieuNoiDung: res.headers.get("content-type") ?? "",
    });
    // 2511-s02: bị chặn thì dừng cả lượt ngay — gửi tiếp chỉ là lách. 403 tính là chặn cả khi thân là JSON.
    if (loai === "bi-chan" || res.status === 403) nemBiChan(ctx.log, `HTTP ${res.status} ${method} ${path}`);
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
    if (err === loiBuocLamMoi || err instanceof LoiXacThuc || err instanceof LoiBiChan || msg.startsWith("401 sau refresh token")) {
      throw err; // dừng cả lượt
    }
    ctx.failed++;
    ctx.log(`  ✗ ${method} ${path}: ${msg}`);
    return null;
  }
}

const monthlyBody = { filters: [], currency: "vnd", granularity: "monthly", period: 12 };

export const airdnaResearch: Collector & { login(): Promise<void> } = {
  id: "airdna-research",
  description: "AirDNA Market Research v2 — active explorer API (market → submarket → listing)",
  // 2511-s02: 5 giây giữa hai lời (chưa kể jitter 2–15 s của scheduler) — chậm hơn trước (0,3) để an toàn
  // cho tài khoản; lượt đêm chỉ mất thêm vài phút.
  requestsPerSecond: 0.2,
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

    // 2511-s02: token lấy đi cửa API — phiên đọc trên đĩa, tra đổi bằng hai lời của ứng dụng; không mở trình duyệt.
    const trinh = trinhTokenCuaApi(
      () => docPhienTuProfile(PROFILE_DIR, KHOA_PHIEN),
      (rt) => doiToken(rt, { rateLimit, log }),
      log,
    );
    let token = await trinh.token(); // không có phiên → AUTH FAIL [S02] rồi dừng, trước lời gọi dữ liệu nào
    const items: RawItem[] = [];
    const cctx: CallCtx = {
      rateLimit,
      log,
      failed: 0,
      getToken: () => token,
      refreshToken: async () => {
        token = await trinh.token(true); // ép làm mới: sắp hết hạn hoặc vừa bị 401
      },
    };
    const methods: Record<string, number> = {};
    const push = (it: RawItem | null, kind: string) => {
      if (!it) return;
      items.push({ ...it, kind: `airdna-v2-${kind}` });
      methods[kind] = (methods[kind] ?? 0) + 1;
    };

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

    const discovered = 9 * markets.length;
    log(`tổng: ${items.length} items, ${cctx.failed} lỗi`);
    return {
      items,
      coverage: {
        discovered,
        captured: items.length,
        failed: cctx.failed,
        methods,
        notes: [`markets: ${markets.join(",")}`, `token: cửa API, phiên đọc từ profile ${TEN_PROFILE}`],
      },
    };
  },
};
