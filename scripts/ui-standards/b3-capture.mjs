#!/usr/bin/env node
// Chụp ba biểu đồ của đợt B3 (ui-clean-b3-charts) trên app đang chạy: ảnh khung ở
// sáng/tối × 1280/390, cộng một "bản chụp cấu trúc" (chữ, vai trò, nhãn aria, số phần tử
// SVG, chữ tooltip sau các thao tác) để so trước/sau mà không lẫn màu.
//
// Dùng: node scripts/ui-standards/b3-capture.mjs --out <thư mục> [--base http://localhost:3456] [--as-of <commit>]
// Ra: <out>/<trang>-<chế độ>.png (khung biểu đồ) + <out>/snapshot.json
//   snapshot.json = { structure: {...}, colors: {...} } — `structure` không chứa màu,
//   `colors` là màu tính được của chấm chú giải / nét biểu đồ.
// Cần playwright-cli đã cài toàn máy (như scripts/ui-capture.sh); mượn playwright-core đi kèm nó.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir, tmpdir } from "node:os";
import { dirname, join } from "node:path";

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const OUT = opt("out");
const BASE = opt("base", "http://localhost:3456");
if (!OUT) {
  console.error("usage: b3-capture.mjs --out <dir> [--base <url>]");
  process.exit(2);
}

function loadPlaywright() {
  const bin = realpathSync(execFileSync("which", ["playwright-cli"], { encoding: "utf8" }).trim());
  // bin = …/node_modules/@playwright/cli/<entry>; playwright-core nằm cạnh trong node_modules của cli.
  let dir = dirname(bin);
  while (!dir.endsWith("@playwright/cli") && dir !== "/") dir = dirname(dir);
  return createRequire(join(dir, "package.json"))("playwright-core");
}

// Trang có biểu đồ của đợt; mỗi khung nhận ra bằng tiêu đề.
const PAGES = [
  { id: "market", path: "/vn/hanoi", frames: ["Hiệu suất theo tháng", "Cơ cấu doanh thu"] },
  { id: "ward", path: "/vn/hanoi/hoan-kiem", frames: ["Hiệu suất theo tháng", "Cơ cấu doanh thu"] },
  { id: "yield", path: "/yield", frames: ["Doanh thu và chi phí 12 tháng tới"] },
];
const MODES = [
  { id: "light", scheme: "light", width: 1280 },
  { id: "dark", scheme: "dark", width: 1280 },
  { id: "light-390", scheme: "light", width: 390 },
  { id: "dark-390", scheme: "dark", width: 390 },
];

// Chạy trong trang: khung (Frame) chứa tiêu đề.
const FIND_FRAME = (title) => {
  const heading = [...document.querySelectorAll("[data-slot=frame-panel-title]")].find(
    (node) => node.textContent?.trim() === title
  );
  return heading?.closest("[data-slot=frame]") ?? null;
};

// Cấu trúc không màu: thẻ, vai trò, aria, chữ trực tiếp; SVG chỉ đếm theo thẻ.
function structureOf(frame) {
  const svgCounts = {};
  const walk = (node) => {
    // <style> của ChartContainer chứa biến màu: chỉ ghi là có, không ghi chữ.
    if (node.tagName === "STYLE") return { t: "style" };
    if (node.namespaceURI === "http://www.w3.org/2000/svg") {
      if (node.closest("[data-slot=chart]")) {
        svgCounts[node.tagName] = (svgCounts[node.tagName] ?? 0) + 1;
        return null;
      }
    }
    const text = [...node.childNodes]
      .filter((child) => child.nodeType === 3)
      .map((child) => child.textContent.trim())
      .filter(Boolean)
      .join(" ");
    const kids = [...node.children].map(walk).filter(Boolean);
    const entry = { t: node.tagName.toLowerCase() };
    for (const attr of ["role", "aria-label", "aria-pressed", "aria-level", "type", "data-slot"]) {
      const value = node.getAttribute(attr);
      if (value !== null) entry[attr] = value;
    }
    if (text) entry.text = text;
    if (kids.length) entry.c = kids;
    return entry;
  };
  return { tree: walk(frame), svg: svgCounts }
}

// Màu tính được: chấm/khoá nhỏ (span aria-hidden có nền) và nét/vùng có màu trong SVG.
function colorsOf(frame) {
  const dots = [...frame.querySelectorAll("span[aria-hidden=true]")]
    .map((node) => getComputedStyle(node).backgroundColor)
    .filter((color) => color && color !== "rgba(0, 0, 0, 0)");
  const marks = [...frame.querySelectorAll("[data-slot=chart] path, [data-slot=chart] rect, [data-slot=chart] circle")]
    .flatMap((node) => {
      const style = getComputedStyle(node);
      return [style.fill, style.stroke];
    })
    .filter((color) => color && color !== "none" && !color.startsWith("url"));
  return { dots: [...new Set(dots)], marks: [...new Set(marks)] };
}

const settle = (page) => page.waitForTimeout(1600);

/** Tooltip của CHÍNH khung đang thao tác (trang có hai biểu đồ Recharts). */
async function tooltipText(frame) {
  const tip = frame.locator(".recharts-tooltip-wrapper").first();
  return (await tip.count()) ? ((await tip.innerText()) || "").trim() : "";
}

