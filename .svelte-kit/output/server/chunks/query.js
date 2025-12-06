import { error, json } from "@sveltejs/kit";
import { b as base, a as app_dir, D as DEV, p as prerendering } from "./environment.js";
import { get_request_store, with_request_store } from "@sveltejs/kit/internal/server";
import { s as stringify_remote_arg, a as stringify, c as create_remote_key } from "./shared.js";
import { parse } from "devalue";
function create_validator(validate_or_fn, maybe_fn) {
  if (!maybe_fn) {
    return (arg) => {
      if (arg !== void 0) {
        error(400, "Bad Request");
      }
    };
  }
  if (validate_or_fn === "unchecked") {
    return (arg) => arg;
  }
  if ("~standard" in validate_or_fn) {
    return async (arg) => {
      const { event, state } = get_request_store();
      const result = await validate_or_fn["~standard"].validate(arg);
      if (result.issues) {
        error(
          400,
          await state.handleValidationError({
            issues: result.issues,
            event
          })
        );
      }
      return result.value;
    };
  }
  throw new Error(
    'Invalid validator passed to remote function. Expected "unchecked" or a Standard Schema (https://standardschema.dev)'
  );
}
async function get_response(info, arg, state, get_result) {
  await 0;
  const cache = get_cache(info, state);
  return cache[stringify_remote_arg(arg, state.transport)] ??= get_result();
}
function parse_remote_response(data, transport) {
  const revivers = {};
  for (const key in transport) {
    revivers[key] = transport[key].decode;
  }
  return parse(data, revivers);
}
async function run_remote_function(event, state, allow_cookies, arg, validate, fn) {
  const store = {
    event: {
      ...event,
      setHeaders: () => {
        throw new Error("setHeaders is not allowed in remote functions");
      },
      cookies: {
        ...event.cookies,
        set: (name, value, opts) => {
          if (!allow_cookies) {
            throw new Error("Cannot set cookies in `query` or `prerender` functions");
          }
          if (opts.path && !opts.path.startsWith("/")) {
            throw new Error("Cookies set in remote functions must have an absolute path");
          }
          return event.cookies.set(name, value, opts);
        },
        delete: (name, opts) => {
          if (!allow_cookies) {
            throw new Error("Cannot delete cookies in `query` or `prerender` functions");
          }
          if (opts.path && !opts.path.startsWith("/")) {
            throw new Error("Cookies deleted in remote functions must have an absolute path");
          }
          return event.cookies.delete(name, opts);
        }
      }
    },
    state: {
      ...state,
      is_in_remote_function: true
    }
  };
  const validated = await with_request_store(store, () => validate(arg));
  return with_request_store(store, () => fn(validated));
}
function get_cache(info, state = get_request_store().state) {
  let cache = state.remote_data?.get(info);
  if (cache === void 0) {
    cache = {};
    (state.remote_data ??= /* @__PURE__ */ new Map()).set(info, cache);
  }
  return cache;
}
// @__NO_SIDE_EFFECTS__
function prerender(validate_or_fn, fn_or_options, maybe_options) {
  const maybe_fn = typeof fn_or_options === "function" ? fn_or_options : void 0;
  const options = maybe_options ?? (maybe_fn ? void 0 : fn_or_options);
  const fn = maybe_fn ?? validate_or_fn;
  const validate = create_validator(validate_or_fn, maybe_fn);
  const __ = {
    type: "prerender",
    id: "",
    name: "",
    has_arg: !!maybe_fn,
    inputs: options?.inputs,
    dynamic: options?.dynamic
  };
  const wrapper = (arg) => {
    const promise = (async () => {
      const { event, state } = get_request_store();
      const payload = stringify_remote_arg(arg, state.transport);
      const id = __.id;
      const url = `${base}/${app_dir}/remote/${id}${payload ? `/${payload}` : ""}`;
      if (!state.prerendering && !DEV && !event.isRemoteRequest) {
        try {
          return await get_response(__, arg, state, async () => {
            const key = stringify_remote_arg(arg, state.transport);
            const cache = get_cache(__, state);
            const promise3 = cache[key] ??= fetch(new URL(url, event.url.origin).href).then(
              async (response) => {
                if (!response.ok) {
                  throw new Error("Prerendered response not found");
                }
                const prerendered = await response.json();
                if (prerendered.type === "error") {
                  error(prerendered.status, prerendered.error);
                }
                return prerendered.result;
              }
            );
            return parse_remote_response(await promise3, state.transport);
          });
        } catch {
        }
      }
      if (state.prerendering?.remote_responses.has(url)) {
        return (
          /** @type {Promise<any>} */
          state.prerendering.remote_responses.get(url)
        );
      }
      const promise2 = get_response(
        __,
        arg,
        state,
        () => run_remote_function(event, state, false, arg, validate, fn)
      );
      if (state.prerendering) {
        state.prerendering.remote_responses.set(url, promise2);
      }
      const result = await promise2;
      if (state.prerendering) {
        const body = { type: "result", result: stringify(result, state.transport) };
        state.prerendering.dependencies.set(url, {
          body: JSON.stringify(body),
          response: json(body)
        });
      }
      return result;
    })();
    promise.catch(() => {
    });
    return (
      /** @type {RemoteResource<Output>} */
      promise
    );
  };
  Object.defineProperty(wrapper, "__", { value: __ });
  return wrapper;
}
// @__NO_SIDE_EFFECTS__
function query(validate_or_fn, maybe_fn) {
  const fn = maybe_fn ?? validate_or_fn;
  const validate = create_validator(validate_or_fn, maybe_fn);
  const __ = { type: "query", id: "", name: "" };
  const wrapper = (arg) => {
    if (prerendering) {
      throw new Error(
        `Cannot call query '${__.name}' while prerendering, as prerendered pages need static data. Use 'prerender' from $app/server instead`
      );
    }
    const { event, state } = get_request_store();
    const get_remote_function_result = () => run_remote_function(event, state, false, arg, validate, fn);
    const promise = get_response(__, arg, state, get_remote_function_result);
    promise.catch(() => {
    });
    promise.set = (value) => update_refresh_value(get_refresh_context(__, "set", arg), value);
    promise.refresh = () => {
      const refresh_context = get_refresh_context(__, "refresh", arg);
      const is_immediate_refresh = !refresh_context.cache[refresh_context.cache_key];
      const value = is_immediate_refresh ? promise : get_remote_function_result();
      return update_refresh_value(refresh_context, value, is_immediate_refresh);
    };
    promise.withOverride = () => {
      throw new Error(`Cannot call '${__.name}.withOverride()' on the server`);
    };
    return (
      /** @type {RemoteQuery<Output>} */
      promise
    );
  };
  Object.defineProperty(wrapper, "__", { value: __ });
  return wrapper;
}
// @__NO_SIDE_EFFECTS__
function batch(validate_or_fn, maybe_fn) {
  const fn = maybe_fn ?? validate_or_fn;
  const validate = create_validator(validate_or_fn, maybe_fn);
  const __ = {
    type: "query_batch",
    id: "",
    name: "",
    run: (args) => {
      const { event, state } = get_request_store();
      return run_remote_function(
        event,
        state,
        false,
        args,
        (array) => Promise.all(array.map(validate)),
        fn
      );
    }
  };
  let batching = { args: [], resolvers: [] };
  const wrapper = (arg) => {
    if (prerendering) {
      throw new Error(
        `Cannot call query.batch '${__.name}' while prerendering, as prerendered pages need static data. Use 'prerender' from $app/server instead`
      );
    }
    const { event, state } = get_request_store();
    const get_remote_function_result = () => {
      return new Promise((resolve, reject) => {
        batching.args.push(arg);
        batching.resolvers.push({ resolve, reject });
        if (batching.args.length > 1) return;
        setTimeout(async () => {
          const batched = batching;
          batching = { args: [], resolvers: [] };
          try {
            const get_result = await run_remote_function(
              event,
              state,
              false,
              batched.args,
              (array) => Promise.all(array.map(validate)),
              fn
            );
            for (let i = 0; i < batched.resolvers.length; i++) {
              try {
                batched.resolvers[i].resolve(get_result(batched.args[i], i));
              } catch (error2) {
                batched.resolvers[i].reject(error2);
              }
            }
          } catch (error2) {
            for (const resolver of batched.resolvers) {
              resolver.reject(error2);
            }
          }
        }, 0);
      });
    };
    const promise = get_response(__, arg, state, get_remote_function_result);
    promise.catch(() => {
    });
    promise.set = (value) => update_refresh_value(get_refresh_context(__, "set", arg), value);
    promise.refresh = () => {
      const refresh_context = get_refresh_context(__, "refresh", arg);
      const is_immediate_refresh = !refresh_context.cache[refresh_context.cache_key];
      const value = is_immediate_refresh ? promise : get_remote_function_result();
      return update_refresh_value(refresh_context, value, is_immediate_refresh);
    };
    promise.withOverride = () => {
      throw new Error(`Cannot call '${__.name}.withOverride()' on the server`);
    };
    return (
      /** @type {RemoteQuery<Output>} */
      promise
    );
  };
  Object.defineProperty(wrapper, "__", { value: __ });
  return wrapper;
}
Object.defineProperty(query, "batch", { value: batch, enumerable: true });
function get_refresh_context(__, action, arg) {
  const { state } = get_request_store();
  const { refreshes } = state;
  if (!refreshes) {
    const name = __.type === "query_batch" ? `query.batch '${__.name}'` : `query '${__.name}'`;
    throw new Error(
      `Cannot call ${action} on ${name} because it is not executed in the context of a command/form remote function`
    );
  }
  const cache = get_cache(__, state);
  const cache_key = stringify_remote_arg(arg, state.transport);
  const refreshes_key = create_remote_key(__.id, cache_key);
  return { __, state, refreshes, refreshes_key, cache, cache_key };
}
function update_refresh_value({ __, refreshes, refreshes_key, cache, cache_key }, value, is_immediate_refresh = false) {
  const promise = Promise.resolve(value);
  if (!is_immediate_refresh) {
    cache[cache_key] = promise;
  }
  if (__.id) {
    refreshes[refreshes_key] = promise;
  }
  return promise.then(() => {
  });
}
export {
  create_validator as c,
  get_cache as g,
  prerender as p,
  query as q,
  run_remote_function as r
};
