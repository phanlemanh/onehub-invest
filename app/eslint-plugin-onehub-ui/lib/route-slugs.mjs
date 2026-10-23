// Luật slug URL (AGENTS.md › Quy ước): mọi đoạn URL tĩnh của trang là tiếng Anh ASCII kebab-case
// và có trong dòng `Slug URL` của CONTEXT.md. Route tiếng Việt cũ chỉ sống nhờ danh sách ngoại lệ
// có hạn; đổi slug thì slug cũ phải có redirect vĩnh viễn trong app/next.config.ts.
// Hàm thuần — test truyền cây route, CONTEXT.md, next.config và ngày vào.
import { readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";

export const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Đoạn tĩnh của mọi route trang dưới appDir: [{ segment, route }]. */
export function staticSegments(appDir) {
  const out = [];
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name === "page.tsx") {
        const parts = relative(appDir, dir).split(sep).filter(Boolean);
        // Thư mục `_x` là private folder của Next.js — trang trong đó không thành route.
        if (parts.some((p) => p.startsWith("_"))) continue;
        const url = parts.filter((p) => !p.startsWith("(") && !p.startsWith("@"));
        const route = "/" + url.join("/");
        for (const p of url) if (!p.startsWith("[")) out.push({ segment: p, route });
      }
    }
  };
  walk(appDir);
  return out;
}

const ticks = (s) => [...s.matchAll(/`([^`]+)`/g)].map((m) => m[1]);

/** Đọc CONTEXT.md: dòng `- Slug URL: \`a\` · \`b\`` và `- Slug cũ: \`cu\` → \`moi\``. */
export function parseContextSlugs(md) {
  const slugs = new Set();
  const old = [];
  for (const line of md.split("\n")) {
    const s = /^\s*-\s*Slug URL:\s*(.*)$/.exec(line);
    if (s) ticks(s[1]).forEach((t) => slugs.add(t));
    const o = /^\s*-\s*Slug cũ:\s*`([^`]+)`\s*→\s*`([^`]+)`/.exec(line);
    if (o) old.push({ from: o[1], to: o[2] });
  }
  return { slugs, old };
}

/** Redirect trong next.config: [{ source, destination, permanent }]. permanent = true | statusCode 301/308. */
export function parseRedirects(text) {
  const out = [];
  for (const m of text.matchAll(/\{[^{}]*?source:\s*["'`]([^"'`]+)["'`][^{}]*?\}/g)) {
    const body = m[0];
    const dest = /destination:\s*["'`]([^"'`]+)["'`]/.exec(body);
    const perm = /permanent:\s*true/.test(body) || /statusCode:\s*30[18]\b/.test(body);
    out.push({ source: m[1], destination: dest ? dest[1] : "", permanent: perm });
  }
  return out;
}

const pathHas = (path, seg) => path.split(/[/?#]/).includes(seg);

/** Có redirect vĩnh viễn từ một đường chứa `from` sang một đường chứa `to`? */
export function hasPermanentRedirect(redirects, from, to) {
  return redirects.some((r) => r.permanent && pathHas(r.source, from) && pathHas(r.destination, to));
}

/**
 * Trả danh sách lỗi (chuỗi tiếng Việt), rỗng là xanh.
 * exceptions: [{ segment, target, until: "YYYY-MM-DD" }] — route tiếng Việt đang chạy.
 */
export function checkRouteSlugs({ segments, slugs, old, exceptions, redirects, today }) {
  const errors = [];
  const live = new Set(segments.map((s) => s.segment));
  const exc = new Map(exceptions.map((e) => [e.segment, e]));

  for (const { segment, route } of segments) {
    if (!KEBAB.test(segment)) {
      errors.push(`${route}: đoạn "${segment}" không phải ASCII kebab-case`);
    } else if (slugs.has(segment)) {
      continue;
    } else if (exc.has(segment)) {
      const e = exc.get(segment);
      if (today > e.until) errors.push(`${route}: ngoại lệ "${segment}" hết hạn ${e.until} — đổi sang "${e.target}" kèm redirect vĩnh viễn`);
    } else {
      errors.push(`${route}: đoạn "${segment}" không có trong "Slug URL" của CONTEXT.md — URL phải tiếng Anh; thêm thuật ngữ + slug vào CONTEXT.md trước`);
    }
  }

  for (const e of exceptions) {
    if (!slugs.has(e.target)) errors.push(`ngoại lệ "${e.segment}": slug đích "${e.target}" chưa có trong "Slug URL" của CONTEXT.md`);
    if (!old.some((o) => o.from === e.segment && o.to === e.target))
      errors.push(`ngoại lệ "${e.segment}" → "${e.target}" không khớp dòng "Slug cũ" nào trong CONTEXT.md`);
    if (!live.has(e.segment)) {
      errors.push(
        hasPermanentRedirect(redirects, e.segment, e.target)
          ? `ngoại lệ "${e.segment}" đã đổi xong — xoá khỏi danh sách ngoại lệ`
          : `ngoại lệ "${e.segment}" không còn route nhưng next.config.ts thiếu redirect vĩnh viễn "${e.segment}" → "${e.target}"`,
      );
    }
  }

  // Slug cũ đã đổi (không còn route, không còn ngoại lệ) vẫn phải giữ redirect: link cũ không được gãy.
  for (const o of old) {
    if (live.has(o.from) || exc.has(o.from)) continue;
    if (!hasPermanentRedirect(redirects, o.from, o.to))
      errors.push(`slug cũ "${o.from}" đã bỏ nhưng next.config.ts thiếu redirect vĩnh viễn sang "${o.to}"`);
  }
  return errors;
}
