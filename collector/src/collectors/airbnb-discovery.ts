import { chromium } from "playwright-core";
import type { Collector, RawItem } from "../core/types.js";

type Card = { href: string; title: string | null; price: string | null };

const MAX_PAGES = Number(process.env.AIRBNB_DISCOVERY_MAX_PAGES ?? 15); // Airbnb thường ~15 trang/khu vực
const SETTLE_MS = 2500; // chờ XHR + card render đủ sau mỗi trang

/**
 * Discovery listings qua search-paging trên airbnb.com.vn (trang public).
 * Kỹ thuật (khảo sát 2026): search render client-side, phân trang cursor-based
 * (nút "Trang sau" đổi ?cursor= trong URL). Kết quả bị xáo trộn giữa các trang
 * → dedupe theo listing id. Dùng system Chrome headful (headless bị anti-bot,
 * HTTP thuần chỉ nhận shell rỗng — probe ev_f95d5775, ev_0c207c29).
 */
export const airbnbDiscovery: Collector = {
  id: "airbnb-discovery",
  description:
    "Airbnb search-paging discovery (airbnb.com.vn public, system Chrome headful, cursor pagination)",
  requestsPerSecond: 0.5, // ~1 request / 2s — kỷ luật với nguồn
  async collect(ctx) {
    const { city, rateLimit, log, checkpoint } = ctx;
    // Có thể thu theo truy vấn con (quận cụ thể) để đo coverage overlap:
    // AIRBNB_DISCOVERY_QUERY="Quận Hoàn Kiếm" npm run collect -- ...
    const query = process.env.AIRBNB_DISCOVERY_QUERY ?? city.name;
    const queryLabel = query === city.name ? "searchPaging" : `searchPaging:${query}`;
    const startUrl = `https://www.airbnb.com.vn/s/${encodeURIComponent(query)}/homes`;

    const browser = await chromium.launch({ channel: "chrome", headless: false });
    try {
      const page = await browser.newPage({
        locale: "vi-VN",
        viewport: { width: 1280, height: 800 },
      });
      await rateLimit.take();
      log("goto", startUrl);
      await page.goto(startUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await page.waitForSelector("[data-testid='card-container']", { timeout: 45_000 });
      await page.waitForTimeout(SETTLE_MS);

      const all = new Map<string, RawItem>();
      let rawTotal = 0;
      let pages = 0;
      let failed = 0;
      let noNewStreak = 0;
      let totalPages = 0; // đọc từ footer "Trang N/Tổng"

      for (;;) {
        pages++;
        let cards: Card[] = [];
        try {
          cards = await page.$$eval("[data-testid='card-container']", (els) =>
            els
              .map((el) => {
                const a = el.querySelector("a[href*='/rooms/']");
                const title =
                  el
                    .querySelector("[data-testid='listing-card-title']")
                    ?.textContent?.trim() ?? a?.getAttribute("aria-label") ?? null;
                const price =
                  el
                    .querySelector("[data-testid='price-and-discounted-price-label']")
                    ?.textContent?.trim() ?? null;
                return a
                  ? { href: a.getAttribute("href") ?? "", title, price }
                  : null;
              })
              .filter((x): x is Card => !!x),
          );
        } catch {
          failed++;
        }
        rawTotal += cards.length;

        let newIds = 0;
        for (const c of cards) {
          const id = c.href.match(/\/rooms\/(\d+)/)?.[1];
          if (!id || all.has(id)) continue;
          newIds++;
          all.set(id, {
            source: "airbnb-discovery",
            sourceId: id,
            kind: "listing-ref",
            fetchedAt: new Date().toISOString(),
            payload: { href: c.href, title: c.title, price: c.price },
            meta: { method: queryLabel, city: city.id, page: pages },
          });
        }
        log(`page ${pages}: ${cards.length} cards, +${newIds} new → total ${all.size}`);
        checkpoint.set(`page${pages}`, { cards: cards.length, newIds, total: all.size });

        // Dừng thông minh: 2 trang liên tiếp không có listing mới (xáo trộn lặp)
        if (newIds === 0) {
          if (++noNewStreak >= 2) {
            log("stop: không còn listing mới (2 trang liên tiếp)");
            break;
          }
        } else {
          noNewStreak = 0;
        }
        if (pages >= MAX_PAGES) {
          log(`stop: đạt MAX_PAGES=${MAX_PAGES}`);
          break;
        }

        // Footer pagination render lười — cuộn xuống đáy trước khi đọc
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(800);

        // Cấu trúc thật (probe 2026-10-17): trang hiện tại là BUTTON
        // aria-label="Trang N/Tổng" (disabled), trang khác là ANCHOR cùng prefix.
        if (!totalPages) {
          const cur = await page
            .locator("button[aria-label^='Trang '][disabled]")
            .first()
            .getAttribute("aria-label")
            .catch(() => null);
          totalPages = Number(cur?.match(/\/(\d+)/)?.[1] ?? 0);
          if (totalPages) log(`phát hiện ${totalPages} trang`);
        }
        if (totalPages && pages >= totalPages) {
          log("stop: hết trang theo footer");
          break;
        }
        let nextLink = page.locator(`a[aria-label^='Trang ${pages + 1}']`);
        if ((await nextLink.count()) === 0) {
          // G0-a: footer thu gọn chỉ còn "Trang cuối, trang N" — nhảy thẳng trang cuối
          const last = page.locator(`a[aria-label*='Trang cuối']`);
          if ((await last.count()) > 0) {
            const label = await last.first().getAttribute("aria-label");
            const lastPage = Number(label?.match(/(\d+)\s*$/)?.[1] ?? 0);
            if (lastPage && pages >= lastPage) {
              log("stop: đã ở trang cuối");
              break;
            }
            log(`dùng link 'Trang cuối' (trang ${lastPage})`);
            nextLink = last;
          }
        }
        if ((await nextLink.count()) === 0) {
          log("stop: không tìm thấy link trang kế");
          break;
        }
        await rateLimit.take();
        const urlBefore = page.url();
        // JS click trực tiếp — actionability click hay fail "element is outside
        // of the viewport" khi footer pagination không scrollIntoView được
        await nextLink.first().evaluate((el) => (el as HTMLElement).click());
        await page
          .waitForURL((u) => u.toString() !== urlBefore, { timeout: 30_000 })
          .catch(() => log("warn: URL chưa đổi sau click — vẫn đọc trang hiện có"));
        await page.waitForSelector("[data-testid='card-container']", { timeout: 30_000 });
        await page.waitForTimeout(SETTLE_MS);
      }
      await browser.close();

      checkpoint.set("lastRun", {
        pages,
        unique: all.size,
        rawTotal,
        at: new Date().toISOString(),
      });
      return {
        items: [...all.values()],
        coverage: {
          discovered: rawTotal,
          captured: all.size,
          failed,
          methods: { [queryLabel]: rawTotal },
          notes: [
            `${pages} trang cursor-paging, dedupe theo id (kết quả xáo trộn giữa trang)`,
          ],
        },
      };
    } catch (err) {
      await browser.close().catch(() => {});
      throw err;
    }
  },
};
