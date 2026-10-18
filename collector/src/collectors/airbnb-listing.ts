import { readdir, readFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import { join } from "node:path";
import { chromium } from "playwright-core";
import type { Collector, RawItem } from "../core/types.js";

/**
 * Chi tiết listing + calendar 12 tháng từ trang /rooms/<id> (public).
 * Bắt 3 nguồn mỗi trang (kỹ thuật Scrapfly 2026):
 *  1. #data-deferred-state-0  — JSON nhúng: chi tiết listing
 *  2. XHR StaysPdpSections     — giá khi có check_in/check_out
 *  3. XHR PdpAvailabilityCalendar — availability 12 tháng theo ngày
 *
 * ID đầu vào lấy từ snapshot airbnb-discovery mới nhất của cùng city;
 * checkpoint ghi các id đã fetch → mỗi lần chạy xử lý một batch (resume được).
 */
const BATCH = Number(process.env.AIRBNB_LISTING_BATCH ?? 25);
const NAV_TIMEOUT = 45_000;

export const airbnbListing: Collector = {
  id: "airbnb-listing",
  description:
    "Listing details + 12-month calendar (airbnb.com.vn /rooms, system Chrome headful, batch + resume)",
  requestsPerSecond: 0.35, // trang listing nặng hơn search
  async collect(ctx) {
    const { city, rateLimit, log, checkpoint, paths } = ctx;

    // ---- Đọc ID từ snapshot discovery mới nhất ----
    const cityDir = join(paths.snapshotRoot, city.id);
    const dirs = (await readdir(cityDir).catch(() => [] as string[]))
      .filter((d) => d.startsWith(`${city.id}__airbnb-discovery__`))
      .sort();
    if (dirs.length === 0) throw new Error(`không có snapshot airbnb-discovery cho ${city.id}`);
    const discoveryDir = join(cityDir, dirs[dirs.length - 1]);

    const ids = new Set<string>();
    for (const f of (await readdir(discoveryDir)).filter((f) => f.startsWith("items-"))) {
      const batch: RawItem[] = JSON.parse(
        gunzipSync(await readFile(join(discoveryDir, f))).toString("utf8"),
      );
      for (const it of batch) ids.add(it.sourceId);
    }
    const doneIds = new Set<string>(checkpoint.get<string[]>("doneIds") ?? []);
    const todo = [...ids].filter((id) => !doneIds.has(id));
    log(`discovery=${ids.size} (từ ${dirs[dirs.length - 1]}), đã fetch=${doneIds.size}, còn=${todo.length}`);
    if (todo.length === 0) {
      return {
        items: [],
        coverage: {
          discovered: ids.size,
          captured: 0,
          failed: 0,
          methods: { roomsPage: 0 },
          notes: ["đã fetch hết — không còn việc"],
        },
      };
    }

    // Cửa sổ ngày để giá resolve (Scrapfly: không ngày → không giá). Nếu window
    // mặc định hết chỗ → trang KHÔNG có giá (đã verify 22/25 listings hụt) →
    // đọc calendar, tự tìm 2 đêm available đầu tiên rồi load lại với window đó.
    const defaultCi = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
    const defaultCo = new Date(Date.now() + 32 * 864e5).toISOString().slice(0, 10);

    const browser = await chromium.launch({ channel: "chrome", headless: false });
    const page = await browser.newPage({
      locale: "vi-VN",
      viewport: { width: 1280, height: 800 },
    });
    const items: RawItem[] = [];
    let failed = 0;
    let hasCalendar = 0;
    let hasPrice = 0;
    let retried = 0;
    const batch = todo.slice(0, BATCH);

    /** Một lượt goto + bắt 3 nguồn. */
    const fetchOnce = async (
      id: string,
      ci: string,
      co: string,
    ): Promise<{ url: string; state: unknown; pdp: unknown; cal: unknown }> => {
      const url = `https://www.airbnb.com.vn/rooms/${id}?adults=1&check_in=${ci}&check_out=${co}`;
      await rateLimit.take();
      const pdpP = page
        .waitForResponse((r) => r.url().includes("StaysPdpSections"), { timeout: 20_000 })
        .catch(() => null);
      const calP = page
        .waitForResponse((r) => r.url().includes("PdpAvailabilityCalendar"), { timeout: 25_000 })
        .catch(() => null);
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT });
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)).catch(() => {});
      const [pdpR, calR] = await Promise.all([pdpP, calP]);
      const stateText = await page
        .$eval("#data-deferred-state-0", (el) => el.textContent)
        .catch(() => null);
      let stateJson: unknown = null;
      try {
        stateJson = stateText ? JSON.parse(stateText) : null;
      } catch {
        stateJson = null;
      }
      return {
        url,
        state: stateJson,
        pdp: pdpR ? await pdpR.json().catch(() => null) : null,
        cal: calR ? await calR.json().catch(() => null) : null,
      };
    };

    const priceOf = (pdp: unknown): string | null => {
      // Hai variant quan sát được: structuredDisplayPrice có "discountedPrice",
      // hoặc primaryLine chỉ có "price"/"priceString" (đều là "640.000 ₫").
      const s = String(JSON.stringify(pdp ?? null));
      const m = s.match(/"(?:discountedPrice|priceString|price)":"([\d.,\s]+₫[^"]{0,8})"/);
      return m ? m[1] : null;
    };

    /** Tìm 2 đêm liền kề còn trống đầu tiên trong calendar (từ hôm nay +7). */
    const firstWindow = (cal: unknown): { ci: string; co: string } | null => {
      const months =
        (cal as any)?.data?.node?.pdpAvailabilityCalendar?.calendarMonths ?? [];
      const days = ([] as any[]).concat(...months.map((m: any) => m.days ?? []));
      const minDate = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
      for (let i = 0; i + 1 < days.length; i++) {
        if (days[i].available && days[i + 1].available) {
          if (days[i].calendarDate >= minDate) {
            return { ci: days[i].calendarDate, co: days[i + 1].calendarDate };
          }
        }
      }
      return null;
    };

    try {
      for (let i = 0; i < batch.length; i++) {
        const id = batch[i];
        try {
          let r = await fetchOnce(id, defaultCi, defaultCo);
          let pdpStr = priceOf(r.pdp);
          if (!pdpStr && r.cal) {
            // window mặc định hết chỗ → thử window available từ calendar
            const w = firstWindow(r.cal);
            if (w) {
              retried++;
              const r2 = await fetchOnce(id, w.ci, w.co);
              const p2 = priceOf(r2.pdp);
              if (p2) {
                pdpStr = p2;
                r = { ...r2, cal: r2.cal ?? r.cal };
              }
            }
          }
          if (!r.state && !r.pdp && !r.cal) throw new Error("không bắt được nguồn nào");
          if (r.cal) hasCalendar++;
          if (pdpStr) hasPrice++;
          items.push({
            source: "airbnb-listing",
            sourceId: id,
            kind: "listing",
            fetchedAt: new Date().toISOString(),
            payload: { url: r.url, deferredState: r.state, pdpSections: r.pdp, calendar: r.cal },
            meta: {
              discoverySnapshot: dirs[dirs.length - 1],
              hasState: !!r.state,
              hasPdp: !!r.pdp,
              hasCalendar: !!r.cal,
              hasPrice: !!pdpStr,
            },
          });
          doneIds.add(id);
          log(
            `[${i + 1}/${batch.length}] ${id}: state=${!!r.state} cal=${!!r.cal} price=${pdpStr ?? "—"}`,
          );
        } catch (err) {
          failed++;
          log(`[${i + 1}/${batch.length}] ${id}: FAIL ${err instanceof Error ? err.message : err}`);
        }
        // checkpoint định kỳ để đứt giữa chừng không mất tiến độ
        if ((i + 1) % 10 === 0) {
          checkpoint.set("doneIds", [...doneIds]);
          await checkpoint.save();
        }
      }
      await browser.close();
    } catch (err) {
      await browser.close().catch(() => {});
      throw err;
    }

    checkpoint.set("doneIds", [...doneIds]);
    const remaining = ids.size - doneIds.size;
    return {
      items,
      coverage: {
        discovered: ids.size,
        captured: items.length,
        failed,
        methods: { roomsPage: batch.length },
        notes: [
          `batch ${batch.length}/${todo.length} còn lại; còn ${remaining} id cho lần chạy sau`,
          `calendar: ${hasCalendar}/${items.length} · giá: ${hasPrice}/${items.length} (retry window: ${retried})`,
        ],
      },
    };
  },
};
