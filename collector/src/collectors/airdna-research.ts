import { chromium } from "playwright-core";
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

/** Mở profile 1 lần để lấy JWT (localStorage.auth.appToken) rồi đóng ngay. */
async function appToken(log: (...a: unknown[]) => void): Promise<string> {
  const browser = await chromium.launchPersistentContext(PROFILE_DIR, {
    channel: "chrome",
    headless: false, // Turnstile chặn headless (AGENTS.md)
    viewport: { width: 1440, height: 900 },
    locale: "en-US",
  });
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
    if (!token) throw new Error("không đọc được appToken từ .airdna-profile — cần login lại AirDNA");
    log(`token OK (${token.length} chars)`);
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
      if (res.status === 401) throw new Error(`401 sau refresh token — dừng chạy (${path})`);
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
