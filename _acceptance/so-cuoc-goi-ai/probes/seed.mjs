// seed.mjs — mồi dòng `sca-mau-*` cho ui-check E6 vào DB thử (DATABASE_URL BẮT BUỘC, không được là DB `oneinvest`).
//   DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p4_sca_facts node seed.mjs        mồi
//   DATABASE_URL=… node seed.mjs --don                                                                    dọn
// Dev server cho ui-check chạy với cùng DATABASE_URL (cổng riêng, vd 3463), mở /ops/ai-calls.
import { MIGRATION, mau, moi, pg } from "./_db.mjs"
const url = process.env.DATABASE_URL
if (!url || /\/oneinvest(\?|$)/.test(url)) { console.error("seed: DATABASE_URL phải trỏ DB thử, không phải oneinvest"); process.exit(2) }
const c = new pg.Client({ connectionString: url })
await c.connect()
await c.query(MIGRATION)
await c.query("delete from ai_calls where viec like 'sca-mau-%'")
if (!process.argv.includes("--don")) await moi(c, mau())
console.log(process.argv.includes("--don") ? "seed: đã dọn sca-mau-*" : "seed: đã mồi 5 cuộc sca-mau-*")
await c.end()
