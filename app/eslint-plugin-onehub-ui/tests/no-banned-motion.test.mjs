import rule from "../rules/no-banned-motion.mjs";
import { tester, assertMessages } from "../test-utils.mjs";

tester.run("no-banned-motion", rule, {
  valid: [
    { code: 'const c = "duration-200";' },
    { code: 'const c = "transition-colors duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]";' },
    { code: 'const c = "duration-0 duration-100 duration-300 duration-500";' },
    { code: 'import { motion } from "motion/react";' },
    { code: "const c = `duration-${n}`;" },
    { code: "const a = <div onHover={f} />;" },
  ],
  invalid: [
    { code: 'const c = "transition-all duration-300";', errors: [{ messageId: "transitionAll" }] },
    { code: 'const c = "animate-bounce";', errors: [{ messageId: "bounce" }] },
    { code: 'const c = "ease-in-out";', errors: [{ messageId: "ease" }] },
    { code: 'const c = "hover:ease-out";', errors: [{ messageId: "ease" }] },
    { code: 'const c = "duration-700";', errors: [{ messageId: "duration" }] },
    { code: 'const c = "md:duration-1000";', errors: [{ messageId: "duration" }] },
    { code: 'const c = "duration-[250ms]";', errors: [{ messageId: "duration" }] },
    { code: 'const c = "hover:duration-[0.4s]";', errors: [{ messageId: "duration" }] },
    { code: 'import { motion } from "framer-motion";', errors: [{ messageId: "framer" }] },
    { code: "const a = <div whileHover={{ scale: 1.1 }} />;", errors: [{ messageId: "whileProp" }] },
    { code: "const a = <div whileTap={{}} whileFocus={{}} />;", errors: [{ messageId: "whileProp" }, { messageId: "whileProp" }] },
  ],
});
assertMessages(rule, {
  transitionAll: "transition-colors",
  bounce: "motion/react",
  ease: "transition-colors",
  duration: "duration-200",
  framer: "motion/react",
  whileProp: "motion/react",
});
