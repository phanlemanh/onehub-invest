import rule from "../rules/no-native-dialogs.mjs";
import { tester, assertMessages } from "../test-utils.mjs";

tester.run("no-native-dialogs", rule, {
  valid: [
    { code: "toast('x');" },
    { code: "const a = <AlertDialog />;" },
    { code: "const c = 'fixed bottom-0 inset-x-0';" },
    { code: "foo.confirm('x');" },
    // `confirm` khai báo cục bộ (biến, hàm, tham số) không phải hộp thoại của trình duyệt
    { code: "const confirm = () => true; confirm('x');" },
    { code: "function confirm(m) { return m; } confirm('x');" },
    { code: "function f(confirm) { return confirm(); }" },
    { code: "import { confirm } from './dialogs'; confirm('x');", languageOptions: { sourceType: "module" } },
  ],
  invalid: [
    { code: 'window.confirm("x");', errors: [{ messageId: "nativeDialog" }] },
    { code: 'confirm("x");', errors: [{ messageId: "nativeDialog" }] },
    // biến cục bộ ở phạm vi khác không che được confirm toàn cục ở đây
    { code: 'function a() { const confirm = 1; } confirm("x");', errors: [{ messageId: "nativeDialog" }] },
    { code: 'function f(confirm) { return window.confirm("x"); }', errors: [{ messageId: "nativeDialog" }] },
    { code: 'alert("x");', errors: [{ messageId: "nativeDialog" }] },
    { code: 'const ok = prompt("x");', errors: [{ messageId: "nativeDialog" }] },
    { code: 'const c = "fixed inset-0 bg-black/50";', errors: [{ messageId: "rawOverlay" }] },
    { code: 'const a = <div className="fixed inset-0 z-50" />;', errors: [{ messageId: "rawOverlay" }] },
  ],
});
assertMessages(rule, { nativeDialog: "AlertDialog", rawOverlay: "AlertDialog" });
assertMessages(rule, { nativeDialog: "sonner" });
