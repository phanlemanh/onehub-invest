// do-cu-man.tsx — phần màn của E12: lát đời trước (không stratum) mở biểu mẫu chín trường của PL7. do-cu.mjs gọi ở app/ bằng tsx.
import { renderToStaticMarkup } from "react-dom/server"

import { LabelsContent } from "../../../app/src/components/ops/labels/labels-content"

async function main() {
  const lat = process.argv[2]
  const html = renderToStaticMarkup(await LabelsContent({ user: { id: "usr_gcndocu", email: "x@gcn.test", plan: "free", role: "ops" }, lat }))
  console.log(JSON.stringify({
    chin: html.includes("Chín trường lõi"),
    khongNhom: !html.includes("data-labels-nhom") && !html.includes("data-labels-cases"),
    cauCu: html.includes("Tin không nêu"),
  }))
  process.exit(0)
}
void main()
