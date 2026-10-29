// _render.mts — chạy TRONG app/ (`cd app && node --import tsx ../_acceptance/so-cuoc-goi-ai/probes/_render.mts <mode>`):
// dựng trang /ops/ai-calls phía máy chủ bằng đúng getAiCalls + AiCallsView của app, in JSON {nhom, tong, state, html}.
// DATABASE_URL (và VERCEL=1 cho chế độ máy chủ) do đầu dò đặt.
import { createRequire } from "node:module"
import path from "node:path"

// react nằm ở app/node_modules — nạp theo gốc app (tệp này nằm ngoài app/).
const req = createRequire(path.join(process.cwd(), "package.json"))
const { createElement } = req("react")
const { renderToStaticMarkup } = req("react-dom/server")

import { AiCallsView } from "../../../app/src/components/ops/ai-calls/ai-calls-view"
import { getAiCalls } from "../../../app/src/lib/ai-calls-queries"

const mode = process.argv[2] === "cloud" ? "cloud" : "local"
const data = await getAiCalls({ mode })
const html = renderToStaticMarkup(createElement(AiCallsView, { data }))
console.log(JSON.stringify({ state: data.state, nhom: data.nhom, tong: data.tong, html }))
process.exit(0)
