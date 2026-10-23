import rule from "../rules/no-raw-palette.mjs";
import { tester, assertMessages } from "../test-utils.mjs";

tester.run("no-raw-palette", rule, {
  valid: [
    { code: 'const a = <Badge variant="success-light">Đã duyệt</Badge>;' },
    { code: 'const c = "text-violet-600 dark:text-violet-400";' },
    { code: "const c = `text-${tone}-600`;" },
    { code: 'const c = "duration-200";' },
    { code: 'const c = "var(--color-violet-500)";' },
    { code: 'const c = "text-foreground bg-muted";' },
    { code: 'const c = "dark:text-slate-400";' },
  ],
  invalid: [
    {
      code: 'const a = <span className="text-emerald-600">active</span>;',
      errors: [{ messageId: "state" }],
    },
    { code: 'const c = cn("bg-blue-500");', errors: [{ messageId: "noDarkPair" }] },
    { code: 'const c = "hover:bg-red-50 text-red-600";', errors: [{ messageId: "noDarkPair" }] },
    { code: "const c = `bg-blue-500 ${x}`;", errors: [{ messageId: "noDarkPair" }] },
    // Một đơn vị chuỗi chỉ báo một lỗi dù có nhiều lớp palette.
    { code: 'const c = "bg-blue-500 text-blue-700 border-blue-200";', errors: [{ messageId: "noDarkPair" }] },
    // Dòng có từ trạng thái -> state, kể cả khi đã có cặp dark:.
    {
      code: 'const failed = "text-red-600 dark:text-red-400";',
      errors: [{ messageId: "state" }],
    },
  ],
});
assertMessages(rule, { state: "Badge variant", noDarkPair: "dark:" });
