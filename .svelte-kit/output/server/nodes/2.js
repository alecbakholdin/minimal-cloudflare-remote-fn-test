import * as universal from '../entries/pages/_page.ts.js';

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/+page.ts";
export const imports = ["_app/immutable/nodes/2.BNAXMS6o.js","_app/immutable/chunks/CJcJB-l1.js","_app/immutable/chunks/I6fbWUjK.js","_app/immutable/chunks/LeO-fAKs.js","_app/immutable/chunks/Bju_0ad6.js","_app/immutable/chunks/CMbe3k5-.js"];
export const stylesheets = [];
export const fonts = [];