/** Thao tác cố định trên khung, ghi lại chữ thấy được sau mỗi bước. */
async function interact(page, pageId, title) {
  const frame = page.locator("[data-slot=frame]", {
    has: page.locator("[data-slot=frame-panel-title]", { hasText: title }),
  }).first();
  const steps = {};
  // Donut: rê lên lát đầu tiên; đường/cột: rê giữa vùng vẽ. Tooltip rỗng là lỗi, không nuốt.
  const box = await frame.locator("[data-slot=chart]").first().boundingBox();
  if (!box) throw new Error(`không thấy vùng biểu đồ của "${title}" (${pageId})`);
  if (await frame.locator(".recharts-pie-sector").count()) {
    // Donut: thẻ <svg> chặn hover theo phần tử, nên rê theo toạ độ trên vành (bán kính 66 =
    // giữa inner 56 và outer 76 của mix-donut), thử các góc theo thứ tự cố định tới khi ra tooltip.
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    for (let deg = 0; deg < 360 && !steps.hover; deg += 30) {
      const rad = (deg * Math.PI) / 180;
      await page.mouse.move(cx + 66 * Math.cos(rad), cy - 66 * Math.sin(rad));
      await page.waitForTimeout(250);
      steps.hover = await tooltipText(frame);
    }
  } else {
    await page.mouse.move(box.x + box.width * 0.55, box.y + box.height * 0.6);
    await page.waitForTimeout(300);
    steps.hover = await tooltipText(frame);
  }
  if (!steps.hover) throw new Error(`rê chuột không ra tooltip ở "${title}" (${pageId})`);
  await page.mouse.move(0, 0);
  if (title === "Hiệu suất theo tháng") {
    await frame.getByRole("button", { name: /Công suất/ }).first().click();
    await settle(page);
    steps.afterOccupancy = (await frame.innerText()).trim();
    await frame.getByRole("radio", { name: "6 tháng" }).first().click().catch(async () => {
      await frame.getByText("6 tháng", { exact: true }).first().click();
    });
    await settle(page);
    steps.afterSixMonths = (await frame.innerText()).trim();
  }
  if (title === "Doanh thu và chi phí 12 tháng tới") {
    await frame.getByText("Quý", { exact: true }).first().click();
    await settle(page);
    steps.afterQuarter = (await frame.innerText()).trim();
  }
  if (title === "Doanh thu và chi phí 12 tháng tới") {
    // Tắt rồi bật lại mốc thuê dài hạn: chữ khung lúc tắt phải như trước.
    for (const phase of ["afterTargetOff", "afterTargetOn"]) {
      await frame.getByRole("button", { name: "Thao tác khác" }).first().click();
      await page.locator("[role=menuitemcheckbox]", { hasText: "Mốc ngang thuê dài hạn" }).first().click();
      await page.keyboard.press("Escape");
      await settle(page);
      steps[phase] = (await frame.innerText()).trim();
    }
  }
  Object.assign(steps, await menuActions(page, frame));
  return steps;
}


// Toast mới = toast chưa mang dấu đã-thấy (chữ của toast cũ đổi khi chúng xếp chồng, so chữ không tin được).
const markToasts = (page) =>
  page.evaluate(() => document.querySelectorAll("[data-sonner-toast]").forEach((t) => t.setAttribute("data-b3-seen", "")));
const newToasts = async (page) =>
  (await page.locator("[data-sonner-toast]:not([data-b3-seen])").allInnerTexts()).map((t) => t.trim());

/** Bấm lần lượt mọi mục của "Thao tác khác": tải CSV (tên tệp + sha256), sao chép (chữ toast mới). */
async function menuActions(page, frame) {
  const trigger = frame.getByRole("button", { name: "Thao tác khác" }).first();
  await trigger.click();
  await page.waitForTimeout(300);
  const menu = (await page.locator("[role=menu]").first().innerText().catch(() => "")).trim();
  const names = (await page.locator("[role=menu] [role=menuitem]").allInnerTexts()).map((t) => t.trim());
  await page.keyboard.press("Escape");
  const items = {};
  for (const name of names) {
    await trigger.click();
    await page.waitForTimeout(200);
    const item = page.locator("[role=menu] [role=menuitem]", { hasText: name }).first();
    await markToasts(page);
    if (/CSV/.test(name)) {
      const [download] = await Promise.all([page.waitForEvent("download"), item.click()]);
      const body = readFileSync(await download.path());
      items[name] = { file: download.suggestedFilename(), sha256: createHash("sha256").update(body).digest("hex") };
    } else {
      await item.click();
      items[name] = {};
    }
    await page.waitForTimeout(400);
    items[name].toast = await newToasts(page);
    await page.keyboard.press("Escape");
  }
  return { menu, menuItems: items };
}

