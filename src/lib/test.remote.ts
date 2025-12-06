import { prerender } from "$app/server";

export const testFn = prerender(() => {
  return "testing";
});
