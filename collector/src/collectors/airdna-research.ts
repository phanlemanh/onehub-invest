import { chromium } from "playwright-core";
import { moTrinhDuyet } from "../core/trinh-duyet.js";
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
 */
const PROFILE_DIR = new URL("../../.airdna-profile/", import.meta.url).pathname;
const API = "https://api.airdna.co/api/explorer";

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
 * chẩn đoán; token còn hạn → trả dòng log 'token OK …'. appToken chỉ gọi hàm này. */
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

/** 1911-10 (MỞ LẠI): TOÀN BỘ quyết định gom MỘT hàm thuần — appToken chỉ gọi hàm
 * này: còn hạn → log dòng OK; hết hạn/rác → nemAuthFail (in AUTH FAIL [S02] rồi
 * ném lại). Đo được bằng đột biến: bỏ bước nemAuthFail → ca duyetAppToken đỏ. */
export function duyetAppToken(log: (...a: unknown[]) => void, token: string, now: number = Date.now()): string {
  try {
    const logDong = kiemAppToken(token, now);
    log(logDong);
    return logDong;
  } catch (e) {
    nemAuthFail(log, e, now);
  }
}

/** Mở profile 1 lần để lấy JWT (localStorage.auth.appToken) rồi đóng ngay. */
async function appToken(log: (...a: unknown[]) => void): Promise<string> {
  // 2011-5: trình duyệt chuyên dụng qua lớp chung — ứng viên + ngăn profile chọn MỘT chỗ
  // (ONEHUB_TRINH_DUYET/ONEHUB_BROWSER_*/ONEHUB_PROFILE_GOC), ngăn "s02" ngoài kho
  const browser = await moTrinhDuyet("s02", { headless: false, locale: "en-US" });
  try {
    const page = await browser.newPage();
    await page.goto("https://app.airdna.co/data/vn", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await page.waitForTimeout(6_000);
    const token = await page.evaluate(() => {
      try {
        return JSON.parse(localStorage.getItem("auth") ?? "{}")?.appToken ?? "";
      } catch {
        return "";
      }
    });
    // 1911-5 + 1911-10: toàn bộ duyệt/từ chối (kiểm exp + AUTH FAIL khi ném)
    // nằm trong duyetAppToken — hàm thuần đo được bằng đột biến; hết hạn dừng
    // trước LỜI GỌI API nào (báo xanh giả 'token OK (327 chars)' đốt cả run 401).
    duyetAppToken(log, token);
    return token;
  } finally {
    await browser.close().catch(() => {});
  }
}

type CallCtx = {
  rateLimit: { take(n?: number): Promise<void> };
  log: (...a: unknown[]) => void;
  failed: number;
  getToken: () => string;
  refreshToken: () => Promise<void>;
};

/** 1 call API = 1 rateLimit.take() (scheduler đã thêm jitter CCP) + RawItem.
 * JWT ngắn hạn (~5 phút): gặp 401 thì mở lại profile lấy token mới, thử lại
 * một lần; vẫn 401 → throw để dừng cả run (scheduler ghi manifest lỗi). */
async function call(
  method: "GET" | "POST",
  path: string,
  body: unknown,
  ctx: CallCtx,
): Promise<RawItem | null> {
  const url = `${API}${path}`;
  const doFetch = async (): Promise<Response> => {
    await ctx.rateLimit.take();
    return fetch(url, {
      method,
      headers: { "content-type": "application/json", authorization: `Bearer ${ctx.getToken()}` },
      body: method === "POST" ? JSON.stringify(body ?? {}) : undefined,
    });
  };
  try {
    let res = await doFetch();
    if (res.status === 401) {
      ctx.log(`  ↻ 401 ${path} — refresh token`);
      await ctx.refreshToken();
      res = await doFetch();
      if (res.status === 401) {
        // 1711-1(a): dòng chuẩn máy đọc được khi xác thực hỏng — thước độ tươi làn
        // Claude đọc dòng này để báo đỏ (SLO 35 ngày không thấy lượt 401 liền).
        ctx.log(`AUTH FAIL [S02] ${new Date().toISOString()}`);
        throw new Error(`401 sau refresh token — dừng chạy (${path})`);
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
    if (msg.startsWith("401 sau refresh token")) throw err; // abort cả run
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
  async collect(ctx) {
    const { city, rateLimit, log } = ctx;
    const markets = (process.env.AIRDNA_MARKETS ?? CITY_MARKET[city.id] ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!markets.length) throw new Error(`city ${city.id} chưa có mapping market id — dùng AIRDNA_MARKETS=<id>`);

    const subLimit = Number(process.env.AIRDNA_SUB_LIMIT ?? 0); // 0 = không giới hạn
    const wantSubListings = process.env.AIRDNA_SUB_LISTINGS !== "0";

    let token = await appToken(log);
    const items: RawItem[] = [];
    const cctx: CallCtx = {
      rateLimit,
      log,
      failed: 0,
      getToken: () => token,
      refreshToken: async () => {
        token = await appToken(log);
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
        notes: [`markets: ${markets.join(",")}`, `token: profile .airdna-profile`],
      },
    };
  },
};
