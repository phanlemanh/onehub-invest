// visible-strings.ts — rút chuỗi hiển thị của cổng Ops bằng cây cú pháp TypeScript (ON12 AC-1, AC-2; design doc §3.1).
// Không phải tệp test. Luật rút:
//  - tệp component (.tsx/.ts ngoài src/lib): text JSX; chuỗi/template của thuộc tính hiển thị (ATTR); giá trị khoá hiển
//    thị trong object (KEY); chuỗi trong biểu thức con JSX; đối số đầu của toast.*(); trừ `className`.
//  - tệp lib trọn tệp (src/lib/*): mọi chuỗi trừ tên module, khoá object, vế so sánh, nhãn `case`, chỉ số mảng.
//  - tệp lib một phần: luật tệp component, chỉ trong thân các hàm ghim tên.
// Chữ trong <code>/<kbd> đánh dấu `inCode` (luật tiếng Anh miễn, luật _Avoid_ vẫn áp).
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import ts from "typescript"

/** Danh sách tệp quét ĐÓNG (viết tay 24/10 từ các mẫu ở design doc §3.1). */
export const SCAN_FILES = [
  "src/app/ops/collections/page.tsx",
  "src/app/ops/data-flow/page.tsx",
  "src/app/ops/deals/page.tsx",
  "src/app/ops/design/page.tsx",
  "src/app/ops/error.tsx",
  "src/app/ops/layout.tsx",
  "src/app/ops/page.tsx",
  "src/app/ops/quality/page.tsx",
  "src/app/ops/review/page.tsx",
  "src/app/ops/sources/page.tsx",
  "src/components/ops/collections-tables.tsx",
  "src/components/ops/collections/attention-list.tsx",
  "src/components/ops/collections/collections-content.tsx",
  "src/components/ops/collections/collections-tiles.tsx",
  "src/components/ops/collections/collections-view.tsx",
  "src/components/ops/collections/feed-status.ts",
  "src/components/ops/collections/feeds-grid.tsx",
  "src/components/ops/collections/jobs-grid.tsx",
  "src/components/ops/collections/lockdown-grid.tsx",
  "src/components/ops/collections/pipe-panels.tsx",
  "src/components/ops/collections/section.tsx",
  "src/components/ops/collections/status-grid.tsx",
  "src/components/ops/collections/sync-activity.tsx",
  "src/components/ops/data-flow/data-flow-content.tsx",
  "src/components/ops/data-flow/data-flow-skeleton.tsx",
  "src/components/ops/data-flow/data-flow-view.tsx",
  "src/components/ops/data-flow/flow-journey.tsx",
  "src/components/ops/data-flow/flow-readout.tsx",
  "src/components/ops/data-flow/flow-sankey-data.ts",
  "src/components/ops/data-flow/flow-sankey.tsx",
  "src/components/ops/data-flow/kind-mix-chart.tsx",
  "src/components/ops/data-flow/quality-grid.tsx",
  "src/components/ops/data-flow/quality-rows.ts",
  "src/components/ops/data-flow/record-sheet.tsx",
  "src/components/ops/data-flow/records-filter.tsx",
  "src/components/ops/data-flow/records-grid.tsx",
  "src/components/ops/data-flow/stage-face.tsx",
  "src/components/ops/data-flow/stage-trend-chart.tsx",
  "src/components/ops/data-flow/stage-trend-data.ts",
  "src/components/ops/deal-card.tsx",
  "src/components/ops/deal-seen-note.tsx",
  "src/components/ops/design/catalog-samples.tsx",
  "src/components/ops/facts-status.tsx",
  "src/components/ops/local-only-alert.tsx",
  "src/components/ops/overview/objectives-grid.tsx",
  "src/components/ops/overview/overview-tiles.tsx",
  "src/components/ops/overview/section-lead.tsx",
  "src/components/ops/overview/status.ts",
  "src/components/ops/quality-tables.tsx",
  "src/components/ops/quality/dq-checks-table.tsx",
  "src/components/ops/raw-label.tsx",
  "src/components/ops/review-card.tsx",
  "src/components/ops/review-content.tsx",
  "src/components/ops/review-photos.tsx",
  "src/components/ops/review/review-badges.tsx",
  "src/components/ops/review/review-detail-sheet.tsx",
  "src/components/ops/review/review-queue-skeleton.tsx",
  "src/components/ops/review/review-queue.tsx",
  "src/components/ops/sources/confirm-delete.tsx",
  "src/components/ops/sources/mode-dialog.tsx",
  "src/components/ops/sources/new-group-sheet.tsx",
  "src/components/ops/sources/registry-table.tsx",
  "src/components/ops/sources/so-don-vi-dialog.tsx",
  "src/components/ops/sources/so-don-vi.tsx",
  "src/components/ops/sources/source-groups.tsx",
  "src/components/ops/sources/sources-content.tsx",
  "src/components/ops/sources/zalo-account-row.tsx",
  "src/components/ops/sources/zalo-accounts.tsx",
  "src/components/ops/sources/zalo-groups-grid.tsx",
  "src/components/ops/sources/zalo-qr-dialog.tsx",
  "src/components/page/area-thumbnail.tsx",
  "src/components/page/page-header.tsx",
  "src/components/page/stat-tiles.tsx",
  "src/components/page/tiers.ts",
  "src/components/shell/nav.tsx",
  "src/components/shell/ops-shell/faces.ts",
  "src/components/shell/ops-shell/ops-header.tsx",
  "src/components/shell/ops-shell/ops-nav.ts",
  "src/components/shell/ops-shell/ops-rail.tsx",
  "src/components/shell/ops-shell/ops-shell.tsx",
  "src/components/shell/ops-shell/ops-sidebar.tsx",
  "src/components/shell/ops-shell/portal-switcher.tsx",
  "src/components/shell/ops-shell/sidebar-search.tsx",
  "src/components/shell/ops-shell/user-card.tsx",
  "src/components/states/app-crash.tsx",
  "src/components/states/not-found-state.tsx",
  "src/components/states/page-error.tsx",
  "src/components/states/page-skeleton.tsx",
  "src/components/states/region-error.tsx",
  "src/lib/dq-labels.ts",
  "src/lib/freshness.ts",
  "src/lib/market-names.ts",
  "src/lib/ops-labels.ts",
  "src/lib/source-labels.ts",
  "src/lib/collections-queries.ts",
  "src/lib/ops-queries.ts",
  "src/lib/queries.ts",
] as const

