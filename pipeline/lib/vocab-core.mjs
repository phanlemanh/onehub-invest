// vocab-core.mjs — PL6 sổ từ vựng một nguồn (phần thuần: đọc sổ, kiểm khuôn).
// Sổ = khối `enums:` của pipeline/mappings.yaml theo khuôn RESO Lookup/RelatedLookup (ADR-0013 §8).
// Không I/O ở đây ngoài readMappings; CLI là pipeline/vocab.mjs.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import YAML from "yaml";

export class VocabError extends Error {
  constructor(message, axis = null, code = null) {
    super(message);
    this.name = "VocabError";
    this.axis = axis;
    this.code = code;
  }
}

const CODE_RE = /^[a-z][a-z0-9_]*$|^[A-Z][0-9]$/;

/** Đọc chuỗi YAML của mappings.yaml → Register (chưa kiểm khuôn; gọi validateRegister). */
export function loadRegister(yamlText) {
  const doc = YAML.parse(yamlText) ?? {};
  const enums = doc.enums ?? {};
  const axes = [];
  for (const [name, a] of Object.entries(enums)) {
    if (a && "values_from" in a) continue; // `source` lấy từ source_registry.code — không phải lookup của sổ
    const axisLocal = a?.local === true;
    axes.push({
      name,
      term_vi: a?.term_vi,
      dd_field: a?.dd_field ?? null,
      columns: Array.isArray(a?.columns) ? a.columns : a?.columns,
      nullable: a?.nullable === true,
      lint_keys: a?.lint_keys !== false,
      local: axisLocal,
      rationale: a?.rationale,
      checked_on: a?.checked_on,
      values: (a?.values ?? []).map((v) => ({
        code: v?.code,
        label_vi: v?.label_vi,
        dd_lookup: v?.dd_lookup,
        local: v?.local === true || (axisLocal && !v?.dd_lookup && v?.local !== false),
        localKhai: v?.local === true,
        rationale: v?.rationale ?? (axisLocal ? a?.rationale : undefined),
        checked_on: v?.checked_on ?? a?.checked_on,
      })),
    });
  }
  const allow = (doc.enums_lint_allow ?? []).map((x) => ({ path: x?.path, axis: x?.axis, reason: x?.reason }));
  const canonicalFields = Object.keys(doc.canonical?.fields ?? {});
  return { axes, allow, canonicalFields };
}

/** Kiểm khuôn sổ; ném VocabError nêu trục + code đầu tiên sai. */
export function validateRegister(reg) {
  const cotCuaTruc = new Map();
  for (const a of reg.axes) {
    const loi = (msg, code = null) => {
      throw new VocabError(`sổ từ vựng: trục ${a.name}${code != null ? ` · ${code}` : ""}: ${msg}`, a.name, code);
    };
    if (!a.term_vi) loi("thiếu term_vi");
    if (!Array.isArray(a.columns)) loi("columns phải là danh sách (có thể rỗng)");
    if (!a.values.length) loi("không có giá trị nào");
    if (a.local && !a.rationale) loi("trục local thiếu rationale");
    for (const col of a.columns) {
      if (!/^[a-z_]+\.[a-z_]+$/.test(col)) loi("cột phải dạng bảng.cột", col);
      if (cotCuaTruc.has(col)) loi(`cột đã khai ở trục ${cotCuaTruc.get(col)}`, col);
      cotCuaTruc.set(col, a.name);
    }
    const thay = new Set();
    for (const v of a.values) {
      const code = v.code;
      if (typeof code !== "string" || !CODE_RE.test(code)) loi("code sai khuôn (chữ thường snake_case hoặc mã bậc như P1)", String(code));
      if (thay.has(code)) loi("code trùng trong trục", code);
      thay.add(code);
      if (!v.label_vi) loi("thiếu label_vi", code);
      if (v.label_vi !== v.label_vi.normalize("NFC")) loi("label_vi không ở dạng NFC", code);
      if (v.localKhai && v.dd_lookup) loi("vừa dd_lookup vừa local", code);
      if (!v.dd_lookup && !v.local) loi("cần dd_lookup hoặc local: true", code);
      if (v.local && !v.rationale) loi("local thiếu rationale", code);
      if (v.local && !v.checked_on) loi("local thiếu checked_on", code);
    }
  }
  for (const x of reg.allow) {
    if (!x.path || !x.axis) throw new VocabError(`enums_lint_allow: mục thiếu path/axis (${x.path ?? "?"})`, x.axis);
  }
}

/** Đọc + kiểm sổ từ gốc kho (hoặc tệp chỉ định). */
export function readMappings(root, mappingsPath = join(root, "pipeline", "mappings.yaml")) {
  const reg = loadRegister(readFileSync(mappingsPath, "utf8"));
  validateRegister(reg);
  return reg;
}
