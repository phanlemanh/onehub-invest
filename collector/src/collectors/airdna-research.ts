import { chromium } from "playwright-core";
import { join } from "node:path";
import { homedir } from "node:os";
import type { Collector, RawItem, CoverageReport } from "../core/types.js";

/**
 * AirDNA Market Research collector (Track A — persistent profile).
 * Dùng profile riêng đã login 1 lần (~/dev/one-invest-collector/.airdna-profile/).
 * Capture XHR từ api.airdna.co/api/explorer/ khi duyệt trang VN.
 */
const PROFILE_DIR = join(homedir(), "dev", "one-invest-collector", ".airdna-profile");

export const airdnaResearch: Collector = {
  id: "airdna-research",
  description: "AirDNA Market Research — capture explorer API (persistent profile)",
  requestsPerSecond: 0.3,
  async collect(ctx) {
    const { city, rateLimit, log } = ctx;
    const items: RawItem[] = [];

    // launchPersistentContext = dùng profile có cookie login
    const browser = await chromium.launchPersistentContext(PROFILE_DIR, {
      channel: "chrome",
      headless: false,
      viewport: { width: 1440, height: 900 },
      locale: "en-US",
    });

    try {
      const page = await browser.newPage();

      // Intercept XHR từ api.airdna.co
      const captured: { url: string; body: string; kind: string }[] = [];
      page.on("response", async (res) => {
        const url = res.url();
        if (!url.includes("api.airdna.co")) return;
        try {
          const body = await res.text();
          let kind = "other";
          if (url.includes("/markets")) kind = "markets";
          else if (url.includes("/summary")) kind = "summary";
          else if (url.includes("/metrics/")) kind = "timeseries";
          else if (url.match(/\/(market|submarket)\/\d+/)) kind = "detail";
          else if (url.includes("/search/")) kind = "search";
          captured.push({ url, body, kind });
          log(`  ⚡ ${kind}: ${url.replace("https://api.airdna.co/api/explorer/", "")}`);
        } catch { /* body unreadable */ }
      });

      // B1: Country VN — bắt market list toàn quốc + summary
      await rateLimit.take();
      log("goto /data/vn (country-level)");
      await page.goto("https://app.airdna.co/data/vn", { waitUntil: "domcontentloaded", timeout: 60_000 });
      await page.waitForTimeout(8_000); // chờ XHR + render (networkidle không dùng được — telemetry liên tục)

      // B2: Market Hà Nội — bắt submarket detail
      if (city.id === "hanoi") {
        await rateLimit.take();
        log("tìm link Hà Nội…");
        const links = page.locator("a[href*='/vn/']");
        const count = await links.count();
        log(`  thấy ${count} link /vn/…`);
        for (let i = 0; i < Math.min(count, 20); i++) {
          const text = await links.nth(i).textContent().catch(() => "");
          const href = await links.nth(i).getAttribute("href").catch(() => "");
          if (text && /hanoi|hà nội/i.test(text) && href) {
            log(`  click: ${text.trim()} → ${href}`);
            await links.nth(i).click();
            await page.waitForTimeout(6_000);
            break;
          }
        }
        // Thử các tab để bắt thêm XHR
        for (const tab of ["revenue", "occupancy"]) {
          await rateLimit.take();
          const tabLink = page.locator(`a[href*='/${tab}']`).first();
          if (await tabLink.count() > 0) {
            await tabLink.click().catch(() => {});
            await page.waitForTimeout(3_000);
          }
        }
      }

      // Chuyển captured XHR thành RawItems
      for (const cap of captured) {
        // Parse JSON body — AirDNA trả JSON
        let jsonBody: unknown = null;
        try { jsonBody = JSON.parse(cap.body); } catch { jsonBody = cap.body; }
        items.push({
          source: "airdna-research",
          sourceId: cap.url.split("?")[0].split("/").slice(-2).join("/"),
          kind: `airdna-${cap.kind}`,
          fetchedAt: new Date().toISOString(),
          payload: { url: cap.url, data: jsonBody },
          meta: { city: city.id, kind: cap.kind },
        });
      }

      await browser.close();
      log(`tổng: ${items.length} XHR captured`);
      return {
        items,
        coverage: {
          discovered: captured.length,
          captured: items.length,
          failed: 0,
          methods: { webAppXHR: captured.length },
          notes: [
            `markets: ${captured.filter(c => c.kind === "markets").length}`,
            `summary: ${captured.filter(c => c.kind === "summary").length}`,
            `detail: ${captured.filter(c => c.kind === "detail").length}`,
          ],
        },
      };
    } catch (err) {
      await browser.close().catch(() => {});
      throw err;
    }
  },
};
