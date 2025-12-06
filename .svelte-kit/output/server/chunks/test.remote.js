import "@sveltejs/kit/internal/server";
import "./utils.js";
import "@sveltejs/kit";
import { init_remote_functions } from "@sveltejs/kit/internal";
import { p as prerender } from "./query.js";
const m = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  get testFn() {
    return testFn;
  }
}, Symbol.toStringTag, { value: "Module" }));
const testFn = prerender(() => {
  return "testing";
});
init_remote_functions(m, "src/lib/test.remote.ts", "62b3f9");
for (const [name, fn] of Object.entries(m)) {
  fn.__.id = "62b3f9/" + name;
  fn.__.name = name;
}
export {
  m,
  testFn as t
};