/** Sao chép khi trình duyệt chặn clipboard (giả lập writeText bị từ chối): chữ toast lỗi của từng khung. */
async function deniedToasts(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: () => Promise.reject(new Error("bị chặn")) },
    });
  });
  const page = await context.newPage();
  const out = {};
  for (const target of PAGES) {
    await page.goto(BASE + target.path, { waitUntil: "networkidle" });
    await settle(page);
    for (const title of target.frames) {
      const frame = page.locator("[data-slot=frame]", {
        has: page.locator("[data-slot=frame-panel-title]", { hasText: title }),
      }).first();
      await frame.getByRole("button", { name: "Thao tác khác" }).first().click();
      await markToasts(page);
      await page.locator("[role=menu] [role=menuitem]", { hasText: "Sao chép tóm tắt" }).first().click();
      await page.waitForTimeout(400);
      out[`${target.id}/${title}`] = await newToasts(page);
      await page.keyboard.press("Escape");
    }
  }
  await context.close();
  return out;
}

/** Bản chromium playwright-core đòi có thể chưa tải; khi đó dùng headless shell mới nhất trong cache. */
async function launch(chromium) {
  try {
    return await chromium.launch();
  } catch (error) {
    const cache = join(homedir(), "Library/Caches/ms-playwright");
    const shell = readdirSync(cache)
      .filter((name) => name.startsWith("chromium_headless_shell-"))
      .sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1]))
      .map((name) => join(cache, name, "chrome-headless-shell-mac-arm64", "chrome-headless-shell"))
      .find((path) => existsSync(path));
    if (!shell) throw error;
    return chromium.launch({ executablePath: shell });
  }
}

const { chromium } = loadPlaywright();
mkdirSync(OUT, { recursive: true });
const browser = await launch(chromium);
// Bản chụp ghi cây app/src nó chụp trên (mã tree của git); app/src bẩn thì không có mã tree.
// Mã cây của các tệp app/src ĐANG TRÊN ĐĨA (chỉ mục tạm, không đụng chỉ mục thật).
// --as-of <commit>: khai bản chụp này là của <commit> (vd chụp "trước" sau khi tạm khôi phục
// app/src về commit gốc) — cây trên đĩa phải đúng bằng <commit>:app/src, không thì dừng.
const SELF = new URL(import.meta.url).pathname;
const ROOT = join(dirname(SELF), "..", "..");
const git = (argv, env) => execFileSync("git", argv, { cwd: ROOT, encoding: "utf8", env: { ...process.env, ...env } }).trim();
const tmpIndex = join(mkdtempSync(join(tmpdir(), "b3-index-")), "index");
git(["read-tree", "HEAD"], { GIT_INDEX_FILE: tmpIndex });
git(["add", "-A", "--", "app/src"], { GIT_INDEX_FILE: tmpIndex });
const diskTree = git(["write-tree", "--prefix=app/src/"], { GIT_INDEX_FILE: tmpIndex });
const asOf = opt("as-of", null);
const head = git(["rev-parse", asOf ?? "HEAD"]);
if (diskTree !== git(["rev-parse", `${head}:app/src`])) {
  console.error(`app/src trên đĩa (${diskTree.slice(0, 12)}) khác ${asOf ?? "HEAD"}:app/src — commit hoặc khôi phục trước khi chụp`);
  process.exit(1);
}
const snapshot = {
  base: BASE,
  at: new Date().toISOString(),
  head,
  capture_sha: createHash("sha256").update(readFileSync(SELF)).digest("hex"),
  app_src_tree: diskTree,
  structure: {},
  colors: {},
  interactions: {},
};
try {
  for (const mode of MODES) {
    const context = await browser.newContext({
      colorScheme: mode.scheme,
      viewport: { width: mode.width, height: 900 },
      deviceScaleFactor: 1,
      reducedMotion: "reduce",
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const page = await context.newPage();
    for (const target of PAGES) {
      await page.goto(BASE + target.path, { waitUntil: "networkidle" });
      await settle(page);
      for (const title of target.frames) {
        const key = `${target.id}/${title}`;
        const handle = await page.evaluateHandle(FIND_FRAME, title);
        const element = handle.asElement();
        if (!element) throw new Error(`không thấy khung "${title}" ở ${target.path} (${mode.id})`);
        const slug = title === "Cơ cấu doanh thu" ? "mix" : title.startsWith("Hiệu") ? "performance" : "pnl";
        await element.screenshot({ path: join(OUT, `${target.id}-${slug}-${mode.id}.png`) });
        snapshot.colors[`${key}@${mode.id}`] = await element.evaluate(colorsOf);
        // Cấu trúc và thao tác chỉ ghi ở 1280: cùng mã, khác bề rộng thì cây DOM vẫn vậy.
        if (mode.width === 1280) {
          const shape = await element.evaluate(structureOf);
          snapshot.structure[`${key}@${mode.scheme}`] = shape;
          if (mode.scheme === "light") snapshot.interactions[key] = await interact(page, target.id, title);
        }
      }
    }
    await context.close();
  }
  snapshot.interactions.denied = await deniedToasts(browser);
} finally {
  await browser.close();
}
writeFileSync(join(OUT, "snapshot.json"), JSON.stringify(snapshot, null, 2) + "\n");
console.log(`đã chụp ${Object.keys(snapshot.colors).length} khung → ${OUT}`);
