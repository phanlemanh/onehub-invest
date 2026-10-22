import rule from "../rules/no-emoji-icons.mjs";
import { tester, assertMessages } from "../test-utils.mjs";

tester.run("no-emoji-icons", rule, {
  valid: [
    { code: "const a = <p>Xong</p>;" },
    { code: 'setMsg("Đã lưu — 3 căn hộ");' },
    { code: 'import x from "./ok";' },
    { code: "const a = <Check className='size-4' />;" },
  ],
  invalid: [
    { code: "const a = <p>✅ Xong</p>;", errors: [{ messageId: "emoji" }] },
    { code: 'setMsg("❌ lỗi");', errors: [{ messageId: "emoji" }] },
    { code: "const s = `🔥 ${n}`;", errors: [{ messageId: "emoji" }] },
    { code: 'const a = <Tab label="⚠️ Cảnh báo" />;', errors: [{ messageId: "emoji" }] },
  ],
});
assertMessages(rule, { emoji: "lucide" });
