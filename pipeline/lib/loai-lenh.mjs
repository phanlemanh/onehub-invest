// loai-lenh.mjs — 14 loại lệnh của ADR-0015 §4 (TV4 `so-lenh-bo-ap`), bằng CHECK change_requests_type_chk của 091.
// Tách khỏi lenh.mjs: danh sách có tên «review.decide», còn lenh.mjs ghi ops_audit — quét tĩnh TD-AC-8
// (app/tests/the-duyet-du-can-cu.test.tsx) giữ «chỉ route decide ghi review.decide» theo từng tệp.
export const LOAI_LENH = Object.freeze([
  "unit.create", "unit.update_meta", "unit.enable", "unit.disable", "unit.retire",
  "source.pause", "source.resume", "source.set_schedule", "source.set_slo",
  "context_rule.publish", "context_rule.retire", "coverage_target.set", "job.rerun", "review.decide",
]);
