import rule from "../rules/no-native-dialogs.mjs";
import { tester, assertMessages } from "../test-utils.mjs";

tester.run("no-native-dialogs", rule, {
  valid: [
    { code: "toast('x');" },
    { code: "const a = <AlertDialog />;" },
    { code: "const c = 'fixed bottom-0 inset-x-0';" },
    { code: "foo.confirm('x');" },
  ],
  invalid: [
    { code: 'window.confirm("x");', errors: [{ messageId: "nativeDialog" }] },
    { code: 'confirm("x");', errors: [{ messageId: "nativeDialog" }] },
    { code: 'alert("x");', errors: [{ messageId: "nativeDialog" }] },
    { code: 'const ok = prompt("x");', errors: [{ messageId: "nativeDialog" }] },
    { code: 'const c = "fixed inset-0 bg-black/50";', errors: [{ messageId: "rawOverlay" }] },
    { code: 'const a = <div className="fixed inset-0 z-50" />;', errors: [{ messageId: "rawOverlay" }] },
  ],
});
assertMessages(rule, { nativeDialog: "AlertDialog", rawOverlay: "AlertDialog" });
assertMessages(rule, { nativeDialog: "sonner" });
