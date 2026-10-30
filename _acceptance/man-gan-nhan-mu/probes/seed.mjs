// seed.mjs — mồi cho E3 (ui-check): lát ocp1 trên DB thử oneinvest_p4_mgn = 10 tin thật của lát (lệnh lấy mẫu thật,
// seed «e3» → 2 tin gắn trùng), xoá nhãn cũ của lát. GIA_TRI_MAU là giá trị người chấm điền vào chín ô.
import { execFileSync } from "node:child_process"
import path from "node:path"

import { ROOT, URL_THU, noiDbThu } from "./_db.mjs"

export const GIA_TRI_MAU = {
  "Ý định tin": "Tin rao", "Loại tin": "Bán", "Loại hình": "Căn hộ", "Dự án": "Vinhomes Ocean Park", "Toà": "S1",
  "Giá (khoảng)": "3,5 – 3,8 tỷ", "Diện tích": "Tin không nêu", "Phòng ngủ": "2",
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)
if (isMain) {
  const c = await noiDbThu()
  await c.query(`DELETE FROM eval_label_items WHERE lat = 'ocp1'`)
  await c.end()
  process.stdout.write(execFileSync("node", [path.join(ROOT, "pipeline/label-sample.mjs"), "--lat", "ocp1", "--n", "10", "--seed", "e3"],
    { cwd: ROOT, env: { ...process.env, DATABASE_URL: URL_THU }, encoding: "utf8" }))
}
