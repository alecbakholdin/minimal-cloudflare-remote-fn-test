import "../../chunks/async.js";
import { e as escape_html } from "../../chunks/escaping.js";
import "clsx";
import { t as testFn } from "../../chunks/test.remote.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    $$renderer2.push(`<!---->`);
    $$renderer2.push(async () => escape_html(await testFn()));
  });
}
export {
  _page as default
};
