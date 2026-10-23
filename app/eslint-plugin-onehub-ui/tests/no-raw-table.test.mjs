import rule from "../rules/no-raw-table.mjs";
import { tester, assertMessages } from "../test-utils.mjs";

tester.run("no-raw-table", rule, {
  valid: [
    { code: "const a = <DataGrid table={t} />;" },
    { code: "const a = <Table />;" },
  ],
  invalid: [
    { code: "const a = <table><tbody/></table>;", errors: [{ messageId: "rawTable" }] },
  ],
});
assertMessages(rule, { rawTable: "data-grid" });