/** Tệp lib quét một phần: chỉ thân các hàm/hằng ghim tên. Hàm truy vấn đọc theo luật component (khoá hiển thị);
 *  hàm dựng chữ của freshness.ts đọc mọi chuỗi (luật lib). */
export const PARTIAL: Record<string, string[]> = {
  "src/lib/collections-queries.ts": ["readSchedulerStatus", "readRotationPreview"],
  "src/lib/ops-queries.ts": ["getLockdownStatus"],
  "src/lib/queries.ts": ["getAirdnaComparison"],
  "src/lib/freshness.ts": ["fmtOverdue", "fmtAge", "sloSummaryText", "LOCAL_ONLY_TEXT"],
}
const PARTIAL_LIB = new Set(["src/lib/freshness.ts"])

/** Khai triển các mẫu của design doc §3.1 trên cây hiện tại — so với SCAN_FILES để bắt tệp mới chưa kê. */
export function expandPatterns(app: string): string[] {
  const walk = (d: string): string[] =>
    // Tệp ẩn (`.on3-mut-…`, `.on23-mut-…`) là bản đột biến tạm của test khác chạy song song — không phải tệp của trang.
    readdirSync(join(app, d)).filter((f) => !f.startsWith(".")).flatMap((f) => {
      const p = join(d, f)
      return statSync(join(app, p)).isDirectory() ? walk(p) : /\.tsx?$/.test(f) ? [p] : []
    })
  const flat = (d: string) => readdirSync(join(app, d)).filter((f) => !f.startsWith(".") && /\.tsx?$/.test(f)).map((f) => join(d, f))
  return [
    ...walk("src/app/ops"),
    ...walk("src/components/ops"),
    ...flat("src/components/shell/ops-shell"),
    "src/components/shell/nav.tsx",
    ...flat("src/components/page"),
    ...flat("src/components/states"),
    "src/lib/dq-labels.ts",
    "src/lib/market-names.ts",
    "src/lib/ops-labels.ts",
    "src/lib/source-labels.ts",
    ...Object.keys(PARTIAL),
  ].map((p) => relative(".", p))
}

const ATTR = new Set(["title", "aria-label", "alt", "placeholder", "label", "description", "footnote", "header", "heading", "caption", "tooltip", "emptyText", "message", "aria-description"])
/** Prop kỹ thuật của component — không phải chữ. Prop khác của component viết hoa mang chữ có khoảng trắng hay chữ có
 *  dấu thì tính là chữ hiển thị (vd `basis`, `period` của StatCard). */
const ATTR_SKIP = new Set(["className", "variant", "size", "href", "id", "key", "type", "name", "role", "side", "align", "value", "src", "rel", "target", "tone", "spacing", "mode", "orientation", "dir", "htmlFor", "autoComplete", "inputMode", "loading", "sizes", "method", "action", "form", "accessorKey", "defaultValue", "layout", "color", "kind", "state", "status", "format", "unit", "fill", "stroke", "dataKey", "stackId", "aria-keyshortcuts"])
const KEY = new Set(["title", "label", "description", "footer", "footnote", "header", "metric", "desc", "schedule", "message", "subtitle", "hint", "empty", "note", "detail"])

export type VisibleString = { line: number; text: string; inCode: boolean }

const strOf = (n: ts.Node): string | null =>
  ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)
    ? n.text
    : ts.isTemplateExpression(n)
      ? n.head.text + n.templateSpans.map((s) => " " + s.literal.text).join("")
      : null

