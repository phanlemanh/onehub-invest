// luoc-do-rieng.mjs — cho test DB chạy song song (hồ sơ app-test-chiu-song-song; khuôn từ sd3-test-chiu-song-song).
// Trong giao dịch sẽ ROLLBACK: dựng một lược đồ riêng, chép RỖNG các bảng cần dùng (dựng từ catalog: cột, kiểu, NOT NULL, mặc
// định, CHECK/PK/UNIQUE, chỉ mục cùng tên; mặc định nextval trỏ dãy riêng) rồi đặt search_path vào đó trước public. Câu SQL
// không gắn schema của mã đang test sẽ đọc/ghi bản riêng — không xếp hàng khoá tư vấn 33033 dùng chung, không khoá dòng
// hay DDL trên bảng public. Không chép trigger, khoá ngoại, RLS, dữ liệu.

let soLuocDo = 0;

/** ACCESS SHARE trên mọi bảng nguồn trong MỘT câu NOWAIT; bị ca DDL khác chặn thì nhả hết, chờ 100 ms rồi thử lại — không
 * bao giờ vừa giữ vừa chờ (không vào vòng deadlock), chỉ chờ đúng lúc ca DDL ấy còn chạy. Trả số lần thử lại. */
export async function khoaNguon(c, bang, { toiDa = 1000 } = {}) {
  const ds = bang.map((t) => `public.${t}`).join(", ");
  for (let lan = 0; ; lan++) {
    await c.query("SAVEPOINT khoa_nguon");
    try {
      await c.query(`LOCK TABLE ${ds} IN ACCESS SHARE MODE NOWAIT`);
      await c.query("RELEASE SAVEPOINT khoa_nguon");
      return lan;
    } catch (e) {
      await c.query("ROLLBACK TO SAVEPOINT khoa_nguon");
      if (e.code !== "55P03" || lan >= toiDa) throw e; // 55P03 lock_not_available
      await new Promise((r) => setTimeout(r, 100));
    }
  }
}

/** CREATE TABLE <sc>.<t> rỗng dựng từ catalog của public.<t>. Gọi SAU khoaNguon (đọc định nghĩa cần ACCESS SHARE). */
export async function chepBang(c, sc, t) {
  const oid = (await c.query(`SELECT c.oid FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = $1 AND c.relkind IN ('r', 'p')`, [t])).rows[0]?.oid;
  if (!oid) throw new Error(`luoc-do-rieng: public.${t} không phải bảng (hoặc không có)`);
  const cot = (await c.query(`SELECT a.attname AS ten, format_type(a.atttypid, a.atttypmod) AS kieu, a.attnotnull AS nn,
      a.attgenerated AS sinh, pg_get_expr(d.adbin, 0) AS md
    FROM pg_attribute a LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
    WHERE a.attrelid = $1 AND a.attnum > 0 AND NOT a.attisdropped ORDER BY a.attnum`, [oid])).rows;
  const day = [];
  const dong = cot.map((x) => {
    let md = x.md;
    const seq = md?.match(/^nextval\('([^']+)'::regclass\)$/);
    if (seq) {
      const ten = `${sc}.${seq[1].replace(/^.*\./, "").replace(/"/g, "")}`;
      day.push(ten);
      md = `nextval('${ten}'::regclass)`;
    }
    const ct = x.sinh === "s" ? ` GENERATED ALWAYS AS (${md}) STORED` : md ? ` DEFAULT ${md}` : "";
    return `"${x.ten}" ${x.kieu}${x.nn ? " NOT NULL" : ""}${ct}`;
  });
  const rb = (await c.query(`SELECT conname AS ten, pg_get_constraintdef(oid) AS d FROM pg_constraint
    WHERE conrelid = $1 AND contype IN ('c', 'p', 'u')`, [oid])).rows.map((r) => `CONSTRAINT "${r.ten}" ${r.d}`);
  for (const d of day) await c.query(`CREATE SEQUENCE ${d}`);
  await c.query(`CREATE TABLE ${sc}.${t} (${[...dong, ...rb].join(", ")})`);
  const idx = await c.query(`SELECT pg_get_indexdef(i.indexrelid) AS d FROM pg_index i
    WHERE i.indrelid = $1 AND NOT EXISTS (SELECT 1 FROM pg_constraint k WHERE k.conindid = i.indexrelid)`, [oid]);
  for (const { d } of idx.rows) await c.query(d.replace(` ON public.${t} `, ` ON ${sc}.${t} `));
}

/**
 * Lược đồ riêng trong giao dịch đang mở của `c`: chép rỗng `bang`, đặt `search_path = <sc>, public` (SET LOCAL — hết khi
 * giao dịch kết thúc). Trả tên lược đồ. View hay hàm cần dựng lại trên bản riêng thì người gọi tự chạy sau đó (search_path
 * đã trỏ vào bản riêng).
 * @param {import("pg").Client} c @param {string[]} bang @param {{tienTo?: string}} [o]
 */
export async function luocDoRieng(c, bang, { tienTo = "ldr" } = {}) {
  const sc = `${tienTo}_${process.pid}_${++soLuocDo}`;
  await c.query(`CREATE SCHEMA ${sc}`);
  await khoaNguon(c, bang);
  for (const t of bang) await chepBang(c, sc, t);
  await c.query(`SET LOCAL search_path = ${sc}, public`);
  return sc;
}
