// Plugin ESLint onehub-ui: làm "tự vẽ tay UI" phát hiện được bằng máy (chuẩn ReUI + shadcn base-nova).
import noRawTable from "./rules/no-raw-table.mjs";
import noRawControls from "./rules/no-raw-controls.mjs";
import noNativeDialogs from "./rules/no-native-dialogs.mjs";
import noRawPalette from "./rules/no-raw-palette.mjs";
import noHardcodedColor from "./rules/no-hardcoded-color.mjs";
import noArbitraryTextSize from "./rules/no-arbitrary-text-size.mjs";
import noBannedMotion from "./rules/no-banned-motion.mjs";
import noAsChild from "./rules/no-aschild.mjs";
import noEmojiIcons from "./rules/no-emoji-icons.mjs";

export default {
  meta: { name: "onehub-ui" },
  rules: {
    "no-raw-table": noRawTable,
    "no-raw-controls": noRawControls,
    "no-native-dialogs": noNativeDialogs,
    "no-raw-palette": noRawPalette,
    "no-hardcoded-color": noHardcodedColor,
    "no-arbitrary-text-size": noArbitraryTextSize,
    "no-banned-motion": noBannedMotion,
    "no-aschild": noAsChild,
    "no-emoji-icons": noEmojiIcons,
  },
};
