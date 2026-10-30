// doc-nhan.mjs — E3: in các dòng eval_labels của lượt lưu mới nhất ở lát ocp1 trên DB thử (field, giá trị, not_stated,
// labeler_id, email người gắn) để người chấm đối chiếu với chín ô vừa điền.
import { noiDbThu } from "./_db.mjs"

const c = await noiDbThu()
const { rows } = await c.query(
  `WITH moi AS (SELECT l.item_id, l.labeler_id FROM eval_labels l JOIN eval_label_items i USING (item_id)
                WHERE i.lat = 'ocp1' ORDER BY l.labeled_at DESC LIMIT 1)
   SELECT l.item_id::int, l.field, l.value, l.not_stated, l.labeler_id, u.email
   FROM eval_labels l JOIN moi USING (item_id, labeler_id) LEFT JOIN users u ON u.id = l.labeler_id ORDER BY l.field`)
for (const r of rows) console.log(`${r.item_id} ${r.field} ${r.not_stated ? "(tin khong neu)" : r.value} ${r.labeler_id} ${r.email ?? ""}`)
console.log(`${rows.length} dong`)
await c.end()