export function visibleStrings(file: string, src: string): VisibleString[] {
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  const out: VisibleString[] = []
  const lineOf = (n: ts.Node) => sf.getLineAndCharacterOfPosition(n.getStart()).line + 1
  const inCode = (n: ts.Node) => {
    for (let p = n.parent; p; p = p.parent) if (ts.isJsxElement(p) && ["code", "kbd"].includes(p.openingElement.tagName.getText())) return true
    return false
  }
  const inClassName = (n: ts.Node) => {
    for (let p = n.parent; p; p = p.parent) if (ts.isJsxAttribute(p)) return p.name.getText() === "className"
    return false
  }
  const add = (n: ts.Node, text: string) => {
    const t = text.replace(/\s+/g, " ").trim()
    if (t && /\p{L}/u.test(t)) out.push({ line: lineOf(n), text: t, inCode: inCode(n) })
  }
  const collect = (e: ts.Node): void => {
    const s = strOf(e)
    if (s !== null) return add(e, s)
    if (ts.isConditionalExpression(e)) {
      collect(e.whenTrue)
      collect(e.whenFalse)
    } else if (ts.isBinaryExpression(e) && ["??", "||", "&&", "+"].includes(e.operatorToken.getText())) {
      collect(e.left)
      collect(e.right)
    } else if (ts.isParenthesizedExpression(e) || ts.isAsExpression(e)) collect(e.expression)
    else if (ts.isArrayLiteralExpression(e)) e.elements.forEach(collect)
  }

  const libWhole = file.startsWith("src/lib/") && !PARTIAL[file]
  const fnRoots: ts.Node[] = []
  if (PARTIAL[file]) {
    const names = new Set(PARTIAL[file])
    const found = new Set<string>()
    const find = (n: ts.Node) => {
      if (ts.isFunctionDeclaration(n) && n.name && names.has(n.name.text)) {
        fnRoots.push(n)
        found.add(n.name.text)
      } else if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && names.has(n.name.text) && n.initializer) {
        fnRoots.push(n.initializer)
        found.add(n.name.text)
      }
      ts.forEachChild(n, find)
    }
    find(sf)
    for (const want of PARTIAL[file]) if (!found.has(want)) throw new Error(`${file}: không thấy hàm ghim tên ${want}`)
  }

  const visitUi = (n: ts.Node): void => {
    if (ts.isJsxText(n)) add(n, n.text)
    else if (ts.isJsxAttribute(n) && ATTR.has(n.name.getText()) && n.initializer) {
      const i = n.initializer
      const s = strOf(i)
      if (s !== null) add(n, s)
      else if (ts.isJsxExpression(i) && i.expression) collect(i.expression)
    } else if (
      ts.isJsxAttribute(n) &&
      !ATTR_SKIP.has(n.name.getText()) &&
      !n.name.getText().startsWith("data-") &&
      /^[A-Z]/.test((n.parent.parent as ts.JsxOpeningLikeElement).tagName?.getText() ?? "") &&
      n.initializer
    ) {
      const i = n.initializer
      const coChu = (t: string) => /\s|[^\x00-\x7f]/.test(t.trim())
      const s = strOf(i)
      if (s !== null) {
        if (coChu(s)) add(n, s)
      } else if (ts.isJsxExpression(i) && i.expression) {
        const truoc = out.length
        collect(i.expression)
        for (let k = out.length - 1; k >= truoc; k--) if (!coChu(out[k].text)) out.splice(k, 1)
      }
    } else if (ts.isPropertyAssignment(n) && KEY.has(n.name.getText().replace(/["']/g, ""))) collect(n.initializer)
    else if (ts.isPropertyAssignment(n) && strOf(n.initializer) !== null && /[^\x00-\x7f]/.test(strOf(n.initializer)!)) add(n, strOf(n.initializer)!)
    else if (ts.isJsxExpression(n) && n.parent && (ts.isJsxElement(n.parent) || ts.isJsxFragment(n.parent)) && n.expression && !inClassName(n)) collect(n.expression)
    else if (ts.isCallExpression(n) && /^toast(\.\w+)?$/.test(n.expression.getText()) && n.arguments[0]) collect(n.arguments[0])
    ts.forEachChild(n, visitUi)
  }

  const visitLib = (n: ts.Node): void => {
    const s = strOf(n)
    if (s !== null) {
      const p = n.parent
      const skip =
        ts.isImportDeclaration(p) ||
        ts.isExportDeclaration(p) ||
        (ts.isPropertyAssignment(p) && p.name === n) ||
        (ts.isBinaryExpression(p) && ["===", "!==", "==", "!="].includes(p.operatorToken.getText())) ||
        ts.isCaseClause(p) ||
        ts.isElementAccessExpression(p) ||
        ts.isLiteralTypeNode(p) ||
        (ts.isCallExpression(p) && /(^|\.)(query|test|match|replace|startsWith|endsWith|includes|split|join|get|has)$/.test(p.expression.getText()))
      if (!skip) add(n, s)
    }
    ts.forEachChild(n, visitLib)
  }

  if (libWhole) visitLib(sf)
  else if (fnRoots.length) fnRoots.forEach(PARTIAL_LIB.has(file) ? visitLib : visitUi)
  else visitUi(sf)
  return out
}

export function readScan(app: string, file: string): VisibleString[] {
  return visibleStrings(file, readFileSync(join(app, file), "utf8"))
}
