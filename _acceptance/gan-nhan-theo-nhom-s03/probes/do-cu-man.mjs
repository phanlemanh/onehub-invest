// do-cu-man.mjs — phần màn của E12: lát đời trước (không stratum) mở biểu mẫu chín trường của PL7. do-cu.mjs gọi ở app/ bằng tsx.
import { createRequire } from "node:module"
import path from "node:path"
import { pathToFileURL } from "node:url"

import { ROOT } from "./_db.mjs"

const tuApp = createRequire(path.join(ROOT, "app/package.json"))
const { renderToStaticMarkup } = await import(pathToFileURL(tuApp.resolve("react-dom/server")).href)
const { LabelsContent } = await import(pathToFileURL(path.join(ROOT, "app/src/components/ops/labels/labels-content.tsx")).href)

const lat = process.argv[2]
const html = renderToStaticMarkup(await LabelsContent({ user: { id: "usr_gcndocu", email: "x@gcn.test", plan: "free", role: "ops" }, lat }))
console.log(JSON.stringify({
  chin: html.includes("Chín trường lõi"),
  khongNhom: !html.includes("data-labels-nhom") && !html.includes("data-labels-cases"),
  cauCu: html.includes("Tin không nêu"),
}))
process.exit(0)
