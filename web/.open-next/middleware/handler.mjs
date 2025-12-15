
import {Buffer} from "node:buffer";
globalThis.Buffer = Buffer;

import {AsyncLocalStorage} from "node:async_hooks";
globalThis.AsyncLocalStorage = AsyncLocalStorage;


const defaultDefineProperty = Object.defineProperty;
Object.defineProperty = function(o, p, a) {
  if(p=== '__import_unsupported' && Boolean(globalThis.__import_unsupported)) {
    return;
  }
  return defaultDefineProperty(o, p, a);
};

  
  
  globalThis.openNextDebug = false;globalThis.openNextVersion = "3.9.6";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/@opennextjs/aws/dist/utils/error.js
function isOpenNextError(e) {
  try {
    return "__openNextInternal" in e;
  } catch {
    return false;
  }
}
var init_error = __esm({
  "node_modules/@opennextjs/aws/dist/utils/error.js"() {
  }
});

// node_modules/@opennextjs/aws/dist/adapters/logger.js
function debug(...args) {
  if (globalThis.openNextDebug) {
    console.log(...args);
  }
}
function warn(...args) {
  console.warn(...args);
}
function error(...args) {
  if (args.some((arg) => isDownplayedErrorLog(arg))) {
    return debug(...args);
  }
  if (args.some((arg) => isOpenNextError(arg))) {
    const error2 = args.find((arg) => isOpenNextError(arg));
    if (error2.logLevel < getOpenNextErrorLogLevel()) {
      return;
    }
    if (error2.logLevel === 0) {
      return console.log(...args.map((arg) => isOpenNextError(arg) ? `${arg.name}: ${arg.message}` : arg));
    }
    if (error2.logLevel === 1) {
      return warn(...args.map((arg) => isOpenNextError(arg) ? `${arg.name}: ${arg.message}` : arg));
    }
    return console.error(...args);
  }
  console.error(...args);
}
function getOpenNextErrorLogLevel() {
  const strLevel = process.env.OPEN_NEXT_ERROR_LOG_LEVEL ?? "1";
  switch (strLevel.toLowerCase()) {
    case "debug":
    case "0":
      return 0;
    case "error":
    case "2":
      return 2;
    default:
      return 1;
  }
}
var DOWNPLAYED_ERROR_LOGS, isDownplayedErrorLog;
var init_logger = __esm({
  "node_modules/@opennextjs/aws/dist/adapters/logger.js"() {
    init_error();
    DOWNPLAYED_ERROR_LOGS = [
      {
        clientName: "S3Client",
        commandName: "GetObjectCommand",
        errorName: "NoSuchKey"
      }
    ];
    isDownplayedErrorLog = (errorLog) => DOWNPLAYED_ERROR_LOGS.some((downplayedInput) => downplayedInput.clientName === errorLog?.clientName && downplayedInput.commandName === errorLog?.commandName && (downplayedInput.errorName === errorLog?.error?.name || downplayedInput.errorName === errorLog?.error?.Code));
  }
});

// node_modules/cookie/dist/index.js
var require_dist = __commonJS({
  "node_modules/cookie/dist/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parseCookie = parseCookie;
    exports.parse = parseCookie;
    exports.stringifyCookie = stringifyCookie;
    exports.stringifySetCookie = stringifySetCookie;
    exports.serialize = stringifySetCookie;
    exports.parseSetCookie = parseSetCookie;
    exports.stringifySetCookie = stringifySetCookie;
    exports.serialize = stringifySetCookie;
    var cookieNameRegExp = /^[\u0021-\u003A\u003C\u003E-\u007E]+$/;
    var cookieValueRegExp = /^[\u0021-\u003A\u003C-\u007E]*$/;
    var domainValueRegExp = /^([.]?[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)([.][a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i;
    var pathValueRegExp = /^[\u0020-\u003A\u003D-\u007E]*$/;
    var maxAgeRegExp = /^-?\d+$/;
    var __toString = Object.prototype.toString;
    var NullObject = /* @__PURE__ */ (() => {
      const C = function() {
      };
      C.prototype = /* @__PURE__ */ Object.create(null);
      return C;
    })();
    function parseCookie(str, options) {
      const obj = new NullObject();
      const len = str.length;
      if (len < 2)
        return obj;
      const dec = options?.decode || decode;
      let index = 0;
      do {
        const eqIdx = eqIndex(str, index, len);
        if (eqIdx === -1)
          break;
        const endIdx = endIndex(str, index, len);
        if (eqIdx > endIdx) {
          index = str.lastIndexOf(";", eqIdx - 1) + 1;
          continue;
        }
        const key = valueSlice(str, index, eqIdx);
        if (obj[key] === void 0) {
          obj[key] = dec(valueSlice(str, eqIdx + 1, endIdx));
        }
        index = endIdx + 1;
      } while (index < len);
      return obj;
    }
    function stringifyCookie(cookie, options) {
      const enc = options?.encode || encodeURIComponent;
      const cookieStrings = [];
      for (const name of Object.keys(cookie)) {
        const val = cookie[name];
        if (val === void 0)
          continue;
        if (!cookieNameRegExp.test(name)) {
          throw new TypeError(`cookie name is invalid: ${name}`);
        }
        const value = enc(val);
        if (!cookieValueRegExp.test(value)) {
          throw new TypeError(`cookie val is invalid: ${val}`);
        }
        cookieStrings.push(`${name}=${value}`);
      }
      return cookieStrings.join("; ");
    }
    function stringifySetCookie(_name, _val, _opts) {
      const cookie = typeof _name === "object" ? _name : { ..._opts, name: _name, value: String(_val) };
      const options = typeof _val === "object" ? _val : _opts;
      const enc = options?.encode || encodeURIComponent;
      if (!cookieNameRegExp.test(cookie.name)) {
        throw new TypeError(`argument name is invalid: ${cookie.name}`);
      }
      const value = cookie.value ? enc(cookie.value) : "";
      if (!cookieValueRegExp.test(value)) {
        throw new TypeError(`argument val is invalid: ${cookie.value}`);
      }
      let str = cookie.name + "=" + value;
      if (cookie.maxAge !== void 0) {
        if (!Number.isInteger(cookie.maxAge)) {
          throw new TypeError(`option maxAge is invalid: ${cookie.maxAge}`);
        }
        str += "; Max-Age=" + cookie.maxAge;
      }
      if (cookie.domain) {
        if (!domainValueRegExp.test(cookie.domain)) {
          throw new TypeError(`option domain is invalid: ${cookie.domain}`);
        }
        str += "; Domain=" + cookie.domain;
      }
      if (cookie.path) {
        if (!pathValueRegExp.test(cookie.path)) {
          throw new TypeError(`option path is invalid: ${cookie.path}`);
        }
        str += "; Path=" + cookie.path;
      }
      if (cookie.expires) {
        if (!isDate(cookie.expires) || !Number.isFinite(cookie.expires.valueOf())) {
          throw new TypeError(`option expires is invalid: ${cookie.expires}`);
        }
        str += "; Expires=" + cookie.expires.toUTCString();
      }
      if (cookie.httpOnly) {
        str += "; HttpOnly";
      }
      if (cookie.secure) {
        str += "; Secure";
      }
      if (cookie.partitioned) {
        str += "; Partitioned";
      }
      if (cookie.priority) {
        const priority = typeof cookie.priority === "string" ? cookie.priority.toLowerCase() : void 0;
        switch (priority) {
          case "low":
            str += "; Priority=Low";
            break;
          case "medium":
            str += "; Priority=Medium";
            break;
          case "high":
            str += "; Priority=High";
            break;
          default:
            throw new TypeError(`option priority is invalid: ${cookie.priority}`);
        }
      }
      if (cookie.sameSite) {
        const sameSite = typeof cookie.sameSite === "string" ? cookie.sameSite.toLowerCase() : cookie.sameSite;
        switch (sameSite) {
          case true:
          case "strict":
            str += "; SameSite=Strict";
            break;
          case "lax":
            str += "; SameSite=Lax";
            break;
          case "none":
            str += "; SameSite=None";
            break;
          default:
            throw new TypeError(`option sameSite is invalid: ${cookie.sameSite}`);
        }
      }
      return str;
    }
    function parseSetCookie(str, options) {
      const dec = options?.decode || decode;
      const len = str.length;
      const endIdx = endIndex(str, 0, len);
      const eqIdx = eqIndex(str, 0, endIdx);
      const setCookie = eqIdx === -1 ? { name: "", value: dec(valueSlice(str, 0, endIdx)) } : {
        name: valueSlice(str, 0, eqIdx),
        value: dec(valueSlice(str, eqIdx + 1, endIdx))
      };
      let index = endIdx + 1;
      while (index < len) {
        const endIdx2 = endIndex(str, index, len);
        const eqIdx2 = eqIndex(str, index, endIdx2);
        const attr = eqIdx2 === -1 ? valueSlice(str, index, endIdx2) : valueSlice(str, index, eqIdx2);
        const val = eqIdx2 === -1 ? void 0 : valueSlice(str, eqIdx2 + 1, endIdx2);
        switch (attr.toLowerCase()) {
          case "httponly":
            setCookie.httpOnly = true;
            break;
          case "secure":
            setCookie.secure = true;
            break;
          case "partitioned":
            setCookie.partitioned = true;
            break;
          case "domain":
            setCookie.domain = val;
            break;
          case "path":
            setCookie.path = val;
            break;
          case "max-age":
            if (val && maxAgeRegExp.test(val))
              setCookie.maxAge = Number(val);
            break;
          case "expires":
            if (!val)
              break;
            const date = new Date(val);
            if (Number.isFinite(date.valueOf()))
              setCookie.expires = date;
            break;
          case "priority":
            if (!val)
              break;
            const priority = val.toLowerCase();
            if (priority === "low" || priority === "medium" || priority === "high") {
              setCookie.priority = priority;
            }
            break;
          case "samesite":
            if (!val)
              break;
            const sameSite = val.toLowerCase();
            if (sameSite === "lax" || sameSite === "strict" || sameSite === "none") {
              setCookie.sameSite = sameSite;
            }
            break;
        }
        index = endIdx2 + 1;
      }
      return setCookie;
    }
    function endIndex(str, min, len) {
      const index = str.indexOf(";", min);
      return index === -1 ? len : index;
    }
    function eqIndex(str, min, max) {
      const index = str.indexOf("=", min);
      return index < max ? index : -1;
    }
    function valueSlice(str, min, max) {
      let start = min;
      let end = max;
      do {
        const code = str.charCodeAt(start);
        if (code !== 32 && code !== 9)
          break;
      } while (++start < end);
      while (end > start) {
        const code = str.charCodeAt(end - 1);
        if (code !== 32 && code !== 9)
          break;
        end--;
      }
      return str.slice(start, end);
    }
    function decode(str) {
      if (str.indexOf("%") === -1)
        return str;
      try {
        return decodeURIComponent(str);
      } catch (e) {
        return str;
      }
    }
    function isDate(val) {
      return __toString.call(val) === "[object Date]";
    }
  }
});

// node_modules/@opennextjs/aws/dist/http/util.js
function parseSetCookieHeader(cookies) {
  if (!cookies) {
    return [];
  }
  if (typeof cookies === "string") {
    return cookies.split(/(?<!Expires=\w+),/i).map((c) => c.trim());
  }
  return cookies;
}
function getQueryFromIterator(it) {
  const query = {};
  for (const [key, value] of it) {
    if (key in query) {
      if (Array.isArray(query[key])) {
        query[key].push(value);
      } else {
        query[key] = [query[key], value];
      }
    } else {
      query[key] = value;
    }
  }
  return query;
}
var init_util = __esm({
  "node_modules/@opennextjs/aws/dist/http/util.js"() {
    init_logger();
  }
});

// node_modules/@opennextjs/aws/dist/overrides/converters/utils.js
function getQueryFromSearchParams(searchParams) {
  return getQueryFromIterator(searchParams.entries());
}
var init_utils = __esm({
  "node_modules/@opennextjs/aws/dist/overrides/converters/utils.js"() {
    init_util();
  }
});

// node_modules/@opennextjs/aws/dist/overrides/converters/edge.js
var edge_exports = {};
__export(edge_exports, {
  default: () => edge_default
});
import { Buffer as Buffer2 } from "node:buffer";
var import_cookie, NULL_BODY_STATUSES, converter, edge_default;
var init_edge = __esm({
  "node_modules/@opennextjs/aws/dist/overrides/converters/edge.js"() {
    import_cookie = __toESM(require_dist(), 1);
    init_util();
    init_utils();
    NULL_BODY_STATUSES = /* @__PURE__ */ new Set([101, 103, 204, 205, 304]);
    converter = {
      convertFrom: async (event) => {
        const url = new URL(event.url);
        const searchParams = url.searchParams;
        const query = getQueryFromSearchParams(searchParams);
        const headers = {};
        event.headers.forEach((value, key) => {
          headers[key] = value;
        });
        const rawPath = url.pathname;
        const method = event.method;
        const shouldHaveBody = method !== "GET" && method !== "HEAD";
        const body = shouldHaveBody ? Buffer2.from(await event.arrayBuffer()) : void 0;
        const cookieHeader = event.headers.get("cookie");
        const cookies = cookieHeader ? import_cookie.default.parse(cookieHeader) : {};
        return {
          type: "core",
          method,
          rawPath,
          url: event.url,
          body,
          headers,
          remoteAddress: event.headers.get("x-forwarded-for") ?? "::1",
          query,
          cookies
        };
      },
      convertTo: async (result) => {
        if ("internalEvent" in result) {
          const request = new Request(result.internalEvent.url, {
            body: result.internalEvent.body,
            method: result.internalEvent.method,
            headers: {
              ...result.internalEvent.headers,
              "x-forwarded-host": result.internalEvent.headers.host
            }
          });
          if (globalThis.__dangerous_ON_edge_converter_returns_request === true) {
            return request;
          }
          const cfCache = (result.isISR || result.internalEvent.rawPath.startsWith("/_next/image")) && process.env.DISABLE_CACHE !== "true" ? { cacheEverything: true } : {};
          return fetch(request, {
            // This is a hack to make sure that the response is cached by Cloudflare
            // See https://developers.cloudflare.com/workers/examples/cache-using-fetch/#caching-html-resources
            // @ts-expect-error - This is a Cloudflare specific option
            cf: cfCache
          });
        }
        const headers = new Headers();
        for (const [key, value] of Object.entries(result.headers)) {
          if (key === "set-cookie" && typeof value === "string") {
            const cookies = parseSetCookieHeader(value);
            for (const cookie of cookies) {
              headers.append(key, cookie);
            }
            continue;
          }
          if (Array.isArray(value)) {
            for (const v of value) {
              headers.append(key, v);
            }
          } else {
            headers.set(key, value);
          }
        }
        const body = NULL_BODY_STATUSES.has(result.statusCode) ? null : result.body;
        return new Response(body, {
          status: result.statusCode,
          headers
        });
      },
      name: "edge"
    };
    edge_default = converter;
  }
});

// node_modules/@opennextjs/aws/dist/overrides/wrappers/cloudflare-edge.js
var cloudflare_edge_exports = {};
__export(cloudflare_edge_exports, {
  default: () => cloudflare_edge_default
});
var cfPropNameMapping, handler, cloudflare_edge_default;
var init_cloudflare_edge = __esm({
  "node_modules/@opennextjs/aws/dist/overrides/wrappers/cloudflare-edge.js"() {
    cfPropNameMapping = {
      // The city name is percent-encoded.
      // See https://github.com/vercel/vercel/blob/4cb6143/packages/functions/src/headers.ts#L94C19-L94C37
      city: [encodeURIComponent, "x-open-next-city"],
      country: "x-open-next-country",
      regionCode: "x-open-next-region",
      latitude: "x-open-next-latitude",
      longitude: "x-open-next-longitude"
    };
    handler = async (handler3, converter2) => async (request, env, ctx) => {
      globalThis.process = process;
      for (const [key, value] of Object.entries(env)) {
        if (typeof value === "string") {
          process.env[key] = value;
        }
      }
      const internalEvent = await converter2.convertFrom(request);
      const cfProperties = request.cf;
      for (const [propName, mapping] of Object.entries(cfPropNameMapping)) {
        const propValue = cfProperties?.[propName];
        if (propValue != null) {
          const [encode, headerName] = Array.isArray(mapping) ? mapping : [null, mapping];
          internalEvent.headers[headerName] = encode ? encode(propValue) : propValue;
        }
      }
      const response = await handler3(internalEvent, {
        waitUntil: ctx.waitUntil.bind(ctx)
      });
      const result = await converter2.convertTo(response);
      return result;
    };
    cloudflare_edge_default = {
      wrapper: handler,
      name: "cloudflare-edge",
      supportStreaming: true,
      edgeRuntime: true
    };
  }
});

// node_modules/@opennextjs/aws/dist/overrides/originResolver/pattern-env.js
var pattern_env_exports = {};
__export(pattern_env_exports, {
  default: () => pattern_env_default
});
function initializeOnce() {
  if (initialized)
    return;
  cachedOrigins = JSON.parse(process.env.OPEN_NEXT_ORIGIN ?? "{}");
  const functions = globalThis.openNextConfig.functions ?? {};
  for (const key in functions) {
    if (key !== "default") {
      const value = functions[key];
      const regexes = [];
      for (const pattern of value.patterns) {
        const regexPattern = `/${pattern.replace(/\*\*/g, "(.*)").replace(/\*/g, "([^/]*)").replace(/\//g, "\\/").replace(/\?/g, ".")}`;
        regexes.push(new RegExp(regexPattern));
      }
      cachedPatterns.push({
        key,
        patterns: value.patterns,
        regexes
      });
    }
  }
  initialized = true;
}
var cachedOrigins, cachedPatterns, initialized, envLoader, pattern_env_default;
var init_pattern_env = __esm({
  "node_modules/@opennextjs/aws/dist/overrides/originResolver/pattern-env.js"() {
    init_logger();
    cachedPatterns = [];
    initialized = false;
    envLoader = {
      name: "env",
      resolve: async (_path) => {
        try {
          initializeOnce();
          for (const { key, patterns, regexes } of cachedPatterns) {
            for (const regex of regexes) {
              if (regex.test(_path)) {
                debug("Using origin", key, patterns);
                return cachedOrigins[key];
              }
            }
          }
          if (_path.startsWith("/_next/image") && cachedOrigins.imageOptimizer) {
            debug("Using origin", "imageOptimizer", _path);
            return cachedOrigins.imageOptimizer;
          }
          if (cachedOrigins.default) {
            debug("Using default origin", cachedOrigins.default, _path);
            return cachedOrigins.default;
          }
          return false;
        } catch (e) {
          error("Error while resolving origin", e);
          return false;
        }
      }
    };
    pattern_env_default = envLoader;
  }
});

// node_modules/@opennextjs/aws/dist/overrides/assetResolver/dummy.js
var dummy_exports = {};
__export(dummy_exports, {
  default: () => dummy_default
});
var resolver, dummy_default;
var init_dummy = __esm({
  "node_modules/@opennextjs/aws/dist/overrides/assetResolver/dummy.js"() {
    resolver = {
      name: "dummy"
    };
    dummy_default = resolver;
  }
});

// node_modules/@opennextjs/aws/dist/utils/stream.js
import { ReadableStream as ReadableStream2 } from "node:stream/web";
function toReadableStream(value, isBase64) {
  return new ReadableStream2({
    pull(controller) {
      controller.enqueue(Buffer.from(value, isBase64 ? "base64" : "utf8"));
      controller.close();
    }
  }, { highWaterMark: 0 });
}
function emptyReadableStream() {
  if (process.env.OPEN_NEXT_FORCE_NON_EMPTY_RESPONSE === "true") {
    return new ReadableStream2({
      pull(controller) {
        maybeSomethingBuffer ??= Buffer.from("SOMETHING");
        controller.enqueue(maybeSomethingBuffer);
        controller.close();
      }
    }, { highWaterMark: 0 });
  }
  return new ReadableStream2({
    start(controller) {
      controller.close();
    }
  });
}
var maybeSomethingBuffer;
var init_stream = __esm({
  "node_modules/@opennextjs/aws/dist/utils/stream.js"() {
  }
});

// node_modules/@opennextjs/aws/dist/overrides/proxyExternalRequest/fetch.js
var fetch_exports = {};
__export(fetch_exports, {
  default: () => fetch_default
});
var fetchProxy, fetch_default;
var init_fetch = __esm({
  "node_modules/@opennextjs/aws/dist/overrides/proxyExternalRequest/fetch.js"() {
    init_stream();
    fetchProxy = {
      name: "fetch-proxy",
      // @ts-ignore
      proxy: async (internalEvent) => {
        const { url, headers: eventHeaders, method, body } = internalEvent;
        const headers = Object.fromEntries(Object.entries(eventHeaders).filter(([key]) => key.toLowerCase() !== "cf-connecting-ip"));
        const response = await fetch(url, {
          method,
          headers,
          body
        });
        const responseHeaders = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });
        return {
          type: "core",
          headers: responseHeaders,
          statusCode: response.status,
          isBase64Encoded: true,
          body: response.body ?? emptyReadableStream()
        };
      }
    };
    fetch_default = fetchProxy;
  }
});

// .next/server/edge/chunks/edge-wrapper_fa177864.js
var require_edge_wrapper_fa177864 = __commonJS({
  ".next/server/edge/chunks/edge-wrapper_fa177864.js"() {
    "use strict";
    (globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push(["chunks/edge-wrapper_fa177864.js", 88912, (e, t, h) => {
      self._ENTRIES ||= {};
      let l = Promise.resolve().then(() => e.i(58217));
      l.catch(() => {
      }), self._ENTRIES.middleware_middleware = new Proxy(l, { get(e2, t2) {
        if ("then" === t2) return (t3, h3) => e2.then(t3, h3);
        let h2 = (...h3) => e2.then((e3) => (0, e3[t2])(...h3));
        return h2.then = (h3, l2) => e2.then((e3) => e3[t2]).then(h3, l2), h2;
      } });
    }]);
  }
});

// node-built-in-modules:node:buffer
var node_buffer_exports = {};
import * as node_buffer_star from "node:buffer";
var init_node_buffer = __esm({
  "node-built-in-modules:node:buffer"() {
    __reExport(node_buffer_exports, node_buffer_star);
  }
});

// node-built-in-modules:node:async_hooks
var node_async_hooks_exports = {};
import * as node_async_hooks_star from "node:async_hooks";
var init_node_async_hooks = __esm({
  "node-built-in-modules:node:async_hooks"() {
    __reExport(node_async_hooks_exports, node_async_hooks_star);
  }
});

// .next/server/edge/chunks/[root-of-the-server]__398964b2._.js
var require_root_of_the_server_398964b2 = __commonJS({
  ".next/server/edge/chunks/[root-of-the-server]__398964b2._.js"() {
    "use strict";
    (globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push(["chunks/[root-of-the-server]__398964b2._.js", 28042, (e, t, r) => {
      "use strict";
      var n = Object.defineProperty, s = Object.getOwnPropertyDescriptor, i = Object.getOwnPropertyNames, a = Object.prototype.hasOwnProperty, o = {}, l = { RequestCookies: () => g, ResponseCookies: () => m, parseCookie: () => h, parseSetCookie: () => d, stringifyCookie: () => c };
      for (var u in l) n(o, u, { get: l[u], enumerable: true });
      function c(e2) {
        var t2;
        let r2 = ["path" in e2 && e2.path && `Path=${e2.path}`, "expires" in e2 && (e2.expires || 0 === e2.expires) && `Expires=${("number" == typeof e2.expires ? new Date(e2.expires) : e2.expires).toUTCString()}`, "maxAge" in e2 && "number" == typeof e2.maxAge && `Max-Age=${e2.maxAge}`, "domain" in e2 && e2.domain && `Domain=${e2.domain}`, "secure" in e2 && e2.secure && "Secure", "httpOnly" in e2 && e2.httpOnly && "HttpOnly", "sameSite" in e2 && e2.sameSite && `SameSite=${e2.sameSite}`, "partitioned" in e2 && e2.partitioned && "Partitioned", "priority" in e2 && e2.priority && `Priority=${e2.priority}`].filter(Boolean), n2 = `${e2.name}=${encodeURIComponent(null != (t2 = e2.value) ? t2 : "")}`;
        return 0 === r2.length ? n2 : `${n2}; ${r2.join("; ")}`;
      }
      function h(e2) {
        let t2 = /* @__PURE__ */ new Map();
        for (let r2 of e2.split(/; */)) {
          if (!r2) continue;
          let e3 = r2.indexOf("=");
          if (-1 === e3) {
            t2.set(r2, "true");
            continue;
          }
          let [n2, s2] = [r2.slice(0, e3), r2.slice(e3 + 1)];
          try {
            t2.set(n2, decodeURIComponent(null != s2 ? s2 : "true"));
          } catch {
          }
        }
        return t2;
      }
      function d(e2) {
        if (!e2) return;
        let [[t2, r2], ...n2] = h(e2), { domain: s2, expires: i2, httponly: a2, maxage: o2, path: l2, samesite: u2, secure: c2, partitioned: d2, priority: g2 } = Object.fromEntries(n2.map(([e3, t3]) => [e3.toLowerCase().replace(/-/g, ""), t3]));
        {
          var m2, y, w = { name: t2, value: decodeURIComponent(r2), domain: s2, ...i2 && { expires: new Date(i2) }, ...a2 && { httpOnly: true }, ..."string" == typeof o2 && { maxAge: Number(o2) }, path: l2, ...u2 && { sameSite: f.includes(m2 = (m2 = u2).toLowerCase()) ? m2 : void 0 }, ...c2 && { secure: true }, ...g2 && { priority: p.includes(y = (y = g2).toLowerCase()) ? y : void 0 }, ...d2 && { partitioned: true } };
          let e3 = {};
          for (let t3 in w) w[t3] && (e3[t3] = w[t3]);
          return e3;
        }
      }
      t.exports = ((e2, t2, r2, o2) => {
        if (t2 && "object" == typeof t2 || "function" == typeof t2) for (let l2 of i(t2)) a.call(e2, l2) || l2 === r2 || n(e2, l2, { get: () => t2[l2], enumerable: !(o2 = s(t2, l2)) || o2.enumerable });
        return e2;
      })(n({}, "__esModule", { value: true }), o);
      var f = ["strict", "lax", "none"], p = ["low", "medium", "high"], g = class {
        constructor(e2) {
          this._parsed = /* @__PURE__ */ new Map(), this._headers = e2;
          const t2 = e2.get("cookie");
          if (t2) for (const [e3, r2] of h(t2)) this._parsed.set(e3, { name: e3, value: r2 });
        }
        [Symbol.iterator]() {
          return this._parsed[Symbol.iterator]();
        }
        get size() {
          return this._parsed.size;
        }
        get(...e2) {
          let t2 = "string" == typeof e2[0] ? e2[0] : e2[0].name;
          return this._parsed.get(t2);
        }
        getAll(...e2) {
          var t2;
          let r2 = Array.from(this._parsed);
          if (!e2.length) return r2.map(([e3, t3]) => t3);
          let n2 = "string" == typeof e2[0] ? e2[0] : null == (t2 = e2[0]) ? void 0 : t2.name;
          return r2.filter(([e3]) => e3 === n2).map(([e3, t3]) => t3);
        }
        has(e2) {
          return this._parsed.has(e2);
        }
        set(...e2) {
          let [t2, r2] = 1 === e2.length ? [e2[0].name, e2[0].value] : e2, n2 = this._parsed;
          return n2.set(t2, { name: t2, value: r2 }), this._headers.set("cookie", Array.from(n2).map(([e3, t3]) => c(t3)).join("; ")), this;
        }
        delete(e2) {
          let t2 = this._parsed, r2 = Array.isArray(e2) ? e2.map((e3) => t2.delete(e3)) : t2.delete(e2);
          return this._headers.set("cookie", Array.from(t2).map(([e3, t3]) => c(t3)).join("; ")), r2;
        }
        clear() {
          return this.delete(Array.from(this._parsed.keys())), this;
        }
        [Symbol.for("edge-runtime.inspect.custom")]() {
          return `RequestCookies ${JSON.stringify(Object.fromEntries(this._parsed))}`;
        }
        toString() {
          return [...this._parsed.values()].map((e2) => `${e2.name}=${encodeURIComponent(e2.value)}`).join("; ");
        }
      }, m = class {
        constructor(e2) {
          var t2, r2, n2;
          this._parsed = /* @__PURE__ */ new Map(), this._headers = e2;
          const s2 = null != (n2 = null != (r2 = null == (t2 = e2.getSetCookie) ? void 0 : t2.call(e2)) ? r2 : e2.get("set-cookie")) ? n2 : [];
          for (const e3 of Array.isArray(s2) ? s2 : function(e4) {
            if (!e4) return [];
            var t3, r3, n3, s3, i2, a2 = [], o2 = 0;
            function l2() {
              for (; o2 < e4.length && /\s/.test(e4.charAt(o2)); ) o2 += 1;
              return o2 < e4.length;
            }
            for (; o2 < e4.length; ) {
              for (t3 = o2, i2 = false; l2(); ) if ("," === (r3 = e4.charAt(o2))) {
                for (n3 = o2, o2 += 1, l2(), s3 = o2; o2 < e4.length && "=" !== (r3 = e4.charAt(o2)) && ";" !== r3 && "," !== r3; ) o2 += 1;
                o2 < e4.length && "=" === e4.charAt(o2) ? (i2 = true, o2 = s3, a2.push(e4.substring(t3, n3)), t3 = o2) : o2 = n3 + 1;
              } else o2 += 1;
              (!i2 || o2 >= e4.length) && a2.push(e4.substring(t3, e4.length));
            }
            return a2;
          }(s2)) {
            const t3 = d(e3);
            t3 && this._parsed.set(t3.name, t3);
          }
        }
        get(...e2) {
          let t2 = "string" == typeof e2[0] ? e2[0] : e2[0].name;
          return this._parsed.get(t2);
        }
        getAll(...e2) {
          var t2;
          let r2 = Array.from(this._parsed.values());
          if (!e2.length) return r2;
          let n2 = "string" == typeof e2[0] ? e2[0] : null == (t2 = e2[0]) ? void 0 : t2.name;
          return r2.filter((e3) => e3.name === n2);
        }
        has(e2) {
          return this._parsed.has(e2);
        }
        set(...e2) {
          let [t2, r2, n2] = 1 === e2.length ? [e2[0].name, e2[0].value, e2[0]] : e2, s2 = this._parsed;
          return s2.set(t2, function(e3 = { name: "", value: "" }) {
            return "number" == typeof e3.expires && (e3.expires = new Date(e3.expires)), e3.maxAge && (e3.expires = new Date(Date.now() + 1e3 * e3.maxAge)), (null === e3.path || void 0 === e3.path) && (e3.path = "/"), e3;
          }({ name: t2, value: r2, ...n2 })), function(e3, t3) {
            for (let [, r3] of (t3.delete("set-cookie"), e3)) {
              let e4 = c(r3);
              t3.append("set-cookie", e4);
            }
          }(s2, this._headers), this;
        }
        delete(...e2) {
          let [t2, r2] = "string" == typeof e2[0] ? [e2[0]] : [e2[0].name, e2[0]];
          return this.set({ ...r2, name: t2, value: "", expires: /* @__PURE__ */ new Date(0) });
        }
        [Symbol.for("edge-runtime.inspect.custom")]() {
          return `ResponseCookies ${JSON.stringify(Object.fromEntries(this._parsed))}`;
        }
        toString() {
          return [...this._parsed.values()].map(c).join("; ");
        }
      };
    }, 11646, (e) => {
      "use strict";
      function t(e7) {
        return Symbol.for(e7);
      }
      var r, n, s, i, a, o, l, u, c, h, d, f, p, g = new function e7(t2) {
        var r2 = this;
        r2._currentContext = t2 ? new Map(t2) : /* @__PURE__ */ new Map(), r2.getValue = function(e9) {
          return r2._currentContext.get(e9);
        }, r2.setValue = function(t3, n2) {
          var s2 = new e7(r2._currentContext);
          return s2._currentContext.set(t3, n2), s2;
        }, r2.deleteValue = function(t3) {
          var n2 = new e7(r2._currentContext);
          return n2._currentContext.delete(t3), n2;
        };
      }(), m = function(e7, t2) {
        var r2 = "function" == typeof Symbol && e7[Symbol.iterator];
        if (!r2) return e7;
        var n2, s2, i2 = r2.call(e7), a2 = [];
        try {
          for (; (void 0 === t2 || t2-- > 0) && !(n2 = i2.next()).done; ) a2.push(n2.value);
        } catch (e9) {
          s2 = { error: e9 };
        } finally {
          try {
            n2 && !n2.done && (r2 = i2.return) && r2.call(i2);
          } finally {
            if (s2) throw s2.error;
          }
        }
        return a2;
      }, y = function(e7, t2, r2) {
        if (r2 || 2 == arguments.length) for (var n2, s2 = 0, i2 = t2.length; s2 < i2; s2++) !n2 && s2 in t2 || (n2 || (n2 = Array.prototype.slice.call(t2, 0, s2)), n2[s2] = t2[s2]);
        return e7.concat(n2 || Array.prototype.slice.call(t2));
      }, w = function() {
        function e7() {
        }
        return e7.prototype.active = function() {
          return g;
        }, e7.prototype.with = function(e9, t2, r2) {
          for (var n2 = [], s2 = 3; s2 < arguments.length; s2++) n2[s2 - 3] = arguments[s2];
          return t2.call.apply(t2, y([r2], m(n2), false));
        }, e7.prototype.bind = function(e9, t2) {
          return t2;
        }, e7.prototype.enable = function() {
          return this;
        }, e7.prototype.disable = function() {
          return this;
        }, e7;
      }(), b = "object" == typeof globalThis ? globalThis : "object" == typeof self ? self : e.g, v = "1.9.0", _ = /^(\d+)\.(\d+)\.(\d+)(-(.+))?$/, S = function(e7) {
        var t2 = /* @__PURE__ */ new Set([e7]), r2 = /* @__PURE__ */ new Set(), n2 = e7.match(_);
        if (!n2) return function() {
          return false;
        };
        var s2 = { major: +n2[1], minor: +n2[2], patch: +n2[3], prerelease: n2[4] };
        if (null != s2.prerelease) return function(t3) {
          return t3 === e7;
        };
        function i2(e9) {
          return r2.add(e9), false;
        }
        return function(e9) {
          if (t2.has(e9)) return true;
          if (r2.has(e9)) return false;
          var n3 = e9.match(_);
          if (!n3) return i2(e9);
          var a2 = { major: +n3[1], minor: +n3[2], patch: +n3[3], prerelease: n3[4] };
          if (null != a2.prerelease || s2.major !== a2.major) return i2(e9);
          if (0 === s2.major) return s2.minor === a2.minor && s2.patch <= a2.patch ? (t2.add(e9), true) : i2(e9);
          return s2.minor <= a2.minor ? (t2.add(e9), true) : i2(e9);
        };
      }(v), E = Symbol.for("opentelemetry.js.api." + v.split(".")[0]);
      function k(e7, t2, r2, n2) {
        void 0 === n2 && (n2 = false);
        var s2, i2 = b[E] = null != (s2 = b[E]) ? s2 : { version: v };
        if (!n2 && i2[e7]) {
          var a2 = Error("@opentelemetry/api: Attempted duplicate registration of API: " + e7);
          return r2.error(a2.stack || a2.message), false;
        }
        if (i2.version !== v) {
          var a2 = Error("@opentelemetry/api: Registration of version v" + i2.version + " for " + e7 + " does not match previously registered API v" + v);
          return r2.error(a2.stack || a2.message), false;
        }
        return i2[e7] = t2, r2.debug("@opentelemetry/api: Registered a global for " + e7 + " v" + v + "."), true;
      }
      function O(e7) {
        var t2, r2, n2 = null == (t2 = b[E]) ? void 0 : t2.version;
        if (n2 && S(n2)) return null == (r2 = b[E]) ? void 0 : r2[e7];
      }
      function T(e7, t2) {
        t2.debug("@opentelemetry/api: Unregistering a global for " + e7 + " v" + v + ".");
        var r2 = b[E];
        r2 && delete r2[e7];
      }
      var R = function(e7, t2) {
        var r2 = "function" == typeof Symbol && e7[Symbol.iterator];
        if (!r2) return e7;
        var n2, s2, i2 = r2.call(e7), a2 = [];
        try {
          for (; (void 0 === t2 || t2-- > 0) && !(n2 = i2.next()).done; ) a2.push(n2.value);
        } catch (e9) {
          s2 = { error: e9 };
        } finally {
          try {
            n2 && !n2.done && (r2 = i2.return) && r2.call(i2);
          } finally {
            if (s2) throw s2.error;
          }
        }
        return a2;
      }, x = function(e7, t2, r2) {
        if (r2 || 2 == arguments.length) for (var n2, s2 = 0, i2 = t2.length; s2 < i2; s2++) !n2 && s2 in t2 || (n2 || (n2 = Array.prototype.slice.call(t2, 0, s2)), n2[s2] = t2[s2]);
        return e7.concat(n2 || Array.prototype.slice.call(t2));
      }, C = function() {
        function e7(e9) {
          this._namespace = e9.namespace || "DiagComponentLogger";
        }
        return e7.prototype.debug = function() {
          for (var e9 = [], t2 = 0; t2 < arguments.length; t2++) e9[t2] = arguments[t2];
          return j("debug", this._namespace, e9);
        }, e7.prototype.error = function() {
          for (var e9 = [], t2 = 0; t2 < arguments.length; t2++) e9[t2] = arguments[t2];
          return j("error", this._namespace, e9);
        }, e7.prototype.info = function() {
          for (var e9 = [], t2 = 0; t2 < arguments.length; t2++) e9[t2] = arguments[t2];
          return j("info", this._namespace, e9);
        }, e7.prototype.warn = function() {
          for (var e9 = [], t2 = 0; t2 < arguments.length; t2++) e9[t2] = arguments[t2];
          return j("warn", this._namespace, e9);
        }, e7.prototype.verbose = function() {
          for (var e9 = [], t2 = 0; t2 < arguments.length; t2++) e9[t2] = arguments[t2];
          return j("verbose", this._namespace, e9);
        }, e7;
      }();
      function j(e7, t2, r2) {
        var n2 = O("diag");
        if (n2) return r2.unshift(t2), n2[e7].apply(n2, x([], R(r2), false));
      }
      (l = r || (r = {}))[l.NONE = 0] = "NONE", l[l.ERROR = 30] = "ERROR", l[l.WARN = 50] = "WARN", l[l.INFO = 60] = "INFO", l[l.DEBUG = 70] = "DEBUG", l[l.VERBOSE = 80] = "VERBOSE", l[l.ALL = 9999] = "ALL";
      var P = function(e7, t2) {
        var r2 = "function" == typeof Symbol && e7[Symbol.iterator];
        if (!r2) return e7;
        var n2, s2, i2 = r2.call(e7), a2 = [];
        try {
          for (; (void 0 === t2 || t2-- > 0) && !(n2 = i2.next()).done; ) a2.push(n2.value);
        } catch (e9) {
          s2 = { error: e9 };
        } finally {
          try {
            n2 && !n2.done && (r2 = i2.return) && r2.call(i2);
          } finally {
            if (s2) throw s2.error;
          }
        }
        return a2;
      }, A = function(e7, t2, r2) {
        if (r2 || 2 == arguments.length) for (var n2, s2 = 0, i2 = t2.length; s2 < i2; s2++) !n2 && s2 in t2 || (n2 || (n2 = Array.prototype.slice.call(t2, 0, s2)), n2[s2] = t2[s2]);
        return e7.concat(n2 || Array.prototype.slice.call(t2));
      }, I = function() {
        function e7() {
          function e9(e10) {
            return function() {
              for (var t3 = [], r2 = 0; r2 < arguments.length; r2++) t3[r2] = arguments[r2];
              var n2 = O("diag");
              if (n2) return n2[e10].apply(n2, A([], P(t3), false));
            };
          }
          var t2 = this;
          t2.setLogger = function(e10, n2) {
            if (void 0 === n2 && (n2 = { logLevel: r.INFO }), e10 === t2) {
              var s2, i2, a2, o2 = Error("Cannot use diag as the logger for itself. Please use a DiagLogger implementation like ConsoleDiagLogger or a custom implementation");
              return t2.error(null != (s2 = o2.stack) ? s2 : o2.message), false;
            }
            "number" == typeof n2 && (n2 = { logLevel: n2 });
            var l2 = O("diag"), u2 = function(e11, t3) {
              function n3(r2, n4) {
                var s3 = t3[r2];
                return "function" == typeof s3 && e11 >= n4 ? s3.bind(t3) : function() {
                };
              }
              return e11 < r.NONE ? e11 = r.NONE : e11 > r.ALL && (e11 = r.ALL), t3 = t3 || {}, { error: n3("error", r.ERROR), warn: n3("warn", r.WARN), info: n3("info", r.INFO), debug: n3("debug", r.DEBUG), verbose: n3("verbose", r.VERBOSE) };
            }(null != (i2 = n2.logLevel) ? i2 : r.INFO, e10);
            if (l2 && !n2.suppressOverrideMessage) {
              var c2 = null != (a2 = Error().stack) ? a2 : "<failed to generate stacktrace>";
              l2.warn("Current logger will be overwritten from " + c2), u2.warn("Current logger will overwrite one already registered from " + c2);
            }
            return k("diag", u2, t2, true);
          }, t2.disable = function() {
            T("diag", t2);
          }, t2.createComponentLogger = function(e10) {
            return new C(e10);
          }, t2.verbose = e9("verbose"), t2.debug = e9("debug"), t2.info = e9("info"), t2.warn = e9("warn"), t2.error = e9("error");
        }
        return e7.instance = function() {
          return this._instance || (this._instance = new e7()), this._instance;
        }, e7;
      }(), $ = function(e7, t2) {
        var r2 = "function" == typeof Symbol && e7[Symbol.iterator];
        if (!r2) return e7;
        var n2, s2, i2 = r2.call(e7), a2 = [];
        try {
          for (; (void 0 === t2 || t2-- > 0) && !(n2 = i2.next()).done; ) a2.push(n2.value);
        } catch (e9) {
          s2 = { error: e9 };
        } finally {
          try {
            n2 && !n2.done && (r2 = i2.return) && r2.call(i2);
          } finally {
            if (s2) throw s2.error;
          }
        }
        return a2;
      }, N = function(e7, t2, r2) {
        if (r2 || 2 == arguments.length) for (var n2, s2 = 0, i2 = t2.length; s2 < i2; s2++) !n2 && s2 in t2 || (n2 || (n2 = Array.prototype.slice.call(t2, 0, s2)), n2[s2] = t2[s2]);
        return e7.concat(n2 || Array.prototype.slice.call(t2));
      }, U = "context", D = new w(), L = function() {
        function e7() {
        }
        return e7.getInstance = function() {
          return this._instance || (this._instance = new e7()), this._instance;
        }, e7.prototype.setGlobalContextManager = function(e9) {
          return k(U, e9, I.instance());
        }, e7.prototype.active = function() {
          return this._getContextManager().active();
        }, e7.prototype.with = function(e9, t2, r2) {
          for (var n2, s2 = [], i2 = 3; i2 < arguments.length; i2++) s2[i2 - 3] = arguments[i2];
          return (n2 = this._getContextManager()).with.apply(n2, N([e9, t2, r2], $(s2), false));
        }, e7.prototype.bind = function(e9, t2) {
          return this._getContextManager().bind(e9, t2);
        }, e7.prototype._getContextManager = function() {
          return O(U) || D;
        }, e7.prototype.disable = function() {
          this._getContextManager().disable(), T(U, I.instance());
        }, e7;
      }(), q = L.getInstance(), B = I.instance(), M = (u = function(e7, t2) {
        return (u = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(e9, t3) {
          e9.__proto__ = t3;
        } || function(e9, t3) {
          for (var r2 in t3) Object.prototype.hasOwnProperty.call(t3, r2) && (e9[r2] = t3[r2]);
        })(e7, t2);
      }, function(e7, t2) {
        if ("function" != typeof t2 && null !== t2) throw TypeError("Class extends value " + String(t2) + " is not a constructor or null");
        function r2() {
          this.constructor = e7;
        }
        u(e7, t2), e7.prototype = null === t2 ? Object.create(t2) : (r2.prototype = t2.prototype, new r2());
      }), W = function() {
        function e7() {
        }
        return e7.prototype.createGauge = function(e9, t2) {
          return ee;
        }, e7.prototype.createHistogram = function(e9, t2) {
          return et;
        }, e7.prototype.createCounter = function(e9, t2) {
          return Z;
        }, e7.prototype.createUpDownCounter = function(e9, t2) {
          return er;
        }, e7.prototype.createObservableGauge = function(e9, t2) {
          return es;
        }, e7.prototype.createObservableCounter = function(e9, t2) {
          return en;
        }, e7.prototype.createObservableUpDownCounter = function(e9, t2) {
          return ei;
        }, e7.prototype.addBatchObservableCallback = function(e9, t2) {
        }, e7.prototype.removeBatchObservableCallback = function(e9) {
        }, e7;
      }(), H = function() {
      }, V = function(e7) {
        function t2() {
          return null !== e7 && e7.apply(this, arguments) || this;
        }
        return M(t2, e7), t2.prototype.add = function(e9, t3) {
        }, t2;
      }(H), z = function(e7) {
        function t2() {
          return null !== e7 && e7.apply(this, arguments) || this;
        }
        return M(t2, e7), t2.prototype.add = function(e9, t3) {
        }, t2;
      }(H), F = function(e7) {
        function t2() {
          return null !== e7 && e7.apply(this, arguments) || this;
        }
        return M(t2, e7), t2.prototype.record = function(e9, t3) {
        }, t2;
      }(H), K = function(e7) {
        function t2() {
          return null !== e7 && e7.apply(this, arguments) || this;
        }
        return M(t2, e7), t2.prototype.record = function(e9, t3) {
        }, t2;
      }(H), G = function() {
        function e7() {
        }
        return e7.prototype.addCallback = function(e9) {
        }, e7.prototype.removeCallback = function(e9) {
        }, e7;
      }(), J = function(e7) {
        function t2() {
          return null !== e7 && e7.apply(this, arguments) || this;
        }
        return M(t2, e7), t2;
      }(G), X = function(e7) {
        function t2() {
          return null !== e7 && e7.apply(this, arguments) || this;
        }
        return M(t2, e7), t2;
      }(G), Y = function(e7) {
        function t2() {
          return null !== e7 && e7.apply(this, arguments) || this;
        }
        return M(t2, e7), t2;
      }(G), Q = new W(), Z = new V(), ee = new F(), et = new K(), er = new z(), en = new J(), es = new X(), ei = new Y();
      function ea() {
        return Q;
      }
      var eo = new (function() {
        function e7() {
        }
        return e7.prototype.getMeter = function(e9, t2, r2) {
          return Q;
        }, e7;
      }())(), el = "metrics", eu = function() {
        function e7() {
        }
        return e7.getInstance = function() {
          return this._instance || (this._instance = new e7()), this._instance;
        }, e7.prototype.setGlobalMeterProvider = function(e9) {
          return k(el, e9, I.instance());
        }, e7.prototype.getMeterProvider = function() {
          return O(el) || eo;
        }, e7.prototype.getMeter = function(e9, t2, r2) {
          return this.getMeterProvider().getMeter(e9, t2, r2);
        }, e7.prototype.disable = function() {
          T(el, I.instance());
        }, e7;
      }().getInstance(), ec = function() {
        function e7() {
        }
        return e7.prototype.inject = function(e9, t2) {
        }, e7.prototype.extract = function(e9, t2) {
          return e9;
        }, e7.prototype.fields = function() {
          return [];
        }, e7;
      }(), eh = { get: function(e7, t2) {
        if (null != e7) return e7[t2];
      }, keys: function(e7) {
        return null == e7 ? [] : Object.keys(e7);
      } }, ed = { set: function(e7, t2, r2) {
        null != e7 && (e7[t2] = r2);
      } }, ef = t("OpenTelemetry Baggage Key");
      function ep(e7) {
        return e7.getValue(ef) || void 0;
      }
      function eg() {
        return ep(L.getInstance().active());
      }
      function em(e7, t2) {
        return e7.setValue(ef, t2);
      }
      function ey(e7) {
        return e7.deleteValue(ef);
      }
      var ew = function(e7, t2) {
        var r2 = "function" == typeof Symbol && e7[Symbol.iterator];
        if (!r2) return e7;
        var n2, s2, i2 = r2.call(e7), a2 = [];
        try {
          for (; (void 0 === t2 || t2-- > 0) && !(n2 = i2.next()).done; ) a2.push(n2.value);
        } catch (e9) {
          s2 = { error: e9 };
        } finally {
          try {
            n2 && !n2.done && (r2 = i2.return) && r2.call(i2);
          } finally {
            if (s2) throw s2.error;
          }
        }
        return a2;
      }, eb = function(e7) {
        var t2 = "function" == typeof Symbol && Symbol.iterator, r2 = t2 && e7[t2], n2 = 0;
        if (r2) return r2.call(e7);
        if (e7 && "number" == typeof e7.length) return { next: function() {
          return e7 && n2 >= e7.length && (e7 = void 0), { value: e7 && e7[n2++], done: !e7 };
        } };
        throw TypeError(t2 ? "Object is not iterable." : "Symbol.iterator is not defined.");
      }, ev = function() {
        function e7(e9) {
          this._entries = e9 ? new Map(e9) : /* @__PURE__ */ new Map();
        }
        return e7.prototype.getEntry = function(e9) {
          var t2 = this._entries.get(e9);
          if (t2) return Object.assign({}, t2);
        }, e7.prototype.getAllEntries = function() {
          return Array.from(this._entries.entries()).map(function(e9) {
            var t2 = ew(e9, 2);
            return [t2[0], t2[1]];
          });
        }, e7.prototype.setEntry = function(t2, r2) {
          var n2 = new e7(this._entries);
          return n2._entries.set(t2, r2), n2;
        }, e7.prototype.removeEntry = function(t2) {
          var r2 = new e7(this._entries);
          return r2._entries.delete(t2), r2;
        }, e7.prototype.removeEntries = function() {
          for (var t2, r2, n2 = [], s2 = 0; s2 < arguments.length; s2++) n2[s2] = arguments[s2];
          var i2 = new e7(this._entries);
          try {
            for (var a2 = eb(n2), o2 = a2.next(); !o2.done; o2 = a2.next()) {
              var l2 = o2.value;
              i2._entries.delete(l2);
            }
          } catch (e9) {
            t2 = { error: e9 };
          } finally {
            try {
              o2 && !o2.done && (r2 = a2.return) && r2.call(a2);
            } finally {
              if (t2) throw t2.error;
            }
          }
          return i2;
        }, e7.prototype.clear = function() {
          return new e7();
        }, e7;
      }(), e_ = Symbol("BaggageEntryMetadata"), eS = I.instance();
      function eE(e7) {
        return void 0 === e7 && (e7 = {}), new ev(new Map(Object.entries(e7)));
      }
      function ek(e7) {
        return "string" != typeof e7 && (eS.error("Cannot create baggage metadata from unknown type: " + typeof e7), e7 = ""), { __TYPE__: e_, toString: function() {
          return e7;
        } };
      }
      var eO = "propagation", eT = new ec(), eR = function() {
        function e7() {
          this.createBaggage = eE, this.getBaggage = ep, this.getActiveBaggage = eg, this.setBaggage = em, this.deleteBaggage = ey;
        }
        return e7.getInstance = function() {
          return this._instance || (this._instance = new e7()), this._instance;
        }, e7.prototype.setGlobalPropagator = function(e9) {
          return k(eO, e9, I.instance());
        }, e7.prototype.inject = function(e9, t2, r2) {
          return void 0 === r2 && (r2 = ed), this._getGlobalPropagator().inject(e9, t2, r2);
        }, e7.prototype.extract = function(e9, t2, r2) {
          return void 0 === r2 && (r2 = eh), this._getGlobalPropagator().extract(e9, t2, r2);
        }, e7.prototype.fields = function() {
          return this._getGlobalPropagator().fields();
        }, e7.prototype.disable = function() {
          T(eO, I.instance());
        }, e7.prototype._getGlobalPropagator = function() {
          return O(eO) || eT;
        }, e7;
      }().getInstance();
      (c = n || (n = {}))[c.NONE = 0] = "NONE", c[c.SAMPLED = 1] = "SAMPLED";
      var ex = "0000000000000000", eC = "00000000000000000000000000000000", ej = { traceId: eC, spanId: ex, traceFlags: n.NONE }, eP = function() {
        function e7(e9) {
          void 0 === e9 && (e9 = ej), this._spanContext = e9;
        }
        return e7.prototype.spanContext = function() {
          return this._spanContext;
        }, e7.prototype.setAttribute = function(e9, t2) {
          return this;
        }, e7.prototype.setAttributes = function(e9) {
          return this;
        }, e7.prototype.addEvent = function(e9, t2) {
          return this;
        }, e7.prototype.addLink = function(e9) {
          return this;
        }, e7.prototype.addLinks = function(e9) {
          return this;
        }, e7.prototype.setStatus = function(e9) {
          return this;
        }, e7.prototype.updateName = function(e9) {
          return this;
        }, e7.prototype.end = function(e9) {
        }, e7.prototype.isRecording = function() {
          return false;
        }, e7.prototype.recordException = function(e9, t2) {
        }, e7;
      }(), eA = t("OpenTelemetry Context Key SPAN");
      function eI(e7) {
        return e7.getValue(eA) || void 0;
      }
      function e$() {
        return eI(L.getInstance().active());
      }
      function eN(e7, t2) {
        return e7.setValue(eA, t2);
      }
      function eU(e7) {
        return e7.deleteValue(eA);
      }
      function eD(e7, t2) {
        return eN(e7, new eP(t2));
      }
      function eL(e7) {
        var t2;
        return null == (t2 = eI(e7)) ? void 0 : t2.spanContext();
      }
      var eq = /^([0-9a-f]{32})$/i, eB = /^[0-9a-f]{16}$/i;
      function eM(e7) {
        return eq.test(e7) && e7 !== eC;
      }
      function eW(e7) {
        return eB.test(e7) && e7 !== ex;
      }
      function eH(e7) {
        return eM(e7.traceId) && eW(e7.spanId);
      }
      function eV(e7) {
        return new eP(e7);
      }
      var ez = L.getInstance(), eF = function() {
        function e7() {
        }
        return e7.prototype.startSpan = function(e9, t2, r2) {
          if (void 0 === r2 && (r2 = ez.active()), null == t2 ? void 0 : t2.root) return new eP();
          var n2, s2 = r2 && eL(r2);
          return "object" == typeof (n2 = s2) && "string" == typeof n2.spanId && "string" == typeof n2.traceId && "number" == typeof n2.traceFlags && eH(s2) ? new eP(s2) : new eP();
        }, e7.prototype.startActiveSpan = function(e9, t2, r2, n2) {
          if (!(arguments.length < 2)) {
            2 == arguments.length ? a2 = t2 : 3 == arguments.length ? (s2 = t2, a2 = r2) : (s2 = t2, i2 = r2, a2 = n2);
            var s2, i2, a2, o2 = null != i2 ? i2 : ez.active(), l2 = this.startSpan(e9, s2, o2), u2 = eN(o2, l2);
            return ez.with(u2, a2, void 0, l2);
          }
        }, e7;
      }(), eK = new eF(), eG = function() {
        function e7(e9, t2, r2, n2) {
          this._provider = e9, this.name = t2, this.version = r2, this.options = n2;
        }
        return e7.prototype.startSpan = function(e9, t2, r2) {
          return this._getTracer().startSpan(e9, t2, r2);
        }, e7.prototype.startActiveSpan = function(e9, t2, r2, n2) {
          var s2 = this._getTracer();
          return Reflect.apply(s2.startActiveSpan, s2, arguments);
        }, e7.prototype._getTracer = function() {
          if (this._delegate) return this._delegate;
          var e9 = this._provider.getDelegateTracer(this.name, this.version, this.options);
          return e9 ? (this._delegate = e9, this._delegate) : eK;
        }, e7;
      }(), eJ = new (function() {
        function e7() {
        }
        return e7.prototype.getTracer = function(e9, t2, r2) {
          return new eF();
        }, e7;
      }())(), eX = function() {
        function e7() {
        }
        return e7.prototype.getTracer = function(e9, t2, r2) {
          var n2;
          return null != (n2 = this.getDelegateTracer(e9, t2, r2)) ? n2 : new eG(this, e9, t2, r2);
        }, e7.prototype.getDelegate = function() {
          var e9;
          return null != (e9 = this._delegate) ? e9 : eJ;
        }, e7.prototype.setDelegate = function(e9) {
          this._delegate = e9;
        }, e7.prototype.getDelegateTracer = function(e9, t2, r2) {
          var n2;
          return null == (n2 = this._delegate) ? void 0 : n2.getTracer(e9, t2, r2);
        }, e7;
      }(), eY = "trace", eQ = function() {
        function e7() {
          this._proxyTracerProvider = new eX(), this.wrapSpanContext = eV, this.isSpanContextValid = eH, this.deleteSpan = eU, this.getSpan = eI, this.getActiveSpan = e$, this.getSpanContext = eL, this.setSpan = eN, this.setSpanContext = eD;
        }
        return e7.getInstance = function() {
          return this._instance || (this._instance = new e7()), this._instance;
        }, e7.prototype.setGlobalTracerProvider = function(e9) {
          var t2 = k(eY, this._proxyTracerProvider, I.instance());
          return t2 && this._proxyTracerProvider.setDelegate(e9), t2;
        }, e7.prototype.getTracerProvider = function() {
          return O(eY) || this._proxyTracerProvider;
        }, e7.prototype.getTracer = function(e9, t2) {
          return this.getTracerProvider().getTracer(e9, t2);
        }, e7.prototype.disable = function() {
          T(eY, I.instance()), this._proxyTracerProvider = new eX();
        }, e7;
      }().getInstance();
      let eZ = { context: q, diag: B, metrics: eu, propagation: eR, trace: eQ };
      e.s(["default", 0, eZ], 47071), e.i(47071);
      var e0 = [{ n: "error", c: "error" }, { n: "warn", c: "warn" }, { n: "info", c: "info" }, { n: "debug", c: "debug" }, { n: "verbose", c: "trace" }], e1 = function() {
        for (var e7 = 0; e7 < e0.length; e7++) this[e0[e7].n] = /* @__PURE__ */ function(e9) {
          return function() {
            for (var t2 = [], r2 = 0; r2 < arguments.length; r2++) t2[r2] = arguments[r2];
            if (console) {
              var n2 = console[e9];
              if ("function" != typeof n2 && (n2 = console.log), "function" == typeof n2) return n2.apply(console, t2);
            }
          };
        }(e0[e7].c);
      };
      (h = s || (s = {}))[h.INT = 0] = "INT", h[h.DOUBLE = 1] = "DOUBLE", (d = i || (i = {}))[d.NOT_RECORD = 0] = "NOT_RECORD", d[d.RECORD = 1] = "RECORD", d[d.RECORD_AND_SAMPLED = 2] = "RECORD_AND_SAMPLED", (f = a || (a = {}))[f.INTERNAL = 0] = "INTERNAL", f[f.SERVER = 1] = "SERVER", f[f.CLIENT = 2] = "CLIENT", f[f.PRODUCER = 3] = "PRODUCER", f[f.CONSUMER = 4] = "CONSUMER", (p = o || (o = {}))[p.UNSET = 0] = "UNSET", p[p.OK = 1] = "OK", p[p.ERROR = 2] = "ERROR";
      var e2 = "[_0-9a-z-*/]", e3 = RegExp("^(?:[a-z]" + e2 + "{0,255}|" + ("[a-z0-9]" + e2 + "{0,240}@[a-z]") + e2 + "{0,13})$"), e4 = /^[ -~]{0,255}[!-~]$/, e5 = /,|=/, e6 = function() {
        function e7(e9) {
          this._internalState = /* @__PURE__ */ new Map(), e9 && this._parse(e9);
        }
        return e7.prototype.set = function(e9, t2) {
          var r2 = this._clone();
          return r2._internalState.has(e9) && r2._internalState.delete(e9), r2._internalState.set(e9, t2), r2;
        }, e7.prototype.unset = function(e9) {
          var t2 = this._clone();
          return t2._internalState.delete(e9), t2;
        }, e7.prototype.get = function(e9) {
          return this._internalState.get(e9);
        }, e7.prototype.serialize = function() {
          var e9 = this;
          return this._keys().reduce(function(t2, r2) {
            return t2.push(r2 + "=" + e9.get(r2)), t2;
          }, []).join(",");
        }, e7.prototype._parse = function(e9) {
          !(e9.length > 512) && (this._internalState = e9.split(",").reverse().reduce(function(e10, t2) {
            var r2 = t2.trim(), n2 = r2.indexOf("=");
            if (-1 !== n2) {
              var s2 = r2.slice(0, n2), i2 = r2.slice(n2 + 1, t2.length);
              e3.test(s2) && e4.test(i2) && !e5.test(i2) && e10.set(s2, i2);
            }
            return e10;
          }, /* @__PURE__ */ new Map()), this._internalState.size > 32 && (this._internalState = new Map(Array.from(this._internalState.entries()).reverse().slice(0, 32))));
        }, e7.prototype._keys = function() {
          return Array.from(this._internalState.keys()).reverse();
        }, e7.prototype._clone = function() {
          var t2 = new e7();
          return t2._internalState = new Map(this._internalState), t2;
        }, e7;
      }();
      function e8(e7) {
        return new e6(e7);
      }
      e.s(["DiagConsoleLogger", () => e1, "DiagLogLevel", () => r, "INVALID_SPANID", () => ex, "INVALID_SPAN_CONTEXT", () => ej, "INVALID_TRACEID", () => eC, "ProxyTracer", () => eG, "ProxyTracerProvider", () => eX, "ROOT_CONTEXT", () => g, "SamplingDecision", () => i, "SpanKind", () => a, "SpanStatusCode", () => o, "TraceFlags", () => n, "ValueType", () => s, "baggageEntryMetadataFromString", () => ek, "context", () => q, "createContextKey", () => t, "createNoopMeter", () => ea, "createTraceState", () => e8, "default", 0, eZ, "defaultTextMapGetter", () => eh, "defaultTextMapSetter", () => ed, "diag", () => B, "isSpanContextValid", () => eH, "isValidSpanId", () => eW, "isValidTraceId", () => eM, "metrics", () => eu, "propagation", () => eR, "trace", () => eQ], 11646);
    }, 71498, (e, t, r) => {
      (() => {
        "use strict";
        "undefined" != typeof __nccwpck_require__ && (__nccwpck_require__.ab = "/ROOT/node_modules/next/dist/compiled/cookie/");
        var e2, r2, n, s, i = {};
        i.parse = function(t2, r3) {
          if ("string" != typeof t2) throw TypeError("argument str must be a string");
          for (var s2 = {}, i2 = t2.split(n), a = (r3 || {}).decode || e2, o = 0; o < i2.length; o++) {
            var l = i2[o], u = l.indexOf("=");
            if (!(u < 0)) {
              var c = l.substr(0, u).trim(), h = l.substr(++u, l.length).trim();
              '"' == h[0] && (h = h.slice(1, -1)), void 0 == s2[c] && (s2[c] = function(e3, t3) {
                try {
                  return t3(e3);
                } catch (t4) {
                  return e3;
                }
              }(h, a));
            }
          }
          return s2;
        }, i.serialize = function(e3, t2, n2) {
          var i2 = n2 || {}, a = i2.encode || r2;
          if ("function" != typeof a) throw TypeError("option encode is invalid");
          if (!s.test(e3)) throw TypeError("argument name is invalid");
          var o = a(t2);
          if (o && !s.test(o)) throw TypeError("argument val is invalid");
          var l = e3 + "=" + o;
          if (null != i2.maxAge) {
            var u = i2.maxAge - 0;
            if (isNaN(u) || !isFinite(u)) throw TypeError("option maxAge is invalid");
            l += "; Max-Age=" + Math.floor(u);
          }
          if (i2.domain) {
            if (!s.test(i2.domain)) throw TypeError("option domain is invalid");
            l += "; Domain=" + i2.domain;
          }
          if (i2.path) {
            if (!s.test(i2.path)) throw TypeError("option path is invalid");
            l += "; Path=" + i2.path;
          }
          if (i2.expires) {
            if ("function" != typeof i2.expires.toUTCString) throw TypeError("option expires is invalid");
            l += "; Expires=" + i2.expires.toUTCString();
          }
          if (i2.httpOnly && (l += "; HttpOnly"), i2.secure && (l += "; Secure"), i2.sameSite) switch ("string" == typeof i2.sameSite ? i2.sameSite.toLowerCase() : i2.sameSite) {
            case true:
            case "strict":
              l += "; SameSite=Strict";
              break;
            case "lax":
              l += "; SameSite=Lax";
              break;
            case "none":
              l += "; SameSite=None";
              break;
            default:
              throw TypeError("option sameSite is invalid");
          }
          return l;
        }, e2 = decodeURIComponent, r2 = encodeURIComponent, n = /; */, s = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/, t.exports = i;
      })();
    }, 99734, (e, t, r) => {
      (() => {
        "use strict";
        let e2, r2, n, s, i;
        var a = { 993: (e3) => {
          var t2 = Object.prototype.hasOwnProperty, r3 = "~";
          function n2() {
          }
          function s2(e4, t3, r4) {
            this.fn = e4, this.context = t3, this.once = r4 || false;
          }
          function i2(e4, t3, n3, i3, a3) {
            if ("function" != typeof n3) throw TypeError("The listener must be a function");
            var o3 = new s2(n3, i3 || e4, a3), l2 = r3 ? r3 + t3 : t3;
            return e4._events[l2] ? e4._events[l2].fn ? e4._events[l2] = [e4._events[l2], o3] : e4._events[l2].push(o3) : (e4._events[l2] = o3, e4._eventsCount++), e4;
          }
          function a2(e4, t3) {
            0 == --e4._eventsCount ? e4._events = new n2() : delete e4._events[t3];
          }
          function o2() {
            this._events = new n2(), this._eventsCount = 0;
          }
          Object.create && (n2.prototype = /* @__PURE__ */ Object.create(null), new n2().__proto__ || (r3 = false)), o2.prototype.eventNames = function() {
            var e4, n3, s3 = [];
            if (0 === this._eventsCount) return s3;
            for (n3 in e4 = this._events) t2.call(e4, n3) && s3.push(r3 ? n3.slice(1) : n3);
            return Object.getOwnPropertySymbols ? s3.concat(Object.getOwnPropertySymbols(e4)) : s3;
          }, o2.prototype.listeners = function(e4) {
            var t3 = r3 ? r3 + e4 : e4, n3 = this._events[t3];
            if (!n3) return [];
            if (n3.fn) return [n3.fn];
            for (var s3 = 0, i3 = n3.length, a3 = Array(i3); s3 < i3; s3++) a3[s3] = n3[s3].fn;
            return a3;
          }, o2.prototype.listenerCount = function(e4) {
            var t3 = r3 ? r3 + e4 : e4, n3 = this._events[t3];
            return n3 ? n3.fn ? 1 : n3.length : 0;
          }, o2.prototype.emit = function(e4, t3, n3, s3, i3, a3) {
            var o3 = r3 ? r3 + e4 : e4;
            if (!this._events[o3]) return false;
            var l2, u2, c = this._events[o3], h = arguments.length;
            if (c.fn) {
              switch (c.once && this.removeListener(e4, c.fn, void 0, true), h) {
                case 1:
                  return c.fn.call(c.context), true;
                case 2:
                  return c.fn.call(c.context, t3), true;
                case 3:
                  return c.fn.call(c.context, t3, n3), true;
                case 4:
                  return c.fn.call(c.context, t3, n3, s3), true;
                case 5:
                  return c.fn.call(c.context, t3, n3, s3, i3), true;
                case 6:
                  return c.fn.call(c.context, t3, n3, s3, i3, a3), true;
              }
              for (u2 = 1, l2 = Array(h - 1); u2 < h; u2++) l2[u2 - 1] = arguments[u2];
              c.fn.apply(c.context, l2);
            } else {
              var d, f = c.length;
              for (u2 = 0; u2 < f; u2++) switch (c[u2].once && this.removeListener(e4, c[u2].fn, void 0, true), h) {
                case 1:
                  c[u2].fn.call(c[u2].context);
                  break;
                case 2:
                  c[u2].fn.call(c[u2].context, t3);
                  break;
                case 3:
                  c[u2].fn.call(c[u2].context, t3, n3);
                  break;
                case 4:
                  c[u2].fn.call(c[u2].context, t3, n3, s3);
                  break;
                default:
                  if (!l2) for (d = 1, l2 = Array(h - 1); d < h; d++) l2[d - 1] = arguments[d];
                  c[u2].fn.apply(c[u2].context, l2);
              }
            }
            return true;
          }, o2.prototype.on = function(e4, t3, r4) {
            return i2(this, e4, t3, r4, false);
          }, o2.prototype.once = function(e4, t3, r4) {
            return i2(this, e4, t3, r4, true);
          }, o2.prototype.removeListener = function(e4, t3, n3, s3) {
            var i3 = r3 ? r3 + e4 : e4;
            if (!this._events[i3]) return this;
            if (!t3) return a2(this, i3), this;
            var o3 = this._events[i3];
            if (o3.fn) o3.fn !== t3 || s3 && !o3.once || n3 && o3.context !== n3 || a2(this, i3);
            else {
              for (var l2 = 0, u2 = [], c = o3.length; l2 < c; l2++) (o3[l2].fn !== t3 || s3 && !o3[l2].once || n3 && o3[l2].context !== n3) && u2.push(o3[l2]);
              u2.length ? this._events[i3] = 1 === u2.length ? u2[0] : u2 : a2(this, i3);
            }
            return this;
          }, o2.prototype.removeAllListeners = function(e4) {
            var t3;
            return e4 ? (t3 = r3 ? r3 + e4 : e4, this._events[t3] && a2(this, t3)) : (this._events = new n2(), this._eventsCount = 0), this;
          }, o2.prototype.off = o2.prototype.removeListener, o2.prototype.addListener = o2.prototype.on, o2.prefixed = r3, o2.EventEmitter = o2, e3.exports = o2;
        }, 213: (e3) => {
          e3.exports = (e4, t2) => (t2 = t2 || (() => {
          }), e4.then((e5) => new Promise((e6) => {
            e6(t2());
          }).then(() => e5), (e5) => new Promise((e6) => {
            e6(t2());
          }).then(() => {
            throw e5;
          })));
        }, 574: (e3, t2) => {
          Object.defineProperty(t2, "__esModule", { value: true }), t2.default = function(e4, t3, r3) {
            let n2 = 0, s2 = e4.length;
            for (; s2 > 0; ) {
              let i2 = s2 / 2 | 0, a2 = n2 + i2;
              0 >= r3(e4[a2], t3) ? (n2 = ++a2, s2 -= i2 + 1) : s2 = i2;
            }
            return n2;
          };
        }, 821: (e3, t2, r3) => {
          Object.defineProperty(t2, "__esModule", { value: true });
          let n2 = r3(574);
          t2.default = class {
            constructor() {
              this._queue = [];
            }
            enqueue(e4, t3) {
              let r4 = { priority: (t3 = Object.assign({ priority: 0 }, t3)).priority, run: e4 };
              if (this.size && this._queue[this.size - 1].priority >= t3.priority) return void this._queue.push(r4);
              let s2 = n2.default(this._queue, r4, (e5, t4) => t4.priority - e5.priority);
              this._queue.splice(s2, 0, r4);
            }
            dequeue() {
              let e4 = this._queue.shift();
              return null == e4 ? void 0 : e4.run;
            }
            filter(e4) {
              return this._queue.filter((t3) => t3.priority === e4.priority).map((e5) => e5.run);
            }
            get size() {
              return this._queue.length;
            }
          };
        }, 816: (e3, t2, r3) => {
          let n2 = r3(213);
          class s2 extends Error {
            constructor(e4) {
              super(e4), this.name = "TimeoutError";
            }
          }
          let i2 = (e4, t3, r4) => new Promise((i3, a2) => {
            if ("number" != typeof t3 || t3 < 0) throw TypeError("Expected `milliseconds` to be a positive number");
            if (t3 === 1 / 0) return void i3(e4);
            let o2 = setTimeout(() => {
              if ("function" == typeof r4) {
                try {
                  i3(r4());
                } catch (e5) {
                  a2(e5);
                }
                return;
              }
              let n3 = "string" == typeof r4 ? r4 : `Promise timed out after ${t3} milliseconds`, o3 = r4 instanceof Error ? r4 : new s2(n3);
              "function" == typeof e4.cancel && e4.cancel(), a2(o3);
            }, t3);
            n2(e4.then(i3, a2), () => {
              clearTimeout(o2);
            });
          });
          e3.exports = i2, e3.exports.default = i2, e3.exports.TimeoutError = s2;
        } }, o = {};
        function l(e3) {
          var t2 = o[e3];
          if (void 0 !== t2) return t2.exports;
          var r3 = o[e3] = { exports: {} }, n2 = true;
          try {
            a[e3](r3, r3.exports, l), n2 = false;
          } finally {
            n2 && delete o[e3];
          }
          return r3.exports;
        }
        l.ab = "/ROOT/node_modules/next/dist/compiled/p-queue/";
        var u = {};
        Object.defineProperty(u, "__esModule", { value: true }), e2 = l(993), r2 = l(816), n = l(821), s = () => {
        }, i = new r2.TimeoutError(), u.default = class extends e2 {
          constructor(e3) {
            var t2, r3, i2, a2;
            if (super(), this._intervalCount = 0, this._intervalEnd = 0, this._pendingCount = 0, this._resolveEmpty = s, this._resolveIdle = s, !("number" == typeof (e3 = Object.assign({ carryoverConcurrencyCount: false, intervalCap: 1 / 0, interval: 0, concurrency: 1 / 0, autoStart: true, queueClass: n.default }, e3)).intervalCap && e3.intervalCap >= 1)) throw TypeError(`Expected \`intervalCap\` to be a number from 1 and up, got \`${null != (r3 = null == (t2 = e3.intervalCap) ? void 0 : t2.toString()) ? r3 : ""}\` (${typeof e3.intervalCap})`);
            if (void 0 === e3.interval || !(Number.isFinite(e3.interval) && e3.interval >= 0)) throw TypeError(`Expected \`interval\` to be a finite number >= 0, got \`${null != (a2 = null == (i2 = e3.interval) ? void 0 : i2.toString()) ? a2 : ""}\` (${typeof e3.interval})`);
            this._carryoverConcurrencyCount = e3.carryoverConcurrencyCount, this._isIntervalIgnored = e3.intervalCap === 1 / 0 || 0 === e3.interval, this._intervalCap = e3.intervalCap, this._interval = e3.interval, this._queue = new e3.queueClass(), this._queueClass = e3.queueClass, this.concurrency = e3.concurrency, this._timeout = e3.timeout, this._throwOnTimeout = true === e3.throwOnTimeout, this._isPaused = false === e3.autoStart;
          }
          get _doesIntervalAllowAnother() {
            return this._isIntervalIgnored || this._intervalCount < this._intervalCap;
          }
          get _doesConcurrentAllowAnother() {
            return this._pendingCount < this._concurrency;
          }
          _next() {
            this._pendingCount--, this._tryToStartAnother(), this.emit("next");
          }
          _resolvePromises() {
            this._resolveEmpty(), this._resolveEmpty = s, 0 === this._pendingCount && (this._resolveIdle(), this._resolveIdle = s, this.emit("idle"));
          }
          _onResumeInterval() {
            this._onInterval(), this._initializeIntervalIfNeeded(), this._timeoutId = void 0;
          }
          _isIntervalPaused() {
            let e3 = Date.now();
            if (void 0 === this._intervalId) {
              let t2 = this._intervalEnd - e3;
              if (!(t2 < 0)) return void 0 === this._timeoutId && (this._timeoutId = setTimeout(() => {
                this._onResumeInterval();
              }, t2)), true;
              this._intervalCount = this._carryoverConcurrencyCount ? this._pendingCount : 0;
            }
            return false;
          }
          _tryToStartAnother() {
            if (0 === this._queue.size) return this._intervalId && clearInterval(this._intervalId), this._intervalId = void 0, this._resolvePromises(), false;
            if (!this._isPaused) {
              let e3 = !this._isIntervalPaused();
              if (this._doesIntervalAllowAnother && this._doesConcurrentAllowAnother) {
                let t2 = this._queue.dequeue();
                return !!t2 && (this.emit("active"), t2(), e3 && this._initializeIntervalIfNeeded(), true);
              }
            }
            return false;
          }
          _initializeIntervalIfNeeded() {
            this._isIntervalIgnored || void 0 !== this._intervalId || (this._intervalId = setInterval(() => {
              this._onInterval();
            }, this._interval), this._intervalEnd = Date.now() + this._interval);
          }
          _onInterval() {
            0 === this._intervalCount && 0 === this._pendingCount && this._intervalId && (clearInterval(this._intervalId), this._intervalId = void 0), this._intervalCount = this._carryoverConcurrencyCount ? this._pendingCount : 0, this._processQueue();
          }
          _processQueue() {
            for (; this._tryToStartAnother(); ) ;
          }
          get concurrency() {
            return this._concurrency;
          }
          set concurrency(e3) {
            if (!("number" == typeof e3 && e3 >= 1)) throw TypeError(`Expected \`concurrency\` to be a number from 1 and up, got \`${e3}\` (${typeof e3})`);
            this._concurrency = e3, this._processQueue();
          }
          async add(e3, t2 = {}) {
            return new Promise((n2, s2) => {
              let a2 = async () => {
                this._pendingCount++, this._intervalCount++;
                try {
                  let a3 = void 0 === this._timeout && void 0 === t2.timeout ? e3() : r2.default(Promise.resolve(e3()), void 0 === t2.timeout ? this._timeout : t2.timeout, () => {
                    (void 0 === t2.throwOnTimeout ? this._throwOnTimeout : t2.throwOnTimeout) && s2(i);
                  });
                  n2(await a3);
                } catch (e4) {
                  s2(e4);
                }
                this._next();
              };
              this._queue.enqueue(a2, t2), this._tryToStartAnother(), this.emit("add");
            });
          }
          async addAll(e3, t2) {
            return Promise.all(e3.map(async (e4) => this.add(e4, t2)));
          }
          start() {
            return this._isPaused && (this._isPaused = false, this._processQueue()), this;
          }
          pause() {
            this._isPaused = true;
          }
          clear() {
            this._queue = new this._queueClass();
          }
          async onEmpty() {
            if (0 !== this._queue.size) return new Promise((e3) => {
              let t2 = this._resolveEmpty;
              this._resolveEmpty = () => {
                t2(), e3();
              };
            });
          }
          async onIdle() {
            if (0 !== this._pendingCount || 0 !== this._queue.size) return new Promise((e3) => {
              let t2 = this._resolveIdle;
              this._resolveIdle = () => {
                t2(), e3();
              };
            });
          }
          get size() {
            return this._queue.size;
          }
          sizeBy(e3) {
            return this._queue.filter(e3).length;
          }
          get pending() {
            return this._pendingCount;
          }
          get isPaused() {
            return this._isPaused;
          }
          get timeout() {
            return this._timeout;
          }
          set timeout(e3) {
            this._timeout = e3;
          }
        }, t.exports = u;
      })();
    }, 51615, (e, t, r) => {
      t.exports = e.x("node:buffer", () => (init_node_buffer(), __toCommonJS(node_buffer_exports)));
    }, 78500, (e, t, r) => {
      t.exports = e.x("node:async_hooks", () => (init_node_async_hooks(), __toCommonJS(node_async_hooks_exports)));
    }, 25085, (e, t, r) => {
      "use strict";
      Object.defineProperty(r, "__esModule", { value: true });
      var n = { getTestReqInfo: function() {
        return l;
      }, withRequest: function() {
        return o;
      } };
      for (var s in n) Object.defineProperty(r, s, { enumerable: true, get: n[s] });
      let i = new (e.r(78500)).AsyncLocalStorage();
      function a(e2, t2) {
        let r2 = t2.header(e2, "next-test-proxy-port");
        if (!r2) return;
        let n2 = t2.url(e2);
        return { url: n2, proxyPort: Number(r2), testData: t2.header(e2, "next-test-data") || "" };
      }
      function o(e2, t2, r2) {
        let n2 = a(e2, t2);
        return n2 ? i.run(n2, r2) : r2();
      }
      function l(e2, t2) {
        let r2 = i.getStore();
        return r2 || (e2 && t2 ? a(e2, t2) : void 0);
      }
    }, 28325, (e, t, r) => {
      "use strict";
      var n = e.i(51615);
      Object.defineProperty(r, "__esModule", { value: true });
      var s = { handleFetch: function() {
        return u;
      }, interceptFetch: function() {
        return c;
      }, reader: function() {
        return o;
      } };
      for (var i in s) Object.defineProperty(r, i, { enumerable: true, get: s[i] });
      let a = e.r(25085), o = { url: (e2) => e2.url, header: (e2, t2) => e2.headers.get(t2) };
      async function l(e2, t2) {
        let { url: r2, method: s2, headers: i2, body: a2, cache: o2, credentials: l2, integrity: u2, mode: c2, redirect: h, referrer: d, referrerPolicy: f } = t2;
        return { testData: e2, api: "fetch", request: { url: r2, method: s2, headers: [...Array.from(i2), ["next-test-stack", function() {
          let e3 = (Error().stack ?? "").split("\n");
          for (let t3 = 1; t3 < e3.length; t3++) if (e3[t3].length > 0) {
            e3 = e3.slice(t3);
            break;
          }
          return (e3 = (e3 = (e3 = e3.filter((e4) => !e4.includes("/next/dist/"))).slice(0, 5)).map((e4) => e4.replace("webpack-internal:///(rsc)/", "").trim())).join("    ");
        }()]], body: a2 ? n.Buffer.from(await t2.arrayBuffer()).toString("base64") : null, cache: o2, credentials: l2, integrity: u2, mode: c2, redirect: h, referrer: d, referrerPolicy: f } };
      }
      async function u(e2, t2) {
        let r2 = (0, a.getTestReqInfo)(t2, o);
        if (!r2) return e2(t2);
        let { testData: s2, proxyPort: i2 } = r2, u2 = await l(s2, t2), c2 = await e2(`http://localhost:${i2}`, { method: "POST", body: JSON.stringify(u2), next: { internal: true } });
        if (!c2.ok) throw Object.defineProperty(Error(`Proxy request failed: ${c2.status}`), "__NEXT_ERROR_CODE", { value: "E146", enumerable: false, configurable: true });
        let h = await c2.json(), { api: d } = h;
        switch (d) {
          case "continue":
            return e2(t2);
          case "abort":
          case "unhandled":
            throw Object.defineProperty(Error(`Proxy request aborted [${t2.method} ${t2.url}]`), "__NEXT_ERROR_CODE", { value: "E145", enumerable: false, configurable: true });
          case "fetch":
            return function(e3) {
              let { status: t3, headers: r3, body: s3 } = e3.response;
              return new Response(s3 ? n.Buffer.from(s3, "base64") : null, { status: t3, headers: new Headers(r3) });
            }(h);
          default:
            return d;
        }
      }
      function c(t2) {
        return e.g.fetch = function(e2, r2) {
          var n2;
          return (null == r2 || null == (n2 = r2.next) ? void 0 : n2.internal) ? t2(e2, r2) : u(t2, new Request(e2, r2));
        }, () => {
          e.g.fetch = t2;
        };
      }
    }, 94165, (e, t, r) => {
      "use strict";
      Object.defineProperty(r, "__esModule", { value: true });
      var n = { interceptTestApis: function() {
        return o;
      }, wrapRequestHandler: function() {
        return l;
      } };
      for (var s in n) Object.defineProperty(r, s, { enumerable: true, get: n[s] });
      let i = e.r(25085), a = e.r(28325);
      function o() {
        return (0, a.interceptFetch)(e.g.fetch);
      }
      function l(e2) {
        return (t2, r2) => (0, i.withRequest)(t2, a.reader, () => e2(t2, r2));
      }
    }, 64445, (e, t, r) => {
      var n = { 226: function(t2, r2) {
        !function(n2, s2) {
          "use strict";
          var i2 = "function", a = "undefined", o = "object", l = "string", u = "major", c = "model", h = "name", d = "type", f = "vendor", p = "version", g = "architecture", m = "console", y = "mobile", w = "tablet", b = "smarttv", v = "wearable", _ = "embedded", S = "Amazon", E = "Apple", k = "ASUS", O = "BlackBerry", T = "Browser", R = "Chrome", x = "Firefox", C = "Google", j = "Huawei", P = "Microsoft", A = "Motorola", I = "Opera", $ = "Samsung", N = "Sharp", U = "Sony", D = "Xiaomi", L = "Zebra", q = "Facebook", B = "Chromium OS", M = "Mac OS", W = function(e2, t3) {
            var r3 = {};
            for (var n3 in e2) t3[n3] && t3[n3].length % 2 == 0 ? r3[n3] = t3[n3].concat(e2[n3]) : r3[n3] = e2[n3];
            return r3;
          }, H = function(e2) {
            for (var t3 = {}, r3 = 0; r3 < e2.length; r3++) t3[e2[r3].toUpperCase()] = e2[r3];
            return t3;
          }, V = function(e2, t3) {
            return typeof e2 === l && -1 !== z(t3).indexOf(z(e2));
          }, z = function(e2) {
            return e2.toLowerCase();
          }, F = function(e2, t3) {
            if (typeof e2 === l) return e2 = e2.replace(/^\s\s*/, ""), typeof t3 === a ? e2 : e2.substring(0, 350);
          }, K = function(e2, t3) {
            for (var r3, n3, s3, a2, l2, u2, c2 = 0; c2 < t3.length && !l2; ) {
              var h2 = t3[c2], d2 = t3[c2 + 1];
              for (r3 = n3 = 0; r3 < h2.length && !l2 && h2[r3]; ) if (l2 = h2[r3++].exec(e2)) for (s3 = 0; s3 < d2.length; s3++) u2 = l2[++n3], typeof (a2 = d2[s3]) === o && a2.length > 0 ? 2 === a2.length ? typeof a2[1] == i2 ? this[a2[0]] = a2[1].call(this, u2) : this[a2[0]] = a2[1] : 3 === a2.length ? typeof a2[1] !== i2 || a2[1].exec && a2[1].test ? this[a2[0]] = u2 ? u2.replace(a2[1], a2[2]) : void 0 : this[a2[0]] = u2 ? a2[1].call(this, u2, a2[2]) : void 0 : 4 === a2.length && (this[a2[0]] = u2 ? a2[3].call(this, u2.replace(a2[1], a2[2])) : void 0) : this[a2] = u2 || void 0;
              c2 += 2;
            }
          }, G = function(e2, t3) {
            for (var r3 in t3) if (typeof t3[r3] === o && t3[r3].length > 0) {
              for (var n3 = 0; n3 < t3[r3].length; n3++) if (V(t3[r3][n3], e2)) return "?" === r3 ? void 0 : r3;
            } else if (V(t3[r3], e2)) return "?" === r3 ? void 0 : r3;
            return e2;
          }, J = { ME: "4.90", "NT 3.11": "NT3.51", "NT 4.0": "NT4.0", 2e3: "NT 5.0", XP: ["NT 5.1", "NT 5.2"], Vista: "NT 6.0", 7: "NT 6.1", 8: "NT 6.2", 8.1: "NT 6.3", 10: ["NT 6.4", "NT 10.0"], RT: "ARM" }, X = { browser: [[/\b(?:crmo|crios)\/([\w\.]+)/i], [p, [h, "Chrome"]], [/edg(?:e|ios|a)?\/([\w\.]+)/i], [p, [h, "Edge"]], [/(opera mini)\/([-\w\.]+)/i, /(opera [mobiletab]{3,6})\b.+version\/([-\w\.]+)/i, /(opera)(?:.+version\/|[\/ ]+)([\w\.]+)/i], [h, p], [/opios[\/ ]+([\w\.]+)/i], [p, [h, I + " Mini"]], [/\bopr\/([\w\.]+)/i], [p, [h, I]], [/(kindle)\/([\w\.]+)/i, /(lunascape|maxthon|netfront|jasmine|blazer)[\/ ]?([\w\.]*)/i, /(avant |iemobile|slim)(?:browser)?[\/ ]?([\w\.]*)/i, /(ba?idubrowser)[\/ ]?([\w\.]+)/i, /(?:ms|\()(ie) ([\w\.]+)/i, /(flock|rockmelt|midori|epiphany|silk|skyfire|bolt|iron|vivaldi|iridium|phantomjs|bowser|quark|qupzilla|falkon|rekonq|puffin|brave|whale(?!.+naver)|qqbrowserlite|qq|duckduckgo)\/([-\w\.]+)/i, /(heytap|ovi)browser\/([\d\.]+)/i, /(weibo)__([\d\.]+)/i], [h, p], [/(?:\buc? ?browser|(?:juc.+)ucweb)[\/ ]?([\w\.]+)/i], [p, [h, "UC" + T]], [/microm.+\bqbcore\/([\w\.]+)/i, /\bqbcore\/([\w\.]+).+microm/i], [p, [h, "WeChat(Win) Desktop"]], [/micromessenger\/([\w\.]+)/i], [p, [h, "WeChat"]], [/konqueror\/([\w\.]+)/i], [p, [h, "Konqueror"]], [/trident.+rv[: ]([\w\.]{1,9})\b.+like gecko/i], [p, [h, "IE"]], [/ya(?:search)?browser\/([\w\.]+)/i], [p, [h, "Yandex"]], [/(avast|avg)\/([\w\.]+)/i], [[h, /(.+)/, "$1 Secure " + T], p], [/\bfocus\/([\w\.]+)/i], [p, [h, x + " Focus"]], [/\bopt\/([\w\.]+)/i], [p, [h, I + " Touch"]], [/coc_coc\w+\/([\w\.]+)/i], [p, [h, "Coc Coc"]], [/dolfin\/([\w\.]+)/i], [p, [h, "Dolphin"]], [/coast\/([\w\.]+)/i], [p, [h, I + " Coast"]], [/miuibrowser\/([\w\.]+)/i], [p, [h, "MIUI " + T]], [/fxios\/([-\w\.]+)/i], [p, [h, x]], [/\bqihu|(qi?ho?o?|360)browser/i], [[h, "360 " + T]], [/(oculus|samsung|sailfish|huawei)browser\/([\w\.]+)/i], [[h, /(.+)/, "$1 " + T], p], [/(comodo_dragon)\/([\w\.]+)/i], [[h, /_/g, " "], p], [/(electron)\/([\w\.]+) safari/i, /(tesla)(?: qtcarbrowser|\/(20\d\d\.[-\w\.]+))/i, /m?(qqbrowser|baiduboxapp|2345Explorer)[\/ ]?([\w\.]+)/i], [h, p], [/(metasr)[\/ ]?([\w\.]+)/i, /(lbbrowser)/i, /\[(linkedin)app\]/i], [h], [/((?:fban\/fbios|fb_iab\/fb4a)(?!.+fbav)|;fbav\/([\w\.]+);)/i], [[h, q], p], [/(kakao(?:talk|story))[\/ ]([\w\.]+)/i, /(naver)\(.*?(\d+\.[\w\.]+).*\)/i, /safari (line)\/([\w\.]+)/i, /\b(line)\/([\w\.]+)\/iab/i, /(chromium|instagram)[\/ ]([-\w\.]+)/i], [h, p], [/\bgsa\/([\w\.]+) .*safari\//i], [p, [h, "GSA"]], [/musical_ly(?:.+app_?version\/|_)([\w\.]+)/i], [p, [h, "TikTok"]], [/headlesschrome(?:\/([\w\.]+)| )/i], [p, [h, R + " Headless"]], [/ wv\).+(chrome)\/([\w\.]+)/i], [[h, R + " WebView"], p], [/droid.+ version\/([\w\.]+)\b.+(?:mobile safari|safari)/i], [p, [h, "Android " + T]], [/(chrome|omniweb|arora|[tizenoka]{5} ?browser)\/v?([\w\.]+)/i], [h, p], [/version\/([\w\.\,]+) .*mobile\/\w+ (safari)/i], [p, [h, "Mobile Safari"]], [/version\/([\w(\.|\,)]+) .*(mobile ?safari|safari)/i], [p, h], [/webkit.+?(mobile ?safari|safari)(\/[\w\.]+)/i], [h, [p, G, { "1.0": "/8", 1.2: "/1", 1.3: "/3", "2.0": "/412", "2.0.2": "/416", "2.0.3": "/417", "2.0.4": "/419", "?": "/" }]], [/(webkit|khtml)\/([\w\.]+)/i], [h, p], [/(navigator|netscape\d?)\/([-\w\.]+)/i], [[h, "Netscape"], p], [/mobile vr; rv:([\w\.]+)\).+firefox/i], [p, [h, x + " Reality"]], [/ekiohf.+(flow)\/([\w\.]+)/i, /(swiftfox)/i, /(icedragon|iceweasel|camino|chimera|fennec|maemo browser|minimo|conkeror|klar)[\/ ]?([\w\.\+]+)/i, /(seamonkey|k-meleon|icecat|iceape|firebird|phoenix|palemoon|basilisk|waterfox)\/([-\w\.]+)$/i, /(firefox)\/([\w\.]+)/i, /(mozilla)\/([\w\.]+) .+rv\:.+gecko\/\d+/i, /(polaris|lynx|dillo|icab|doris|amaya|w3m|netsurf|sleipnir|obigo|mosaic|(?:go|ice|up)[\. ]?browser)[-\/ ]?v?([\w\.]+)/i, /(links) \(([\w\.]+)/i, /panasonic;(viera)/i], [h, p], [/(cobalt)\/([\w\.]+)/i], [h, [p, /master.|lts./, ""]]], cpu: [[/(?:(amd|x(?:(?:86|64)[-_])?|wow|win)64)[;\)]/i], [[g, "amd64"]], [/(ia32(?=;))/i], [[g, z]], [/((?:i[346]|x)86)[;\)]/i], [[g, "ia32"]], [/\b(aarch64|arm(v?8e?l?|_?64))\b/i], [[g, "arm64"]], [/\b(arm(?:v[67])?ht?n?[fl]p?)\b/i], [[g, "armhf"]], [/windows (ce|mobile); ppc;/i], [[g, "arm"]], [/((?:ppc|powerpc)(?:64)?)(?: mac|;|\))/i], [[g, /ower/, "", z]], [/(sun4\w)[;\)]/i], [[g, "sparc"]], [/((?:avr32|ia64(?=;))|68k(?=\))|\barm(?=v(?:[1-7]|[5-7]1)l?|;|eabi)|(?=atmel )avr|(?:irix|mips|sparc)(?:64)?\b|pa-risc)/i], [[g, z]]], device: [[/\b(sch-i[89]0\d|shw-m380s|sm-[ptx]\w{2,4}|gt-[pn]\d{2,4}|sgh-t8[56]9|nexus 10)/i], [c, [f, $], [d, w]], [/\b((?:s[cgp]h|gt|sm)-\w+|sc[g-]?[\d]+a?|galaxy nexus)/i, /samsung[- ]([-\w]+)/i, /sec-(sgh\w+)/i], [c, [f, $], [d, y]], [/(?:\/|\()(ip(?:hone|od)[\w, ]*)(?:\/|;)/i], [c, [f, E], [d, y]], [/\((ipad);[-\w\),; ]+apple/i, /applecoremedia\/[\w\.]+ \((ipad)/i, /\b(ipad)\d\d?,\d\d?[;\]].+ios/i], [c, [f, E], [d, w]], [/(macintosh);/i], [c, [f, E]], [/\b(sh-?[altvz]?\d\d[a-ekm]?)/i], [c, [f, N], [d, y]], [/\b((?:ag[rs][23]?|bah2?|sht?|btv)-a?[lw]\d{2})\b(?!.+d\/s)/i], [c, [f, j], [d, w]], [/(?:huawei|honor)([-\w ]+)[;\)]/i, /\b(nexus 6p|\w{2,4}e?-[atu]?[ln][\dx][012359c][adn]?)\b(?!.+d\/s)/i], [c, [f, j], [d, y]], [/\b(poco[\w ]+)(?: bui|\))/i, /\b; (\w+) build\/hm\1/i, /\b(hm[-_ ]?note?[_ ]?(?:\d\w)?) bui/i, /\b(redmi[\-_ ]?(?:note|k)?[\w_ ]+)(?: bui|\))/i, /\b(mi[-_ ]?(?:a\d|one|one[_ ]plus|note lte|max|cc)?[_ ]?(?:\d?\w?)[_ ]?(?:plus|se|lite)?)(?: bui|\))/i], [[c, /_/g, " "], [f, D], [d, y]], [/\b(mi[-_ ]?(?:pad)(?:[\w_ ]+))(?: bui|\))/i], [[c, /_/g, " "], [f, D], [d, w]], [/; (\w+) bui.+ oppo/i, /\b(cph[12]\d{3}|p(?:af|c[al]|d\w|e[ar])[mt]\d0|x9007|a101op)\b/i], [c, [f, "OPPO"], [d, y]], [/vivo (\w+)(?: bui|\))/i, /\b(v[12]\d{3}\w?[at])(?: bui|;)/i], [c, [f, "Vivo"], [d, y]], [/\b(rmx[12]\d{3})(?: bui|;|\))/i], [c, [f, "Realme"], [d, y]], [/\b(milestone|droid(?:[2-4x]| (?:bionic|x2|pro|razr))?:?( 4g)?)\b[\w ]+build\//i, /\bmot(?:orola)?[- ](\w*)/i, /((?:moto[\w\(\) ]+|xt\d{3,4}|nexus 6)(?= bui|\)))/i], [c, [f, A], [d, y]], [/\b(mz60\d|xoom[2 ]{0,2}) build\//i], [c, [f, A], [d, w]], [/((?=lg)?[vl]k\-?\d{3}) bui| 3\.[-\w; ]{10}lg?-([06cv9]{3,4})/i], [c, [f, "LG"], [d, w]], [/(lm(?:-?f100[nv]?|-[\w\.]+)(?= bui|\))|nexus [45])/i, /\blg[-e;\/ ]+((?!browser|netcast|android tv)\w+)/i, /\blg-?([\d\w]+) bui/i], [c, [f, "LG"], [d, y]], [/(ideatab[-\w ]+)/i, /lenovo ?(s[56]000[-\w]+|tab(?:[\w ]+)|yt[-\d\w]{6}|tb[-\d\w]{6})/i], [c, [f, "Lenovo"], [d, w]], [/(?:maemo|nokia).*(n900|lumia \d+)/i, /nokia[-_ ]?([-\w\.]*)/i], [[c, /_/g, " "], [f, "Nokia"], [d, y]], [/(pixel c)\b/i], [c, [f, C], [d, w]], [/droid.+; (pixel[\daxl ]{0,6})(?: bui|\))/i], [c, [f, C], [d, y]], [/droid.+ (a?\d[0-2]{2}so|[c-g]\d{4}|so[-gl]\w+|xq-a\w[4-7][12])(?= bui|\).+chrome\/(?![1-6]{0,1}\d\.))/i], [c, [f, U], [d, y]], [/sony tablet [ps]/i, /\b(?:sony)?sgp\w+(?: bui|\))/i], [[c, "Xperia Tablet"], [f, U], [d, w]], [/ (kb2005|in20[12]5|be20[12][59])\b/i, /(?:one)?(?:plus)? (a\d0\d\d)(?: b|\))/i], [c, [f, "OnePlus"], [d, y]], [/(alexa)webm/i, /(kf[a-z]{2}wi|aeo[c-r]{2})( bui|\))/i, /(kf[a-z]+)( bui|\)).+silk\//i], [c, [f, S], [d, w]], [/((?:sd|kf)[0349hijorstuw]+)( bui|\)).+silk\//i], [[c, /(.+)/g, "Fire Phone $1"], [f, S], [d, y]], [/(playbook);[-\w\),; ]+(rim)/i], [c, f, [d, w]], [/\b((?:bb[a-f]|st[hv])100-\d)/i, /\(bb10; (\w+)/i], [c, [f, O], [d, y]], [/(?:\b|asus_)(transfo[prime ]{4,10} \w+|eeepc|slider \w+|nexus 7|padfone|p00[cj])/i], [c, [f, k], [d, w]], [/ (z[bes]6[027][012][km][ls]|zenfone \d\w?)\b/i], [c, [f, k], [d, y]], [/(nexus 9)/i], [c, [f, "HTC"], [d, w]], [/(htc)[-;_ ]{1,2}([\w ]+(?=\)| bui)|\w+)/i, /(zte)[- ]([\w ]+?)(?: bui|\/|\))/i, /(alcatel|geeksphone|nexian|panasonic(?!(?:;|\.))|sony(?!-bra))[-_ ]?([-\w]*)/i], [f, [c, /_/g, " "], [d, y]], [/droid.+; ([ab][1-7]-?[0178a]\d\d?)/i], [c, [f, "Acer"], [d, w]], [/droid.+; (m[1-5] note) bui/i, /\bmz-([-\w]{2,})/i], [c, [f, "Meizu"], [d, y]], [/(blackberry|benq|palm(?=\-)|sonyericsson|acer|asus|dell|meizu|motorola|polytron)[-_ ]?([-\w]*)/i, /(hp) ([\w ]+\w)/i, /(asus)-?(\w+)/i, /(microsoft); (lumia[\w ]+)/i, /(lenovo)[-_ ]?([-\w]+)/i, /(jolla)/i, /(oppo) ?([\w ]+) bui/i], [f, c, [d, y]], [/(kobo)\s(ereader|touch)/i, /(archos) (gamepad2?)/i, /(hp).+(touchpad(?!.+tablet)|tablet)/i, /(kindle)\/([\w\.]+)/i, /(nook)[\w ]+build\/(\w+)/i, /(dell) (strea[kpr\d ]*[\dko])/i, /(le[- ]+pan)[- ]+(\w{1,9}) bui/i, /(trinity)[- ]*(t\d{3}) bui/i, /(gigaset)[- ]+(q\w{1,9}) bui/i, /(vodafone) ([\w ]+)(?:\)| bui)/i], [f, c, [d, w]], [/(surface duo)/i], [c, [f, P], [d, w]], [/droid [\d\.]+; (fp\du?)(?: b|\))/i], [c, [f, "Fairphone"], [d, y]], [/(u304aa)/i], [c, [f, "AT&T"], [d, y]], [/\bsie-(\w*)/i], [c, [f, "Siemens"], [d, y]], [/\b(rct\w+) b/i], [c, [f, "RCA"], [d, w]], [/\b(venue[\d ]{2,7}) b/i], [c, [f, "Dell"], [d, w]], [/\b(q(?:mv|ta)\w+) b/i], [c, [f, "Verizon"], [d, w]], [/\b(?:barnes[& ]+noble |bn[rt])([\w\+ ]*) b/i], [c, [f, "Barnes & Noble"], [d, w]], [/\b(tm\d{3}\w+) b/i], [c, [f, "NuVision"], [d, w]], [/\b(k88) b/i], [c, [f, "ZTE"], [d, w]], [/\b(nx\d{3}j) b/i], [c, [f, "ZTE"], [d, y]], [/\b(gen\d{3}) b.+49h/i], [c, [f, "Swiss"], [d, y]], [/\b(zur\d{3}) b/i], [c, [f, "Swiss"], [d, w]], [/\b((zeki)?tb.*\b) b/i], [c, [f, "Zeki"], [d, w]], [/\b([yr]\d{2}) b/i, /\b(dragon[- ]+touch |dt)(\w{5}) b/i], [[f, "Dragon Touch"], c, [d, w]], [/\b(ns-?\w{0,9}) b/i], [c, [f, "Insignia"], [d, w]], [/\b((nxa|next)-?\w{0,9}) b/i], [c, [f, "NextBook"], [d, w]], [/\b(xtreme\_)?(v(1[045]|2[015]|[3469]0|7[05])) b/i], [[f, "Voice"], c, [d, y]], [/\b(lvtel\-)?(v1[12]) b/i], [[f, "LvTel"], c, [d, y]], [/\b(ph-1) /i], [c, [f, "Essential"], [d, y]], [/\b(v(100md|700na|7011|917g).*\b) b/i], [c, [f, "Envizen"], [d, w]], [/\b(trio[-\w\. ]+) b/i], [c, [f, "MachSpeed"], [d, w]], [/\btu_(1491) b/i], [c, [f, "Rotor"], [d, w]], [/(shield[\w ]+) b/i], [c, [f, "Nvidia"], [d, w]], [/(sprint) (\w+)/i], [f, c, [d, y]], [/(kin\.[onetw]{3})/i], [[c, /\./g, " "], [f, P], [d, y]], [/droid.+; (cc6666?|et5[16]|mc[239][23]x?|vc8[03]x?)\)/i], [c, [f, L], [d, w]], [/droid.+; (ec30|ps20|tc[2-8]\d[kx])\)/i], [c, [f, L], [d, y]], [/smart-tv.+(samsung)/i], [f, [d, b]], [/hbbtv.+maple;(\d+)/i], [[c, /^/, "SmartTV"], [f, $], [d, b]], [/(nux; netcast.+smarttv|lg (netcast\.tv-201\d|android tv))/i], [[f, "LG"], [d, b]], [/(apple) ?tv/i], [f, [c, E + " TV"], [d, b]], [/crkey/i], [[c, R + "cast"], [f, C], [d, b]], [/droid.+aft(\w)( bui|\))/i], [c, [f, S], [d, b]], [/\(dtv[\);].+(aquos)/i, /(aquos-tv[\w ]+)\)/i], [c, [f, N], [d, b]], [/(bravia[\w ]+)( bui|\))/i], [c, [f, U], [d, b]], [/(mitv-\w{5}) bui/i], [c, [f, D], [d, b]], [/Hbbtv.*(technisat) (.*);/i], [f, c, [d, b]], [/\b(roku)[\dx]*[\)\/]((?:dvp-)?[\d\.]*)/i, /hbbtv\/\d+\.\d+\.\d+ +\([\w\+ ]*; *([\w\d][^;]*);([^;]*)/i], [[f, F], [c, F], [d, b]], [/\b(android tv|smart[- ]?tv|opera tv|tv; rv:)\b/i], [[d, b]], [/(ouya)/i, /(nintendo) ([wids3utch]+)/i], [f, c, [d, m]], [/droid.+; (shield) bui/i], [c, [f, "Nvidia"], [d, m]], [/(playstation [345portablevi]+)/i], [c, [f, U], [d, m]], [/\b(xbox(?: one)?(?!; xbox))[\); ]/i], [c, [f, P], [d, m]], [/((pebble))app/i], [f, c, [d, v]], [/(watch)(?: ?os[,\/]|\d,\d\/)[\d\.]+/i], [c, [f, E], [d, v]], [/droid.+; (glass) \d/i], [c, [f, C], [d, v]], [/droid.+; (wt63?0{2,3})\)/i], [c, [f, L], [d, v]], [/(quest( 2| pro)?)/i], [c, [f, q], [d, v]], [/(tesla)(?: qtcarbrowser|\/[-\w\.]+)/i], [f, [d, _]], [/(aeobc)\b/i], [c, [f, S], [d, _]], [/droid .+?; ([^;]+?)(?: bui|\) applew).+? mobile safari/i], [c, [d, y]], [/droid .+?; ([^;]+?)(?: bui|\) applew).+?(?! mobile) safari/i], [c, [d, w]], [/\b((tablet|tab)[;\/]|focus\/\d(?!.+mobile))/i], [[d, w]], [/(phone|mobile(?:[;\/]| [ \w\/\.]*safari)|pda(?=.+windows ce))/i], [[d, y]], [/(android[-\w\. ]{0,9});.+buil/i], [c, [f, "Generic"]]], engine: [[/windows.+ edge\/([\w\.]+)/i], [p, [h, "EdgeHTML"]], [/webkit\/537\.36.+chrome\/(?!27)([\w\.]+)/i], [p, [h, "Blink"]], [/(presto)\/([\w\.]+)/i, /(webkit|trident|netfront|netsurf|amaya|lynx|w3m|goanna)\/([\w\.]+)/i, /ekioh(flow)\/([\w\.]+)/i, /(khtml|tasman|links)[\/ ]\(?([\w\.]+)/i, /(icab)[\/ ]([23]\.[\d\.]+)/i, /\b(libweb)/i], [h, p], [/rv\:([\w\.]{1,9})\b.+(gecko)/i], [p, h]], os: [[/microsoft (windows) (vista|xp)/i], [h, p], [/(windows) nt 6\.2; (arm)/i, /(windows (?:phone(?: os)?|mobile))[\/ ]?([\d\.\w ]*)/i, /(windows)[\/ ]?([ntce\d\. ]+\w)(?!.+xbox)/i], [h, [p, G, J]], [/(win(?=3|9|n)|win 9x )([nt\d\.]+)/i], [[h, "Windows"], [p, G, J]], [/ip[honead]{2,4}\b(?:.*os ([\w]+) like mac|; opera)/i, /ios;fbsv\/([\d\.]+)/i, /cfnetwork\/.+darwin/i], [[p, /_/g, "."], [h, "iOS"]], [/(mac os x) ?([\w\. ]*)/i, /(macintosh|mac_powerpc\b)(?!.+haiku)/i], [[h, M], [p, /_/g, "."]], [/droid ([\w\.]+)\b.+(android[- ]x86|harmonyos)/i], [p, h], [/(android|webos|qnx|bada|rim tablet os|maemo|meego|sailfish)[-\/ ]?([\w\.]*)/i, /(blackberry)\w*\/([\w\.]*)/i, /(tizen|kaios)[\/ ]([\w\.]+)/i, /\((series40);/i], [h, p], [/\(bb(10);/i], [p, [h, O]], [/(?:symbian ?os|symbos|s60(?=;)|series60)[-\/ ]?([\w\.]*)/i], [p, [h, "Symbian"]], [/mozilla\/[\d\.]+ \((?:mobile|tablet|tv|mobile; [\w ]+); rv:.+ gecko\/([\w\.]+)/i], [p, [h, x + " OS"]], [/web0s;.+rt(tv)/i, /\b(?:hp)?wos(?:browser)?\/([\w\.]+)/i], [p, [h, "webOS"]], [/watch(?: ?os[,\/]|\d,\d\/)([\d\.]+)/i], [p, [h, "watchOS"]], [/crkey\/([\d\.]+)/i], [p, [h, R + "cast"]], [/(cros) [\w]+(?:\)| ([\w\.]+)\b)/i], [[h, B], p], [/panasonic;(viera)/i, /(netrange)mmh/i, /(nettv)\/(\d+\.[\w\.]+)/i, /(nintendo|playstation) ([wids345portablevuch]+)/i, /(xbox); +xbox ([^\);]+)/i, /\b(joli|palm)\b ?(?:os)?\/?([\w\.]*)/i, /(mint)[\/\(\) ]?(\w*)/i, /(mageia|vectorlinux)[; ]/i, /([kxln]?ubuntu|debian|suse|opensuse|gentoo|arch(?= linux)|slackware|fedora|mandriva|centos|pclinuxos|red ?hat|zenwalk|linpus|raspbian|plan 9|minix|risc os|contiki|deepin|manjaro|elementary os|sabayon|linspire)(?: gnu\/linux)?(?: enterprise)?(?:[- ]linux)?(?:-gnu)?[-\/ ]?(?!chrom|package)([-\w\.]*)/i, /(hurd|linux) ?([\w\.]*)/i, /(gnu) ?([\w\.]*)/i, /\b([-frentopcghs]{0,5}bsd|dragonfly)[\/ ]?(?!amd|[ix346]{1,2}86)([\w\.]*)/i, /(haiku) (\w+)/i], [h, p], [/(sunos) ?([\w\.\d]*)/i], [[h, "Solaris"], p], [/((?:open)?solaris)[-\/ ]?([\w\.]*)/i, /(aix) ((\d)(?=\.|\)| )[\w\.])*/i, /\b(beos|os\/2|amigaos|morphos|openvms|fuchsia|hp-ux|serenityos)/i, /(unix) ?([\w\.]*)/i], [h, p]] }, Y = function(e2, t3) {
            if (typeof e2 === o && (t3 = e2, e2 = void 0), !(this instanceof Y)) return new Y(e2, t3).getResult();
            var r3 = typeof n2 !== a && n2.navigator ? n2.navigator : void 0, s3 = e2 || (r3 && r3.userAgent ? r3.userAgent : ""), m2 = r3 && r3.userAgentData ? r3.userAgentData : void 0, b2 = t3 ? W(X, t3) : X, v2 = r3 && r3.userAgent == s3;
            return this.getBrowser = function() {
              var e3, t4 = {};
              return t4[h] = void 0, t4[p] = void 0, K.call(t4, s3, b2.browser), t4[u] = typeof (e3 = t4[p]) === l ? e3.replace(/[^\d\.]/g, "").split(".")[0] : void 0, v2 && r3 && r3.brave && typeof r3.brave.isBrave == i2 && (t4[h] = "Brave"), t4;
            }, this.getCPU = function() {
              var e3 = {};
              return e3[g] = void 0, K.call(e3, s3, b2.cpu), e3;
            }, this.getDevice = function() {
              var e3 = {};
              return e3[f] = void 0, e3[c] = void 0, e3[d] = void 0, K.call(e3, s3, b2.device), v2 && !e3[d] && m2 && m2.mobile && (e3[d] = y), v2 && "Macintosh" == e3[c] && r3 && typeof r3.standalone !== a && r3.maxTouchPoints && r3.maxTouchPoints > 2 && (e3[c] = "iPad", e3[d] = w), e3;
            }, this.getEngine = function() {
              var e3 = {};
              return e3[h] = void 0, e3[p] = void 0, K.call(e3, s3, b2.engine), e3;
            }, this.getOS = function() {
              var e3 = {};
              return e3[h] = void 0, e3[p] = void 0, K.call(e3, s3, b2.os), v2 && !e3[h] && m2 && "Unknown" != m2.platform && (e3[h] = m2.platform.replace(/chrome os/i, B).replace(/macos/i, M)), e3;
            }, this.getResult = function() {
              return { ua: this.getUA(), browser: this.getBrowser(), engine: this.getEngine(), os: this.getOS(), device: this.getDevice(), cpu: this.getCPU() };
            }, this.getUA = function() {
              return s3;
            }, this.setUA = function(e3) {
              return s3 = typeof e3 === l && e3.length > 350 ? F(e3, 350) : e3, this;
            }, this.setUA(s3), this;
          };
          if (Y.VERSION = "1.0.35", Y.BROWSER = H([h, p, u]), Y.CPU = H([g]), Y.DEVICE = H([c, f, d, m, y, b, w, v, _]), Y.ENGINE = Y.OS = H([h, p]), typeof r2 !== a) t2.exports && (r2 = t2.exports = Y), r2.UAParser = Y;
          else if (typeof define === i2 && define.amd) e.r, void 0 !== Y && e.v(Y);
          else typeof n2 !== a && (n2.UAParser = Y);
          var Q = typeof n2 !== a && (n2.jQuery || n2.Zepto);
          if (Q && !Q.ua) {
            var Z = new Y();
            Q.ua = Z.getResult(), Q.ua.get = function() {
              return Z.getUA();
            }, Q.ua.set = function(e2) {
              Z.setUA(e2);
              var t3 = Z.getResult();
              for (var r3 in t3) Q.ua[r3] = t3[r3];
            };
          }
        }(this);
      } }, s = {};
      function i(e2) {
        var t2 = s[e2];
        if (void 0 !== t2) return t2.exports;
        var r2 = s[e2] = { exports: {} }, a = true;
        try {
          n[e2].call(r2.exports, r2, r2.exports, i), a = false;
        } finally {
          a && delete s[e2];
        }
        return r2.exports;
      }
      i.ab = "/ROOT/node_modules/next/dist/compiled/ua-parser-js/", t.exports = i(226);
    }, 8946, (e, t, r) => {
      "use strict";
      var n = { H: null, A: null };
      function s(e2) {
        var t2 = "https://react.dev/errors/" + e2;
        if (1 < arguments.length) {
          t2 += "?args[]=" + encodeURIComponent(arguments[1]);
          for (var r2 = 2; r2 < arguments.length; r2++) t2 += "&args[]=" + encodeURIComponent(arguments[r2]);
        }
        return "Minified React error #" + e2 + "; visit " + t2 + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
      }
      var i = Array.isArray;
      function a() {
      }
      var o = Symbol.for("react.transitional.element"), l = Symbol.for("react.portal"), u = Symbol.for("react.fragment"), c = Symbol.for("react.strict_mode"), h = Symbol.for("react.profiler"), d = Symbol.for("react.forward_ref"), f = Symbol.for("react.suspense"), p = Symbol.for("react.memo"), g = Symbol.for("react.lazy"), m = Symbol.for("react.activity"), y = Symbol.for("react.view_transition"), w = Symbol.iterator, b = Object.prototype.hasOwnProperty, v = Object.assign;
      function _(e2, t2, r2) {
        var n2 = r2.ref;
        return { $$typeof: o, type: e2, key: t2, ref: void 0 !== n2 ? n2 : null, props: r2 };
      }
      function S(e2) {
        return "object" == typeof e2 && null !== e2 && e2.$$typeof === o;
      }
      var E = /\/+/g;
      function k(e2, t2) {
        var r2, n2;
        return "object" == typeof e2 && null !== e2 && null != e2.key ? (r2 = "" + e2.key, n2 = { "=": "=0", ":": "=2" }, "$" + r2.replace(/[=:]/g, function(e3) {
          return n2[e3];
        })) : t2.toString(36);
      }
      function O(e2, t2, r2) {
        if (null == e2) return e2;
        var n2 = [], u2 = 0;
        return !function e3(t3, r3, n3, u3, c2) {
          var h2, d2, f2, p2 = typeof t3;
          ("undefined" === p2 || "boolean" === p2) && (t3 = null);
          var m2 = false;
          if (null === t3) m2 = true;
          else switch (p2) {
            case "bigint":
            case "string":
            case "number":
              m2 = true;
              break;
            case "object":
              switch (t3.$$typeof) {
                case o:
                case l:
                  m2 = true;
                  break;
                case g:
                  return e3((m2 = t3._init)(t3._payload), r3, n3, u3, c2);
              }
          }
          if (m2) return c2 = c2(t3), m2 = "" === u3 ? "." + k(t3, 0) : u3, i(c2) ? (n3 = "", null != m2 && (n3 = m2.replace(E, "$&/") + "/"), e3(c2, r3, n3, "", function(e4) {
            return e4;
          })) : null != c2 && (S(c2) && (h2 = c2, d2 = n3 + (null == c2.key || t3 && t3.key === c2.key ? "" : ("" + c2.key).replace(E, "$&/") + "/") + m2, c2 = _(h2.type, d2, h2.props)), r3.push(c2)), 1;
          m2 = 0;
          var y2 = "" === u3 ? "." : u3 + ":";
          if (i(t3)) for (var b2 = 0; b2 < t3.length; b2++) p2 = y2 + k(u3 = t3[b2], b2), m2 += e3(u3, r3, n3, p2, c2);
          else if ("function" == typeof (b2 = null === (f2 = t3) || "object" != typeof f2 ? null : "function" == typeof (f2 = w && f2[w] || f2["@@iterator"]) ? f2 : null)) for (t3 = b2.call(t3), b2 = 0; !(u3 = t3.next()).done; ) p2 = y2 + k(u3 = u3.value, b2++), m2 += e3(u3, r3, n3, p2, c2);
          else if ("object" === p2) {
            if ("function" == typeof t3.then) return e3(function(e4) {
              switch (e4.status) {
                case "fulfilled":
                  return e4.value;
                case "rejected":
                  throw e4.reason;
                default:
                  switch ("string" == typeof e4.status ? e4.then(a, a) : (e4.status = "pending", e4.then(function(t4) {
                    "pending" === e4.status && (e4.status = "fulfilled", e4.value = t4);
                  }, function(t4) {
                    "pending" === e4.status && (e4.status = "rejected", e4.reason = t4);
                  })), e4.status) {
                    case "fulfilled":
                      return e4.value;
                    case "rejected":
                      throw e4.reason;
                  }
              }
              throw e4;
            }(t3), r3, n3, u3, c2);
            throw Error(s(31, "[object Object]" === (r3 = String(t3)) ? "object with keys {" + Object.keys(t3).join(", ") + "}" : r3));
          }
          return m2;
        }(e2, n2, "", "", function(e3) {
          return t2.call(r2, e3, u2++);
        }), n2;
      }
      function T(e2) {
        if (-1 === e2._status) {
          var t2 = e2._result;
          (t2 = t2()).then(function(t3) {
            (0 === e2._status || -1 === e2._status) && (e2._status = 1, e2._result = t3);
          }, function(t3) {
            (0 === e2._status || -1 === e2._status) && (e2._status = 2, e2._result = t3);
          }), -1 === e2._status && (e2._status = 0, e2._result = t2);
        }
        if (1 === e2._status) return e2._result.default;
        throw e2._result;
      }
      function R() {
        return /* @__PURE__ */ new WeakMap();
      }
      function x() {
        return { s: 0, v: void 0, o: null, p: null };
      }
      r.Activity = m, r.Children = { map: O, forEach: function(e2, t2, r2) {
        O(e2, function() {
          t2.apply(this, arguments);
        }, r2);
      }, count: function(e2) {
        var t2 = 0;
        return O(e2, function() {
          t2++;
        }), t2;
      }, toArray: function(e2) {
        return O(e2, function(e3) {
          return e3;
        }) || [];
      }, only: function(e2) {
        if (!S(e2)) throw Error(s(143));
        return e2;
      } }, r.Fragment = u, r.Profiler = h, r.StrictMode = c, r.Suspense = f, r.ViewTransition = y, r.__SERVER_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = n, r.cache = function(e2) {
        return function() {
          var t2 = n.A;
          if (!t2) return e2.apply(null, arguments);
          var r2 = t2.getCacheForType(R);
          void 0 === (t2 = r2.get(e2)) && (t2 = x(), r2.set(e2, t2)), r2 = 0;
          for (var s2 = arguments.length; r2 < s2; r2++) {
            var i2 = arguments[r2];
            if ("function" == typeof i2 || "object" == typeof i2 && null !== i2) {
              var a2 = t2.o;
              null === a2 && (t2.o = a2 = /* @__PURE__ */ new WeakMap()), void 0 === (t2 = a2.get(i2)) && (t2 = x(), a2.set(i2, t2));
            } else null === (a2 = t2.p) && (t2.p = a2 = /* @__PURE__ */ new Map()), void 0 === (t2 = a2.get(i2)) && (t2 = x(), a2.set(i2, t2));
          }
          if (1 === t2.s) return t2.v;
          if (2 === t2.s) throw t2.v;
          try {
            var o2 = e2.apply(null, arguments);
            return (r2 = t2).s = 1, r2.v = o2;
          } catch (e3) {
            throw (o2 = t2).s = 2, o2.v = e3, e3;
          }
        };
      }, r.cacheSignal = function() {
        var e2 = n.A;
        return e2 ? e2.cacheSignal() : null;
      }, r.captureOwnerStack = function() {
        return null;
      }, r.cloneElement = function(e2, t2, r2) {
        if (null == e2) throw Error(s(267, e2));
        var n2 = v({}, e2.props), i2 = e2.key;
        if (null != t2) for (a2 in void 0 !== t2.key && (i2 = "" + t2.key), t2) b.call(t2, a2) && "key" !== a2 && "__self" !== a2 && "__source" !== a2 && ("ref" !== a2 || void 0 !== t2.ref) && (n2[a2] = t2[a2]);
        var a2 = arguments.length - 2;
        if (1 === a2) n2.children = r2;
        else if (1 < a2) {
          for (var o2 = Array(a2), l2 = 0; l2 < a2; l2++) o2[l2] = arguments[l2 + 2];
          n2.children = o2;
        }
        return _(e2.type, i2, n2);
      }, r.createElement = function(e2, t2, r2) {
        var n2, s2 = {}, i2 = null;
        if (null != t2) for (n2 in void 0 !== t2.key && (i2 = "" + t2.key), t2) b.call(t2, n2) && "key" !== n2 && "__self" !== n2 && "__source" !== n2 && (s2[n2] = t2[n2]);
        var a2 = arguments.length - 2;
        if (1 === a2) s2.children = r2;
        else if (1 < a2) {
          for (var o2 = Array(a2), l2 = 0; l2 < a2; l2++) o2[l2] = arguments[l2 + 2];
          s2.children = o2;
        }
        if (e2 && e2.defaultProps) for (n2 in a2 = e2.defaultProps) void 0 === s2[n2] && (s2[n2] = a2[n2]);
        return _(e2, i2, s2);
      }, r.createRef = function() {
        return { current: null };
      }, r.forwardRef = function(e2) {
        return { $$typeof: d, render: e2 };
      }, r.isValidElement = S, r.lazy = function(e2) {
        return { $$typeof: g, _payload: { _status: -1, _result: e2 }, _init: T };
      }, r.memo = function(e2, t2) {
        return { $$typeof: p, type: e2, compare: void 0 === t2 ? null : t2 };
      }, r.use = function(e2) {
        return n.H.use(e2);
      }, r.useCallback = function(e2, t2) {
        return n.H.useCallback(e2, t2);
      }, r.useDebugValue = function() {
      }, r.useId = function() {
        return n.H.useId();
      }, r.useMemo = function(e2, t2) {
        return n.H.useMemo(e2, t2);
      }, r.version = "19.3.0-canary-52684925-20251110";
    }, 40049, (e, t, r) => {
      "use strict";
      t.exports = e.r(8946);
    }, 70858, (e) => {
      "use strict";
      var t = function(e2, r2) {
        return (t = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(e3, t2) {
          e3.__proto__ = t2;
        } || function(e3, t2) {
          for (var r3 in t2) Object.prototype.hasOwnProperty.call(t2, r3) && (e3[r3] = t2[r3]);
        })(e2, r2);
      };
      function r(e2, r2) {
        if ("function" != typeof r2 && null !== r2) throw TypeError("Class extends value " + String(r2) + " is not a constructor or null");
        function n2() {
          this.constructor = e2;
        }
        t(e2, r2), e2.prototype = null === r2 ? Object.create(r2) : (n2.prototype = r2.prototype, new n2());
      }
      var n = function() {
        return (n = Object.assign || function(e2) {
          for (var t2, r2 = 1, n2 = arguments.length; r2 < n2; r2++) for (var s2 in t2 = arguments[r2]) Object.prototype.hasOwnProperty.call(t2, s2) && (e2[s2] = t2[s2]);
          return e2;
        }).apply(this, arguments);
      };
      function s(e2, t2) {
        var r2 = {};
        for (var n2 in e2) Object.prototype.hasOwnProperty.call(e2, n2) && 0 > t2.indexOf(n2) && (r2[n2] = e2[n2]);
        if (null != e2 && "function" == typeof Object.getOwnPropertySymbols) for (var s2 = 0, n2 = Object.getOwnPropertySymbols(e2); s2 < n2.length; s2++) 0 > t2.indexOf(n2[s2]) && Object.prototype.propertyIsEnumerable.call(e2, n2[s2]) && (r2[n2[s2]] = e2[n2[s2]]);
        return r2;
      }
      function i(e2, t2, r2, n2) {
        var s2, i2 = arguments.length, a2 = i2 < 3 ? t2 : null === n2 ? n2 = Object.getOwnPropertyDescriptor(t2, r2) : n2;
        if ("object" == typeof Reflect && "function" == typeof Reflect.decorate) a2 = Reflect.decorate(e2, t2, r2, n2);
        else for (var o2 = e2.length - 1; o2 >= 0; o2--) (s2 = e2[o2]) && (a2 = (i2 < 3 ? s2(a2) : i2 > 3 ? s2(t2, r2, a2) : s2(t2, r2)) || a2);
        return i2 > 3 && a2 && Object.defineProperty(t2, r2, a2), a2;
      }
      function a(e2, t2) {
        return function(r2, n2) {
          t2(r2, n2, e2);
        };
      }
      function o(e2, t2, r2, n2, s2, i2) {
        function a2(e3) {
          if (void 0 !== e3 && "function" != typeof e3) throw TypeError("Function expected");
          return e3;
        }
        for (var o2, l2 = n2.kind, u2 = "getter" === l2 ? "get" : "setter" === l2 ? "set" : "value", c2 = !t2 && e2 ? n2.static ? e2 : e2.prototype : null, h2 = t2 || (c2 ? Object.getOwnPropertyDescriptor(c2, n2.name) : {}), d2 = false, f2 = r2.length - 1; f2 >= 0; f2--) {
          var p2 = {};
          for (var g2 in n2) p2[g2] = "access" === g2 ? {} : n2[g2];
          for (var g2 in n2.access) p2.access[g2] = n2.access[g2];
          p2.addInitializer = function(e3) {
            if (d2) throw TypeError("Cannot add initializers after decoration has completed");
            i2.push(a2(e3 || null));
          };
          var m2 = (0, r2[f2])("accessor" === l2 ? { get: h2.get, set: h2.set } : h2[u2], p2);
          if ("accessor" === l2) {
            if (void 0 === m2) continue;
            if (null === m2 || "object" != typeof m2) throw TypeError("Object expected");
            (o2 = a2(m2.get)) && (h2.get = o2), (o2 = a2(m2.set)) && (h2.set = o2), (o2 = a2(m2.init)) && s2.unshift(o2);
          } else (o2 = a2(m2)) && ("field" === l2 ? s2.unshift(o2) : h2[u2] = o2);
        }
        c2 && Object.defineProperty(c2, n2.name, h2), d2 = true;
      }
      function l(e2, t2, r2) {
        for (var n2 = arguments.length > 2, s2 = 0; s2 < t2.length; s2++) r2 = n2 ? t2[s2].call(e2, r2) : t2[s2].call(e2);
        return n2 ? r2 : void 0;
      }
      function u(e2) {
        return "symbol" == typeof e2 ? e2 : "".concat(e2);
      }
      function c(e2, t2, r2) {
        return "symbol" == typeof t2 && (t2 = t2.description ? "[".concat(t2.description, "]") : ""), Object.defineProperty(e2, "name", { configurable: true, value: r2 ? "".concat(r2, " ", t2) : t2 });
      }
      function h(e2, t2) {
        if ("object" == typeof Reflect && "function" == typeof Reflect.metadata) return Reflect.metadata(e2, t2);
      }
      function d(e2, t2, r2, n2) {
        return new (r2 || (r2 = Promise))(function(s2, i2) {
          function a2(e3) {
            try {
              l2(n2.next(e3));
            } catch (e4) {
              i2(e4);
            }
          }
          function o2(e3) {
            try {
              l2(n2.throw(e3));
            } catch (e4) {
              i2(e4);
            }
          }
          function l2(e3) {
            var t3;
            e3.done ? s2(e3.value) : ((t3 = e3.value) instanceof r2 ? t3 : new r2(function(e4) {
              e4(t3);
            })).then(a2, o2);
          }
          l2((n2 = n2.apply(e2, t2 || [])).next());
        });
      }
      function f(e2, t2) {
        var r2, n2, s2, i2 = { label: 0, sent: function() {
          if (1 & s2[0]) throw s2[1];
          return s2[1];
        }, trys: [], ops: [] }, a2 = Object.create(("function" == typeof Iterator ? Iterator : Object).prototype);
        return a2.next = o2(0), a2.throw = o2(1), a2.return = o2(2), "function" == typeof Symbol && (a2[Symbol.iterator] = function() {
          return this;
        }), a2;
        function o2(o3) {
          return function(l2) {
            var u2 = [o3, l2];
            if (r2) throw TypeError("Generator is already executing.");
            for (; a2 && (a2 = 0, u2[0] && (i2 = 0)), i2; ) try {
              if (r2 = 1, n2 && (s2 = 2 & u2[0] ? n2.return : u2[0] ? n2.throw || ((s2 = n2.return) && s2.call(n2), 0) : n2.next) && !(s2 = s2.call(n2, u2[1])).done) return s2;
              switch (n2 = 0, s2 && (u2 = [2 & u2[0], s2.value]), u2[0]) {
                case 0:
                case 1:
                  s2 = u2;
                  break;
                case 4:
                  return i2.label++, { value: u2[1], done: false };
                case 5:
                  i2.label++, n2 = u2[1], u2 = [0];
                  continue;
                case 7:
                  u2 = i2.ops.pop(), i2.trys.pop();
                  continue;
                default:
                  if (!(s2 = (s2 = i2.trys).length > 0 && s2[s2.length - 1]) && (6 === u2[0] || 2 === u2[0])) {
                    i2 = 0;
                    continue;
                  }
                  if (3 === u2[0] && (!s2 || u2[1] > s2[0] && u2[1] < s2[3])) {
                    i2.label = u2[1];
                    break;
                  }
                  if (6 === u2[0] && i2.label < s2[1]) {
                    i2.label = s2[1], s2 = u2;
                    break;
                  }
                  if (s2 && i2.label < s2[2]) {
                    i2.label = s2[2], i2.ops.push(u2);
                    break;
                  }
                  s2[2] && i2.ops.pop(), i2.trys.pop();
                  continue;
              }
              u2 = t2.call(e2, i2);
            } catch (e3) {
              u2 = [6, e3], n2 = 0;
            } finally {
              r2 = s2 = 0;
            }
            if (5 & u2[0]) throw u2[1];
            return { value: u2[0] ? u2[1] : void 0, done: true };
          };
        }
      }
      var p = Object.create ? function(e2, t2, r2, n2) {
        void 0 === n2 && (n2 = r2);
        var s2 = Object.getOwnPropertyDescriptor(t2, r2);
        (!s2 || ("get" in s2 ? !t2.__esModule : s2.writable || s2.configurable)) && (s2 = { enumerable: true, get: function() {
          return t2[r2];
        } }), Object.defineProperty(e2, n2, s2);
      } : function(e2, t2, r2, n2) {
        void 0 === n2 && (n2 = r2), e2[n2] = t2[r2];
      };
      function g(e2, t2) {
        for (var r2 in e2) "default" === r2 || Object.prototype.hasOwnProperty.call(t2, r2) || p(t2, e2, r2);
      }
      function m(e2) {
        var t2 = "function" == typeof Symbol && Symbol.iterator, r2 = t2 && e2[t2], n2 = 0;
        if (r2) return r2.call(e2);
        if (e2 && "number" == typeof e2.length) return { next: function() {
          return e2 && n2 >= e2.length && (e2 = void 0), { value: e2 && e2[n2++], done: !e2 };
        } };
        throw TypeError(t2 ? "Object is not iterable." : "Symbol.iterator is not defined.");
      }
      function y(e2, t2) {
        var r2 = "function" == typeof Symbol && e2[Symbol.iterator];
        if (!r2) return e2;
        var n2, s2, i2 = r2.call(e2), a2 = [];
        try {
          for (; (void 0 === t2 || t2-- > 0) && !(n2 = i2.next()).done; ) a2.push(n2.value);
        } catch (e3) {
          s2 = { error: e3 };
        } finally {
          try {
            n2 && !n2.done && (r2 = i2.return) && r2.call(i2);
          } finally {
            if (s2) throw s2.error;
          }
        }
        return a2;
      }
      function w() {
        for (var e2 = [], t2 = 0; t2 < arguments.length; t2++) e2 = e2.concat(y(arguments[t2]));
        return e2;
      }
      function b() {
        for (var e2 = 0, t2 = 0, r2 = arguments.length; t2 < r2; t2++) e2 += arguments[t2].length;
        for (var n2 = Array(e2), s2 = 0, t2 = 0; t2 < r2; t2++) for (var i2 = arguments[t2], a2 = 0, o2 = i2.length; a2 < o2; a2++, s2++) n2[s2] = i2[a2];
        return n2;
      }
      function v(e2, t2, r2) {
        if (r2 || 2 == arguments.length) for (var n2, s2 = 0, i2 = t2.length; s2 < i2; s2++) !n2 && s2 in t2 || (n2 || (n2 = Array.prototype.slice.call(t2, 0, s2)), n2[s2] = t2[s2]);
        return e2.concat(n2 || Array.prototype.slice.call(t2));
      }
      function _(e2) {
        return this instanceof _ ? (this.v = e2, this) : new _(e2);
      }
      function S(e2, t2, r2) {
        if (!Symbol.asyncIterator) throw TypeError("Symbol.asyncIterator is not defined.");
        var n2, s2 = r2.apply(e2, t2 || []), i2 = [];
        return n2 = Object.create(("function" == typeof AsyncIterator ? AsyncIterator : Object).prototype), a2("next"), a2("throw"), a2("return", function(e3) {
          return function(t3) {
            return Promise.resolve(t3).then(e3, u2);
          };
        }), n2[Symbol.asyncIterator] = function() {
          return this;
        }, n2;
        function a2(e3, t3) {
          s2[e3] && (n2[e3] = function(t4) {
            return new Promise(function(r3, n3) {
              i2.push([e3, t4, r3, n3]) > 1 || o2(e3, t4);
            });
          }, t3 && (n2[e3] = t3(n2[e3])));
        }
        function o2(e3, t3) {
          try {
            var r3;
            (r3 = s2[e3](t3)).value instanceof _ ? Promise.resolve(r3.value.v).then(l2, u2) : c2(i2[0][2], r3);
          } catch (e4) {
            c2(i2[0][3], e4);
          }
        }
        function l2(e3) {
          o2("next", e3);
        }
        function u2(e3) {
          o2("throw", e3);
        }
        function c2(e3, t3) {
          e3(t3), i2.shift(), i2.length && o2(i2[0][0], i2[0][1]);
        }
      }
      function E(e2) {
        var t2, r2;
        return t2 = {}, n2("next"), n2("throw", function(e3) {
          throw e3;
        }), n2("return"), t2[Symbol.iterator] = function() {
          return this;
        }, t2;
        function n2(n3, s2) {
          t2[n3] = e2[n3] ? function(t3) {
            return (r2 = !r2) ? { value: _(e2[n3](t3)), done: false } : s2 ? s2(t3) : t3;
          } : s2;
        }
      }
      function k(e2) {
        if (!Symbol.asyncIterator) throw TypeError("Symbol.asyncIterator is not defined.");
        var t2, r2 = e2[Symbol.asyncIterator];
        return r2 ? r2.call(e2) : (e2 = m(e2), t2 = {}, n2("next"), n2("throw"), n2("return"), t2[Symbol.asyncIterator] = function() {
          return this;
        }, t2);
        function n2(r3) {
          t2[r3] = e2[r3] && function(t3) {
            return new Promise(function(n3, s2) {
              var i2, a2, o2;
              i2 = n3, a2 = s2, o2 = (t3 = e2[r3](t3)).done, Promise.resolve(t3.value).then(function(e3) {
                i2({ value: e3, done: o2 });
              }, a2);
            });
          };
        }
      }
      function O(e2, t2) {
        return Object.defineProperty ? Object.defineProperty(e2, "raw", { value: t2 }) : e2.raw = t2, e2;
      }
      var T = Object.create ? function(e2, t2) {
        Object.defineProperty(e2, "default", { enumerable: true, value: t2 });
      } : function(e2, t2) {
        e2.default = t2;
      }, R = function(e2) {
        return (R = Object.getOwnPropertyNames || function(e3) {
          var t2 = [];
          for (var r2 in e3) Object.prototype.hasOwnProperty.call(e3, r2) && (t2[t2.length] = r2);
          return t2;
        })(e2);
      };
      function x(e2) {
        if (e2 && e2.__esModule) return e2;
        var t2 = {};
        if (null != e2) for (var r2 = R(e2), n2 = 0; n2 < r2.length; n2++) "default" !== r2[n2] && p(t2, e2, r2[n2]);
        return T(t2, e2), t2;
      }
      function C(e2) {
        return e2 && e2.__esModule ? e2 : { default: e2 };
      }
      function j(e2, t2, r2, n2) {
        if ("a" === r2 && !n2) throw TypeError("Private accessor was defined without a getter");
        if ("function" == typeof t2 ? e2 !== t2 || !n2 : !t2.has(e2)) throw TypeError("Cannot read private member from an object whose class did not declare it");
        return "m" === r2 ? n2 : "a" === r2 ? n2.call(e2) : n2 ? n2.value : t2.get(e2);
      }
      function P(e2, t2, r2, n2, s2) {
        if ("m" === n2) throw TypeError("Private method is not writable");
        if ("a" === n2 && !s2) throw TypeError("Private accessor was defined without a setter");
        if ("function" == typeof t2 ? e2 !== t2 || !s2 : !t2.has(e2)) throw TypeError("Cannot write private member to an object whose class did not declare it");
        return "a" === n2 ? s2.call(e2, r2) : s2 ? s2.value = r2 : t2.set(e2, r2), r2;
      }
      function A(e2, t2) {
        if (null === t2 || "object" != typeof t2 && "function" != typeof t2) throw TypeError("Cannot use 'in' operator on non-object");
        return "function" == typeof e2 ? t2 === e2 : e2.has(t2);
      }
      function I(e2, t2, r2) {
        if (null != t2) {
          var n2, s2;
          if ("object" != typeof t2 && "function" != typeof t2) throw TypeError("Object expected.");
          if (r2) {
            if (!Symbol.asyncDispose) throw TypeError("Symbol.asyncDispose is not defined.");
            n2 = t2[Symbol.asyncDispose];
          }
          if (void 0 === n2) {
            if (!Symbol.dispose) throw TypeError("Symbol.dispose is not defined.");
            n2 = t2[Symbol.dispose], r2 && (s2 = n2);
          }
          if ("function" != typeof n2) throw TypeError("Object not disposable.");
          s2 && (n2 = function() {
            try {
              s2.call(this);
            } catch (e3) {
              return Promise.reject(e3);
            }
          }), e2.stack.push({ value: t2, dispose: n2, async: r2 });
        } else r2 && e2.stack.push({ async: true });
        return t2;
      }
      var $ = "function" == typeof SuppressedError ? SuppressedError : function(e2, t2, r2) {
        var n2 = Error(r2);
        return n2.name = "SuppressedError", n2.error = e2, n2.suppressed = t2, n2;
      };
      function N(e2) {
        function t2(t3) {
          e2.error = e2.hasError ? new $(t3, e2.error, "An error was suppressed during disposal.") : t3, e2.hasError = true;
        }
        var r2, n2 = 0;
        return function s2() {
          for (; r2 = e2.stack.pop(); ) try {
            if (!r2.async && 1 === n2) return n2 = 0, e2.stack.push(r2), Promise.resolve().then(s2);
            if (r2.dispose) {
              var i2 = r2.dispose.call(r2.value);
              if (r2.async) return n2 |= 2, Promise.resolve(i2).then(s2, function(e3) {
                return t2(e3), s2();
              });
            } else n2 |= 1;
          } catch (e3) {
            t2(e3);
          }
          if (1 === n2) return e2.hasError ? Promise.reject(e2.error) : Promise.resolve();
          if (e2.hasError) throw e2.error;
        }();
      }
      function U(e2, t2) {
        return "string" == typeof e2 && /^\.\.?\//.test(e2) ? e2.replace(/\.(tsx)$|((?:\.d)?)((?:\.[^./]+?)?)\.([cm]?)ts$/i, function(e3, r2, n2, s2, i2) {
          return r2 ? t2 ? ".jsx" : ".js" : !n2 || s2 && i2 ? n2 + s2 + "." + i2.toLowerCase() + "js" : e3;
        }) : e2;
      }
      let D = { __extends: r, __assign: n, __rest: s, __decorate: i, __param: a, __esDecorate: o, __runInitializers: l, __propKey: u, __setFunctionName: c, __metadata: h, __awaiter: d, __generator: f, __createBinding: p, __exportStar: g, __values: m, __read: y, __spread: w, __spreadArrays: b, __spreadArray: v, __await: _, __asyncGenerator: S, __asyncDelegator: E, __asyncValues: k, __makeTemplateObject: O, __importStar: x, __importDefault: C, __classPrivateFieldGet: j, __classPrivateFieldSet: P, __classPrivateFieldIn: A, __addDisposableResource: I, __disposeResources: N, __rewriteRelativeImportExtension: U };
      e.s(["__addDisposableResource", () => I, "__assign", () => n, "__asyncDelegator", () => E, "__asyncGenerator", () => S, "__asyncValues", () => k, "__await", () => _, "__awaiter", () => d, "__classPrivateFieldGet", () => j, "__classPrivateFieldIn", () => A, "__classPrivateFieldSet", () => P, "__createBinding", () => p, "__decorate", () => i, "__disposeResources", () => N, "__esDecorate", () => o, "__exportStar", () => g, "__extends", () => r, "__generator", () => f, "__importDefault", () => C, "__importStar", () => x, "__makeTemplateObject", () => O, "__metadata", () => h, "__param", () => a, "__propKey", () => u, "__read", () => y, "__rest", () => s, "__rewriteRelativeImportExtension", () => U, "__runInitializers", () => l, "__setFunctionName", () => c, "__spread", () => w, "__spreadArray", () => v, "__spreadArrays", () => b, "__values", () => m, "default", 0, D]);
    }, 93143, (e, t, r) => {
      "use strict";
      Object.defineProperty(r, "__esModule", { value: true }), r.default = class extends Error {
        constructor(e2) {
          super(e2.message), this.name = "PostgrestError", this.details = e2.details, this.hint = e2.hint, this.code = e2.code;
        }
      };
    }, 1264, (e, t, r) => {
      "use strict";
      Object.defineProperty(r, "__esModule", { value: true });
      let n = e.r(70858).__importDefault(e.r(93143));
      r.default = class {
        constructor(e2) {
          var t2, r2;
          this.shouldThrowOnError = false, this.method = e2.method, this.url = e2.url, this.headers = new Headers(e2.headers), this.schema = e2.schema, this.body = e2.body, this.shouldThrowOnError = null != (t2 = e2.shouldThrowOnError) && t2, this.signal = e2.signal, this.isMaybeSingle = null != (r2 = e2.isMaybeSingle) && r2, e2.fetch ? this.fetch = e2.fetch : this.fetch = fetch;
        }
        throwOnError() {
          return this.shouldThrowOnError = true, this;
        }
        setHeader(e2, t2) {
          return this.headers = new Headers(this.headers), this.headers.set(e2, t2), this;
        }
        then(e2, t2) {
          void 0 === this.schema || (["GET", "HEAD"].includes(this.method) ? this.headers.set("Accept-Profile", this.schema) : this.headers.set("Content-Profile", this.schema)), "GET" !== this.method && "HEAD" !== this.method && this.headers.set("Content-Type", "application/json");
          let r2 = (0, this.fetch)(this.url.toString(), { method: this.method, headers: this.headers, body: JSON.stringify(this.body), signal: this.signal }).then(async (e3) => {
            var t3, r3, s, i;
            let a = null, o = null, l = null, u = e3.status, c = e3.statusText;
            if (e3.ok) {
              if ("HEAD" !== this.method) {
                let r4 = await e3.text();
                "" === r4 || (o = "text/csv" === this.headers.get("Accept") || this.headers.get("Accept") && (null == (t3 = this.headers.get("Accept")) ? void 0 : t3.includes("application/vnd.pgrst.plan+text")) ? r4 : JSON.parse(r4));
              }
              let n2 = null == (r3 = this.headers.get("Prefer")) ? void 0 : r3.match(/count=(exact|planned|estimated)/), i2 = null == (s = e3.headers.get("content-range")) ? void 0 : s.split("/");
              n2 && i2 && i2.length > 1 && (l = parseInt(i2[1])), this.isMaybeSingle && "GET" === this.method && Array.isArray(o) && (o.length > 1 ? (a = { code: "PGRST116", details: `Results contain ${o.length} rows, application/vnd.pgrst.object+json requires 1 row`, hint: null, message: "JSON object requested, multiple (or no) rows returned" }, o = null, l = null, u = 406, c = "Not Acceptable") : o = 1 === o.length ? o[0] : null);
            } else {
              let t4 = await e3.text();
              try {
                a = JSON.parse(t4), Array.isArray(a) && 404 === e3.status && (o = [], a = null, u = 200, c = "OK");
              } catch (r4) {
                404 === e3.status && "" === t4 ? (u = 204, c = "No Content") : a = { message: t4 };
              }
              if (a && this.isMaybeSingle && (null == (i = null == a ? void 0 : a.details) ? void 0 : i.includes("0 rows")) && (a = null, u = 200, c = "OK"), a && this.shouldThrowOnError) throw new n.default(a);
            }
            return { error: a, data: o, count: l, status: u, statusText: c };
          });
          return this.shouldThrowOnError || (r2 = r2.catch((e3) => {
            var t3, r3, n2, s, i, a;
            let o = "", l = null == e3 ? void 0 : e3.cause;
            if (l) {
              let i2 = null != (t3 = null == l ? void 0 : l.message) ? t3 : "", a2 = null != (r3 = null == l ? void 0 : l.code) ? r3 : "";
              o = `${null != (n2 = null == e3 ? void 0 : e3.name) ? n2 : "FetchError"}: ${null == e3 ? void 0 : e3.message}

Caused by: ${null != (s = null == l ? void 0 : l.name) ? s : "Error"}: ${i2}`, a2 && (o += ` (${a2})`), (null == l ? void 0 : l.stack) && (o += `
${l.stack}`);
            } else o = null != (i = null == e3 ? void 0 : e3.stack) ? i : "";
            return { error: { message: `${null != (a = null == e3 ? void 0 : e3.name) ? a : "FetchError"}: ${null == e3 ? void 0 : e3.message}`, details: o, hint: "", code: "" }, data: null, count: null, status: 0, statusText: "" };
          })), r2.then(e2, t2);
        }
        returns() {
          return this;
        }
        overrideTypes() {
          return this;
        }
      };
    }, 44588, (e, t, r) => {
      "use strict";
      Object.defineProperty(r, "__esModule", { value: true });
      let n = e.r(70858).__importDefault(e.r(1264));
      class s extends n.default {
        select(e2) {
          let t2 = false, r2 = (null != e2 ? e2 : "*").split("").map((e3) => /\s/.test(e3) && !t2 ? "" : ('"' === e3 && (t2 = !t2), e3)).join("");
          return this.url.searchParams.set("select", r2), this.headers.append("Prefer", "return=representation"), this;
        }
        order(e2, { ascending: t2 = true, nullsFirst: r2, foreignTable: n2, referencedTable: s2 = n2 } = {}) {
          let i = s2 ? `${s2}.order` : "order", a = this.url.searchParams.get(i);
          return this.url.searchParams.set(i, `${a ? `${a},` : ""}${e2}.${t2 ? "asc" : "desc"}${void 0 === r2 ? "" : r2 ? ".nullsfirst" : ".nullslast"}`), this;
        }
        limit(e2, { foreignTable: t2, referencedTable: r2 = t2 } = {}) {
          let n2 = void 0 === r2 ? "limit" : `${r2}.limit`;
          return this.url.searchParams.set(n2, `${e2}`), this;
        }
        range(e2, t2, { foreignTable: r2, referencedTable: n2 = r2 } = {}) {
          let s2 = void 0 === n2 ? "offset" : `${n2}.offset`, i = void 0 === n2 ? "limit" : `${n2}.limit`;
          return this.url.searchParams.set(s2, `${e2}`), this.url.searchParams.set(i, `${t2 - e2 + 1}`), this;
        }
        abortSignal(e2) {
          return this.signal = e2, this;
        }
        single() {
          return this.headers.set("Accept", "application/vnd.pgrst.object+json"), this;
        }
        maybeSingle() {
          return "GET" === this.method ? this.headers.set("Accept", "application/json") : this.headers.set("Accept", "application/vnd.pgrst.object+json"), this.isMaybeSingle = true, this;
        }
        csv() {
          return this.headers.set("Accept", "text/csv"), this;
        }
        geojson() {
          return this.headers.set("Accept", "application/geo+json"), this;
        }
        explain({ analyze: e2 = false, verbose: t2 = false, settings: r2 = false, buffers: n2 = false, wal: s2 = false, format: i = "text" } = {}) {
          var a;
          let o = [e2 ? "analyze" : null, t2 ? "verbose" : null, r2 ? "settings" : null, n2 ? "buffers" : null, s2 ? "wal" : null].filter(Boolean).join("|"), l = null != (a = this.headers.get("Accept")) ? a : "application/json";
          return this.headers.set("Accept", `application/vnd.pgrst.plan+${i}; for="${l}"; options=${o};`), this;
        }
        rollback() {
          return this.headers.append("Prefer", "tx=rollback"), this;
        }
        returns() {
          return this;
        }
        maxAffected(e2) {
          return this.headers.append("Prefer", "handling=strict"), this.headers.append("Prefer", `max-affected=${e2}`), this;
        }
      }
      r.default = s;
    }, 37729, (e, t, r) => {
      "use strict";
      Object.defineProperty(r, "__esModule", { value: true });
      let n = e.r(70858).__importDefault(e.r(44588)), s = RegExp("[,()]");
      class i extends n.default {
        eq(e2, t2) {
          return this.url.searchParams.append(e2, `eq.${t2}`), this;
        }
        neq(e2, t2) {
          return this.url.searchParams.append(e2, `neq.${t2}`), this;
        }
        gt(e2, t2) {
          return this.url.searchParams.append(e2, `gt.${t2}`), this;
        }
        gte(e2, t2) {
          return this.url.searchParams.append(e2, `gte.${t2}`), this;
        }
        lt(e2, t2) {
          return this.url.searchParams.append(e2, `lt.${t2}`), this;
        }
        lte(e2, t2) {
          return this.url.searchParams.append(e2, `lte.${t2}`), this;
        }
        like(e2, t2) {
          return this.url.searchParams.append(e2, `like.${t2}`), this;
        }
        likeAllOf(e2, t2) {
          return this.url.searchParams.append(e2, `like(all).{${t2.join(",")}}`), this;
        }
        likeAnyOf(e2, t2) {
          return this.url.searchParams.append(e2, `like(any).{${t2.join(",")}}`), this;
        }
        ilike(e2, t2) {
          return this.url.searchParams.append(e2, `ilike.${t2}`), this;
        }
        ilikeAllOf(e2, t2) {
          return this.url.searchParams.append(e2, `ilike(all).{${t2.join(",")}}`), this;
        }
        ilikeAnyOf(e2, t2) {
          return this.url.searchParams.append(e2, `ilike(any).{${t2.join(",")}}`), this;
        }
        regexMatch(e2, t2) {
          return this.url.searchParams.append(e2, `match.${t2}`), this;
        }
        regexIMatch(e2, t2) {
          return this.url.searchParams.append(e2, `imatch.${t2}`), this;
        }
        is(e2, t2) {
          return this.url.searchParams.append(e2, `is.${t2}`), this;
        }
        isDistinct(e2, t2) {
          return this.url.searchParams.append(e2, `isdistinct.${t2}`), this;
        }
        in(e2, t2) {
          let r2 = Array.from(new Set(t2)).map((e3) => "string" == typeof e3 && s.test(e3) ? `"${e3}"` : `${e3}`).join(",");
          return this.url.searchParams.append(e2, `in.(${r2})`), this;
        }
        contains(e2, t2) {
          return "string" == typeof t2 ? this.url.searchParams.append(e2, `cs.${t2}`) : Array.isArray(t2) ? this.url.searchParams.append(e2, `cs.{${t2.join(",")}}`) : this.url.searchParams.append(e2, `cs.${JSON.stringify(t2)}`), this;
        }
        containedBy(e2, t2) {
          return "string" == typeof t2 ? this.url.searchParams.append(e2, `cd.${t2}`) : Array.isArray(t2) ? this.url.searchParams.append(e2, `cd.{${t2.join(",")}}`) : this.url.searchParams.append(e2, `cd.${JSON.stringify(t2)}`), this;
        }
        rangeGt(e2, t2) {
          return this.url.searchParams.append(e2, `sr.${t2}`), this;
        }
        rangeGte(e2, t2) {
          return this.url.searchParams.append(e2, `nxl.${t2}`), this;
        }
        rangeLt(e2, t2) {
          return this.url.searchParams.append(e2, `sl.${t2}`), this;
        }
        rangeLte(e2, t2) {
          return this.url.searchParams.append(e2, `nxr.${t2}`), this;
        }
        rangeAdjacent(e2, t2) {
          return this.url.searchParams.append(e2, `adj.${t2}`), this;
        }
        overlaps(e2, t2) {
          return "string" == typeof t2 ? this.url.searchParams.append(e2, `ov.${t2}`) : this.url.searchParams.append(e2, `ov.{${t2.join(",")}}`), this;
        }
        textSearch(e2, t2, { config: r2, type: n2 } = {}) {
          let s2 = "";
          "plain" === n2 ? s2 = "pl" : "phrase" === n2 ? s2 = "ph" : "websearch" === n2 && (s2 = "w");
          let i2 = void 0 === r2 ? "" : `(${r2})`;
          return this.url.searchParams.append(e2, `${s2}fts${i2}.${t2}`), this;
        }
        match(e2) {
          return Object.entries(e2).forEach(([e3, t2]) => {
            this.url.searchParams.append(e3, `eq.${t2}`);
          }), this;
        }
        not(e2, t2, r2) {
          return this.url.searchParams.append(e2, `not.${t2}.${r2}`), this;
        }
        or(e2, { foreignTable: t2, referencedTable: r2 = t2 } = {}) {
          let n2 = r2 ? `${r2}.or` : "or";
          return this.url.searchParams.append(n2, `(${e2})`), this;
        }
        filter(e2, t2, r2) {
          return this.url.searchParams.append(e2, `${t2}.${r2}`), this;
        }
      }
      r.default = i;
    }, 89237, (e, t, r) => {
      "use strict";
      Object.defineProperty(r, "__esModule", { value: true });
      let n = e.r(70858).__importDefault(e.r(37729));
      r.default = class {
        constructor(e2, { headers: t2 = {}, schema: r2, fetch: n2 }) {
          this.url = e2, this.headers = new Headers(t2), this.schema = r2, this.fetch = n2;
        }
        select(e2, t2) {
          let { head: r2 = false, count: s } = null != t2 ? t2 : {}, i = false, a = (null != e2 ? e2 : "*").split("").map((e3) => /\s/.test(e3) && !i ? "" : ('"' === e3 && (i = !i), e3)).join("");
          return this.url.searchParams.set("select", a), s && this.headers.append("Prefer", `count=${s}`), new n.default({ method: r2 ? "HEAD" : "GET", url: this.url, headers: this.headers, schema: this.schema, fetch: this.fetch });
        }
        insert(e2, { count: t2, defaultToNull: r2 = true } = {}) {
          var s;
          if (t2 && this.headers.append("Prefer", `count=${t2}`), r2 || this.headers.append("Prefer", "missing=default"), Array.isArray(e2)) {
            let t3 = e2.reduce((e3, t4) => e3.concat(Object.keys(t4)), []);
            if (t3.length > 0) {
              let e3 = [...new Set(t3)].map((e4) => `"${e4}"`);
              this.url.searchParams.set("columns", e3.join(","));
            }
          }
          return new n.default({ method: "POST", url: this.url, headers: this.headers, schema: this.schema, body: e2, fetch: null != (s = this.fetch) ? s : fetch });
        }
        upsert(e2, { onConflict: t2, ignoreDuplicates: r2 = false, count: s, defaultToNull: i = true } = {}) {
          var a;
          if (this.headers.append("Prefer", `resolution=${r2 ? "ignore" : "merge"}-duplicates`), void 0 !== t2 && this.url.searchParams.set("on_conflict", t2), s && this.headers.append("Prefer", `count=${s}`), i || this.headers.append("Prefer", "missing=default"), Array.isArray(e2)) {
            let t3 = e2.reduce((e3, t4) => e3.concat(Object.keys(t4)), []);
            if (t3.length > 0) {
              let e3 = [...new Set(t3)].map((e4) => `"${e4}"`);
              this.url.searchParams.set("columns", e3.join(","));
            }
          }
          return new n.default({ method: "POST", url: this.url, headers: this.headers, schema: this.schema, body: e2, fetch: null != (a = this.fetch) ? a : fetch });
        }
        update(e2, { count: t2 } = {}) {
          var r2;
          return t2 && this.headers.append("Prefer", `count=${t2}`), new n.default({ method: "PATCH", url: this.url, headers: this.headers, schema: this.schema, body: e2, fetch: null != (r2 = this.fetch) ? r2 : fetch });
        }
        delete({ count: e2 } = {}) {
          var t2;
          return e2 && this.headers.append("Prefer", `count=${e2}`), new n.default({ method: "DELETE", url: this.url, headers: this.headers, schema: this.schema, fetch: null != (t2 = this.fetch) ? t2 : fetch });
        }
      };
    }, 51048, (e, t, r) => {
      "use strict";
      Object.defineProperty(r, "__esModule", { value: true });
      let n = e.r(70858), s = n.__importDefault(e.r(89237)), i = n.__importDefault(e.r(37729));
      class a {
        constructor(e2, { headers: t2 = {}, schema: r2, fetch: n2 } = {}) {
          this.url = e2, this.headers = new Headers(t2), this.schemaName = r2, this.fetch = n2;
        }
        from(e2) {
          if (!e2 || "string" != typeof e2 || "" === e2.trim()) throw Error("Invalid relation name: relation must be a non-empty string.");
          let t2 = new URL(`${this.url}/${e2}`);
          return new s.default(t2, { headers: new Headers(this.headers), schema: this.schemaName, fetch: this.fetch });
        }
        schema(e2) {
          return new a(this.url, { headers: this.headers, schema: e2, fetch: this.fetch });
        }
        rpc(e2, t2 = {}, { head: r2 = false, get: n2 = false, count: s2 } = {}) {
          var a2;
          let o, l, u = new URL(`${this.url}/rpc/${e2}`);
          r2 || n2 ? (o = r2 ? "HEAD" : "GET", Object.entries(t2).filter(([e3, t3]) => void 0 !== t3).map(([e3, t3]) => [e3, Array.isArray(t3) ? `{${t3.join(",")}}` : `${t3}`]).forEach(([e3, t3]) => {
            u.searchParams.append(e3, t3);
          })) : (o = "POST", l = t2);
          let c = new Headers(this.headers);
          return s2 && c.set("Prefer", `count=${s2}`), new i.default({ method: o, url: u, headers: c, schema: this.schemaName, body: l, fetch: null != (a2 = this.fetch) ? a2 : fetch });
        }
      }
      r.default = a;
    }, 1565, (e, t, r) => {
      "use strict";
      Object.defineProperty(r, "__esModule", { value: true }), r.PostgrestError = r.PostgrestBuilder = r.PostgrestTransformBuilder = r.PostgrestFilterBuilder = r.PostgrestQueryBuilder = r.PostgrestClient = void 0;
      let n = e.r(70858), s = n.__importDefault(e.r(51048));
      r.PostgrestClient = s.default;
      let i = n.__importDefault(e.r(89237));
      r.PostgrestQueryBuilder = i.default;
      let a = n.__importDefault(e.r(37729));
      r.PostgrestFilterBuilder = a.default;
      let o = n.__importDefault(e.r(44588));
      r.PostgrestTransformBuilder = o.default;
      let l = n.__importDefault(e.r(1264));
      r.PostgrestBuilder = l.default;
      let u = n.__importDefault(e.r(93143));
      r.PostgrestError = u.default, r.default = { PostgrestClient: s.default, PostgrestQueryBuilder: i.default, PostgrestFilterBuilder: a.default, PostgrestTransformBuilder: o.default, PostgrestBuilder: l.default, PostgrestError: u.default };
    }, 99929, (e, t, r) => {
      "use strict";
      let n;
      Object.defineProperty(r, "__esModule", { value: true }), r.parseCookie = h, r.parse = h, r.stringifyCookie = function(e2, t2) {
        let r2 = t2?.encode || encodeURIComponent, n2 = [];
        for (let t3 of Object.keys(e2)) {
          let a2 = e2[t3];
          if (void 0 === a2) continue;
          if (!s.test(t3)) throw TypeError(`cookie name is invalid: ${t3}`);
          let o2 = r2(a2);
          if (!i.test(o2)) throw TypeError(`cookie val is invalid: ${a2}`);
          n2.push(`${t3}=${o2}`);
        }
        return n2.join("; ");
      }, r.stringifySetCookie = d, r.serialize = d, r.parseSetCookie = function(e2, t2) {
        let r2 = t2?.decode || m, n2 = e2.length, s2 = f(e2, 0, n2), i2 = p(e2, 0, s2), a2 = -1 === i2 ? { name: "", value: r2(g(e2, 0, s2)) } : { name: g(e2, 0, i2), value: r2(g(e2, i2 + 1, s2)) }, o2 = s2 + 1;
        for (; o2 < n2; ) {
          let t3 = f(e2, o2, n2), r3 = p(e2, o2, t3), s3 = -1 === r3 ? g(e2, o2, t3) : g(e2, o2, r3), i3 = -1 === r3 ? void 0 : g(e2, r3 + 1, t3);
          switch (s3.toLowerCase()) {
            case "httponly":
              a2.httpOnly = true;
              break;
            case "secure":
              a2.secure = true;
              break;
            case "partitioned":
              a2.partitioned = true;
              break;
            case "domain":
              a2.domain = i3;
              break;
            case "path":
              a2.path = i3;
              break;
            case "max-age":
              i3 && l.test(i3) && (a2.maxAge = Number(i3));
              break;
            case "expires":
              if (!i3) break;
              let u2 = new Date(i3);
              Number.isFinite(u2.valueOf()) && (a2.expires = u2);
              break;
            case "priority":
              if (!i3) break;
              let c2 = i3.toLowerCase();
              ("low" === c2 || "medium" === c2 || "high" === c2) && (a2.priority = c2);
              break;
            case "samesite":
              if (!i3) break;
              let h2 = i3.toLowerCase();
              ("lax" === h2 || "strict" === h2 || "none" === h2) && (a2.sameSite = h2);
          }
          o2 = t3 + 1;
        }
        return a2;
      }, r.stringifySetCookie = d, r.serialize = d;
      let s = /^[\u0021-\u003A\u003C\u003E-\u007E]+$/, i = /^[\u0021-\u003A\u003C-\u007E]*$/, a = /^([.]?[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)([.][a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i, o = /^[\u0020-\u003A\u003D-\u007E]*$/, l = /^-?\d+$/, u = Object.prototype.toString, c = ((n = function() {
      }).prototype = /* @__PURE__ */ Object.create(null), n);
      function h(e2, t2) {
        let r2 = new c(), n2 = e2.length;
        if (n2 < 2) return r2;
        let s2 = t2?.decode || m, i2 = 0;
        do {
          let t3 = p(e2, i2, n2);
          if (-1 === t3) break;
          let a2 = f(e2, i2, n2);
          if (t3 > a2) {
            i2 = e2.lastIndexOf(";", t3 - 1) + 1;
            continue;
          }
          let o2 = g(e2, i2, t3);
          void 0 === r2[o2] && (r2[o2] = s2(g(e2, t3 + 1, a2))), i2 = a2 + 1;
        } while (i2 < n2);
        return r2;
      }
      function d(e2, t2, r2) {
        let n2 = "object" == typeof e2 ? e2 : { ...r2, name: e2, value: String(t2) }, l2 = ("object" == typeof t2 ? t2 : r2)?.encode || encodeURIComponent;
        if (!s.test(n2.name)) throw TypeError(`argument name is invalid: ${n2.name}`);
        let c2 = n2.value ? l2(n2.value) : "";
        if (!i.test(c2)) throw TypeError(`argument val is invalid: ${n2.value}`);
        let h2 = n2.name + "=" + c2;
        if (void 0 !== n2.maxAge) {
          if (!Number.isInteger(n2.maxAge)) throw TypeError(`option maxAge is invalid: ${n2.maxAge}`);
          h2 += "; Max-Age=" + n2.maxAge;
        }
        if (n2.domain) {
          if (!a.test(n2.domain)) throw TypeError(`option domain is invalid: ${n2.domain}`);
          h2 += "; Domain=" + n2.domain;
        }
        if (n2.path) {
          if (!o.test(n2.path)) throw TypeError(`option path is invalid: ${n2.path}`);
          h2 += "; Path=" + n2.path;
        }
        if (n2.expires) {
          var d2;
          if (d2 = n2.expires, "[object Date]" !== u.call(d2) || !Number.isFinite(n2.expires.valueOf())) throw TypeError(`option expires is invalid: ${n2.expires}`);
          h2 += "; Expires=" + n2.expires.toUTCString();
        }
        if (n2.httpOnly && (h2 += "; HttpOnly"), n2.secure && (h2 += "; Secure"), n2.partitioned && (h2 += "; Partitioned"), n2.priority) switch ("string" == typeof n2.priority ? n2.priority.toLowerCase() : void 0) {
          case "low":
            h2 += "; Priority=Low";
            break;
          case "medium":
            h2 += "; Priority=Medium";
            break;
          case "high":
            h2 += "; Priority=High";
            break;
          default:
            throw TypeError(`option priority is invalid: ${n2.priority}`);
        }
        if (n2.sameSite) switch ("string" == typeof n2.sameSite ? n2.sameSite.toLowerCase() : n2.sameSite) {
          case true:
          case "strict":
            h2 += "; SameSite=Strict";
            break;
          case "lax":
            h2 += "; SameSite=Lax";
            break;
          case "none":
            h2 += "; SameSite=None";
            break;
          default:
            throw TypeError(`option sameSite is invalid: ${n2.sameSite}`);
        }
        return h2;
      }
      function f(e2, t2, r2) {
        let n2 = e2.indexOf(";", t2);
        return -1 === n2 ? r2 : n2;
      }
      function p(e2, t2, r2) {
        let n2 = e2.indexOf("=", t2);
        return n2 < r2 ? n2 : -1;
      }
      function g(e2, t2, r2) {
        let n2 = t2, s2 = r2;
        do {
          let t3 = e2.charCodeAt(n2);
          if (32 !== t3 && 9 !== t3) break;
        } while (++n2 < s2);
        for (; s2 > n2; ) {
          let t3 = e2.charCodeAt(s2 - 1);
          if (32 !== t3 && 9 !== t3) break;
          s2--;
        }
        return e2.slice(n2, s2);
      }
      function m(e2) {
        if (-1 === e2.indexOf("%")) return e2;
        try {
          return decodeURIComponent(e2);
        } catch (t2) {
          return e2;
        }
      }
    }, 39990, (e, t, r) => {
    }, 58217, (e) => {
      "use strict";
      let t, r;
      async function n() {
        return "_ENTRIES" in globalThis && _ENTRIES.middleware_instrumentation && await _ENTRIES.middleware_instrumentation;
      }
      let s = null;
      async function i() {
        if ("phase-production-build" === process.env.NEXT_PHASE) return;
        s || (s = n());
        let e10 = await s;
        if (null == e10 ? void 0 : e10.register) try {
          await e10.register();
        } catch (e11) {
          throw e11.message = `An error occurred while loading instrumentation hook: ${e11.message}`, e11;
        }
      }
      async function a(...e10) {
        let t10 = await n();
        try {
          var r10;
          await (null == t10 || null == (r10 = t10.onRequestError) ? void 0 : r10.call(t10, ...e10));
        } catch (e11) {
          console.error("Error in instrumentation.onRequestError:", e11);
        }
      }
      let o = null;
      function l() {
        return o || (o = i()), o;
      }
      function u(e10) {
        return `The edge runtime does not support Node.js '${e10}' module.
Learn More: https://nextjs.org/docs/messages/node-module-in-edge-runtime`;
      }
      process !== e.g.process && (process.env = e.g.process.env, e.g.process = process);
      try {
        Object.defineProperty(globalThis, "__import_unsupported", { value: function(e10) {
          let t10 = new Proxy(function() {
          }, { get(t11, r10) {
            if ("then" === r10) return {};
            throw Object.defineProperty(Error(u(e10)), "__NEXT_ERROR_CODE", { value: "E394", enumerable: false, configurable: true });
          }, construct() {
            throw Object.defineProperty(Error(u(e10)), "__NEXT_ERROR_CODE", { value: "E394", enumerable: false, configurable: true });
          }, apply(r10, n10, s2) {
            if ("function" == typeof s2[0]) return s2[0](t10);
            throw Object.defineProperty(Error(u(e10)), "__NEXT_ERROR_CODE", { value: "E394", enumerable: false, configurable: true });
          } });
          return new Proxy({}, { get: () => t10 });
        }, enumerable: false, configurable: false });
      } catch {
      }
      l();
      class c extends Error {
        constructor({ page: e10 }) {
          super(`The middleware "${e10}" accepts an async API directly with the form:
  
  export function middleware(request, event) {
    return NextResponse.redirect('/new-location')
  }
  
  Read more: https://nextjs.org/docs/messages/middleware-new-signature
  `);
        }
      }
      class h extends Error {
        constructor() {
          super(`The request.page has been deprecated in favour of \`URLPattern\`.
  Read more: https://nextjs.org/docs/messages/middleware-request-page
  `);
        }
      }
      class d extends Error {
        constructor() {
          super(`The request.ua has been removed in favour of \`userAgent\` function.
  Read more: https://nextjs.org/docs/messages/middleware-parse-user-agent
  `);
        }
      }
      let f = "_N_T_", p = { shared: "shared", reactServerComponents: "rsc", serverSideRendering: "ssr", actionBrowser: "action-browser", apiNode: "api-node", apiEdge: "api-edge", middleware: "middleware", instrument: "instrument", edgeAsset: "edge-asset", appPagesBrowser: "app-pages-browser", pagesDirBrowser: "pages-dir-browser", pagesDirEdge: "pages-dir-edge", pagesDirNode: "pages-dir-node" };
      function g(e10) {
        var t10, r10, n10, s2, i2, a2 = [], o2 = 0;
        function l2() {
          for (; o2 < e10.length && /\s/.test(e10.charAt(o2)); ) o2 += 1;
          return o2 < e10.length;
        }
        for (; o2 < e10.length; ) {
          for (t10 = o2, i2 = false; l2(); ) if ("," === (r10 = e10.charAt(o2))) {
            for (n10 = o2, o2 += 1, l2(), s2 = o2; o2 < e10.length && "=" !== (r10 = e10.charAt(o2)) && ";" !== r10 && "," !== r10; ) o2 += 1;
            o2 < e10.length && "=" === e10.charAt(o2) ? (i2 = true, o2 = s2, a2.push(e10.substring(t10, n10)), t10 = o2) : o2 = n10 + 1;
          } else o2 += 1;
          (!i2 || o2 >= e10.length) && a2.push(e10.substring(t10, e10.length));
        }
        return a2;
      }
      function m(e10) {
        let t10 = {}, r10 = [];
        if (e10) for (let [n10, s2] of e10.entries()) "set-cookie" === n10.toLowerCase() ? (r10.push(...g(s2)), t10[n10] = 1 === r10.length ? r10[0] : r10) : t10[n10] = s2;
        return t10;
      }
      function y(e10) {
        try {
          return String(new URL(String(e10)));
        } catch (t10) {
          throw Object.defineProperty(Error(`URL is malformed "${String(e10)}". Please use only absolute URLs - https://nextjs.org/docs/messages/middleware-relative-urls`, { cause: t10 }), "__NEXT_ERROR_CODE", { value: "E61", enumerable: false, configurable: true });
        }
      }
      ({ ...p, GROUP: { builtinReact: [p.reactServerComponents, p.actionBrowser], serverOnly: [p.reactServerComponents, p.actionBrowser, p.instrument, p.middleware], neutralTarget: [p.apiNode, p.apiEdge], clientOnly: [p.serverSideRendering, p.appPagesBrowser], bundled: [p.reactServerComponents, p.actionBrowser, p.serverSideRendering, p.appPagesBrowser, p.shared, p.instrument, p.middleware], appPages: [p.reactServerComponents, p.serverSideRendering, p.appPagesBrowser, p.actionBrowser] } });
      let w = Symbol("response"), b = Symbol("passThrough"), v = Symbol("waitUntil");
      class _ {
        constructor(e10, t10) {
          this[b] = false, this[v] = t10 ? { kind: "external", function: t10 } : { kind: "internal", promises: [] };
        }
        respondWith(e10) {
          this[w] || (this[w] = Promise.resolve(e10));
        }
        passThroughOnException() {
          this[b] = true;
        }
        waitUntil(e10) {
          if ("external" === this[v].kind) return (0, this[v].function)(e10);
          this[v].promises.push(e10);
        }
      }
      class S extends _ {
        constructor(e10) {
          var t10;
          super(e10.request, null == (t10 = e10.context) ? void 0 : t10.waitUntil), this.sourcePage = e10.page;
        }
        get request() {
          throw Object.defineProperty(new c({ page: this.sourcePage }), "__NEXT_ERROR_CODE", { value: "E394", enumerable: false, configurable: true });
        }
        respondWith() {
          throw Object.defineProperty(new c({ page: this.sourcePage }), "__NEXT_ERROR_CODE", { value: "E394", enumerable: false, configurable: true });
        }
      }
      function E(e10) {
        return e10.replace(/\/$/, "") || "/";
      }
      function k(e10) {
        let t10 = e10.indexOf("#"), r10 = e10.indexOf("?"), n10 = r10 > -1 && (t10 < 0 || r10 < t10);
        return n10 || t10 > -1 ? { pathname: e10.substring(0, n10 ? r10 : t10), query: n10 ? e10.substring(r10, t10 > -1 ? t10 : void 0) : "", hash: t10 > -1 ? e10.slice(t10) : "" } : { pathname: e10, query: "", hash: "" };
      }
      function O(e10, t10) {
        if (!e10.startsWith("/") || !t10) return e10;
        let { pathname: r10, query: n10, hash: s2 } = k(e10);
        return `${t10}${r10}${n10}${s2}`;
      }
      function T(e10, t10) {
        if (!e10.startsWith("/") || !t10) return e10;
        let { pathname: r10, query: n10, hash: s2 } = k(e10);
        return `${r10}${t10}${n10}${s2}`;
      }
      function R(e10, t10) {
        if ("string" != typeof e10) return false;
        let { pathname: r10 } = k(e10);
        return r10 === t10 || r10.startsWith(t10 + "/");
      }
      let x = /* @__PURE__ */ new WeakMap();
      function C(e10, t10) {
        let r10;
        if (!t10) return { pathname: e10 };
        let n10 = x.get(t10);
        n10 || (n10 = t10.map((e11) => e11.toLowerCase()), x.set(t10, n10));
        let s2 = e10.split("/", 2);
        if (!s2[1]) return { pathname: e10 };
        let i2 = s2[1].toLowerCase(), a2 = n10.indexOf(i2);
        return a2 < 0 ? { pathname: e10 } : (r10 = t10[a2], { pathname: e10 = e10.slice(r10.length + 1) || "/", detectedLocale: r10 });
      }
      let j = /(?!^https?:\/\/)(127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}|\[::1\]|localhost)/;
      function P(e10, t10) {
        return new URL(String(e10).replace(j, "localhost"), t10 && String(t10).replace(j, "localhost"));
      }
      let A = Symbol("NextURLInternal");
      class I {
        constructor(e10, t10, r10) {
          let n10, s2;
          "object" == typeof t10 && "pathname" in t10 || "string" == typeof t10 ? (n10 = t10, s2 = r10 || {}) : s2 = r10 || t10 || {}, this[A] = { url: P(e10, n10 ?? s2.base), options: s2, basePath: "" }, this.analyze();
        }
        analyze() {
          var e10, t10, r10, n10, s2;
          let i2 = function(e11, t11) {
            let { basePath: r11, i18n: n11, trailingSlash: s3 } = t11.nextConfig ?? {}, i3 = { pathname: e11, trailingSlash: "/" !== e11 ? e11.endsWith("/") : s3 };
            r11 && R(i3.pathname, r11) && (i3.pathname = function(e12, t12) {
              if (!R(e12, t12)) return e12;
              let r12 = e12.slice(t12.length);
              return r12.startsWith("/") ? r12 : `/${r12}`;
            }(i3.pathname, r11), i3.basePath = r11);
            let a3 = i3.pathname;
            if (i3.pathname.startsWith("/_next/data/") && i3.pathname.endsWith(".json")) {
              let e12 = i3.pathname.replace(/^\/_next\/data\//, "").replace(/\.json$/, "").split("/");
              i3.buildId = e12[0], a3 = "index" !== e12[1] ? `/${e12.slice(1).join("/")}` : "/", true === t11.parseData && (i3.pathname = a3);
            }
            if (n11) {
              let e12 = t11.i18nProvider ? t11.i18nProvider.analyze(i3.pathname) : C(i3.pathname, n11.locales);
              i3.locale = e12.detectedLocale, i3.pathname = e12.pathname ?? i3.pathname, !e12.detectedLocale && i3.buildId && (e12 = t11.i18nProvider ? t11.i18nProvider.analyze(a3) : C(a3, n11.locales)).detectedLocale && (i3.locale = e12.detectedLocale);
            }
            return i3;
          }(this[A].url.pathname, { nextConfig: this[A].options.nextConfig, parseData: true, i18nProvider: this[A].options.i18nProvider }), a2 = function(e11, t11) {
            let r11;
            if (t11?.host && !Array.isArray(t11.host)) r11 = t11.host.toString().split(":", 1)[0];
            else {
              if (!e11.hostname) return;
              r11 = e11.hostname;
            }
            return r11.toLowerCase();
          }(this[A].url, this[A].options.headers);
          this[A].domainLocale = this[A].options.i18nProvider ? this[A].options.i18nProvider.detectDomainLocale(a2) : function(e11, t11, r11) {
            if (e11) {
              for (let n11 of (r11 && (r11 = r11.toLowerCase()), e11)) if (t11 === n11.domain?.split(":", 1)[0].toLowerCase() || r11 === n11.defaultLocale.toLowerCase() || n11.locales?.some((e12) => e12.toLowerCase() === r11)) return n11;
            }
          }(null == (t10 = this[A].options.nextConfig) || null == (e10 = t10.i18n) ? void 0 : e10.domains, a2);
          let o2 = (null == (r10 = this[A].domainLocale) ? void 0 : r10.defaultLocale) || (null == (s2 = this[A].options.nextConfig) || null == (n10 = s2.i18n) ? void 0 : n10.defaultLocale);
          this[A].url.pathname = i2.pathname, this[A].defaultLocale = o2, this[A].basePath = i2.basePath ?? "", this[A].buildId = i2.buildId, this[A].locale = i2.locale ?? o2, this[A].trailingSlash = i2.trailingSlash;
        }
        formatPathname() {
          var e10;
          let t10;
          return t10 = function(e11, t11, r10, n10) {
            if (!t11 || t11 === r10) return e11;
            let s2 = e11.toLowerCase();
            return !n10 && (R(s2, "/api") || R(s2, `/${t11.toLowerCase()}`)) ? e11 : O(e11, `/${t11}`);
          }((e10 = { basePath: this[A].basePath, buildId: this[A].buildId, defaultLocale: this[A].options.forceLocale ? void 0 : this[A].defaultLocale, locale: this[A].locale, pathname: this[A].url.pathname, trailingSlash: this[A].trailingSlash }).pathname, e10.locale, e10.buildId ? void 0 : e10.defaultLocale, e10.ignorePrefix), (e10.buildId || !e10.trailingSlash) && (t10 = E(t10)), e10.buildId && (t10 = T(O(t10, `/_next/data/${e10.buildId}`), "/" === e10.pathname ? "index.json" : ".json")), t10 = O(t10, e10.basePath), !e10.buildId && e10.trailingSlash ? t10.endsWith("/") ? t10 : T(t10, "/") : E(t10);
        }
        formatSearch() {
          return this[A].url.search;
        }
        get buildId() {
          return this[A].buildId;
        }
        set buildId(e10) {
          this[A].buildId = e10;
        }
        get locale() {
          return this[A].locale ?? "";
        }
        set locale(e10) {
          var t10, r10;
          if (!this[A].locale || !(null == (r10 = this[A].options.nextConfig) || null == (t10 = r10.i18n) ? void 0 : t10.locales.includes(e10))) throw Object.defineProperty(TypeError(`The NextURL configuration includes no locale "${e10}"`), "__NEXT_ERROR_CODE", { value: "E597", enumerable: false, configurable: true });
          this[A].locale = e10;
        }
        get defaultLocale() {
          return this[A].defaultLocale;
        }
        get domainLocale() {
          return this[A].domainLocale;
        }
        get searchParams() {
          return this[A].url.searchParams;
        }
        get host() {
          return this[A].url.host;
        }
        set host(e10) {
          this[A].url.host = e10;
        }
        get hostname() {
          return this[A].url.hostname;
        }
        set hostname(e10) {
          this[A].url.hostname = e10;
        }
        get port() {
          return this[A].url.port;
        }
        set port(e10) {
          this[A].url.port = e10;
        }
        get protocol() {
          return this[A].url.protocol;
        }
        set protocol(e10) {
          this[A].url.protocol = e10;
        }
        get href() {
          let e10 = this.formatPathname(), t10 = this.formatSearch();
          return `${this.protocol}//${this.host}${e10}${t10}${this.hash}`;
        }
        set href(e10) {
          this[A].url = P(e10), this.analyze();
        }
        get origin() {
          return this[A].url.origin;
        }
        get pathname() {
          return this[A].url.pathname;
        }
        set pathname(e10) {
          this[A].url.pathname = e10;
        }
        get hash() {
          return this[A].url.hash;
        }
        set hash(e10) {
          this[A].url.hash = e10;
        }
        get search() {
          return this[A].url.search;
        }
        set search(e10) {
          this[A].url.search = e10;
        }
        get password() {
          return this[A].url.password;
        }
        set password(e10) {
          this[A].url.password = e10;
        }
        get username() {
          return this[A].url.username;
        }
        set username(e10) {
          this[A].url.username = e10;
        }
        get basePath() {
          return this[A].basePath;
        }
        set basePath(e10) {
          this[A].basePath = e10.startsWith("/") ? e10 : `/${e10}`;
        }
        toString() {
          return this.href;
        }
        toJSON() {
          return this.href;
        }
        [Symbol.for("edge-runtime.inspect.custom")]() {
          return { href: this.href, origin: this.origin, protocol: this.protocol, username: this.username, password: this.password, host: this.host, hostname: this.hostname, port: this.port, pathname: this.pathname, search: this.search, searchParams: this.searchParams, hash: this.hash };
        }
        clone() {
          return new I(String(this), this[A].options);
        }
      }
      var $, N, U, D, L, q, B, M, W, H, V, z, F, K, G, J, X, Y, Q, Z, ee, et, er, en, es, ei, ea, eo, el, eu, ec, eh, ed, ef, ep, eg, em = e.i(28042);
      let ey = Symbol("internal request");
      class ew extends Request {
        constructor(e10, t10 = {}) {
          const r10 = "string" != typeof e10 && "url" in e10 ? e10.url : String(e10);
          y(r10), e10 instanceof Request ? super(e10, t10) : super(r10, t10);
          const n10 = new I(r10, { headers: m(this.headers), nextConfig: t10.nextConfig });
          this[ey] = { cookies: new em.RequestCookies(this.headers), nextUrl: n10, url: n10.toString() };
        }
        [Symbol.for("edge-runtime.inspect.custom")]() {
          return { cookies: this.cookies, nextUrl: this.nextUrl, url: this.url, bodyUsed: this.bodyUsed, cache: this.cache, credentials: this.credentials, destination: this.destination, headers: Object.fromEntries(this.headers), integrity: this.integrity, keepalive: this.keepalive, method: this.method, mode: this.mode, redirect: this.redirect, referrer: this.referrer, referrerPolicy: this.referrerPolicy, signal: this.signal };
        }
        get cookies() {
          return this[ey].cookies;
        }
        get nextUrl() {
          return this[ey].nextUrl;
        }
        get page() {
          throw new h();
        }
        get ua() {
          throw new d();
        }
        get url() {
          return this[ey].url;
        }
      }
      class eb {
        static get(e10, t10, r10) {
          let n10 = Reflect.get(e10, t10, r10);
          return "function" == typeof n10 ? n10.bind(e10) : n10;
        }
        static set(e10, t10, r10, n10) {
          return Reflect.set(e10, t10, r10, n10);
        }
        static has(e10, t10) {
          return Reflect.has(e10, t10);
        }
        static deleteProperty(e10, t10) {
          return Reflect.deleteProperty(e10, t10);
        }
      }
      let ev = Symbol("internal response"), e_ = /* @__PURE__ */ new Set([301, 302, 303, 307, 308]);
      function eS(e10, t10) {
        var r10;
        if (null == e10 || null == (r10 = e10.request) ? void 0 : r10.headers) {
          if (!(e10.request.headers instanceof Headers)) throw Object.defineProperty(Error("request.headers must be an instance of Headers"), "__NEXT_ERROR_CODE", { value: "E119", enumerable: false, configurable: true });
          let r11 = [];
          for (let [n10, s2] of e10.request.headers) t10.set("x-middleware-request-" + n10, s2), r11.push(n10);
          t10.set("x-middleware-override-headers", r11.join(","));
        }
      }
      class eE extends Response {
        constructor(e10, t10 = {}) {
          super(e10, t10);
          const r10 = this.headers, n10 = new Proxy(new em.ResponseCookies(r10), { get(e11, n11, s2) {
            switch (n11) {
              case "delete":
              case "set":
                return (...s3) => {
                  let i2 = Reflect.apply(e11[n11], e11, s3), a2 = new Headers(r10);
                  return i2 instanceof em.ResponseCookies && r10.set("x-middleware-set-cookie", i2.getAll().map((e12) => (0, em.stringifyCookie)(e12)).join(",")), eS(t10, a2), i2;
                };
              default:
                return eb.get(e11, n11, s2);
            }
          } });
          this[ev] = { cookies: n10, url: t10.url ? new I(t10.url, { headers: m(r10), nextConfig: t10.nextConfig }) : void 0 };
        }
        [Symbol.for("edge-runtime.inspect.custom")]() {
          return { cookies: this.cookies, url: this.url, body: this.body, bodyUsed: this.bodyUsed, headers: Object.fromEntries(this.headers), ok: this.ok, redirected: this.redirected, status: this.status, statusText: this.statusText, type: this.type };
        }
        get cookies() {
          return this[ev].cookies;
        }
        static json(e10, t10) {
          let r10 = Response.json(e10, t10);
          return new eE(r10.body, r10);
        }
        static redirect(e10, t10) {
          let r10 = "number" == typeof t10 ? t10 : (null == t10 ? void 0 : t10.status) ?? 307;
          if (!e_.has(r10)) throw Object.defineProperty(RangeError('Failed to execute "redirect" on "response": Invalid status code'), "__NEXT_ERROR_CODE", { value: "E529", enumerable: false, configurable: true });
          let n10 = "object" == typeof t10 ? t10 : {}, s2 = new Headers(null == n10 ? void 0 : n10.headers);
          return s2.set("Location", y(e10)), new eE(null, { ...n10, headers: s2, status: r10 });
        }
        static rewrite(e10, t10) {
          let r10 = new Headers(null == t10 ? void 0 : t10.headers);
          return r10.set("x-middleware-rewrite", y(e10)), eS(t10, r10), new eE(null, { ...t10, headers: r10 });
        }
        static next(e10) {
          let t10 = new Headers(null == e10 ? void 0 : e10.headers);
          return t10.set("x-middleware-next", "1"), eS(e10, t10), new eE(null, { ...e10, headers: t10 });
        }
      }
      function ek(e10, t10) {
        let r10 = "string" == typeof t10 ? new URL(t10) : t10, n10 = new URL(e10, t10), s2 = n10.origin === r10.origin;
        return { url: s2 ? n10.toString().slice(r10.origin.length) : n10.toString(), isRelative: s2 };
      }
      let eO = "next-router-prefetch", eT = ["rsc", "next-router-state-tree", eO, "next-hmr-refresh", "next-router-segment-prefetch"], eR = "_rsc";
      class ex extends Error {
        constructor() {
          super("Headers cannot be modified. Read more: https://nextjs.org/docs/app/api-reference/functions/headers");
        }
        static callable() {
          throw new ex();
        }
      }
      class eC extends Headers {
        constructor(e10) {
          super(), this.headers = new Proxy(e10, { get(t10, r10, n10) {
            if ("symbol" == typeof r10) return eb.get(t10, r10, n10);
            let s2 = r10.toLowerCase(), i2 = Object.keys(e10).find((e11) => e11.toLowerCase() === s2);
            if (void 0 !== i2) return eb.get(t10, i2, n10);
          }, set(t10, r10, n10, s2) {
            if ("symbol" == typeof r10) return eb.set(t10, r10, n10, s2);
            let i2 = r10.toLowerCase(), a2 = Object.keys(e10).find((e11) => e11.toLowerCase() === i2);
            return eb.set(t10, a2 ?? r10, n10, s2);
          }, has(t10, r10) {
            if ("symbol" == typeof r10) return eb.has(t10, r10);
            let n10 = r10.toLowerCase(), s2 = Object.keys(e10).find((e11) => e11.toLowerCase() === n10);
            return void 0 !== s2 && eb.has(t10, s2);
          }, deleteProperty(t10, r10) {
            if ("symbol" == typeof r10) return eb.deleteProperty(t10, r10);
            let n10 = r10.toLowerCase(), s2 = Object.keys(e10).find((e11) => e11.toLowerCase() === n10);
            return void 0 === s2 || eb.deleteProperty(t10, s2);
          } });
        }
        static seal(e10) {
          return new Proxy(e10, { get(e11, t10, r10) {
            switch (t10) {
              case "append":
              case "delete":
              case "set":
                return ex.callable;
              default:
                return eb.get(e11, t10, r10);
            }
          } });
        }
        merge(e10) {
          return Array.isArray(e10) ? e10.join(", ") : e10;
        }
        static from(e10) {
          return e10 instanceof Headers ? e10 : new eC(e10);
        }
        append(e10, t10) {
          let r10 = this.headers[e10];
          "string" == typeof r10 ? this.headers[e10] = [r10, t10] : Array.isArray(r10) ? r10.push(t10) : this.headers[e10] = t10;
        }
        delete(e10) {
          delete this.headers[e10];
        }
        get(e10) {
          let t10 = this.headers[e10];
          return void 0 !== t10 ? this.merge(t10) : null;
        }
        has(e10) {
          return void 0 !== this.headers[e10];
        }
        set(e10, t10) {
          this.headers[e10] = t10;
        }
        forEach(e10, t10) {
          for (let [r10, n10] of this.entries()) e10.call(t10, n10, r10, this);
        }
        *entries() {
          for (let e10 of Object.keys(this.headers)) {
            let t10 = e10.toLowerCase(), r10 = this.get(t10);
            yield [t10, r10];
          }
        }
        *keys() {
          for (let e10 of Object.keys(this.headers)) {
            let t10 = e10.toLowerCase();
            yield t10;
          }
        }
        *values() {
          for (let e10 of Object.keys(this.headers)) {
            let t10 = this.get(e10);
            yield t10;
          }
        }
        [Symbol.iterator]() {
          return this.entries();
        }
      }
      let ej = Object.defineProperty(Error("Invariant: AsyncLocalStorage accessed in runtime where it is not available"), "__NEXT_ERROR_CODE", { value: "E504", enumerable: false, configurable: true });
      class eP {
        disable() {
          throw ej;
        }
        getStore() {
        }
        run() {
          throw ej;
        }
        exit() {
          throw ej;
        }
        enterWith() {
          throw ej;
        }
        static bind(e10) {
          return e10;
        }
      }
      let eA = "undefined" != typeof globalThis && globalThis.AsyncLocalStorage;
      function eI() {
        return eA ? new eA() : new eP();
      }
      let e$ = eI();
      class eN extends Error {
        constructor() {
          super("Cookies can only be modified in a Server Action or Route Handler. Read more: https://nextjs.org/docs/app/api-reference/functions/cookies#options");
        }
        static callable() {
          throw new eN();
        }
      }
      class eU {
        static seal(e10) {
          return new Proxy(e10, { get(e11, t10, r10) {
            switch (t10) {
              case "clear":
              case "delete":
              case "set":
                return eN.callable;
              default:
                return eb.get(e11, t10, r10);
            }
          } });
        }
      }
      let eD = Symbol.for("next.mutated.cookies");
      class eL {
        static wrap(e10, t10) {
          let r10 = new em.ResponseCookies(new Headers());
          for (let t11 of e10.getAll()) r10.set(t11);
          let n10 = [], s2 = /* @__PURE__ */ new Set(), i2 = () => {
            let e11 = e$.getStore();
            if (e11 && (e11.pathWasRevalidated = true), n10 = r10.getAll().filter((e12) => s2.has(e12.name)), t10) {
              let e12 = [];
              for (let t11 of n10) {
                let r11 = new em.ResponseCookies(new Headers());
                r11.set(t11), e12.push(r11.toString());
              }
              t10(e12);
            }
          }, a2 = new Proxy(r10, { get(e11, t11, r11) {
            switch (t11) {
              case eD:
                return n10;
              case "delete":
                return function(...t12) {
                  s2.add("string" == typeof t12[0] ? t12[0] : t12[0].name);
                  try {
                    return e11.delete(...t12), a2;
                  } finally {
                    i2();
                  }
                };
              case "set":
                return function(...t12) {
                  s2.add("string" == typeof t12[0] ? t12[0] : t12[0].name);
                  try {
                    return e11.set(...t12), a2;
                  } finally {
                    i2();
                  }
                };
              default:
                return eb.get(e11, t11, r11);
            }
          } });
          return a2;
        }
      }
      function eq(e10, t10) {
        if ("action" !== e10.phase) throw new eN();
      }
      var eB = (($ = eB || {}).handleRequest = "BaseServer.handleRequest", $.run = "BaseServer.run", $.pipe = "BaseServer.pipe", $.getStaticHTML = "BaseServer.getStaticHTML", $.render = "BaseServer.render", $.renderToResponseWithComponents = "BaseServer.renderToResponseWithComponents", $.renderToResponse = "BaseServer.renderToResponse", $.renderToHTML = "BaseServer.renderToHTML", $.renderError = "BaseServer.renderError", $.renderErrorToResponse = "BaseServer.renderErrorToResponse", $.renderErrorToHTML = "BaseServer.renderErrorToHTML", $.render404 = "BaseServer.render404", $), eM = ((N = eM || {}).loadDefaultErrorComponents = "LoadComponents.loadDefaultErrorComponents", N.loadComponents = "LoadComponents.loadComponents", N), eW = ((U = eW || {}).getRequestHandler = "NextServer.getRequestHandler", U.getRequestHandlerWithMetadata = "NextServer.getRequestHandlerWithMetadata", U.getServer = "NextServer.getServer", U.getServerRequestHandler = "NextServer.getServerRequestHandler", U.createServer = "createServer.createServer", U), eH = ((D = eH || {}).compression = "NextNodeServer.compression", D.getBuildId = "NextNodeServer.getBuildId", D.createComponentTree = "NextNodeServer.createComponentTree", D.clientComponentLoading = "NextNodeServer.clientComponentLoading", D.getLayoutOrPageModule = "NextNodeServer.getLayoutOrPageModule", D.generateStaticRoutes = "NextNodeServer.generateStaticRoutes", D.generateFsStaticRoutes = "NextNodeServer.generateFsStaticRoutes", D.generatePublicRoutes = "NextNodeServer.generatePublicRoutes", D.generateImageRoutes = "NextNodeServer.generateImageRoutes.route", D.sendRenderResult = "NextNodeServer.sendRenderResult", D.proxyRequest = "NextNodeServer.proxyRequest", D.runApi = "NextNodeServer.runApi", D.render = "NextNodeServer.render", D.renderHTML = "NextNodeServer.renderHTML", D.imageOptimizer = "NextNodeServer.imageOptimizer", D.getPagePath = "NextNodeServer.getPagePath", D.getRoutesManifest = "NextNodeServer.getRoutesManifest", D.findPageComponents = "NextNodeServer.findPageComponents", D.getFontManifest = "NextNodeServer.getFontManifest", D.getServerComponentManifest = "NextNodeServer.getServerComponentManifest", D.getRequestHandler = "NextNodeServer.getRequestHandler", D.renderToHTML = "NextNodeServer.renderToHTML", D.renderError = "NextNodeServer.renderError", D.renderErrorToHTML = "NextNodeServer.renderErrorToHTML", D.render404 = "NextNodeServer.render404", D.startResponse = "NextNodeServer.startResponse", D.route = "route", D.onProxyReq = "onProxyReq", D.apiResolver = "apiResolver", D.internalFetch = "internalFetch", D), eV = ((L = eV || {}).startServer = "startServer.startServer", L), ez = ((q = ez || {}).getServerSideProps = "Render.getServerSideProps", q.getStaticProps = "Render.getStaticProps", q.renderToString = "Render.renderToString", q.renderDocument = "Render.renderDocument", q.createBodyResult = "Render.createBodyResult", q), eF = ((B = eF || {}).renderToString = "AppRender.renderToString", B.renderToReadableStream = "AppRender.renderToReadableStream", B.getBodyResult = "AppRender.getBodyResult", B.fetch = "AppRender.fetch", B), eK = ((M = eK || {}).executeRoute = "Router.executeRoute", M), eG = ((W = eG || {}).runHandler = "Node.runHandler", W), eJ = ((H = eJ || {}).runHandler = "AppRouteRouteHandlers.runHandler", H), eX = ((V = eX || {}).generateMetadata = "ResolveMetadata.generateMetadata", V.generateViewport = "ResolveMetadata.generateViewport", V), eY = ((z = eY || {}).execute = "Middleware.execute", z);
      let eQ = /* @__PURE__ */ new Set(["Middleware.execute", "BaseServer.handleRequest", "Render.getServerSideProps", "Render.getStaticProps", "AppRender.fetch", "AppRender.getBodyResult", "Render.renderDocument", "Node.runHandler", "AppRouteRouteHandlers.runHandler", "ResolveMetadata.generateMetadata", "ResolveMetadata.generateViewport", "NextNodeServer.createComponentTree", "NextNodeServer.findPageComponents", "NextNodeServer.getLayoutOrPageModule", "NextNodeServer.startResponse", "NextNodeServer.clientComponentLoading"]), eZ = /* @__PURE__ */ new Set(["NextNodeServer.findPageComponents", "NextNodeServer.createComponentTree", "NextNodeServer.clientComponentLoading"]);
      function e0(e10) {
        return null !== e10 && "object" == typeof e10 && "then" in e10 && "function" == typeof e10.then;
      }
      let e1 = process.env.NEXT_OTEL_PERFORMANCE_PREFIX, { context: e2, propagation: e3, trace: e4, SpanStatusCode: e5, SpanKind: e6, ROOT_CONTEXT: e8 } = t = e.r(11646);
      class e9 extends Error {
        constructor(e10, t10) {
          super(), this.bubble = e10, this.result = t10;
        }
      }
      let e7 = (e10, t10) => {
        "object" == typeof t10 && null !== t10 && t10 instanceof e9 && t10.bubble ? e10.setAttribute("next.bubble", true) : (t10 && (e10.recordException(t10), e10.setAttribute("error.type", t10.name)), e10.setStatus({ code: e5.ERROR, message: null == t10 ? void 0 : t10.message })), e10.end();
      }, te = /* @__PURE__ */ new Map(), tt = t.createContextKey("next.rootSpanId"), tr = 0, tn = { set(e10, t10, r10) {
        e10.push({ key: t10, value: r10 });
      } }, ts = (r = new class e {
        getTracerInstance() {
          return e4.getTracer("next.js", "0.0.1");
        }
        getContext() {
          return e2;
        }
        getTracePropagationData() {
          let e10 = e2.active(), t10 = [];
          return e3.inject(e10, t10, tn), t10;
        }
        getActiveScopeSpan() {
          return e4.getSpan(null == e2 ? void 0 : e2.active());
        }
        withPropagatedContext(e10, t10, r10) {
          let n10 = e2.active();
          if (e4.getSpanContext(n10)) return t10();
          let s2 = e3.extract(n10, e10, r10);
          return e2.with(s2, t10);
        }
        trace(...e10) {
          let [t10, r10, n10] = e10, { fn: s2, options: i2 } = "function" == typeof r10 ? { fn: r10, options: {} } : { fn: n10, options: { ...r10 } }, a2 = i2.spanName ?? t10;
          if (!eQ.has(t10) && "1" !== process.env.NEXT_OTEL_VERBOSE || i2.hideSpan) return s2();
          let o2 = this.getSpanContext((null == i2 ? void 0 : i2.parentSpan) ?? this.getActiveScopeSpan());
          o2 || (o2 = (null == e2 ? void 0 : e2.active()) ?? e8);
          let l2 = o2.getValue(tt), u2 = "number" != typeof l2 || !te.has(l2), c2 = tr++;
          return i2.attributes = { "next.span_name": a2, "next.span_type": t10, ...i2.attributes }, e2.with(o2.setValue(tt, c2), () => this.getTracerInstance().startActiveSpan(a2, i2, (e11) => {
            let r11;
            e1 && t10 && eZ.has(t10) && (r11 = "performance" in globalThis && "measure" in performance ? globalThis.performance.now() : void 0);
            let n11 = false, a3 = () => {
              !n11 && (n11 = true, te.delete(c2), r11 && performance.measure(`${e1}:next-${(t10.split(".").pop() || "").replace(/[A-Z]/g, (e12) => "-" + e12.toLowerCase())}`, { start: r11, end: performance.now() }));
            };
            if (u2 && te.set(c2, new Map(Object.entries(i2.attributes ?? {}))), s2.length > 1) try {
              return s2(e11, (t11) => e7(e11, t11));
            } catch (t11) {
              throw e7(e11, t11), t11;
            } finally {
              a3();
            }
            try {
              let t11 = s2(e11);
              if (e0(t11)) return t11.then((t12) => (e11.end(), t12)).catch((t12) => {
                throw e7(e11, t12), t12;
              }).finally(a3);
              return e11.end(), a3(), t11;
            } catch (t11) {
              throw e7(e11, t11), a3(), t11;
            }
          }));
        }
        wrap(...e10) {
          let t10 = this, [r10, n10, s2] = 3 === e10.length ? e10 : [e10[0], {}, e10[1]];
          return eQ.has(r10) || "1" === process.env.NEXT_OTEL_VERBOSE ? function() {
            let e11 = n10;
            "function" == typeof e11 && "function" == typeof s2 && (e11 = e11.apply(this, arguments));
            let i2 = arguments.length - 1, a2 = arguments[i2];
            if ("function" != typeof a2) return t10.trace(r10, e11, () => s2.apply(this, arguments));
            {
              let n11 = t10.getContext().bind(e2.active(), a2);
              return t10.trace(r10, e11, (e12, t11) => (arguments[i2] = function(e13) {
                return null == t11 || t11(e13), n11.apply(this, arguments);
              }, s2.apply(this, arguments)));
            }
          } : s2;
        }
        startSpan(...e10) {
          let [t10, r10] = e10, n10 = this.getSpanContext((null == r10 ? void 0 : r10.parentSpan) ?? this.getActiveScopeSpan());
          return this.getTracerInstance().startSpan(t10, r10, n10);
        }
        getSpanContext(e10) {
          return e10 ? e4.setSpan(e2.active(), e10) : void 0;
        }
        getRootSpanAttributes() {
          let e10 = e2.active().getValue(tt);
          return te.get(e10);
        }
        setRootSpanAttribute(e10, t10) {
          let r10 = e2.active().getValue(tt), n10 = te.get(r10);
          n10 && !n10.has(e10) && n10.set(e10, t10);
        }
      }(), () => r), ti = "__prerender_bypass";
      Symbol("__next_preview_data"), Symbol(ti);
      class ta {
        constructor(e10, t10, r10, n10) {
          var s2;
          const i2 = e10 && function(e11, t11) {
            let r11 = eC.from(e11.headers);
            return { isOnDemandRevalidate: r11.get("x-prerender-revalidate") === t11.previewModeId, revalidateOnlyGenerated: r11.has("x-prerender-revalidate-if-generated") };
          }(t10, e10).isOnDemandRevalidate, a2 = null == (s2 = r10.get(ti)) ? void 0 : s2.value;
          this._isEnabled = !!(!i2 && a2 && e10 && a2 === e10.previewModeId), this._previewModeId = null == e10 ? void 0 : e10.previewModeId, this._mutableCookies = n10;
        }
        get isEnabled() {
          return this._isEnabled;
        }
        enable() {
          if (!this._previewModeId) throw Object.defineProperty(Error("Invariant: previewProps missing previewModeId this should never happen"), "__NEXT_ERROR_CODE", { value: "E93", enumerable: false, configurable: true });
          this._mutableCookies.set({ name: ti, value: this._previewModeId, httpOnly: true, sameSite: "none", secure: true, path: "/" }), this._isEnabled = true;
        }
        disable() {
          this._mutableCookies.set({ name: ti, value: "", httpOnly: true, sameSite: "none", secure: true, path: "/", expires: /* @__PURE__ */ new Date(0) }), this._isEnabled = false;
        }
      }
      function to(e10, t10) {
        if ("x-middleware-set-cookie" in e10.headers && "string" == typeof e10.headers["x-middleware-set-cookie"]) {
          let r10 = e10.headers["x-middleware-set-cookie"], n10 = new Headers();
          for (let e11 of g(r10)) n10.append("set-cookie", e11);
          for (let e11 of new em.ResponseCookies(n10).getAll()) t10.set(e11);
        }
      }
      let tl = eI();
      class tu extends Error {
        constructor(e10, t10) {
          super(`Invariant: ${e10.endsWith(".") ? e10 : e10 + "."} This is a bug in Next.js.`, t10), this.name = "InvariantError";
        }
      }
      var tc = e.i(99734), th = e.i(51615);
      process.env.NEXT_PRIVATE_DEBUG_CACHE && ((e10, ...t10) => {
        console.log(`use-cache: ${e10}`, ...t10);
      }), Symbol.for("@next/cache-handlers");
      let td = Symbol.for("@next/cache-handlers-map"), tf = Symbol.for("@next/cache-handlers-set"), tp = globalThis;
      function tg() {
        if (tp[td]) return tp[td].entries();
      }
      async function tm(e10, t10) {
        if (!e10) return t10();
        let r10 = ty(e10);
        try {
          return await t10();
        } finally {
          var n10, s2;
          let t11, i2, a2 = (n10 = r10, s2 = ty(e10), t11 = new Set(n10.pendingRevalidatedTags.map((e11) => {
            let t12 = "object" == typeof e11.profile ? JSON.stringify(e11.profile) : e11.profile || "";
            return `${e11.tag}:${t12}`;
          })), i2 = new Set(n10.pendingRevalidateWrites), { pendingRevalidatedTags: s2.pendingRevalidatedTags.filter((e11) => {
            let r11 = "object" == typeof e11.profile ? JSON.stringify(e11.profile) : e11.profile || "";
            return !t11.has(`${e11.tag}:${r11}`);
          }), pendingRevalidates: Object.fromEntries(Object.entries(s2.pendingRevalidates).filter(([e11]) => !(e11 in n10.pendingRevalidates))), pendingRevalidateWrites: s2.pendingRevalidateWrites.filter((e11) => !i2.has(e11)) });
          await tb(e10, a2);
        }
      }
      function ty(e10) {
        return { pendingRevalidatedTags: e10.pendingRevalidatedTags ? [...e10.pendingRevalidatedTags] : [], pendingRevalidates: { ...e10.pendingRevalidates }, pendingRevalidateWrites: e10.pendingRevalidateWrites ? [...e10.pendingRevalidateWrites] : [] };
      }
      async function tw(e10, t10, r10) {
        if (0 === e10.length) return;
        let n10 = function() {
          if (tp[tf]) return tp[tf].values();
        }(), s2 = [], i2 = /* @__PURE__ */ new Map();
        for (let t11 of e10) {
          let e11, r11 = t11.profile;
          for (let [t12] of i2) if ("string" == typeof t12 && "string" == typeof r11 && t12 === r11 || "object" == typeof t12 && "object" == typeof r11 && JSON.stringify(t12) === JSON.stringify(r11) || t12 === r11) {
            e11 = t12;
            break;
          }
          let n11 = e11 || r11;
          i2.has(n11) || i2.set(n11, []), i2.get(n11).push(t11.tag);
        }
        for (let [e11, o2] of i2) {
          let i3;
          if (e11) {
            let t11;
            if ("object" == typeof e11) t11 = e11;
            else if ("string" == typeof e11) {
              var a2;
              if (!(t11 = null == r10 || null == (a2 = r10.cacheLifeProfiles) ? void 0 : a2[e11])) throw Object.defineProperty(Error(`Invalid profile provided "${e11}" must be configured under cacheLife in next.config or be "max"`), "__NEXT_ERROR_CODE", { value: "E873", enumerable: false, configurable: true });
            }
            t11 && (i3 = { expire: t11.expire });
          }
          for (let t11 of n10 || []) e11 ? s2.push(null == t11.updateTags ? void 0 : t11.updateTags.call(t11, o2, i3)) : s2.push(null == t11.updateTags ? void 0 : t11.updateTags.call(t11, o2));
          t10 && s2.push(t10.revalidateTag(o2, i3));
        }
        await Promise.all(s2);
      }
      async function tb(e10, t10) {
        let r10 = (null == t10 ? void 0 : t10.pendingRevalidatedTags) ?? e10.pendingRevalidatedTags ?? [], n10 = (null == t10 ? void 0 : t10.pendingRevalidates) ?? e10.pendingRevalidates ?? {}, s2 = (null == t10 ? void 0 : t10.pendingRevalidateWrites) ?? e10.pendingRevalidateWrites ?? [];
        return Promise.all([tw(r10, e10.incrementalCache, e10), ...Object.values(n10), ...s2]);
      }
      let tv = eI();
      class t_ {
        constructor({ waitUntil: e10, onClose: t10, onTaskError: r10 }) {
          this.workUnitStores = /* @__PURE__ */ new Set(), this.waitUntil = e10, this.onClose = t10, this.onTaskError = r10, this.callbackQueue = new tc.default(), this.callbackQueue.pause();
        }
        after(e10) {
          if (e0(e10)) this.waitUntil || tS(), this.waitUntil(e10.catch((e11) => this.reportTaskError("promise", e11)));
          else if ("function" == typeof e10) this.addCallback(e10);
          else throw Object.defineProperty(Error("`after()`: Argument must be a promise or a function"), "__NEXT_ERROR_CODE", { value: "E50", enumerable: false, configurable: true });
        }
        addCallback(e10) {
          var t10;
          this.waitUntil || tS();
          let r10 = tl.getStore();
          r10 && this.workUnitStores.add(r10);
          let n10 = tv.getStore(), s2 = n10 ? n10.rootTaskSpawnPhase : null == r10 ? void 0 : r10.phase;
          this.runCallbacksOnClosePromise || (this.runCallbacksOnClosePromise = this.runCallbacksOnClose(), this.waitUntil(this.runCallbacksOnClosePromise));
          let i2 = (t10 = async () => {
            try {
              await tv.run({ rootTaskSpawnPhase: s2 }, () => e10());
            } catch (e11) {
              this.reportTaskError("function", e11);
            }
          }, eA ? eA.bind(t10) : eP.bind(t10));
          this.callbackQueue.add(i2);
        }
        async runCallbacksOnClose() {
          return await new Promise((e10) => this.onClose(e10)), this.runCallbacks();
        }
        async runCallbacks() {
          if (0 === this.callbackQueue.size) return;
          for (let e11 of this.workUnitStores) e11.phase = "after";
          let e10 = e$.getStore();
          if (!e10) throw Object.defineProperty(new tu("Missing workStore in AfterContext.runCallbacks"), "__NEXT_ERROR_CODE", { value: "E547", enumerable: false, configurable: true });
          return tm(e10, () => (this.callbackQueue.start(), this.callbackQueue.onIdle()));
        }
        reportTaskError(e10, t10) {
          if (console.error("promise" === e10 ? "A promise passed to `after()` rejected:" : "An error occurred in a function passed to `after()`:", t10), this.onTaskError) try {
            null == this.onTaskError || this.onTaskError.call(this, t10);
          } catch (e11) {
            console.error(Object.defineProperty(new tu("`onTaskError` threw while handling an error thrown from an `after` task", { cause: e11 }), "__NEXT_ERROR_CODE", { value: "E569", enumerable: false, configurable: true }));
          }
        }
      }
      function tS() {
        throw Object.defineProperty(Error("`after()` will not work correctly, because `waitUntil` is not available in the current environment."), "__NEXT_ERROR_CODE", { value: "E91", enumerable: false, configurable: true });
      }
      function tE(e10) {
        let t10, r10 = { then: (n10, s2) => (t10 || (t10 = e10()), t10.then((e11) => {
          r10.value = e11;
        }).catch(() => {
        }), t10.then(n10, s2)) };
        return r10;
      }
      class tk {
        onClose(e10) {
          if (this.isClosed) throw Object.defineProperty(Error("Cannot subscribe to a closed CloseController"), "__NEXT_ERROR_CODE", { value: "E365", enumerable: false, configurable: true });
          this.target.addEventListener("close", e10), this.listeners++;
        }
        dispatchClose() {
          if (this.isClosed) throw Object.defineProperty(Error("Cannot close a CloseController multiple times"), "__NEXT_ERROR_CODE", { value: "E229", enumerable: false, configurable: true });
          this.listeners > 0 && this.target.dispatchEvent(new Event("close")), this.isClosed = true;
        }
        constructor() {
          this.target = new EventTarget(), this.listeners = 0, this.isClosed = false;
        }
      }
      function tO() {
        return { previewModeId: process.env.__NEXT_PREVIEW_MODE_ID || "", previewModeSigningKey: process.env.__NEXT_PREVIEW_MODE_SIGNING_KEY || "", previewModeEncryptionKey: process.env.__NEXT_PREVIEW_MODE_ENCRYPTION_KEY || "" };
      }
      let tT = Symbol.for("@next/request-context");
      async function tR(e10, t10, r10) {
        let n10 = /* @__PURE__ */ new Set();
        for (let t11 of ((e11) => {
          let t12 = ["/layout"];
          if (e11.startsWith("/")) {
            let r11 = e11.split("/");
            for (let e12 = 1; e12 < r11.length + 1; e12++) {
              let n11 = r11.slice(0, e12).join("/");
              n11 && (n11.endsWith("/page") || n11.endsWith("/route") || (n11 = `${n11}${!n11.endsWith("/") ? "/" : ""}layout`), t12.push(n11));
            }
          }
          return t12;
        })(e10)) t11 = `${f}${t11}`, n10.add(t11);
        if (t10.pathname && (!r10 || 0 === r10.size)) {
          let e11 = `${f}${t10.pathname}`;
          n10.add(e11);
        }
        n10.has(`${f}/`) && n10.add(`${f}/index`), n10.has(`${f}/index`) && n10.add(`${f}/`);
        let s2 = Array.from(n10);
        return { tags: s2, expirationsByCacheKind: function(e11) {
          let t11 = /* @__PURE__ */ new Map(), r11 = tg();
          if (r11) for (let [n11, s3] of r11) "getExpiration" in s3 && t11.set(n11, tE(async () => s3.getExpiration(e11)));
          return t11;
        }(s2) };
      }
      class tx extends ew {
        constructor(e10) {
          super(e10.input, e10.init), this.sourcePage = e10.page;
        }
        get request() {
          throw Object.defineProperty(new c({ page: this.sourcePage }), "__NEXT_ERROR_CODE", { value: "E394", enumerable: false, configurable: true });
        }
        respondWith() {
          throw Object.defineProperty(new c({ page: this.sourcePage }), "__NEXT_ERROR_CODE", { value: "E394", enumerable: false, configurable: true });
        }
        waitUntil() {
          throw Object.defineProperty(new c({ page: this.sourcePage }), "__NEXT_ERROR_CODE", { value: "E394", enumerable: false, configurable: true });
        }
      }
      let tC = { keys: (e10) => Array.from(e10.keys()), get: (e10, t10) => e10.get(t10) ?? void 0 }, tj = (e10, t10) => ts().withPropagatedContext(e10.headers, t10, tC), tP = false;
      async function tA(t10) {
        var r10, n10, s2, i2;
        let a2, o2, u2, c2, h2;
        !function() {
          if (!tP && (tP = true, "true" === process.env.NEXT_PRIVATE_TEST_PROXY)) {
            let { interceptTestApis: t11, wrapRequestHandler: r11 } = e.r(94165);
            t11(), tj = r11(tj);
          }
        }(), await l();
        let d2 = void 0 !== globalThis.__BUILD_MANIFEST;
        t10.request.url = t10.request.url.replace(/\.rsc($|\?)/, "$1");
        let f2 = t10.bypassNextUrl ? new URL(t10.request.url) : new I(t10.request.url, { headers: t10.request.headers, nextConfig: t10.request.nextConfig });
        for (let e10 of [...f2.searchParams.keys()]) {
          let t11 = f2.searchParams.getAll(e10), r11 = function(e11) {
            for (let t12 of ["nxtP", "nxtI"]) if (e11 !== t12 && e11.startsWith(t12)) return e11.substring(t12.length);
            return null;
          }(e10);
          if (r11) {
            for (let e11 of (f2.searchParams.delete(r11), t11)) f2.searchParams.append(r11, e11);
            f2.searchParams.delete(e10);
          }
        }
        let p2 = process.env.__NEXT_BUILD_ID || "";
        "buildId" in f2 && (p2 = f2.buildId || "", f2.buildId = "");
        let g2 = function(e10) {
          let t11 = new Headers();
          for (let [r11, n11] of Object.entries(e10)) for (let e11 of Array.isArray(n11) ? n11 : [n11]) void 0 !== e11 && ("number" == typeof e11 && (e11 = e11.toString()), t11.append(r11, e11));
          return t11;
        }(t10.request.headers), m2 = g2.has("x-nextjs-data"), y2 = "1" === g2.get("rsc");
        m2 && "/index" === f2.pathname && (f2.pathname = "/");
        let w2 = /* @__PURE__ */ new Map();
        if (!d2) for (let e10 of eT) {
          let t11 = g2.get(e10);
          null !== t11 && (w2.set(e10, t11), g2.delete(e10));
        }
        let b2 = f2.searchParams.get(eR), _2 = new tx({ page: t10.page, input: ((c2 = (u2 = "string" == typeof f2) ? new URL(f2) : f2).searchParams.delete(eR), u2 ? c2.toString() : c2).toString(), init: { body: t10.request.body, headers: g2, method: t10.request.method, nextConfig: t10.request.nextConfig, signal: t10.request.signal } });
        m2 && Object.defineProperty(_2, "__isData", { enumerable: false, value: true }), !globalThis.__incrementalCacheShared && t10.IncrementalCache && (globalThis.__incrementalCache = new t10.IncrementalCache({ CurCacheHandler: t10.incrementalCacheHandler, minimalMode: true, fetchCacheKeyPrefix: "", dev: false, requestHeaders: t10.request.headers, getPrerenderManifest: () => ({ version: -1, routes: {}, dynamicRoutes: {}, notFoundRoutes: [], preview: tO() }) }));
        let E2 = t10.request.waitUntil ?? (null == (r10 = null == (h2 = globalThis[tT]) ? void 0 : h2.get()) ? void 0 : r10.waitUntil), k2 = new S({ request: _2, page: t10.page, context: E2 ? { waitUntil: E2 } : void 0 });
        if ((a2 = await tj(_2, () => {
          if ("/middleware" === t10.page || "/src/middleware" === t10.page || "/proxy" === t10.page || "/src/proxy" === t10.page) {
            let e10 = k2.waitUntil.bind(k2), r11 = new tk();
            return ts().trace(eY.execute, { spanName: `middleware ${_2.method}`, attributes: { "http.target": _2.nextUrl.pathname, "http.method": _2.method } }, async () => {
              try {
                var n11, s3, i3, a3, l2, u3;
                let c3 = tO(), h3 = await tR("/", _2.nextUrl, null), d3 = (l2 = _2.nextUrl, u3 = (e11) => {
                  o2 = e11;
                }, function(e11, t11, r12, n12, s4, i4, a4, o3, l3, u4, c4, h4) {
                  function d4(e12) {
                    r12 && r12.setHeader("Set-Cookie", e12);
                  }
                  let f4 = {};
                  return { type: "request", phase: e11, implicitTags: i4, url: { pathname: n12.pathname, search: n12.search ?? "" }, rootParams: s4, get headers() {
                    return f4.headers || (f4.headers = function(e12) {
                      let t12 = eC.from(e12);
                      for (let e13 of eT) t12.delete(e13);
                      return eC.seal(t12);
                    }(t11.headers)), f4.headers;
                  }, get cookies() {
                    if (!f4.cookies) {
                      let e12 = new em.RequestCookies(eC.from(t11.headers));
                      to(t11, e12), f4.cookies = eU.seal(e12);
                    }
                    return f4.cookies;
                  }, set cookies(value) {
                    f4.cookies = value;
                  }, get mutableCookies() {
                    if (!f4.mutableCookies) {
                      var p3, g3;
                      let e12, n13 = (p3 = t11.headers, g3 = a4 || (r12 ? d4 : void 0), e12 = new em.RequestCookies(eC.from(p3)), eL.wrap(e12, g3));
                      to(t11, n13), f4.mutableCookies = n13;
                    }
                    return f4.mutableCookies;
                  }, get userspaceMutableCookies() {
                    if (!f4.userspaceMutableCookies) {
                      var m3;
                      let e12;
                      m3 = this, f4.userspaceMutableCookies = e12 = new Proxy(m3.mutableCookies, { get(t12, r13, n13) {
                        switch (r13) {
                          case "delete":
                            return function(...r14) {
                              return eq(m3, "cookies().delete"), t12.delete(...r14), e12;
                            };
                          case "set":
                            return function(...r14) {
                              return eq(m3, "cookies().set"), t12.set(...r14), e12;
                            };
                          default:
                            return eb.get(t12, r13, n13);
                        }
                      } });
                    }
                    return f4.userspaceMutableCookies;
                  }, get draftMode() {
                    return f4.draftMode || (f4.draftMode = new ta(l3, t11, this.cookies, this.mutableCookies)), f4.draftMode;
                  }, renderResumeDataCache: null, isHmrRefresh: u4, serverComponentsHmrCache: c4 || globalThis.__serverComponentsHmrCache, devFallbackParams: null };
                }("action", _2, void 0, l2, {}, h3, u3, null, c3, false, void 0, null)), f3 = function({ page: e11, renderOpts: t11, isPrefetchRequest: r12, buildId: n12, previouslyRevalidatedTags: s4, nonce: i4 }) {
                  var a4;
                  let o3 = !t11.shouldWaitOnAllReady && !t11.supportsDynamicResponse && !t11.isDraftMode && !t11.isPossibleServerAction, l3 = t11.dev ?? false, u4 = l3 || o3 && (!!process.env.NEXT_DEBUG_BUILD || "1" === process.env.NEXT_SSG_FETCH_METRICS), c4 = { isStaticGeneration: o3, page: e11, route: (a4 = e11.split("/").reduce((e12, t12, r13, n13) => t12 ? "(" === t12[0] && t12.endsWith(")") || "@" === t12[0] || ("page" === t12 || "route" === t12) && r13 === n13.length - 1 ? e12 : `${e12}/${t12}` : e12, "")).startsWith("/") ? a4 : `/${a4}`, incrementalCache: t11.incrementalCache || globalThis.__incrementalCache, cacheLifeProfiles: t11.cacheLifeProfiles, isBuildTimePrerendering: t11.nextExport, hasReadableErrorStacks: t11.hasReadableErrorStacks, fetchCache: t11.fetchCache, isOnDemandRevalidate: t11.isOnDemandRevalidate, isDraftMode: t11.isDraftMode, isPrefetchRequest: r12, buildId: n12, reactLoadableManifest: (null == t11 ? void 0 : t11.reactLoadableManifest) || {}, assetPrefix: (null == t11 ? void 0 : t11.assetPrefix) || "", nonce: i4, afterContext: function(e12) {
                    let { waitUntil: t12, onClose: r13, onAfterTaskError: n13 } = e12;
                    return new t_({ waitUntil: t12, onClose: r13, onTaskError: n13 });
                  }(t11), cacheComponentsEnabled: t11.cacheComponents, dev: l3, previouslyRevalidatedTags: s4, refreshTagsByCacheKind: function() {
                    let e12 = /* @__PURE__ */ new Map(), t12 = tg();
                    if (t12) for (let [r13, n13] of t12) "refreshTags" in n13 && e12.set(r13, tE(async () => n13.refreshTags()));
                    return e12;
                  }(), runInCleanSnapshot: eA ? eA.snapshot() : function(e12, ...t12) {
                    return e12(...t12);
                  }, shouldTrackFetchMetrics: u4 };
                  return t11.store = c4, c4;
                }({ page: "/", renderOpts: { cacheLifeProfiles: null == (s3 = t10.request.nextConfig) || null == (n11 = s3.experimental) ? void 0 : n11.cacheLife, cacheComponents: false, experimental: { isRoutePPREnabled: false, authInterrupts: !!(null == (a3 = t10.request.nextConfig) || null == (i3 = a3.experimental) ? void 0 : i3.authInterrupts) }, supportsDynamicResponse: true, waitUntil: e10, onClose: r11.onClose.bind(r11), onAfterTaskError: void 0 }, isPrefetchRequest: "1" === _2.headers.get(eO), buildId: p2 ?? "", previouslyRevalidatedTags: [] });
                return await e$.run(f3, () => tl.run(d3, t10.handler, _2, k2));
              } finally {
                setTimeout(() => {
                  r11.dispatchClose();
                }, 0);
              }
            });
          }
          return t10.handler(_2, k2);
        })) && !(a2 instanceof Response)) throw Object.defineProperty(TypeError("Expected an instance of Response to be returned"), "__NEXT_ERROR_CODE", { value: "E567", enumerable: false, configurable: true });
        a2 && o2 && a2.headers.set("set-cookie", o2);
        let O2 = null == a2 ? void 0 : a2.headers.get("x-middleware-rewrite");
        if (a2 && O2 && (y2 || !d2)) {
          let e10 = new I(O2, { forceLocale: true, headers: t10.request.headers, nextConfig: t10.request.nextConfig });
          d2 || e10.host !== _2.nextUrl.host || (e10.buildId = p2 || e10.buildId, a2.headers.set("x-middleware-rewrite", String(e10)));
          let { url: r11, isRelative: o3 } = ek(e10.toString(), f2.toString());
          !d2 && m2 && a2.headers.set("x-nextjs-rewrite", r11);
          let l2 = !o3 && (null == (i2 = t10.request.nextConfig) || null == (s2 = i2.experimental) || null == (n10 = s2.clientParamParsingOrigins) ? void 0 : n10.some((t11) => new RegExp(t11).test(e10.origin)));
          y2 && (o3 || l2) && (f2.pathname !== e10.pathname && a2.headers.set("x-nextjs-rewritten-path", e10.pathname), f2.search !== e10.search && a2.headers.set("x-nextjs-rewritten-query", e10.search.slice(1)));
        }
        if (a2 && O2 && y2 && b2) {
          let e10 = new URL(O2);
          e10.searchParams.has(eR) || (e10.searchParams.set(eR, b2), a2.headers.set("x-middleware-rewrite", e10.toString()));
        }
        let T2 = null == a2 ? void 0 : a2.headers.get("Location");
        if (a2 && T2 && !d2) {
          let e10 = new I(T2, { forceLocale: false, headers: t10.request.headers, nextConfig: t10.request.nextConfig });
          a2 = new Response(a2.body, a2), e10.host === f2.host && (e10.buildId = p2 || e10.buildId, a2.headers.set("Location", e10.toString())), m2 && (a2.headers.delete("Location"), a2.headers.set("x-nextjs-redirect", ek(e10.toString(), f2.toString()).url));
        }
        let R2 = a2 || eE.next(), x2 = R2.headers.get("x-middleware-override-headers"), C2 = [];
        if (x2) {
          for (let [e10, t11] of w2) R2.headers.set(`x-middleware-request-${e10}`, t11), C2.push(e10);
          C2.length > 0 && R2.headers.set("x-middleware-override-headers", x2 + "," + C2.join(","));
        }
        return { response: R2, waitUntil: ("internal" === k2[v].kind ? Promise.all(k2[v].promises).then(() => {
        }) : void 0) ?? Promise.resolve(), fetchMetrics: _2.fetchMetrics };
      }
      e.i(64445), "undefined" == typeof URLPattern || URLPattern;
      var tI = e.i(40049);
      if (/* @__PURE__ */ new WeakMap(), tI.default.unstable_postpone, false === ("Route %%% needs to bail out of prerendering at this point because it used ^^^. React throws this special object to indicate where. It should not be caught by your own try/catch. Learn more: https://nextjs.org/docs/messages/ppr-caught-error".includes("needs to bail out of prerendering at this point because it used") && "Route %%% needs to bail out of prerendering at this point because it used ^^^. React throws this special object to indicate where. It should not be caught by your own try/catch. Learn more: https://nextjs.org/docs/messages/ppr-caught-error".includes("Learn more: https://nextjs.org/docs/messages/ppr-caught-error"))) throw Object.defineProperty(Error("Invariant: isDynamicPostpone misidentified a postpone reason. This is a bug in Next.js"), "__NEXT_ERROR_CODE", { value: "E296", enumerable: false, configurable: true });
      RegExp(`\\n\\s+at Suspense \\(<anonymous>\\)(?:(?!\\n\\s+at (?:body|div|main|section|article|aside|header|footer|nav|form|p|span|h1|h2|h3|h4|h5|h6) \\(<anonymous>\\))[\\s\\S])*?\\n\\s+at __next_root_layout_boundary__ \\([^\\n]*\\)`), RegExp(`\\n\\s+at __next_metadata_boundary__[\\n\\s]`), RegExp(`\\n\\s+at __next_viewport_boundary__[\\n\\s]`), RegExp(`\\n\\s+at __next_outlet_boundary__[\\n\\s]`), e.s([], 85835), e.i(85835);
      var t$ = e.i(70858);
      class tN extends Error {
        constructor(e10, t10 = "FunctionsError", r10) {
          super(e10), this.name = t10, this.context = r10;
        }
      }
      class tU extends tN {
        constructor(e10) {
          super("Failed to send a request to the Edge Function", "FunctionsFetchError", e10);
        }
      }
      class tD extends tN {
        constructor(e10) {
          super("Relay Error invoking the Edge Function", "FunctionsRelayError", e10);
        }
      }
      class tL extends tN {
        constructor(e10) {
          super("Edge Function returned a non-2xx status code", "FunctionsHttpError", e10);
        }
      }
      (F = en || (en = {})).Any = "any", F.ApNortheast1 = "ap-northeast-1", F.ApNortheast2 = "ap-northeast-2", F.ApSouth1 = "ap-south-1", F.ApSoutheast1 = "ap-southeast-1", F.ApSoutheast2 = "ap-southeast-2", F.CaCentral1 = "ca-central-1", F.EuCentral1 = "eu-central-1", F.EuWest1 = "eu-west-1", F.EuWest2 = "eu-west-2", F.EuWest3 = "eu-west-3", F.SaEast1 = "sa-east-1", F.UsEast1 = "us-east-1", F.UsWest1 = "us-west-1", F.UsWest2 = "us-west-2";
      class tq {
        constructor(e10, { headers: t10 = {}, customFetch: r10, region: n10 = en.Any } = {}) {
          this.url = e10, this.headers = t10, this.region = n10, this.fetch = /* @__PURE__ */ ((e11) => e11 ? (...t11) => e11(...t11) : (...e12) => fetch(...e12))(r10);
        }
        setAuth(e10) {
          this.headers.Authorization = `Bearer ${e10}`;
        }
        invoke(e10) {
          return (0, t$.__awaiter)(this, arguments, void 0, function* (e11, t10 = {}) {
            var r10;
            let n10, s2;
            try {
              let i2, { headers: a2, method: o2, body: l2, signal: u2, timeout: c2 } = t10, h2 = {}, { region: d2 } = t10;
              d2 || (d2 = this.region);
              let f2 = new URL(`${this.url}/${e11}`);
              d2 && "any" !== d2 && (h2["x-region"] = d2, f2.searchParams.set("forceFunctionRegion", d2)), l2 && (a2 && !Object.prototype.hasOwnProperty.call(a2, "Content-Type") || !a2) ? "undefined" != typeof Blob && l2 instanceof Blob || l2 instanceof ArrayBuffer ? (h2["Content-Type"] = "application/octet-stream", i2 = l2) : "string" == typeof l2 ? (h2["Content-Type"] = "text/plain", i2 = l2) : "undefined" != typeof FormData && l2 instanceof FormData ? i2 = l2 : (h2["Content-Type"] = "application/json", i2 = JSON.stringify(l2)) : i2 = l2;
              let p2 = u2;
              c2 && (s2 = new AbortController(), n10 = setTimeout(() => s2.abort(), c2), u2 ? (p2 = s2.signal, u2.addEventListener("abort", () => s2.abort())) : p2 = s2.signal);
              let g2 = yield this.fetch(f2.toString(), { method: o2 || "POST", headers: Object.assign(Object.assign(Object.assign({}, h2), this.headers), a2), body: i2, signal: p2 }).catch((e12) => {
                throw new tU(e12);
              }), m2 = g2.headers.get("x-relay-error");
              if (m2 && "true" === m2) throw new tD(g2);
              if (!g2.ok) throw new tL(g2);
              let y2 = (null != (r10 = g2.headers.get("Content-Type")) ? r10 : "text/plain").split(";")[0].trim();
              return { data: "application/json" === y2 ? yield g2.json() : "application/octet-stream" === y2 || "application/pdf" === y2 ? yield g2.blob() : "text/event-stream" === y2 ? g2 : "multipart/form-data" === y2 ? yield g2.formData() : yield g2.text(), error: null, response: g2 };
            } catch (e12) {
              return { data: null, error: e12, response: e12 instanceof tL || e12 instanceof tD ? e12.context : void 0 };
            } finally {
              n10 && clearTimeout(n10);
            }
          });
        }
      }
      var tB = e.i(1565);
      let { PostgrestClient: tM, PostgrestQueryBuilder: tW, PostgrestFilterBuilder: tH, PostgrestTransformBuilder: tV, PostgrestBuilder: tz, PostgrestError: tF } = tB.default || tB, tK = class {
        constructor() {
        }
        static detectEnvironment() {
          var t10;
          if ("undefined" != typeof WebSocket) return { type: "native", constructor: WebSocket };
          if ("undefined" != typeof globalThis && void 0 !== globalThis.WebSocket) return { type: "native", constructor: globalThis.WebSocket };
          if (void 0 !== e.g.WebSocket) return { type: "native", constructor: e.g.WebSocket };
          if ("undefined" != typeof globalThis && void 0 !== globalThis.WebSocketPair && void 0 === globalThis.WebSocket) return { type: "cloudflare", error: "Cloudflare Workers detected. WebSocket clients are not supported in Cloudflare Workers.", workaround: "Use Cloudflare Workers WebSocket API for server-side WebSocket handling, or deploy to a different runtime." };
          if ("undefined" != typeof globalThis && globalThis.EdgeRuntime || "undefined" != typeof navigator && (null == (t10 = navigator.userAgent) ? void 0 : t10.includes("Vercel-Edge"))) return { type: "unsupported", error: "Edge runtime detected (Vercel Edge/Netlify Edge). WebSockets are not supported in edge functions.", workaround: "Use serverless functions or a different deployment target for WebSocket functionality." };
          if ("undefined" != typeof process) {
            let e10 = process.versions;
            if (e10 && e10.node) {
              let t11 = parseInt(e10.node.replace(/^v/, "").split(".")[0]);
              return t11 >= 22 ? void 0 !== globalThis.WebSocket ? { type: "native", constructor: globalThis.WebSocket } : { type: "unsupported", error: `Node.js ${t11} detected but native WebSocket not found.`, workaround: "Provide a WebSocket implementation via the transport option." } : { type: "unsupported", error: `Node.js ${t11} detected without native WebSocket support.`, workaround: 'For Node.js < 22, install "ws" package and provide it via the transport option:\nimport ws from "ws"\nnew RealtimeClient(url, { transport: ws })' };
            }
          }
          return { type: "unsupported", error: "Unknown JavaScript runtime without WebSocket support.", workaround: "Ensure you're running in a supported environment (browser, Node.js, Deno) or provide a custom WebSocket implementation." };
        }
        static getWebSocketConstructor() {
          let e10 = this.detectEnvironment();
          if (e10.constructor) return e10.constructor;
          let t10 = e10.error || "WebSocket not supported in this environment.";
          throw e10.workaround && (t10 += `

Suggested solution: ${e10.workaround}`), Error(t10);
        }
        static createWebSocket(e10, t10) {
          return new (this.getWebSocketConstructor())(e10, t10);
        }
        static isWebSocketSupported() {
          try {
            let e10 = this.detectEnvironment();
            return "native" === e10.type || "ws" === e10.type;
          } catch (e10) {
            return false;
          }
        }
      }, tG = "1.0.0";
      (K = es || (es = {}))[K.connecting = 0] = "connecting", K[K.open = 1] = "open", K[K.closing = 2] = "closing", K[K.closed = 3] = "closed", (G = ei || (ei = {})).closed = "closed", G.errored = "errored", G.joined = "joined", G.joining = "joining", G.leaving = "leaving", (J = ea || (ea = {})).close = "phx_close", J.error = "phx_error", J.join = "phx_join", J.reply = "phx_reply", J.leave = "phx_leave", J.access_token = "access_token", (eo || (eo = {})).websocket = "websocket", (X = el || (el = {})).Connecting = "connecting", X.Open = "open", X.Closing = "closing", X.Closed = "closed";
      class tJ {
        constructor(e10) {
          this.HEADER_LENGTH = 1, this.USER_BROADCAST_PUSH_META_LENGTH = 6, this.KINDS = { userBroadcastPush: 3, userBroadcast: 4 }, this.BINARY_ENCODING = 0, this.JSON_ENCODING = 1, this.BROADCAST_EVENT = "broadcast", this.allowedMetadataKeys = [], this.allowedMetadataKeys = null != e10 ? e10 : [];
        }
        encode(e10, t10) {
          return e10.event !== this.BROADCAST_EVENT || e10.payload instanceof ArrayBuffer || "string" != typeof e10.payload.event ? t10(JSON.stringify([e10.join_ref, e10.ref, e10.topic, e10.event, e10.payload])) : t10(this._binaryEncodeUserBroadcastPush(e10));
        }
        _binaryEncodeUserBroadcastPush(e10) {
          var t10;
          return this._isArrayBuffer(null == (t10 = e10.payload) ? void 0 : t10.payload) ? this._encodeBinaryUserBroadcastPush(e10) : this._encodeJsonUserBroadcastPush(e10);
        }
        _encodeBinaryUserBroadcastPush(e10) {
          var t10, r10;
          let n10 = null != (r10 = null == (t10 = e10.payload) ? void 0 : t10.payload) ? r10 : new ArrayBuffer(0);
          return this._encodeUserBroadcastPush(e10, this.BINARY_ENCODING, n10);
        }
        _encodeJsonUserBroadcastPush(e10) {
          var t10, r10;
          let n10 = null != (r10 = null == (t10 = e10.payload) ? void 0 : t10.payload) ? r10 : {}, s2 = new TextEncoder().encode(JSON.stringify(n10)).buffer;
          return this._encodeUserBroadcastPush(e10, this.JSON_ENCODING, s2);
        }
        _encodeUserBroadcastPush(e10, t10, r10) {
          let n10 = e10.topic, s2 = null != (f2 = e10.ref) ? f2 : "", i2 = null != (p2 = e10.join_ref) ? p2 : "", a2 = e10.payload.event, o2 = this.allowedMetadataKeys ? this._pick(e10.payload, this.allowedMetadataKeys) : {}, l2 = 0 === Object.keys(o2).length ? "" : JSON.stringify(o2);
          if (i2.length > 255) throw Error(`joinRef length ${i2.length} exceeds maximum of 255`);
          if (s2.length > 255) throw Error(`ref length ${s2.length} exceeds maximum of 255`);
          if (n10.length > 255) throw Error(`topic length ${n10.length} exceeds maximum of 255`);
          if (a2.length > 255) throw Error(`userEvent length ${a2.length} exceeds maximum of 255`);
          if (l2.length > 255) throw Error(`metadata length ${l2.length} exceeds maximum of 255`);
          let u2 = this.USER_BROADCAST_PUSH_META_LENGTH + i2.length + s2.length + n10.length + a2.length + l2.length, c2 = new ArrayBuffer(this.HEADER_LENGTH + u2), h2 = new DataView(c2), d2 = 0;
          h2.setUint8(d2++, this.KINDS.userBroadcastPush), h2.setUint8(d2++, i2.length), h2.setUint8(d2++, s2.length), h2.setUint8(d2++, n10.length), h2.setUint8(d2++, a2.length), h2.setUint8(d2++, l2.length), h2.setUint8(d2++, t10), Array.from(i2, (e11) => h2.setUint8(d2++, e11.charCodeAt(0))), Array.from(s2, (e11) => h2.setUint8(d2++, e11.charCodeAt(0))), Array.from(n10, (e11) => h2.setUint8(d2++, e11.charCodeAt(0))), Array.from(a2, (e11) => h2.setUint8(d2++, e11.charCodeAt(0))), Array.from(l2, (e11) => h2.setUint8(d2++, e11.charCodeAt(0)));
          var f2, p2, g2 = new Uint8Array(c2.byteLength + r10.byteLength);
          return g2.set(new Uint8Array(c2), 0), g2.set(new Uint8Array(r10), c2.byteLength), g2.buffer;
        }
        decode(e10, t10) {
          if (this._isArrayBuffer(e10)) return t10(this._binaryDecode(e10));
          if ("string" == typeof e10) {
            let [r10, n10, s2, i2, a2] = JSON.parse(e10);
            return t10({ join_ref: r10, ref: n10, topic: s2, event: i2, payload: a2 });
          }
          return t10({});
        }
        _binaryDecode(e10) {
          let t10 = new DataView(e10), r10 = t10.getUint8(0), n10 = new TextDecoder();
          if (r10 === this.KINDS.userBroadcast) return this._decodeUserBroadcast(e10, t10, n10);
        }
        _decodeUserBroadcast(e10, t10, r10) {
          let n10 = t10.getUint8(1), s2 = t10.getUint8(2), i2 = t10.getUint8(3), a2 = t10.getUint8(4), o2 = this.HEADER_LENGTH + 4, l2 = r10.decode(e10.slice(o2, o2 + n10));
          o2 += n10;
          let u2 = r10.decode(e10.slice(o2, o2 + s2));
          o2 += s2;
          let c2 = r10.decode(e10.slice(o2, o2 + i2));
          o2 += i2;
          let h2 = e10.slice(o2, e10.byteLength), d2 = a2 === this.JSON_ENCODING ? JSON.parse(r10.decode(h2)) : h2, f2 = { type: this.BROADCAST_EVENT, event: u2, payload: d2 };
          return i2 > 0 && (f2.meta = JSON.parse(c2)), { join_ref: null, ref: null, topic: l2, event: this.BROADCAST_EVENT, payload: f2 };
        }
        _isArrayBuffer(e10) {
          var t10;
          return e10 instanceof ArrayBuffer || (null == (t10 = null == e10 ? void 0 : e10.constructor) ? void 0 : t10.name) === "ArrayBuffer";
        }
        _pick(e10, t10) {
          return e10 && "object" == typeof e10 ? Object.fromEntries(Object.entries(e10).filter(([e11]) => t10.includes(e11))) : {};
        }
      }
      class tX {
        constructor(e10, t10) {
          this.callback = e10, this.timerCalc = t10, this.timer = void 0, this.tries = 0, this.callback = e10, this.timerCalc = t10;
        }
        reset() {
          this.tries = 0, clearTimeout(this.timer), this.timer = void 0;
        }
        scheduleTimeout() {
          clearTimeout(this.timer), this.timer = setTimeout(() => {
            this.tries = this.tries + 1, this.callback();
          }, this.timerCalc(this.tries + 1));
        }
      }
      (Y = eu || (eu = {})).abstime = "abstime", Y.bool = "bool", Y.date = "date", Y.daterange = "daterange", Y.float4 = "float4", Y.float8 = "float8", Y.int2 = "int2", Y.int4 = "int4", Y.int4range = "int4range", Y.int8 = "int8", Y.int8range = "int8range", Y.json = "json", Y.jsonb = "jsonb", Y.money = "money", Y.numeric = "numeric", Y.oid = "oid", Y.reltime = "reltime", Y.text = "text", Y.time = "time", Y.timestamp = "timestamp", Y.timestamptz = "timestamptz", Y.timetz = "timetz", Y.tsrange = "tsrange", Y.tstzrange = "tstzrange";
      let tY = (e10, t10, r10 = {}) => {
        var n10;
        let s2 = null != (n10 = r10.skipTypes) ? n10 : [];
        return t10 ? Object.keys(t10).reduce((r11, n11) => (r11[n11] = tQ(n11, e10, t10, s2), r11), {}) : {};
      }, tQ = (e10, t10, r10, n10) => {
        let s2 = t10.find((t11) => t11.name === e10), i2 = null == s2 ? void 0 : s2.type, a2 = r10[e10];
        return i2 && !n10.includes(i2) ? tZ(i2, a2) : t0(a2);
      }, tZ = (e10, t10) => {
        if ("_" === e10.charAt(0)) return t4(t10, e10.slice(1, e10.length));
        switch (e10) {
          case eu.bool:
            return t1(t10);
          case eu.float4:
          case eu.float8:
          case eu.int2:
          case eu.int4:
          case eu.int8:
          case eu.numeric:
          case eu.oid:
            return t2(t10);
          case eu.json:
          case eu.jsonb:
            return t3(t10);
          case eu.timestamp:
            return t5(t10);
          case eu.abstime:
          case eu.date:
          case eu.daterange:
          case eu.int4range:
          case eu.int8range:
          case eu.money:
          case eu.reltime:
          case eu.text:
          case eu.time:
          case eu.timestamptz:
          case eu.timetz:
          case eu.tsrange:
          case eu.tstzrange:
          default:
            return t0(t10);
        }
      }, t0 = (e10) => e10, t1 = (e10) => {
        switch (e10) {
          case "t":
            return true;
          case "f":
            return false;
          default:
            return e10;
        }
      }, t2 = (e10) => {
        if ("string" == typeof e10) {
          let t10 = parseFloat(e10);
          if (!Number.isNaN(t10)) return t10;
        }
        return e10;
      }, t3 = (e10) => {
        if ("string" == typeof e10) try {
          return JSON.parse(e10);
        } catch (e11) {
          console.log(`JSON parse error: ${e11}`);
        }
        return e10;
      }, t4 = (e10, t10) => {
        if ("string" != typeof e10) return e10;
        let r10 = e10.length - 1, n10 = e10[r10];
        if ("{" === e10[0] && "}" === n10) {
          let n11, s2 = e10.slice(1, r10);
          try {
            n11 = JSON.parse("[" + s2 + "]");
          } catch (e11) {
            n11 = s2 ? s2.split(",") : [];
          }
          return n11.map((e11) => tZ(t10, e11));
        }
        return e10;
      }, t5 = (e10) => "string" == typeof e10 ? e10.replace(" ", "T") : e10, t6 = (e10) => {
        let t10 = new URL(e10);
        return t10.protocol = t10.protocol.replace(/^ws/i, "http"), t10.pathname = t10.pathname.replace(/\/+$/, "").replace(/\/socket\/websocket$/i, "").replace(/\/socket$/i, "").replace(/\/websocket$/i, ""), "" === t10.pathname || "/" === t10.pathname ? t10.pathname = "/api/broadcast" : t10.pathname = t10.pathname + "/api/broadcast", t10.href;
      };
      class t8 {
        constructor(e10, t10, r10 = {}, n10 = 1e4) {
          this.channel = e10, this.event = t10, this.payload = r10, this.timeout = n10, this.sent = false, this.timeoutTimer = void 0, this.ref = "", this.receivedResp = null, this.recHooks = [], this.refEvent = null;
        }
        resend(e10) {
          this.timeout = e10, this._cancelRefEvent(), this.ref = "", this.refEvent = null, this.receivedResp = null, this.sent = false, this.send();
        }
        send() {
          this._hasReceived("timeout") || (this.startTimeout(), this.sent = true, this.channel.socket.push({ topic: this.channel.topic, event: this.event, payload: this.payload, ref: this.ref, join_ref: this.channel._joinRef() }));
        }
        updatePayload(e10) {
          this.payload = Object.assign(Object.assign({}, this.payload), e10);
        }
        receive(e10, t10) {
          var r10;
          return this._hasReceived(e10) && t10(null == (r10 = this.receivedResp) ? void 0 : r10.response), this.recHooks.push({ status: e10, callback: t10 }), this;
        }
        startTimeout() {
          if (this.timeoutTimer) return;
          this.ref = this.channel.socket._makeRef(), this.refEvent = this.channel._replyEventName(this.ref);
          let e10 = (e11) => {
            this._cancelRefEvent(), this._cancelTimeout(), this.receivedResp = e11, this._matchReceive(e11);
          };
          this.channel._on(this.refEvent, {}, e10), this.timeoutTimer = setTimeout(() => {
            this.trigger("timeout", {});
          }, this.timeout);
        }
        trigger(e10, t10) {
          this.refEvent && this.channel._trigger(this.refEvent, { status: e10, response: t10 });
        }
        destroy() {
          this._cancelRefEvent(), this._cancelTimeout();
        }
        _cancelRefEvent() {
          this.refEvent && this.channel._off(this.refEvent, {});
        }
        _cancelTimeout() {
          clearTimeout(this.timeoutTimer), this.timeoutTimer = void 0;
        }
        _matchReceive({ status: e10, response: t10 }) {
          this.recHooks.filter((t11) => t11.status === e10).forEach((e11) => e11.callback(t10));
        }
        _hasReceived(e10) {
          return this.receivedResp && this.receivedResp.status === e10;
        }
      }
      (Q = ec || (ec = {})).SYNC = "sync", Q.JOIN = "join", Q.LEAVE = "leave";
      class t9 {
        constructor(e10, t10) {
          this.channel = e10, this.state = {}, this.pendingDiffs = [], this.joinRef = null, this.enabled = false, this.caller = { onJoin: () => {
          }, onLeave: () => {
          }, onSync: () => {
          } };
          const r10 = (null == t10 ? void 0 : t10.events) || { state: "presence_state", diff: "presence_diff" };
          this.channel._on(r10.state, {}, (e11) => {
            let { onJoin: t11, onLeave: r11, onSync: n10 } = this.caller;
            this.joinRef = this.channel._joinRef(), this.state = t9.syncState(this.state, e11, t11, r11), this.pendingDiffs.forEach((e12) => {
              this.state = t9.syncDiff(this.state, e12, t11, r11);
            }), this.pendingDiffs = [], n10();
          }), this.channel._on(r10.diff, {}, (e11) => {
            let { onJoin: t11, onLeave: r11, onSync: n10 } = this.caller;
            this.inPendingSyncState() ? this.pendingDiffs.push(e11) : (this.state = t9.syncDiff(this.state, e11, t11, r11), n10());
          }), this.onJoin((e11, t11, r11) => {
            this.channel._trigger("presence", { event: "join", key: e11, currentPresences: t11, newPresences: r11 });
          }), this.onLeave((e11, t11, r11) => {
            this.channel._trigger("presence", { event: "leave", key: e11, currentPresences: t11, leftPresences: r11 });
          }), this.onSync(() => {
            this.channel._trigger("presence", { event: "sync" });
          });
        }
        static syncState(e10, t10, r10, n10) {
          let s2 = this.cloneDeep(e10), i2 = this.transformState(t10), a2 = {}, o2 = {};
          return this.map(s2, (e11, t11) => {
            i2[e11] || (o2[e11] = t11);
          }), this.map(i2, (e11, t11) => {
            let r11 = s2[e11];
            if (r11) {
              let n11 = t11.map((e12) => e12.presence_ref), s3 = r11.map((e12) => e12.presence_ref), i3 = t11.filter((e12) => 0 > s3.indexOf(e12.presence_ref)), l2 = r11.filter((e12) => 0 > n11.indexOf(e12.presence_ref));
              i3.length > 0 && (a2[e11] = i3), l2.length > 0 && (o2[e11] = l2);
            } else a2[e11] = t11;
          }), this.syncDiff(s2, { joins: a2, leaves: o2 }, r10, n10);
        }
        static syncDiff(e10, t10, r10, n10) {
          let { joins: s2, leaves: i2 } = { joins: this.transformState(t10.joins), leaves: this.transformState(t10.leaves) };
          return r10 || (r10 = () => {
          }), n10 || (n10 = () => {
          }), this.map(s2, (t11, n11) => {
            var s3;
            let i3 = null != (s3 = e10[t11]) ? s3 : [];
            if (e10[t11] = this.cloneDeep(n11), i3.length > 0) {
              let r11 = e10[t11].map((e11) => e11.presence_ref), n12 = i3.filter((e11) => 0 > r11.indexOf(e11.presence_ref));
              e10[t11].unshift(...n12);
            }
            r10(t11, i3, n11);
          }), this.map(i2, (t11, r11) => {
            let s3 = e10[t11];
            if (!s3) return;
            let i3 = r11.map((e11) => e11.presence_ref);
            s3 = s3.filter((e11) => 0 > i3.indexOf(e11.presence_ref)), e10[t11] = s3, n10(t11, s3, r11), 0 === s3.length && delete e10[t11];
          }), e10;
        }
        static map(e10, t10) {
          return Object.getOwnPropertyNames(e10).map((r10) => t10(r10, e10[r10]));
        }
        static transformState(e10) {
          return Object.getOwnPropertyNames(e10 = this.cloneDeep(e10)).reduce((t10, r10) => {
            let n10 = e10[r10];
            return "metas" in n10 ? t10[r10] = n10.metas.map((e11) => (e11.presence_ref = e11.phx_ref, delete e11.phx_ref, delete e11.phx_ref_prev, e11)) : t10[r10] = n10, t10;
          }, {});
        }
        static cloneDeep(e10) {
          return JSON.parse(JSON.stringify(e10));
        }
        onJoin(e10) {
          this.caller.onJoin = e10;
        }
        onLeave(e10) {
          this.caller.onLeave = e10;
        }
        onSync(e10) {
          this.caller.onSync = e10;
        }
        inPendingSyncState() {
          return !this.joinRef || this.joinRef !== this.channel._joinRef();
        }
      }
      (Z = eh || (eh = {})).ALL = "*", Z.INSERT = "INSERT", Z.UPDATE = "UPDATE", Z.DELETE = "DELETE", (ee = ed || (ed = {})).BROADCAST = "broadcast", ee.PRESENCE = "presence", ee.POSTGRES_CHANGES = "postgres_changes", ee.SYSTEM = "system", (et = ef || (ef = {})).SUBSCRIBED = "SUBSCRIBED", et.TIMED_OUT = "TIMED_OUT", et.CLOSED = "CLOSED", et.CHANNEL_ERROR = "CHANNEL_ERROR";
      class t7 {
        constructor(e10, t10 = { config: {} }, r10) {
          var n10, s2;
          if (this.topic = e10, this.params = t10, this.socket = r10, this.bindings = {}, this.state = ei.closed, this.joinedOnce = false, this.pushBuffer = [], this.subTopic = e10.replace(/^realtime:/i, ""), this.params.config = Object.assign({ broadcast: { ack: false, self: false }, presence: { key: "", enabled: false }, private: false }, t10.config), this.timeout = this.socket.timeout, this.joinPush = new t8(this, ea.join, this.params, this.timeout), this.rejoinTimer = new tX(() => this._rejoinUntilConnected(), this.socket.reconnectAfterMs), this.joinPush.receive("ok", () => {
            this.state = ei.joined, this.rejoinTimer.reset(), this.pushBuffer.forEach((e11) => e11.send()), this.pushBuffer = [];
          }), this._onClose(() => {
            this.rejoinTimer.reset(), this.socket.log("channel", `close ${this.topic} ${this._joinRef()}`), this.state = ei.closed, this.socket._remove(this);
          }), this._onError((e11) => {
            this._isLeaving() || this._isClosed() || (this.socket.log("channel", `error ${this.topic}`, e11), this.state = ei.errored, this.rejoinTimer.scheduleTimeout());
          }), this.joinPush.receive("timeout", () => {
            this._isJoining() && (this.socket.log("channel", `timeout ${this.topic}`, this.joinPush.timeout), this.state = ei.errored, this.rejoinTimer.scheduleTimeout());
          }), this.joinPush.receive("error", (e11) => {
            this._isLeaving() || this._isClosed() || (this.socket.log("channel", `error ${this.topic}`, e11), this.state = ei.errored, this.rejoinTimer.scheduleTimeout());
          }), this._on(ea.reply, {}, (e11, t11) => {
            this._trigger(this._replyEventName(t11), e11);
          }), this.presence = new t9(this), this.broadcastEndpointURL = t6(this.socket.endPoint), this.private = this.params.config.private || false, !this.private && (null == (s2 = null == (n10 = this.params.config) ? void 0 : n10.broadcast) ? void 0 : s2.replay)) throw `tried to use replay on public channel '${this.topic}'. It must be a private channel.`;
        }
        subscribe(e10, t10 = this.timeout) {
          var r10, n10, s2;
          if (this.socket.isConnected() || this.socket.connect(), this.state == ei.closed) {
            let { config: { broadcast: i2, presence: a2, private: o2 } } = this.params, l2 = null != (n10 = null == (r10 = this.bindings.postgres_changes) ? void 0 : r10.map((e11) => e11.filter)) ? n10 : [], u2 = !!this.bindings[ed.PRESENCE] && this.bindings[ed.PRESENCE].length > 0 || (null == (s2 = this.params.config.presence) ? void 0 : s2.enabled) === true, c2 = {}, h2 = { broadcast: i2, presence: Object.assign(Object.assign({}, a2), { enabled: u2 }), postgres_changes: l2, private: o2 };
            this.socket.accessTokenValue && (c2.access_token = this.socket.accessTokenValue), this._onError((t11) => null == e10 ? void 0 : e10(ef.CHANNEL_ERROR, t11)), this._onClose(() => null == e10 ? void 0 : e10(ef.CLOSED)), this.updateJoinPayload(Object.assign({ config: h2 }, c2)), this.joinedOnce = true, this._rejoin(t10), this.joinPush.receive("ok", async ({ postgres_changes: t11 }) => {
              var r11;
              if (this.socket.setAuth(), void 0 === t11) {
                null == e10 || e10(ef.SUBSCRIBED);
                return;
              }
              {
                let n11 = this.bindings.postgres_changes, s3 = null != (r11 = null == n11 ? void 0 : n11.length) ? r11 : 0, i3 = [];
                for (let r12 = 0; r12 < s3; r12++) {
                  let s4 = n11[r12], { filter: { event: a3, schema: o3, table: l3, filter: u3 } } = s4, c3 = t11 && t11[r12];
                  if (c3 && c3.event === a3 && c3.schema === o3 && c3.table === l3 && c3.filter === u3) i3.push(Object.assign(Object.assign({}, s4), { id: c3.id }));
                  else {
                    this.unsubscribe(), this.state = ei.errored, null == e10 || e10(ef.CHANNEL_ERROR, Error("mismatch between server and client bindings for postgres changes"));
                    return;
                  }
                }
                this.bindings.postgres_changes = i3, e10 && e10(ef.SUBSCRIBED);
                return;
              }
            }).receive("error", (t11) => {
              this.state = ei.errored, null == e10 || e10(ef.CHANNEL_ERROR, Error(JSON.stringify(Object.values(t11).join(", ") || "error")));
            }).receive("timeout", () => {
              null == e10 || e10(ef.TIMED_OUT);
            });
          }
          return this;
        }
        presenceState() {
          return this.presence.state;
        }
        async track(e10, t10 = {}) {
          return await this.send({ type: "presence", event: "track", payload: e10 }, t10.timeout || this.timeout);
        }
        async untrack(e10 = {}) {
          return await this.send({ type: "presence", event: "untrack" }, e10);
        }
        on(e10, t10, r10) {
          return this.state === ei.joined && e10 === ed.PRESENCE && (this.socket.log("channel", `resubscribe to ${this.topic} due to change in presence callbacks on joined channel`), this.unsubscribe().then(() => this.subscribe())), this._on(e10, t10, r10);
        }
        async httpSend(e10, t10, r10 = {}) {
          var n10;
          let s2 = this.socket.accessTokenValue ? `Bearer ${this.socket.accessTokenValue}` : "";
          if (null == t10) return Promise.reject("Payload is required for httpSend()");
          let i2 = { method: "POST", headers: { Authorization: s2, apikey: this.socket.apiKey ? this.socket.apiKey : "", "Content-Type": "application/json" }, body: JSON.stringify({ messages: [{ topic: this.subTopic, event: e10, payload: t10, private: this.private }] }) }, a2 = await this._fetchWithTimeout(this.broadcastEndpointURL, i2, null != (n10 = r10.timeout) ? n10 : this.timeout);
          if (202 === a2.status) return { success: true };
          let o2 = a2.statusText;
          try {
            let e11 = await a2.json();
            o2 = e11.error || e11.message || o2;
          } catch (e11) {
          }
          return Promise.reject(Error(o2));
        }
        async send(e10, t10 = {}) {
          var r10, n10;
          if (this._canPush() || "broadcast" !== e10.type) return new Promise((r11) => {
            var n11, s2, i2;
            let a2 = this._push(e10.type, e10, t10.timeout || this.timeout);
            "broadcast" !== e10.type || (null == (i2 = null == (s2 = null == (n11 = this.params) ? void 0 : n11.config) ? void 0 : s2.broadcast) ? void 0 : i2.ack) || r11("ok"), a2.receive("ok", () => r11("ok")), a2.receive("error", () => r11("error")), a2.receive("timeout", () => r11("timed out"));
          });
          {
            console.warn("Realtime send() is automatically falling back to REST API. This behavior will be deprecated in the future. Please use httpSend() explicitly for REST delivery.");
            let { event: s2, payload: i2 } = e10, a2 = { method: "POST", headers: { Authorization: this.socket.accessTokenValue ? `Bearer ${this.socket.accessTokenValue}` : "", apikey: this.socket.apiKey ? this.socket.apiKey : "", "Content-Type": "application/json" }, body: JSON.stringify({ messages: [{ topic: this.subTopic, event: s2, payload: i2, private: this.private }] }) };
            try {
              let e11 = await this._fetchWithTimeout(this.broadcastEndpointURL, a2, null != (r10 = t10.timeout) ? r10 : this.timeout);
              return await (null == (n10 = e11.body) ? void 0 : n10.cancel()), e11.ok ? "ok" : "error";
            } catch (e11) {
              if ("AbortError" === e11.name) return "timed out";
              return "error";
            }
          }
        }
        updateJoinPayload(e10) {
          this.joinPush.updatePayload(e10);
        }
        unsubscribe(e10 = this.timeout) {
          this.state = ei.leaving;
          let t10 = () => {
            this.socket.log("channel", `leave ${this.topic}`), this._trigger(ea.close, "leave", this._joinRef());
          };
          this.joinPush.destroy();
          let r10 = null;
          return new Promise((n10) => {
            (r10 = new t8(this, ea.leave, {}, e10)).receive("ok", () => {
              t10(), n10("ok");
            }).receive("timeout", () => {
              t10(), n10("timed out");
            }).receive("error", () => {
              n10("error");
            }), r10.send(), this._canPush() || r10.trigger("ok", {});
          }).finally(() => {
            null == r10 || r10.destroy();
          });
        }
        teardown() {
          this.pushBuffer.forEach((e10) => e10.destroy()), this.pushBuffer = [], this.rejoinTimer.reset(), this.joinPush.destroy(), this.state = ei.closed, this.bindings = {};
        }
        async _fetchWithTimeout(e10, t10, r10) {
          let n10 = new AbortController(), s2 = setTimeout(() => n10.abort(), r10), i2 = await this.socket.fetch(e10, Object.assign(Object.assign({}, t10), { signal: n10.signal }));
          return clearTimeout(s2), i2;
        }
        _push(e10, t10, r10 = this.timeout) {
          if (!this.joinedOnce) throw `tried to push '${e10}' to '${this.topic}' before joining. Use channel.subscribe() before pushing events`;
          let n10 = new t8(this, e10, t10, r10);
          return this._canPush() ? n10.send() : this._addToPushBuffer(n10), n10;
        }
        _addToPushBuffer(e10) {
          if (e10.startTimeout(), this.pushBuffer.push(e10), this.pushBuffer.length > 100) {
            let e11 = this.pushBuffer.shift();
            e11 && (e11.destroy(), this.socket.log("channel", `discarded push due to buffer overflow: ${e11.event}`, e11.payload));
          }
        }
        _onMessage(e10, t10, r10) {
          return t10;
        }
        _isMember(e10) {
          return this.topic === e10;
        }
        _joinRef() {
          return this.joinPush.ref;
        }
        _trigger(e10, t10, r10) {
          var n10, s2;
          let i2 = e10.toLocaleLowerCase(), { close: a2, error: o2, leave: l2, join: u2 } = ea;
          if (r10 && [a2, o2, l2, u2].indexOf(i2) >= 0 && r10 !== this._joinRef()) return;
          let c2 = this._onMessage(i2, t10, r10);
          if (t10 && !c2) throw "channel onMessage callbacks must return the payload, modified or unmodified";
          ["insert", "update", "delete"].includes(i2) ? null == (n10 = this.bindings.postgres_changes) || n10.filter((e11) => {
            var t11, r11, n11;
            return (null == (t11 = e11.filter) ? void 0 : t11.event) === "*" || (null == (n11 = null == (r11 = e11.filter) ? void 0 : r11.event) ? void 0 : n11.toLocaleLowerCase()) === i2;
          }).map((e11) => e11.callback(c2, r10)) : null == (s2 = this.bindings[i2]) || s2.filter((e11) => {
            var r11, n11, s3, a3, o3, l3;
            if (!["broadcast", "presence", "postgres_changes"].includes(i2)) return e11.type.toLocaleLowerCase() === i2;
            if ("id" in e11) {
              let i3 = e11.id, a4 = null == (r11 = e11.filter) ? void 0 : r11.event;
              return i3 && (null == (n11 = t10.ids) ? void 0 : n11.includes(i3)) && ("*" === a4 || (null == a4 ? void 0 : a4.toLocaleLowerCase()) === (null == (s3 = t10.data) ? void 0 : s3.type.toLocaleLowerCase()));
            }
            {
              let r12 = null == (o3 = null == (a3 = null == e11 ? void 0 : e11.filter) ? void 0 : a3.event) ? void 0 : o3.toLocaleLowerCase();
              return "*" === r12 || r12 === (null == (l3 = null == t10 ? void 0 : t10.event) ? void 0 : l3.toLocaleLowerCase());
            }
          }).map((e11) => {
            if ("object" == typeof c2 && "ids" in c2) {
              let e12 = c2.data, { schema: t11, table: r11, commit_timestamp: n11, type: s3, errors: i3 } = e12;
              c2 = Object.assign(Object.assign({}, { schema: t11, table: r11, commit_timestamp: n11, eventType: s3, new: {}, old: {}, errors: i3 }), this._getPayloadRecords(e12));
            }
            e11.callback(c2, r10);
          });
        }
        _isClosed() {
          return this.state === ei.closed;
        }
        _isJoined() {
          return this.state === ei.joined;
        }
        _isJoining() {
          return this.state === ei.joining;
        }
        _isLeaving() {
          return this.state === ei.leaving;
        }
        _replyEventName(e10) {
          return `chan_reply_${e10}`;
        }
        _on(e10, t10, r10) {
          let n10 = e10.toLocaleLowerCase(), s2 = { type: n10, filter: t10, callback: r10 };
          return this.bindings[n10] ? this.bindings[n10].push(s2) : this.bindings[n10] = [s2], this;
        }
        _off(e10, t10) {
          let r10 = e10.toLocaleLowerCase();
          return this.bindings[r10] && (this.bindings[r10] = this.bindings[r10].filter((e11) => {
            var n10;
            return !((null == (n10 = e11.type) ? void 0 : n10.toLocaleLowerCase()) === r10 && t7.isEqual(e11.filter, t10));
          })), this;
        }
        static isEqual(e10, t10) {
          if (Object.keys(e10).length !== Object.keys(t10).length) return false;
          for (let r10 in e10) if (e10[r10] !== t10[r10]) return false;
          return true;
        }
        _rejoinUntilConnected() {
          this.rejoinTimer.scheduleTimeout(), this.socket.isConnected() && this._rejoin();
        }
        _onClose(e10) {
          this._on(ea.close, {}, e10);
        }
        _onError(e10) {
          this._on(ea.error, {}, (t10) => e10(t10));
        }
        _canPush() {
          return this.socket.isConnected() && this._isJoined();
        }
        _rejoin(e10 = this.timeout) {
          this._isLeaving() || (this.socket._leaveOpenTopic(this.topic), this.state = ei.joining, this.joinPush.resend(e10));
        }
        _getPayloadRecords(e10) {
          let t10 = { new: {}, old: {} };
          return ("INSERT" === e10.type || "UPDATE" === e10.type) && (t10.new = tY(e10.columns, e10.record)), ("UPDATE" === e10.type || "DELETE" === e10.type) && (t10.old = tY(e10.columns, e10.old_record)), t10;
        }
      }
      let re = () => {
      }, rt = [1e3, 2e3, 5e3, 1e4], rr = `
  addEventListener("message", (e) => {
    if (e.data.event === "start") {
      setInterval(() => postMessage({ event: "keepAlive" }), e.data.interval);
    }
  });`;
      class rn {
        constructor(e10, t10) {
          var r10;
          if (this.accessTokenValue = null, this.apiKey = null, this.channels = [], this.endPoint = "", this.httpEndpoint = "", this.headers = {}, this.params = {}, this.timeout = 1e4, this.transport = null, this.heartbeatIntervalMs = 25e3, this.heartbeatTimer = void 0, this.pendingHeartbeatRef = null, this.heartbeatCallback = re, this.ref = 0, this.reconnectTimer = null, this.vsn = tG, this.logger = re, this.conn = null, this.sendBuffer = [], this.serializer = new tJ(), this.stateChangeCallbacks = { open: [], close: [], error: [], message: [] }, this.accessToken = null, this._connectionState = "disconnected", this._wasManualDisconnect = false, this._authPromise = null, this._resolveFetch = (e11) => e11 ? (...t11) => e11(...t11) : (...e12) => fetch(...e12), !(null == (r10 = null == t10 ? void 0 : t10.params) ? void 0 : r10.apikey)) throw Error("API key is required to connect to Realtime");
          this.apiKey = t10.params.apikey, this.endPoint = `${e10}/${eo.websocket}`, this.httpEndpoint = t6(e10), this._initializeOptions(t10), this._setupReconnectionTimer(), this.fetch = this._resolveFetch(null == t10 ? void 0 : t10.fetch);
        }
        connect() {
          if (!(this.isConnecting() || this.isDisconnecting() || null !== this.conn && this.isConnected())) {
            if (this._setConnectionState("connecting"), this.accessToken && !this._authPromise && this._setAuthSafely("connect"), this.transport) this.conn = new this.transport(this.endpointURL());
            else try {
              this.conn = tK.createWebSocket(this.endpointURL());
            } catch (t10) {
              this._setConnectionState("disconnected");
              let e10 = t10.message;
              if (e10.includes("Node.js")) throw Error(`${e10}

To use Realtime in Node.js, you need to provide a WebSocket implementation:

Option 1: Use Node.js 22+ which has native WebSocket support
Option 2: Install and provide the "ws" package:

  npm install ws

  import ws from "ws"
  const client = new RealtimeClient(url, {
    ...options,
    transport: ws
  })`);
              throw Error(`WebSocket not available: ${e10}`);
            }
            this._setupConnectionHandlers();
          }
        }
        endpointURL() {
          return this._appendParams(this.endPoint, Object.assign({}, this.params, { vsn: this.vsn }));
        }
        disconnect(e10, t10) {
          if (!this.isDisconnecting()) if (this._setConnectionState("disconnecting", true), this.conn) {
            let r10 = setTimeout(() => {
              this._setConnectionState("disconnected");
            }, 100);
            this.conn.onclose = () => {
              clearTimeout(r10), this._setConnectionState("disconnected");
            }, "function" == typeof this.conn.close && (e10 ? this.conn.close(e10, null != t10 ? t10 : "") : this.conn.close()), this._teardownConnection();
          } else this._setConnectionState("disconnected");
        }
        getChannels() {
          return this.channels;
        }
        async removeChannel(e10) {
          let t10 = await e10.unsubscribe();
          return 0 === this.channels.length && this.disconnect(), t10;
        }
        async removeAllChannels() {
          let e10 = await Promise.all(this.channels.map((e11) => e11.unsubscribe()));
          return this.channels = [], this.disconnect(), e10;
        }
        log(e10, t10, r10) {
          this.logger(e10, t10, r10);
        }
        connectionState() {
          switch (this.conn && this.conn.readyState) {
            case es.connecting:
              return el.Connecting;
            case es.open:
              return el.Open;
            case es.closing:
              return el.Closing;
            default:
              return el.Closed;
          }
        }
        isConnected() {
          return this.connectionState() === el.Open;
        }
        isConnecting() {
          return "connecting" === this._connectionState;
        }
        isDisconnecting() {
          return "disconnecting" === this._connectionState;
        }
        channel(e10, t10 = { config: {} }) {
          let r10 = `realtime:${e10}`, n10 = this.getChannels().find((e11) => e11.topic === r10);
          if (n10) return n10;
          {
            let r11 = new t7(`realtime:${e10}`, t10, this);
            return this.channels.push(r11), r11;
          }
        }
        push(e10) {
          let { topic: t10, event: r10, payload: n10, ref: s2 } = e10, i2 = () => {
            this.encode(e10, (e11) => {
              var t11;
              null == (t11 = this.conn) || t11.send(e11);
            });
          };
          this.log("push", `${t10} ${r10} (${s2})`, n10), this.isConnected() ? i2() : this.sendBuffer.push(i2);
        }
        async setAuth(e10 = null) {
          this._authPromise = this._performAuth(e10);
          try {
            await this._authPromise;
          } finally {
            this._authPromise = null;
          }
        }
        async sendHeartbeat() {
          var e10;
          if (!this.isConnected()) {
            try {
              this.heartbeatCallback("disconnected");
            } catch (e11) {
              this.log("error", "error in heartbeat callback", e11);
            }
            return;
          }
          if (this.pendingHeartbeatRef) {
            this.pendingHeartbeatRef = null, this.log("transport", "heartbeat timeout. Attempting to re-establish connection");
            try {
              this.heartbeatCallback("timeout");
            } catch (e11) {
              this.log("error", "error in heartbeat callback", e11);
            }
            this._wasManualDisconnect = false, null == (e10 = this.conn) || e10.close(1e3, "heartbeat timeout"), setTimeout(() => {
              var e11;
              this.isConnected() || null == (e11 = this.reconnectTimer) || e11.scheduleTimeout();
            }, 100);
            return;
          }
          this.pendingHeartbeatRef = this._makeRef(), this.push({ topic: "phoenix", event: "heartbeat", payload: {}, ref: this.pendingHeartbeatRef });
          try {
            this.heartbeatCallback("sent");
          } catch (e11) {
            this.log("error", "error in heartbeat callback", e11);
          }
          this._setAuthSafely("heartbeat");
        }
        onHeartbeat(e10) {
          this.heartbeatCallback = e10;
        }
        flushSendBuffer() {
          this.isConnected() && this.sendBuffer.length > 0 && (this.sendBuffer.forEach((e10) => e10()), this.sendBuffer = []);
        }
        _makeRef() {
          let e10 = this.ref + 1;
          return e10 === this.ref ? this.ref = 0 : this.ref = e10, this.ref.toString();
        }
        _leaveOpenTopic(e10) {
          let t10 = this.channels.find((t11) => t11.topic === e10 && (t11._isJoined() || t11._isJoining()));
          t10 && (this.log("transport", `leaving duplicate topic "${e10}"`), t10.unsubscribe());
        }
        _remove(e10) {
          this.channels = this.channels.filter((t10) => t10.topic !== e10.topic);
        }
        _onConnMessage(e10) {
          this.decode(e10.data, (e11) => {
            if ("phoenix" === e11.topic && "phx_reply" === e11.event) try {
              this.heartbeatCallback("ok" === e11.payload.status ? "ok" : "error");
            } catch (e12) {
              this.log("error", "error in heartbeat callback", e12);
            }
            e11.ref && e11.ref === this.pendingHeartbeatRef && (this.pendingHeartbeatRef = null);
            let { topic: t10, event: r10, payload: n10, ref: s2 } = e11, i2 = s2 ? `(${s2})` : "", a2 = n10.status || "";
            this.log("receive", `${a2} ${t10} ${r10} ${i2}`.trim(), n10), this.channels.filter((e12) => e12._isMember(t10)).forEach((e12) => e12._trigger(r10, n10, s2)), this._triggerStateCallbacks("message", e11);
          });
        }
        _clearTimer(e10) {
          var t10;
          "heartbeat" === e10 && this.heartbeatTimer ? (clearInterval(this.heartbeatTimer), this.heartbeatTimer = void 0) : "reconnect" === e10 && (null == (t10 = this.reconnectTimer) || t10.reset());
        }
        _clearAllTimers() {
          this._clearTimer("heartbeat"), this._clearTimer("reconnect");
        }
        _setupConnectionHandlers() {
          this.conn && ("binaryType" in this.conn && (this.conn.binaryType = "arraybuffer"), this.conn.onopen = () => this._onConnOpen(), this.conn.onerror = (e10) => this._onConnError(e10), this.conn.onmessage = (e10) => this._onConnMessage(e10), this.conn.onclose = (e10) => this._onConnClose(e10));
        }
        _teardownConnection() {
          if (this.conn) {
            if (this.conn.readyState === es.open || this.conn.readyState === es.connecting) try {
              this.conn.close();
            } catch (e10) {
              this.log("error", "Error closing connection", e10);
            }
            this.conn.onopen = null, this.conn.onerror = null, this.conn.onmessage = null, this.conn.onclose = null, this.conn = null;
          }
          this._clearAllTimers(), this.channels.forEach((e10) => e10.teardown());
        }
        _onConnOpen() {
          this._setConnectionState("connected"), this.log("transport", `connected to ${this.endpointURL()}`), (this._authPromise || (this.accessToken && !this.accessTokenValue ? this.setAuth() : Promise.resolve())).then(() => {
            this.flushSendBuffer();
          }).catch((e10) => {
            this.log("error", "error waiting for auth on connect", e10), this.flushSendBuffer();
          }), this._clearTimer("reconnect"), this.worker ? this.workerRef || this._startWorkerHeartbeat() : this._startHeartbeat(), this._triggerStateCallbacks("open");
        }
        _startHeartbeat() {
          this.heartbeatTimer && clearInterval(this.heartbeatTimer), this.heartbeatTimer = setInterval(() => this.sendHeartbeat(), this.heartbeatIntervalMs);
        }
        _startWorkerHeartbeat() {
          this.workerUrl ? this.log("worker", `starting worker for from ${this.workerUrl}`) : this.log("worker", "starting default worker");
          let e10 = this._workerObjectUrl(this.workerUrl);
          this.workerRef = new Worker(e10), this.workerRef.onerror = (e11) => {
            this.log("worker", "worker error", e11.message), this.workerRef.terminate();
          }, this.workerRef.onmessage = (e11) => {
            "keepAlive" === e11.data.event && this.sendHeartbeat();
          }, this.workerRef.postMessage({ event: "start", interval: this.heartbeatIntervalMs });
        }
        _onConnClose(e10) {
          var t10;
          this._setConnectionState("disconnected"), this.log("transport", "close", e10), this._triggerChanError(), this._clearTimer("heartbeat"), this._wasManualDisconnect || null == (t10 = this.reconnectTimer) || t10.scheduleTimeout(), this._triggerStateCallbacks("close", e10);
        }
        _onConnError(e10) {
          this._setConnectionState("disconnected"), this.log("transport", `${e10}`), this._triggerChanError(), this._triggerStateCallbacks("error", e10);
        }
        _triggerChanError() {
          this.channels.forEach((e10) => e10._trigger(ea.error));
        }
        _appendParams(e10, t10) {
          if (0 === Object.keys(t10).length) return e10;
          let r10 = e10.match(/\?/) ? "&" : "?", n10 = new URLSearchParams(t10);
          return `${e10}${r10}${n10}`;
        }
        _workerObjectUrl(e10) {
          let t10;
          if (e10) t10 = e10;
          else {
            let e11 = new Blob([rr], { type: "application/javascript" });
            t10 = URL.createObjectURL(e11);
          }
          return t10;
        }
        _setConnectionState(e10, t10 = false) {
          this._connectionState = e10, "connecting" === e10 ? this._wasManualDisconnect = false : "disconnecting" === e10 && (this._wasManualDisconnect = t10);
        }
        async _performAuth(e10 = null) {
          let t10;
          t10 = e10 || (this.accessToken ? await this.accessToken() : this.accessTokenValue), this.accessTokenValue != t10 && (this.accessTokenValue = t10, this.channels.forEach((e11) => {
            t10 && e11.updateJoinPayload({ access_token: t10, version: "realtime-js/2.86.0" }), e11.joinedOnce && e11._isJoined() && e11._push(ea.access_token, { access_token: t10 });
          }));
        }
        async _waitForAuthIfNeeded() {
          this._authPromise && await this._authPromise;
        }
        _setAuthSafely(e10 = "general") {
          this.setAuth().catch((t10) => {
            this.log("error", `error setting auth in ${e10}`, t10);
          });
        }
        _triggerStateCallbacks(e10, t10) {
          try {
            this.stateChangeCallbacks[e10].forEach((r10) => {
              try {
                r10(t10);
              } catch (t11) {
                this.log("error", `error in ${e10} callback`, t11);
              }
            });
          } catch (t11) {
            this.log("error", `error triggering ${e10} callbacks`, t11);
          }
        }
        _setupReconnectionTimer() {
          this.reconnectTimer = new tX(async () => {
            setTimeout(async () => {
              await this._waitForAuthIfNeeded(), this.isConnected() || this.connect();
            }, 10);
          }, this.reconnectAfterMs);
        }
        _initializeOptions(e10) {
          var t10, r10, n10, s2, i2, a2, o2, l2, u2, c2, h2, d2;
          switch (this.transport = null != (t10 = null == e10 ? void 0 : e10.transport) ? t10 : null, this.timeout = null != (r10 = null == e10 ? void 0 : e10.timeout) ? r10 : 1e4, this.heartbeatIntervalMs = null != (n10 = null == e10 ? void 0 : e10.heartbeatIntervalMs) ? n10 : 25e3, this.worker = null != (s2 = null == e10 ? void 0 : e10.worker) && s2, this.accessToken = null != (i2 = null == e10 ? void 0 : e10.accessToken) ? i2 : null, this.heartbeatCallback = null != (a2 = null == e10 ? void 0 : e10.heartbeatCallback) ? a2 : re, this.vsn = null != (o2 = null == e10 ? void 0 : e10.vsn) ? o2 : tG, (null == e10 ? void 0 : e10.params) && (this.params = e10.params), (null == e10 ? void 0 : e10.logger) && (this.logger = e10.logger), ((null == e10 ? void 0 : e10.logLevel) || (null == e10 ? void 0 : e10.log_level)) && (this.logLevel = e10.logLevel || e10.log_level, this.params = Object.assign(Object.assign({}, this.params), { log_level: this.logLevel })), this.reconnectAfterMs = null != (l2 = null == e10 ? void 0 : e10.reconnectAfterMs) ? l2 : (e11) => rt[e11 - 1] || 1e4, this.vsn) {
            case tG:
              this.encode = null != (u2 = null == e10 ? void 0 : e10.encode) ? u2 : (e11, t11) => t11(JSON.stringify(e11)), this.decode = null != (c2 = null == e10 ? void 0 : e10.decode) ? c2 : (e11, t11) => t11(JSON.parse(e11));
              break;
            case "2.0.0":
              this.encode = null != (h2 = null == e10 ? void 0 : e10.encode) ? h2 : this.serializer.encode.bind(this.serializer), this.decode = null != (d2 = null == e10 ? void 0 : e10.decode) ? d2 : this.serializer.decode.bind(this.serializer);
              break;
            default:
              throw Error(`Unsupported serializer version: ${this.vsn}`);
          }
          this.worker && (this.workerUrl = null == e10 ? void 0 : e10.workerUrl);
        }
      }
      class rs extends Error {
        constructor(e10) {
          super(e10), this.__isStorageError = true, this.name = "StorageError";
        }
      }
      function ri(e10) {
        return "object" == typeof e10 && null !== e10 && "__isStorageError" in e10;
      }
      class ra extends rs {
        constructor(e10, t10, r10) {
          super(e10), this.name = "StorageApiError", this.status = t10, this.statusCode = r10;
        }
        toJSON() {
          return { name: this.name, message: this.message, status: this.status, statusCode: this.statusCode };
        }
      }
      class ro extends rs {
        constructor(e10, t10) {
          super(e10), this.name = "StorageUnknownError", this.originalError = t10;
        }
      }
      let rl = (e10) => e10 ? (...t10) => e10(...t10) : (...e11) => fetch(...e11), ru = (e10) => {
        if (Array.isArray(e10)) return e10.map((e11) => ru(e11));
        if ("function" == typeof e10 || e10 !== Object(e10)) return e10;
        let t10 = {};
        return Object.entries(e10).forEach(([e11, r10]) => {
          t10[e11.replace(/([-_][a-z])/gi, (e12) => e12.toUpperCase().replace(/[-_]/g, ""))] = ru(r10);
        }), t10;
      }, rc = (e10) => {
        var t10;
        return e10.msg || e10.message || e10.error_description || ("string" == typeof e10.error ? e10.error : null == (t10 = e10.error) ? void 0 : t10.message) || JSON.stringify(e10);
      };
      function rh(e10, t10, r10, n10, s2, i2) {
        return (0, t$.__awaiter)(this, void 0, void 0, function* () {
          return new Promise((a2, o2) => {
            let l2;
            e10(r10, (l2 = { method: t10, headers: (null == n10 ? void 0 : n10.headers) || {} }, "GET" === t10 || !i2 ? l2 : (((e11) => {
              if ("object" != typeof e11 || null === e11) return false;
              let t11 = Object.getPrototypeOf(e11);
              return (null === t11 || t11 === Object.prototype || null === Object.getPrototypeOf(t11)) && !(Symbol.toStringTag in e11) && !(Symbol.iterator in e11);
            })(i2) ? (l2.headers = Object.assign({ "Content-Type": "application/json" }, null == n10 ? void 0 : n10.headers), l2.body = JSON.stringify(i2)) : l2.body = i2, (null == n10 ? void 0 : n10.duplex) && (l2.duplex = n10.duplex), Object.assign(Object.assign({}, l2), s2)))).then((e11) => {
              if (!e11.ok) throw e11;
              return (null == n10 ? void 0 : n10.noResolveJson) ? e11 : e11.json();
            }).then((e11) => a2(e11)).catch((e11) => (0, t$.__awaiter)(void 0, void 0, void 0, function* () {
              e11 instanceof (yield Response) && !(null == n10 ? void 0 : n10.noResolveJson) ? e11.json().then((t11) => {
                let r11 = e11.status || 500, n11 = (null == t11 ? void 0 : t11.statusCode) || r11 + "";
                o2(new ra(rc(t11), r11, n11));
              }).catch((e12) => {
                o2(new ro(rc(e12), e12));
              }) : o2(new ro(rc(e11), e11));
            }));
          });
        });
      }
      function rd(e10, t10, r10, n10) {
        return (0, t$.__awaiter)(this, void 0, void 0, function* () {
          return rh(e10, "GET", t10, r10, n10);
        });
      }
      function rf(e10, t10, r10, n10, s2) {
        return (0, t$.__awaiter)(this, void 0, void 0, function* () {
          return rh(e10, "POST", t10, n10, s2, r10);
        });
      }
      function rp(e10, t10, r10, n10, s2) {
        return (0, t$.__awaiter)(this, void 0, void 0, function* () {
          return rh(e10, "PUT", t10, n10, s2, r10);
        });
      }
      function rg(e10, t10, r10, n10, s2) {
        return (0, t$.__awaiter)(this, void 0, void 0, function* () {
          return rh(e10, "DELETE", t10, n10, s2, r10);
        });
      }
      class rm {
        constructor(e10, t10) {
          this.downloadFn = e10, this.shouldThrowOnError = t10;
        }
        then(e10, t10) {
          return this.execute().then(e10, t10);
        }
        execute() {
          return (0, t$.__awaiter)(this, void 0, void 0, function* () {
            try {
              return { data: (yield this.downloadFn()).body, error: null };
            } catch (e10) {
              if (this.shouldThrowOnError) throw e10;
              if (ri(e10)) return { data: null, error: e10 };
              throw e10;
            }
          });
        }
      }
      ep = Symbol.toStringTag;
      let ry = class {
        constructor(e10, t10) {
          this.downloadFn = e10, this.shouldThrowOnError = t10, this[ep] = "BlobDownloadBuilder", this.promise = null;
        }
        asStream() {
          return new rm(this.downloadFn, this.shouldThrowOnError);
        }
        then(e10, t10) {
          return this.getPromise().then(e10, t10);
        }
        catch(e10) {
          return this.getPromise().catch(e10);
        }
        finally(e10) {
          return this.getPromise().finally(e10);
        }
        getPromise() {
          return this.promise || (this.promise = this.execute()), this.promise;
        }
        execute() {
          return (0, t$.__awaiter)(this, void 0, void 0, function* () {
            try {
              let e10 = yield this.downloadFn();
              return { data: yield e10.blob(), error: null };
            } catch (e10) {
              if (this.shouldThrowOnError) throw e10;
              if (ri(e10)) return { data: null, error: e10 };
              throw e10;
            }
          });
        }
      }, rw = { limit: 100, offset: 0, sortBy: { column: "name", order: "asc" } }, rb = { cacheControl: "3600", contentType: "text/plain;charset=UTF-8", upsert: false };
      class rv {
        constructor(e10, t10 = {}, r10, n10) {
          this.shouldThrowOnError = false, this.url = e10, this.headers = t10, this.bucketId = r10, this.fetch = rl(n10);
        }
        throwOnError() {
          return this.shouldThrowOnError = true, this;
        }
        uploadOrUpdate(e10, t10, r10, n10) {
          return (0, t$.__awaiter)(this, void 0, void 0, function* () {
            try {
              let s2, i2 = Object.assign(Object.assign({}, rb), n10), a2 = Object.assign(Object.assign({}, this.headers), "POST" === e10 && { "x-upsert": String(i2.upsert) }), o2 = i2.metadata;
              "undefined" != typeof Blob && r10 instanceof Blob ? ((s2 = new FormData()).append("cacheControl", i2.cacheControl), o2 && s2.append("metadata", this.encodeMetadata(o2)), s2.append("", r10)) : "undefined" != typeof FormData && r10 instanceof FormData ? ((s2 = r10).has("cacheControl") || s2.append("cacheControl", i2.cacheControl), o2 && !s2.has("metadata") && s2.append("metadata", this.encodeMetadata(o2))) : (s2 = r10, a2["cache-control"] = `max-age=${i2.cacheControl}`, a2["content-type"] = i2.contentType, o2 && (a2["x-metadata"] = this.toBase64(this.encodeMetadata(o2))), ("undefined" != typeof ReadableStream && s2 instanceof ReadableStream || s2 && "object" == typeof s2 && "pipe" in s2 && "function" == typeof s2.pipe) && !i2.duplex && (i2.duplex = "half")), (null == n10 ? void 0 : n10.headers) && (a2 = Object.assign(Object.assign({}, a2), n10.headers));
              let l2 = this._removeEmptyFolders(t10), u2 = this._getFinalPath(l2), c2 = yield ("PUT" == e10 ? rp : rf)(this.fetch, `${this.url}/object/${u2}`, s2, Object.assign({ headers: a2 }, (null == i2 ? void 0 : i2.duplex) ? { duplex: i2.duplex } : {}));
              return { data: { path: l2, id: c2.Id, fullPath: c2.Key }, error: null };
            } catch (e11) {
              if (this.shouldThrowOnError) throw e11;
              if (ri(e11)) return { data: null, error: e11 };
              throw e11;
            }
          });
        }
        upload(e10, t10, r10) {
          return (0, t$.__awaiter)(this, void 0, void 0, function* () {
            return this.uploadOrUpdate("POST", e10, t10, r10);
          });
        }
        uploadToSignedUrl(e10, t10, r10, n10) {
          return (0, t$.__awaiter)(this, void 0, void 0, function* () {
            let s2 = this._removeEmptyFolders(e10), i2 = this._getFinalPath(s2), a2 = new URL(this.url + `/object/upload/sign/${i2}`);
            a2.searchParams.set("token", t10);
            try {
              let e11, t11 = Object.assign({ upsert: rb.upsert }, n10), i3 = Object.assign(Object.assign({}, this.headers), { "x-upsert": String(t11.upsert) });
              "undefined" != typeof Blob && r10 instanceof Blob ? ((e11 = new FormData()).append("cacheControl", t11.cacheControl), e11.append("", r10)) : "undefined" != typeof FormData && r10 instanceof FormData ? (e11 = r10).append("cacheControl", t11.cacheControl) : (e11 = r10, i3["cache-control"] = `max-age=${t11.cacheControl}`, i3["content-type"] = t11.contentType);
              let o2 = yield rp(this.fetch, a2.toString(), e11, { headers: i3 });
              return { data: { path: s2, fullPath: o2.Key }, error: null };
            } catch (e11) {
              if (this.shouldThrowOnError) throw e11;
              if (ri(e11)) return { data: null, error: e11 };
              throw e11;
            }
          });
        }
        createSignedUploadUrl(e10, t10) {
          return (0, t$.__awaiter)(this, void 0, void 0, function* () {
            try {
              let r10 = this._getFinalPath(e10), n10 = Object.assign({}, this.headers);
              (null == t10 ? void 0 : t10.upsert) && (n10["x-upsert"] = "true");
              let s2 = yield rf(this.fetch, `${this.url}/object/upload/sign/${r10}`, {}, { headers: n10 }), i2 = new URL(this.url + s2.url), a2 = i2.searchParams.get("token");
              if (!a2) throw new rs("No token returned by API");
              return { data: { signedUrl: i2.toString(), path: e10, token: a2 }, error: null };
            } catch (e11) {
              if (this.shouldThrowOnError) throw e11;
              if (ri(e11)) return { data: null, error: e11 };
              throw e11;
            }
          });
        }
        update(e10, t10, r10) {
          return (0, t$.__awaiter)(this, void 0, void 0, function* () {
            return this.uploadOrUpdate("PUT", e10, t10, r10);
          });
        }
        move(e10, t10, r10) {
          return (0, t$.__awaiter)(this, void 0, void 0, function* () {
            try {
              return { data: yield rf(this.fetch, `${this.url}/object/move`, { bucketId: this.bucketId, sourceKey: e10, destinationKey: t10, destinationBucket: null == r10 ? void 0 : r10.destinationBucket }, { headers: this.headers }), error: null };
            } catch (e11) {
              if (this.shouldThrowOnError) throw e11;
              if (ri(e11)) return { data: null, error: e11 };
              throw e11;
            }
          });
        }
        copy(e10, t10, r10) {
          return (0, t$.__awaiter)(this, void 0, void 0, function* () {
            try {
              return { data: { path: (yield rf(this.fetch, `${this.url}/object/copy`, { bucketId: this.bucketId, sourceKey: e10, destinationKey: t10, destinationBucket: null == r10 ? void 0 : r10.destinationBucket }, { headers: this.headers })).Key }, error: null };
            } catch (e11) {
              if (this.shouldThrowOnError) throw e11;
              if (ri(e11)) return { data: null, error: e11 };
              throw e11;
            }
          });
        }
        createSignedUrl(e10, t10, r10) {
          return (0, t$.__awaiter)(this, void 0, void 0, function* () {
            try {
              let n10 = this._getFinalPath(e10), s2 = yield rf(this.fetch, `${this.url}/object/sign/${n10}`, Object.assign({ expiresIn: t10 }, (null == r10 ? void 0 : r10.transform) ? { transform: r10.transform } : {}), { headers: this.headers }), i2 = (null == r10 ? void 0 : r10.download) ? `&download=${true === r10.download ? "" : r10.download}` : "";
              return { data: s2 = { signedUrl: encodeURI(`${this.url}${s2.signedURL}${i2}`) }, error: null };
            } catch (e11) {
              if (this.shouldThrowOnError) throw e11;
              if (ri(e11)) return { data: null, error: e11 };
              throw e11;
            }
          });
        }
        createSignedUrls(e10, t10, r10) {
          return (0, t$.__awaiter)(this, void 0, void 0, function* () {
            try {
              let n10 = yield rf(this.fetch, `${this.url}/object/sign/${this.bucketId}`, { expiresIn: t10, paths: e10 }, { headers: this.headers }), s2 = (null == r10 ? void 0 : r10.download) ? `&download=${true === r10.download ? "" : r10.download}` : "";
              return { data: n10.map((e11) => Object.assign(Object.assign({}, e11), { signedUrl: e11.signedURL ? encodeURI(`${this.url}${e11.signedURL}${s2}`) : null })), error: null };
            } catch (e11) {
              if (this.shouldThrowOnError) throw e11;
              if (ri(e11)) return { data: null, error: e11 };
              throw e11;
            }
          });
        }
        download(e10, t10) {
          let r10 = void 0 !== (null == t10 ? void 0 : t10.transform) ? "render/image/authenticated" : "object", n10 = this.transformOptsToQueryString((null == t10 ? void 0 : t10.transform) || {}), s2 = n10 ? `?${n10}` : "", i2 = this._getFinalPath(e10);
          return new ry(() => rd(this.fetch, `${this.url}/${r10}/${i2}${s2}`, { headers: this.headers, noResolveJson: true }), this.shouldThrowOnError);
        }
        info(e10) {
          return (0, t$.__awaiter)(this, void 0, void 0, function* () {
            let t10 = this._getFinalPath(e10);
            try {
              let e11 = yield rd(this.fetch, `${this.url}/object/info/${t10}`, { headers: this.headers });
              return { data: ru(e11), error: null };
            } catch (e11) {
              if (this.shouldThrowOnError) throw e11;
              if (ri(e11)) return { data: null, error: e11 };
              throw e11;
            }
          });
        }
        exists(e10) {
          return (0, t$.__awaiter)(this, void 0, void 0, function* () {
            let t10 = this._getFinalPath(e10);
            try {
              return yield function(e11, t11, r10, n10) {
                return (0, t$.__awaiter)(this, void 0, void 0, function* () {
                  return rh(e11, "HEAD", t11, Object.assign(Object.assign({}, r10), { noResolveJson: true }), void 0);
                });
              }(this.fetch, `${this.url}/object/${t10}`, { headers: this.headers }), { data: true, error: null };
            } catch (e11) {
              if (this.shouldThrowOnError) throw e11;
              if (ri(e11) && e11 instanceof ro) {
                let t11 = e11.originalError;
                if ([400, 404].includes(null == t11 ? void 0 : t11.status)) return { data: false, error: e11 };
              }
              throw e11;
            }
          });
        }
        getPublicUrl(e10, t10) {
          let r10 = this._getFinalPath(e10), n10 = [], s2 = (null == t10 ? void 0 : t10.download) ? `download=${true === t10.download ? "" : t10.download}` : "";
          "" !== s2 && n10.push(s2);
          let i2 = void 0 !== (null == t10 ? void 0 : t10.transform), a2 = this.transformOptsToQueryString((null == t10 ? void 0 : t10.transform) || {});
          "" !== a2 && n10.push(a2);
          let o2 = n10.join("&");
          return "" !== o2 && (o2 = `?${o2}`), { data: { publicUrl: encodeURI(`${this.url}/${i2 ? "render/image" : "object"}/public/${r10}${o2}`) } };
        }
        remove(e10) {
          return (0, t$.__awaiter)(this, void 0, void 0, function* () {
            try {
              return { data: yield rg(this.fetch, `${this.url}/object/${this.bucketId}`, { prefixes: e10 }, { headers: this.headers }), error: null };
            } catch (e11) {
              if (this.shouldThrowOnError) throw e11;
              if (ri(e11)) return { data: null, error: e11 };
              throw e11;
            }
          });
        }
        list(e10, t10, r10) {
          return (0, t$.__awaiter)(this, void 0, void 0, function* () {
            try {
              let n10 = Object.assign(Object.assign(Object.assign({}, rw), t10), { prefix: e10 || "" });
              return { data: yield rf(this.fetch, `${this.url}/object/list/${this.bucketId}`, n10, { headers: this.headers }, r10), error: null };
            } catch (e11) {
              if (this.shouldThrowOnError) throw e11;
              if (ri(e11)) return { data: null, error: e11 };
              throw e11;
            }
          });
        }
        listV2(e10, t10) {
          return (0, t$.__awaiter)(this, void 0, void 0, function* () {
            try {
              let r10 = Object.assign({}, e10);
              return { data: yield rf(this.fetch, `${this.url}/object/list-v2/${this.bucketId}`, r10, { headers: this.headers }, t10), error: null };
            } catch (e11) {
              if (this.shouldThrowOnError) throw e11;
              if (ri(e11)) return { data: null, error: e11 };
              throw e11;
            }
          });
        }
        encodeMetadata(e10) {
          return JSON.stringify(e10);
        }
        toBase64(e10) {
          return void 0 !== th.Buffer ? th.Buffer.from(e10).toString("base64") : btoa(e10);
        }
        _getFinalPath(e10) {
          return `${this.bucketId}/${e10.replace(/^\/+/, "")}`;
        }
        _removeEmptyFolders(e10) {
          return e10.replace(/^\/|\/$/g, "").replace(/\/+/g, "/");
        }
        transformOptsToQueryString(e10) {
          let t10 = [];
          return e10.width && t10.push(`width=${e10.width}`), e10.height && t10.push(`height=${e10.height}`), e10.resize && t10.push(`resize=${e10.resize}`), e10.format && t10.push(`format=${e10.format}`), e10.quality && t10.push(`quality=${e10.quality}`), t10.join("&");
        }
      }
      let r_ = "2.86.0", rS = { "X-Client-Info": `storage-js/${r_}` };
      class rE {
        constructor(e10, t10 = {}, r10, n10) {
          this.shouldThrowOnError = false;
          const s2 = new URL(e10);
          (null == n10 ? void 0 : n10.useNewHostname) && /supabase\.(co|in|red)$/.test(s2.hostname) && !s2.hostname.includes("storage.supabase.") && (s2.hostname = s2.hostname.replace("supabase.", "storage.supabase.")), this.url = s2.href.replace(/\/$/, ""), this.headers = Object.assign(Object.assign({}, rS), t10), this.fetch = rl(r10);
        }
        throwOnError() {
          return this.shouldThrowOnError = true, this;
        }
        listBuckets(e10) {
          return (0, t$.__awaiter)(this, void 0, void 0, function* () {
            try {
              let t10 = this.listBucketOptionsToQueryString(e10);
              return { data: yield rd(this.fetch, `${this.url}/bucket${t10}`, { headers: this.headers }), error: null };
            } catch (e11) {
              if (this.shouldThrowOnError) throw e11;
              if (ri(e11)) return { data: null, error: e11 };
              throw e11;
            }
          });
        }
        getBucket(e10) {
          return (0, t$.__awaiter)(this, void 0, void 0, function* () {
            try {
              return { data: yield rd(this.fetch, `${this.url}/bucket/${e10}`, { headers: this.headers }), error: null };
            } catch (e11) {
              if (this.shouldThrowOnError) throw e11;
              if (ri(e11)) return { data: null, error: e11 };
              throw e11;
            }
          });
        }
        createBucket(e10) {
          return (0, t$.__awaiter)(this, arguments, void 0, function* (e11, t10 = { public: false }) {
            try {
              return { data: yield rf(this.fetch, `${this.url}/bucket`, { id: e11, name: e11, type: t10.type, public: t10.public, file_size_limit: t10.fileSizeLimit, allowed_mime_types: t10.allowedMimeTypes }, { headers: this.headers }), error: null };
            } catch (e12) {
              if (this.shouldThrowOnError) throw e12;
              if (ri(e12)) return { data: null, error: e12 };
              throw e12;
            }
          });
        }
        updateBucket(e10, t10) {
          return (0, t$.__awaiter)(this, void 0, void 0, function* () {
            try {
              return { data: yield rp(this.fetch, `${this.url}/bucket/${e10}`, { id: e10, name: e10, public: t10.public, file_size_limit: t10.fileSizeLimit, allowed_mime_types: t10.allowedMimeTypes }, { headers: this.headers }), error: null };
            } catch (e11) {
              if (this.shouldThrowOnError) throw e11;
              if (ri(e11)) return { data: null, error: e11 };
              throw e11;
            }
          });
        }
        emptyBucket(e10) {
          return (0, t$.__awaiter)(this, void 0, void 0, function* () {
            try {
              return { data: yield rf(this.fetch, `${this.url}/bucket/${e10}/empty`, {}, { headers: this.headers }), error: null };
            } catch (e11) {
              if (this.shouldThrowOnError) throw e11;
              if (ri(e11)) return { data: null, error: e11 };
              throw e11;
            }
          });
        }
        deleteBucket(e10) {
          return (0, t$.__awaiter)(this, void 0, void 0, function* () {
            try {
              return { data: yield rg(this.fetch, `${this.url}/bucket/${e10}`, {}, { headers: this.headers }), error: null };
            } catch (e11) {
              if (this.shouldThrowOnError) throw e11;
              if (ri(e11)) return { data: null, error: e11 };
              throw e11;
            }
          });
        }
        listBucketOptionsToQueryString(e10) {
          let t10 = {};
          return e10 && ("limit" in e10 && (t10.limit = String(e10.limit)), "offset" in e10 && (t10.offset = String(e10.offset)), e10.search && (t10.search = e10.search), e10.sortColumn && (t10.sortColumn = e10.sortColumn), e10.sortOrder && (t10.sortOrder = e10.sortOrder)), Object.keys(t10).length > 0 ? "?" + new URLSearchParams(t10).toString() : "";
        }
      }
      var rk = class extends Error {
        constructor(e10, t10) {
          super(e10), this.name = "IcebergError", this.status = t10.status, this.icebergType = t10.icebergType, this.icebergCode = t10.icebergCode, this.details = t10.details, this.isCommitStateUnknown = "CommitStateUnknownException" === t10.icebergType || [500, 502, 504].includes(t10.status) && t10.icebergType?.includes("CommitState") === true;
        }
        isNotFound() {
          return 404 === this.status;
        }
        isConflict() {
          return 409 === this.status;
        }
        isAuthenticationTimeout() {
          return 419 === this.status;
        }
      };
      async function rO(e10) {
        return e10 && "none" !== e10.type ? "bearer" === e10.type ? { Authorization: `Bearer ${e10.token}` } : "header" === e10.type ? { [e10.name]: e10.value } : "custom" === e10.type ? await e10.getHeaders() : {} : {};
      }
      function rT(e10) {
        return e10.join("");
      }
      var rR = class {
        constructor(e10, t10 = "") {
          this.client = e10, this.prefix = t10;
        }
        async listNamespaces(e10) {
          let t10 = e10 ? { parent: rT(e10.namespace) } : void 0;
          return (await this.client.request({ method: "GET", path: `${this.prefix}/namespaces`, query: t10 })).data.namespaces.map((e11) => ({ namespace: e11 }));
        }
        async createNamespace(e10, t10) {
          let r10 = { namespace: e10.namespace, properties: t10?.properties };
          return (await this.client.request({ method: "POST", path: `${this.prefix}/namespaces`, body: r10 })).data;
        }
        async dropNamespace(e10) {
          await this.client.request({ method: "DELETE", path: `${this.prefix}/namespaces/${rT(e10.namespace)}` });
        }
        async loadNamespaceMetadata(e10) {
          return { properties: (await this.client.request({ method: "GET", path: `${this.prefix}/namespaces/${rT(e10.namespace)}` })).data.properties };
        }
        async namespaceExists(e10) {
          try {
            return await this.client.request({ method: "HEAD", path: `${this.prefix}/namespaces/${rT(e10.namespace)}` }), true;
          } catch (e11) {
            if (e11 instanceof rk && 404 === e11.status) return false;
            throw e11;
          }
        }
        async createNamespaceIfNotExists(e10, t10) {
          try {
            return await this.createNamespace(e10, t10);
          } catch (e11) {
            if (e11 instanceof rk && 409 === e11.status) return;
            throw e11;
          }
        }
      };
      function rx(e10) {
        return e10.join("");
      }
      var rC = class {
        constructor(e10, t10 = "", r10) {
          this.client = e10, this.prefix = t10, this.accessDelegation = r10;
        }
        async listTables(e10) {
          return (await this.client.request({ method: "GET", path: `${this.prefix}/namespaces/${rx(e10.namespace)}/tables` })).data.identifiers;
        }
        async createTable(e10, t10) {
          let r10 = {};
          return this.accessDelegation && (r10["X-Iceberg-Access-Delegation"] = this.accessDelegation), (await this.client.request({ method: "POST", path: `${this.prefix}/namespaces/${rx(e10.namespace)}/tables`, body: t10, headers: r10 })).data.metadata;
        }
        async updateTable(e10, t10) {
          let r10 = await this.client.request({ method: "POST", path: `${this.prefix}/namespaces/${rx(e10.namespace)}/tables/${e10.name}`, body: t10 });
          return { "metadata-location": r10.data["metadata-location"], metadata: r10.data.metadata };
        }
        async dropTable(e10, t10) {
          await this.client.request({ method: "DELETE", path: `${this.prefix}/namespaces/${rx(e10.namespace)}/tables/${e10.name}`, query: { purgeRequested: String(t10?.purge ?? false) } });
        }
        async loadTable(e10) {
          let t10 = {};
          return this.accessDelegation && (t10["X-Iceberg-Access-Delegation"] = this.accessDelegation), (await this.client.request({ method: "GET", path: `${this.prefix}/namespaces/${rx(e10.namespace)}/tables/${e10.name}`, headers: t10 })).data.metadata;
        }
        async tableExists(e10) {
          let t10 = {};
          this.accessDelegation && (t10["X-Iceberg-Access-Delegation"] = this.accessDelegation);
          try {
            return await this.client.request({ method: "HEAD", path: `${this.prefix}/namespaces/${rx(e10.namespace)}/tables/${e10.name}`, headers: t10 }), true;
          } catch (e11) {
            if (e11 instanceof rk && 404 === e11.status) return false;
            throw e11;
          }
        }
        async createTableIfNotExists(e10, t10) {
          try {
            return await this.createTable(e10, t10);
          } catch (r10) {
            if (r10 instanceof rk && 409 === r10.status) return await this.loadTable({ namespace: e10.namespace, name: t10.name });
            throw r10;
          }
        }
      }, rj = class {
        constructor(e10) {
          let t10 = "v1";
          e10.catalogName && (t10 += `/${e10.catalogName}`);
          const r10 = e10.baseUrl.endsWith("/") ? e10.baseUrl : `${e10.baseUrl}/`;
          this.client = function(e11) {
            let t11 = e11.fetchImpl ?? globalThis.fetch;
            return { async request({ method: r11, path: n10, query: s2, body: i2, headers: a2 }) {
              let o2 = function(e12, t12, r12) {
                let n11 = new URL(t12, e12);
                if (r12) for (let [e13, t13] of Object.entries(r12)) void 0 !== t13 && n11.searchParams.set(e13, t13);
                return n11.toString();
              }(e11.baseUrl, n10, s2), l2 = await rO(e11.auth), u2 = await t11(o2, { method: r11, headers: { ...i2 ? { "Content-Type": "application/json" } : {}, ...l2, ...a2 }, body: i2 ? JSON.stringify(i2) : void 0 }), c2 = await u2.text(), h2 = (u2.headers.get("content-type") || "").includes("application/json"), d2 = h2 && c2 ? JSON.parse(c2) : c2;
              if (!u2.ok) {
                let e12 = h2 ? d2 : void 0, t12 = e12?.error;
                throw new rk(t12?.message ?? `Request failed with status ${u2.status}`, { status: u2.status, icebergType: t12?.type, icebergCode: t12?.code, details: e12 });
              }
              return { status: u2.status, headers: u2.headers, data: d2 };
            } };
          }({ baseUrl: r10, auth: e10.auth, fetchImpl: e10.fetch }), this.accessDelegation = e10.accessDelegation?.join(","), this.namespaceOps = new rR(this.client, t10), this.tableOps = new rC(this.client, t10, this.accessDelegation);
        }
        async listNamespaces(e10) {
          return this.namespaceOps.listNamespaces(e10);
        }
        async createNamespace(e10, t10) {
          return this.namespaceOps.createNamespace(e10, t10);
        }
        async dropNamespace(e10) {
          await this.namespaceOps.dropNamespace(e10);
        }
        async loadNamespaceMetadata(e10) {
          return this.namespaceOps.loadNamespaceMetadata(e10);
        }
        async listTables(e10) {
          return this.tableOps.listTables(e10);
        }
        async createTable(e10, t10) {
          return this.tableOps.createTable(e10, t10);
        }
        async updateTable(e10, t10) {
          return this.tableOps.updateTable(e10, t10);
        }
        async dropTable(e10, t10) {
          await this.tableOps.dropTable(e10, t10);
        }
        async loadTable(e10) {
          return this.tableOps.loadTable(e10);
        }
        async namespaceExists(e10) {
          return this.namespaceOps.namespaceExists(e10);
        }
        async tableExists(e10) {
          return this.tableOps.tableExists(e10);
        }
        async createNamespaceIfNotExists(e10, t10) {
          return this.namespaceOps.createNamespaceIfNotExists(e10, t10);
        }
        async createTableIfNotExists(e10, t10) {
          return this.tableOps.createTableIfNotExists(e10, t10);
        }
      };
      class rP {
        constructor(e10, t10 = {}, r10) {
          this.shouldThrowOnError = false, this.url = e10.replace(/\/$/, ""), this.headers = Object.assign(Object.assign({}, rS), t10), this.fetch = rl(r10);
        }
        throwOnError() {
          return this.shouldThrowOnError = true, this;
        }
        createBucket(e10) {
          return (0, t$.__awaiter)(this, void 0, void 0, function* () {
            try {
              return { data: yield rf(this.fetch, `${this.url}/bucket`, { name: e10 }, { headers: this.headers }), error: null };
            } catch (e11) {
              if (this.shouldThrowOnError) throw e11;
              if (ri(e11)) return { data: null, error: e11 };
              throw e11;
            }
          });
        }
        listBuckets(e10) {
          return (0, t$.__awaiter)(this, void 0, void 0, function* () {
            try {
              let t10 = new URLSearchParams();
              (null == e10 ? void 0 : e10.limit) !== void 0 && t10.set("limit", e10.limit.toString()), (null == e10 ? void 0 : e10.offset) !== void 0 && t10.set("offset", e10.offset.toString()), (null == e10 ? void 0 : e10.sortColumn) && t10.set("sortColumn", e10.sortColumn), (null == e10 ? void 0 : e10.sortOrder) && t10.set("sortOrder", e10.sortOrder), (null == e10 ? void 0 : e10.search) && t10.set("search", e10.search);
              let r10 = t10.toString(), n10 = r10 ? `${this.url}/bucket?${r10}` : `${this.url}/bucket`;
              return { data: yield rd(this.fetch, n10, { headers: this.headers }), error: null };
            } catch (e11) {
              if (this.shouldThrowOnError) throw e11;
              if (ri(e11)) return { data: null, error: e11 };
              throw e11;
            }
          });
        }
        deleteBucket(e10) {
          return (0, t$.__awaiter)(this, void 0, void 0, function* () {
            try {
              return { data: yield rg(this.fetch, `${this.url}/bucket/${e10}`, {}, { headers: this.headers }), error: null };
            } catch (e11) {
              if (this.shouldThrowOnError) throw e11;
              if (ri(e11)) return { data: null, error: e11 };
              throw e11;
            }
          });
        }
        from(e10) {
          if (!(!(!e10 || "string" != typeof e10 || 0 === e10.length || e10.length > 100 || e10.trim() !== e10 || e10.includes("/") || e10.includes("\\")) && /^[\w!.\*'() &$@=;:+,?-]+$/.test(e10))) throw new rs("Invalid bucket name: File, folder, and bucket names must follow AWS object key naming guidelines and should avoid the use of any other characters.");
          return new rj({ baseUrl: this.url, catalogName: e10, auth: { type: "custom", getHeaders: () => (0, t$.__awaiter)(this, void 0, void 0, function* () {
            return this.headers;
          }) }, fetch: this.fetch });
        }
      }
      let rA = { "X-Client-Info": `storage-js/${r_}`, "Content-Type": "application/json" };
      class rI extends Error {
        constructor(e10) {
          super(e10), this.__isStorageVectorsError = true, this.name = "StorageVectorsError";
        }
      }
      function r$(e10) {
        return "object" == typeof e10 && null !== e10 && "__isStorageVectorsError" in e10;
      }
      class rN extends rI {
        constructor(e10, t10, r10) {
          super(e10), this.name = "StorageVectorsApiError", this.status = t10, this.statusCode = r10;
        }
        toJSON() {
          return { name: this.name, message: this.message, status: this.status, statusCode: this.statusCode };
        }
      }
      class rU extends rI {
        constructor(e10, t10) {
          super(e10), this.name = "StorageVectorsUnknownError", this.originalError = t10;
        }
      }
      (er = eg || (eg = {})).InternalError = "InternalError", er.S3VectorConflictException = "S3VectorConflictException", er.S3VectorNotFoundException = "S3VectorNotFoundException", er.S3VectorBucketNotEmpty = "S3VectorBucketNotEmpty", er.S3VectorMaxBucketsExceeded = "S3VectorMaxBucketsExceeded", er.S3VectorMaxIndexesExceeded = "S3VectorMaxIndexesExceeded";
      let rD = (e10) => e10 ? (...t10) => e10(...t10) : (...e11) => fetch(...e11), rL = (e10) => e10.msg || e10.message || e10.error_description || e10.error || JSON.stringify(e10);
      function rq(e10, t10, r10, n10, s2) {
        return (0, t$.__awaiter)(this, void 0, void 0, function* () {
          return function(e11, t11, r11, n11, s3, i2) {
            return (0, t$.__awaiter)(this, void 0, void 0, function* () {
              return new Promise((a2, o2) => {
                let l2;
                e11(r11, (l2 = { method: t11, headers: (null == n11 ? void 0 : n11.headers) || {} }, "GET" === t11 || !i2 ? l2 : (((e12) => {
                  if ("object" != typeof e12 || null === e12) return false;
                  let t12 = Object.getPrototypeOf(e12);
                  return (null === t12 || t12 === Object.prototype || null === Object.getPrototypeOf(t12)) && !(Symbol.toStringTag in e12) && !(Symbol.iterator in e12);
                })(i2) ? (l2.headers = Object.assign({ "Content-Type": "application/json" }, null == n11 ? void 0 : n11.headers), l2.body = JSON.stringify(i2)) : l2.body = i2, Object.assign(Object.assign({}, l2), s3)))).then((e12) => {
                  if (!e12.ok) throw e12;
                  if (null == n11 ? void 0 : n11.noResolveJson) return e12;
                  let t12 = e12.headers.get("content-type");
                  return t12 && t12.includes("application/json") ? e12.json() : {};
                }).then((e12) => a2(e12)).catch((e12) => (0, t$.__awaiter)(void 0, void 0, void 0, function* () {
                  if (!(e12 && "object" == typeof e12 && "status" in e12 && "ok" in e12 && "number" == typeof e12.status) || (null == n11 ? void 0 : n11.noResolveJson)) o2(new rU(rL(e12), e12));
                  else {
                    let t12 = e12.status || 500;
                    "function" == typeof e12.json ? e12.json().then((e13) => {
                      let r12 = (null == e13 ? void 0 : e13.statusCode) || (null == e13 ? void 0 : e13.code) || t12 + "";
                      o2(new rN(rL(e13), t12, r12));
                    }).catch(() => {
                      o2(new rN(e12.statusText || `HTTP ${t12} error`, t12, t12 + ""));
                    }) : o2(new rN(e12.statusText || `HTTP ${t12} error`, t12, t12 + ""));
                  }
                }));
              });
            });
          }(e10, "POST", t10, n10, s2, r10);
        });
      }
      class rB {
        constructor(e10, t10 = {}, r10) {
          this.shouldThrowOnError = false, this.url = e10.replace(/\/$/, ""), this.headers = Object.assign(Object.assign({}, rA), t10), this.fetch = rD(r10);
        }
        throwOnError() {
          return this.shouldThrowOnError = true, this;
        }
        createIndex(e10) {
          return (0, t$.__awaiter)(this, void 0, void 0, function* () {
            try {
              return { data: (yield rq(this.fetch, `${this.url}/CreateIndex`, e10, { headers: this.headers })) || {}, error: null };
            } catch (e11) {
              if (this.shouldThrowOnError) throw e11;
              if (r$(e11)) return { data: null, error: e11 };
              throw e11;
            }
          });
        }
        getIndex(e10, t10) {
          return (0, t$.__awaiter)(this, void 0, void 0, function* () {
            try {
              return { data: yield rq(this.fetch, `${this.url}/GetIndex`, { vectorBucketName: e10, indexName: t10 }, { headers: this.headers }), error: null };
            } catch (e11) {
              if (this.shouldThrowOnError) throw e11;
              if (r$(e11)) return { data: null, error: e11 };
              throw e11;
            }
          });
        }
        listIndexes(e10) {
          return (0, t$.__awaiter)(this, void 0, void 0, function* () {
            try {
              return { data: yield rq(this.fetch, `${this.url}/ListIndexes`, e10, { headers: this.headers }), error: null };
            } catch (e11) {
              if (this.shouldThrowOnError) throw e11;
              if (r$(e11)) return { data: null, error: e11 };
              throw e11;
            }
          });
        }
        deleteIndex(e10, t10) {
          return (0, t$.__awaiter)(this, void 0, void 0, function* () {
            try {
              return { data: (yield rq(this.fetch, `${this.url}/DeleteIndex`, { vectorBucketName: e10, indexName: t10 }, { headers: this.headers })) || {}, error: null };
            } catch (e11) {
              if (this.shouldThrowOnError) throw e11;
              if (r$(e11)) return { data: null, error: e11 };
              throw e11;
            }
          });
        }
      }
      class rM {
        constructor(e10, t10 = {}, r10) {
          this.shouldThrowOnError = false, this.url = e10.replace(/\/$/, ""), this.headers = Object.assign(Object.assign({}, rA), t10), this.fetch = rD(r10);
        }
        throwOnError() {
          return this.shouldThrowOnError = true, this;
        }
        putVectors(e10) {
          return (0, t$.__awaiter)(this, void 0, void 0, function* () {
            try {
              if (e10.vectors.length < 1 || e10.vectors.length > 500) throw Error("Vector batch size must be between 1 and 500 items");
              return { data: (yield rq(this.fetch, `${this.url}/PutVectors`, e10, { headers: this.headers })) || {}, error: null };
            } catch (e11) {
              if (this.shouldThrowOnError) throw e11;
              if (r$(e11)) return { data: null, error: e11 };
              throw e11;
            }
          });
        }
        getVectors(e10) {
          return (0, t$.__awaiter)(this, void 0, void 0, function* () {
            try {
              return { data: yield rq(this.fetch, `${this.url}/GetVectors`, e10, { headers: this.headers }), error: null };
            } catch (e11) {
              if (this.shouldThrowOnError) throw e11;
              if (r$(e11)) return { data: null, error: e11 };
              throw e11;
            }
          });
        }
        listVectors(e10) {
          return (0, t$.__awaiter)(this, void 0, void 0, function* () {
            try {
              if (void 0 !== e10.segmentCount) {
                if (e10.segmentCount < 1 || e10.segmentCount > 16) throw Error("segmentCount must be between 1 and 16");
                if (void 0 !== e10.segmentIndex && (e10.segmentIndex < 0 || e10.segmentIndex >= e10.segmentCount)) throw Error(`segmentIndex must be between 0 and ${e10.segmentCount - 1}`);
              }
              return { data: yield rq(this.fetch, `${this.url}/ListVectors`, e10, { headers: this.headers }), error: null };
            } catch (e11) {
              if (this.shouldThrowOnError) throw e11;
              if (r$(e11)) return { data: null, error: e11 };
              throw e11;
            }
          });
        }
        queryVectors(e10) {
          return (0, t$.__awaiter)(this, void 0, void 0, function* () {
            try {
              return { data: yield rq(this.fetch, `${this.url}/QueryVectors`, e10, { headers: this.headers }), error: null };
            } catch (e11) {
              if (this.shouldThrowOnError) throw e11;
              if (r$(e11)) return { data: null, error: e11 };
              throw e11;
            }
          });
        }
        deleteVectors(e10) {
          return (0, t$.__awaiter)(this, void 0, void 0, function* () {
            try {
              if (e10.keys.length < 1 || e10.keys.length > 500) throw Error("Keys batch size must be between 1 and 500 items");
              return { data: (yield rq(this.fetch, `${this.url}/DeleteVectors`, e10, { headers: this.headers })) || {}, error: null };
            } catch (e11) {
              if (this.shouldThrowOnError) throw e11;
              if (r$(e11)) return { data: null, error: e11 };
              throw e11;
            }
          });
        }
      }
      class rW {
        constructor(e10, t10 = {}, r10) {
          this.shouldThrowOnError = false, this.url = e10.replace(/\/$/, ""), this.headers = Object.assign(Object.assign({}, rA), t10), this.fetch = rD(r10);
        }
        throwOnError() {
          return this.shouldThrowOnError = true, this;
        }
        createBucket(e10) {
          return (0, t$.__awaiter)(this, void 0, void 0, function* () {
            try {
              return { data: (yield rq(this.fetch, `${this.url}/CreateVectorBucket`, { vectorBucketName: e10 }, { headers: this.headers })) || {}, error: null };
            } catch (e11) {
              if (this.shouldThrowOnError) throw e11;
              if (r$(e11)) return { data: null, error: e11 };
              throw e11;
            }
          });
        }
        getBucket(e10) {
          return (0, t$.__awaiter)(this, void 0, void 0, function* () {
            try {
              return { data: yield rq(this.fetch, `${this.url}/GetVectorBucket`, { vectorBucketName: e10 }, { headers: this.headers }), error: null };
            } catch (e11) {
              if (this.shouldThrowOnError) throw e11;
              if (r$(e11)) return { data: null, error: e11 };
              throw e11;
            }
          });
        }
        listBuckets() {
          return (0, t$.__awaiter)(this, arguments, void 0, function* (e10 = {}) {
            try {
              return { data: yield rq(this.fetch, `${this.url}/ListVectorBuckets`, e10, { headers: this.headers }), error: null };
            } catch (e11) {
              if (this.shouldThrowOnError) throw e11;
              if (r$(e11)) return { data: null, error: e11 };
              throw e11;
            }
          });
        }
        deleteBucket(e10) {
          return (0, t$.__awaiter)(this, void 0, void 0, function* () {
            try {
              return { data: (yield rq(this.fetch, `${this.url}/DeleteVectorBucket`, { vectorBucketName: e10 }, { headers: this.headers })) || {}, error: null };
            } catch (e11) {
              if (this.shouldThrowOnError) throw e11;
              if (r$(e11)) return { data: null, error: e11 };
              throw e11;
            }
          });
        }
      }
      class rH extends rW {
        constructor(e10, t10 = {}) {
          super(e10, t10.headers || {}, t10.fetch);
        }
        from(e10) {
          return new rV(this.url, this.headers, e10, this.fetch);
        }
        createBucket(e10) {
          let t10 = Object.create(null, { createBucket: { get: () => super.createBucket } });
          return (0, t$.__awaiter)(this, void 0, void 0, function* () {
            return t10.createBucket.call(this, e10);
          });
        }
        getBucket(e10) {
          let t10 = Object.create(null, { getBucket: { get: () => super.getBucket } });
          return (0, t$.__awaiter)(this, void 0, void 0, function* () {
            return t10.getBucket.call(this, e10);
          });
        }
        listBuckets() {
          let e10 = Object.create(null, { listBuckets: { get: () => super.listBuckets } });
          return (0, t$.__awaiter)(this, arguments, void 0, function* (t10 = {}) {
            return e10.listBuckets.call(this, t10);
          });
        }
        deleteBucket(e10) {
          let t10 = Object.create(null, { deleteBucket: { get: () => super.deleteBucket } });
          return (0, t$.__awaiter)(this, void 0, void 0, function* () {
            return t10.deleteBucket.call(this, e10);
          });
        }
      }
      class rV extends rB {
        constructor(e10, t10, r10, n10) {
          super(e10, t10, n10), this.vectorBucketName = r10;
        }
        createIndex(e10) {
          let t10 = Object.create(null, { createIndex: { get: () => super.createIndex } });
          return (0, t$.__awaiter)(this, void 0, void 0, function* () {
            return t10.createIndex.call(this, Object.assign(Object.assign({}, e10), { vectorBucketName: this.vectorBucketName }));
          });
        }
        listIndexes() {
          let e10 = Object.create(null, { listIndexes: { get: () => super.listIndexes } });
          return (0, t$.__awaiter)(this, arguments, void 0, function* (t10 = {}) {
            return e10.listIndexes.call(this, Object.assign(Object.assign({}, t10), { vectorBucketName: this.vectorBucketName }));
          });
        }
        getIndex(e10) {
          let t10 = Object.create(null, { getIndex: { get: () => super.getIndex } });
          return (0, t$.__awaiter)(this, void 0, void 0, function* () {
            return t10.getIndex.call(this, this.vectorBucketName, e10);
          });
        }
        deleteIndex(e10) {
          let t10 = Object.create(null, { deleteIndex: { get: () => super.deleteIndex } });
          return (0, t$.__awaiter)(this, void 0, void 0, function* () {
            return t10.deleteIndex.call(this, this.vectorBucketName, e10);
          });
        }
        index(e10) {
          return new rz(this.url, this.headers, this.vectorBucketName, e10, this.fetch);
        }
      }
      class rz extends rM {
        constructor(e10, t10, r10, n10, s2) {
          super(e10, t10, s2), this.vectorBucketName = r10, this.indexName = n10;
        }
        putVectors(e10) {
          let t10 = Object.create(null, { putVectors: { get: () => super.putVectors } });
          return (0, t$.__awaiter)(this, void 0, void 0, function* () {
            return t10.putVectors.call(this, Object.assign(Object.assign({}, e10), { vectorBucketName: this.vectorBucketName, indexName: this.indexName }));
          });
        }
        getVectors(e10) {
          let t10 = Object.create(null, { getVectors: { get: () => super.getVectors } });
          return (0, t$.__awaiter)(this, void 0, void 0, function* () {
            return t10.getVectors.call(this, Object.assign(Object.assign({}, e10), { vectorBucketName: this.vectorBucketName, indexName: this.indexName }));
          });
        }
        listVectors() {
          let e10 = Object.create(null, { listVectors: { get: () => super.listVectors } });
          return (0, t$.__awaiter)(this, arguments, void 0, function* (t10 = {}) {
            return e10.listVectors.call(this, Object.assign(Object.assign({}, t10), { vectorBucketName: this.vectorBucketName, indexName: this.indexName }));
          });
        }
        queryVectors(e10) {
          let t10 = Object.create(null, { queryVectors: { get: () => super.queryVectors } });
          return (0, t$.__awaiter)(this, void 0, void 0, function* () {
            return t10.queryVectors.call(this, Object.assign(Object.assign({}, e10), { vectorBucketName: this.vectorBucketName, indexName: this.indexName }));
          });
        }
        deleteVectors(e10) {
          let t10 = Object.create(null, { deleteVectors: { get: () => super.deleteVectors } });
          return (0, t$.__awaiter)(this, void 0, void 0, function* () {
            return t10.deleteVectors.call(this, Object.assign(Object.assign({}, e10), { vectorBucketName: this.vectorBucketName, indexName: this.indexName }));
          });
        }
      }
      class rF extends rE {
        constructor(e10, t10 = {}, r10, n10) {
          super(e10, t10, r10, n10);
        }
        from(e10) {
          return new rv(this.url, this.headers, e10, this.fetch);
        }
        get vectors() {
          return new rH(this.url + "/vector", { headers: this.headers, fetch: this.fetch });
        }
        get analytics() {
          return new rP(this.url + "/iceberg", this.headers, this.fetch);
        }
      }
      let rK = "";
      rK = "undefined" != typeof Deno ? "deno" : "undefined" != typeof document ? "web" : "undefined" != typeof navigator && "ReactNative" === navigator.product ? "react-native" : "node";
      let rG = { headers: { "X-Client-Info": `supabase-js-${rK}/2.86.0` } }, rJ = { schema: "public" }, rX = { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true, flowType: "implicit" }, rY = {}, rQ = "2.86.0", rZ = { "X-Client-Info": `gotrue-js/${rQ}` }, r0 = "X-Supabase-Api-Version", r1 = { "2024-01-01": { timestamp: Date.parse("2024-01-01T00:00:00.0Z"), name: "2024-01-01" } }, r2 = /^([a-z0-9_-]{4})*($|[a-z0-9_-]{3}$|[a-z0-9_-]{2}$)$/i;
      class r3 extends Error {
        constructor(e10, t10, r10) {
          super(e10), this.__isAuthError = true, this.name = "AuthError", this.status = t10, this.code = r10;
        }
      }
      function r4(e10) {
        return "object" == typeof e10 && null !== e10 && "__isAuthError" in e10;
      }
      class r5 extends r3 {
        constructor(e10, t10, r10) {
          super(e10, t10, r10), this.name = "AuthApiError", this.status = t10, this.code = r10;
        }
      }
      class r6 extends r3 {
        constructor(e10, t10) {
          super(e10), this.name = "AuthUnknownError", this.originalError = t10;
        }
      }
      class r8 extends r3 {
        constructor(e10, t10, r10, n10) {
          super(e10, r10, n10), this.name = t10, this.status = r10;
        }
      }
      class r9 extends r8 {
        constructor() {
          super("Auth session missing!", "AuthSessionMissingError", 400, void 0);
        }
      }
      class r7 extends r8 {
        constructor() {
          super("Auth session or user missing", "AuthInvalidTokenResponseError", 500, void 0);
        }
      }
      class ne extends r8 {
        constructor(e10) {
          super(e10, "AuthInvalidCredentialsError", 400, void 0);
        }
      }
      class nt extends r8 {
        constructor(e10, t10 = null) {
          super(e10, "AuthImplicitGrantRedirectError", 500, void 0), this.details = null, this.details = t10;
        }
        toJSON() {
          return { name: this.name, message: this.message, status: this.status, details: this.details };
        }
      }
      class nr extends r8 {
        constructor(e10, t10) {
          super(e10, "AuthRetryableFetchError", t10, void 0);
        }
      }
      function nn(e10) {
        return r4(e10) && "AuthRetryableFetchError" === e10.name;
      }
      class ns extends r8 {
        constructor(e10, t10, r10) {
          super(e10, "AuthWeakPasswordError", t10, "weak_password"), this.reasons = r10;
        }
      }
      class ni extends r8 {
        constructor(e10) {
          super(e10, "AuthInvalidJwtError", 400, "invalid_jwt");
        }
      }
      let na = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_".split(""), no = " 	\n\r=".split(""), nl = (() => {
        let e10 = Array(128);
        for (let t10 = 0; t10 < e10.length; t10 += 1) e10[t10] = -1;
        for (let t10 = 0; t10 < no.length; t10 += 1) e10[no[t10].charCodeAt(0)] = -2;
        for (let t10 = 0; t10 < na.length; t10 += 1) e10[na[t10].charCodeAt(0)] = t10;
        return e10;
      })();
      function nu(e10, t10, r10) {
        if (null !== e10) for (t10.queue = t10.queue << 8 | e10, t10.queuedBits += 8; t10.queuedBits >= 6; ) r10(na[t10.queue >> t10.queuedBits - 6 & 63]), t10.queuedBits -= 6;
        else if (t10.queuedBits > 0) for (t10.queue = t10.queue << 6 - t10.queuedBits, t10.queuedBits = 6; t10.queuedBits >= 6; ) r10(na[t10.queue >> t10.queuedBits - 6 & 63]), t10.queuedBits -= 6;
      }
      function nc(e10, t10, r10) {
        let n10 = nl[e10];
        if (n10 > -1) for (t10.queue = t10.queue << 6 | n10, t10.queuedBits += 6; t10.queuedBits >= 8; ) r10(t10.queue >> t10.queuedBits - 8 & 255), t10.queuedBits -= 8;
        else if (-2 === n10) return;
        else throw Error(`Invalid Base64-URL character "${String.fromCharCode(e10)}"`);
      }
      function nh(e10) {
        let t10 = [], r10 = (e11) => {
          t10.push(String.fromCodePoint(e11));
        }, n10 = { utf8seq: 0, codepoint: 0 }, s2 = { queue: 0, queuedBits: 0 }, i2 = (e11) => {
          !function(e12, t11, r11) {
            if (0 === t11.utf8seq) {
              if (e12 <= 127) return r11(e12);
              for (let r12 = 1; r12 < 6; r12 += 1) if ((e12 >> 7 - r12 & 1) == 0) {
                t11.utf8seq = r12;
                break;
              }
              if (2 === t11.utf8seq) t11.codepoint = 31 & e12;
              else if (3 === t11.utf8seq) t11.codepoint = 15 & e12;
              else if (4 === t11.utf8seq) t11.codepoint = 7 & e12;
              else throw Error("Invalid UTF-8 sequence");
              t11.utf8seq -= 1;
            } else if (t11.utf8seq > 0) {
              if (e12 <= 127) throw Error("Invalid UTF-8 sequence");
              t11.codepoint = t11.codepoint << 6 | 63 & e12, t11.utf8seq -= 1, 0 === t11.utf8seq && r11(t11.codepoint);
            }
          }(e11, n10, r10);
        };
        for (let t11 = 0; t11 < e10.length; t11 += 1) nc(e10.charCodeAt(t11), s2, i2);
        return t10.join("");
      }
      function nd(e10) {
        let t10 = [], r10 = { queue: 0, queuedBits: 0 }, n10 = (e11) => {
          t10.push(e11);
        };
        for (let t11 = 0; t11 < e10.length; t11 += 1) nc(e10.charCodeAt(t11), r10, n10);
        return new Uint8Array(t10);
      }
      function nf(e10) {
        let t10 = [], r10 = { queue: 0, queuedBits: 0 }, n10 = (e11) => {
          t10.push(e11);
        };
        return e10.forEach((e11) => nu(e11, r10, n10)), nu(null, r10, n10), t10.join("");
      }
      let np = (e10) => e10 ? (...t10) => e10(...t10) : (...e11) => fetch(...e11), ng = async (e10, t10, r10) => {
        await e10.setItem(t10, JSON.stringify(r10));
      }, nm = async (e10, t10) => {
        let r10 = await e10.getItem(t10);
        if (!r10) return null;
        try {
          return JSON.parse(r10);
        } catch (e11) {
          return r10;
        }
      }, ny = async (e10, t10) => {
        await e10.removeItem(t10);
      };
      class nw {
        constructor() {
          this.promise = new nw.promiseConstructor((e10, t10) => {
            this.resolve = e10, this.reject = t10;
          });
        }
      }
      function nb(e10) {
        let t10 = e10.split(".");
        if (3 !== t10.length) throw new ni("Invalid JWT structure");
        for (let e11 = 0; e11 < t10.length; e11++) if (!r2.test(t10[e11])) throw new ni("JWT not in base64url format");
        return { header: JSON.parse(nh(t10[0])), payload: JSON.parse(nh(t10[1])), signature: nd(t10[2]), raw: { header: t10[0], payload: t10[1] } };
      }
      async function nv(e10) {
        return await new Promise((t10) => {
          setTimeout(() => t10(null), e10);
        });
      }
      function n_(e10) {
        return ("0" + e10.toString(16)).substr(-2);
      }
      async function nS(e10) {
        let t10 = new TextEncoder().encode(e10);
        return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", t10))).map((e11) => String.fromCharCode(e11)).join("");
      }
      async function nE(e10) {
        return "undefined" == typeof crypto || void 0 === crypto.subtle || "undefined" == typeof TextEncoder ? (console.warn("WebCrypto API is not supported. Code challenge method will default to use plain instead of sha256."), e10) : btoa(await nS(e10)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      }
      async function nk(e10, t10, r10 = false) {
        let n10 = function() {
          let e11 = new Uint32Array(56);
          if ("undefined" == typeof crypto) {
            let e12 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~", t11 = e12.length, r11 = "";
            for (let n11 = 0; n11 < 56; n11++) r11 += e12.charAt(Math.floor(Math.random() * t11));
            return r11;
          }
          return crypto.getRandomValues(e11), Array.from(e11, n_).join("");
        }(), s2 = n10;
        r10 && (s2 += "/PASSWORD_RECOVERY"), await ng(e10, `${t10}-code-verifier`, s2);
        let i2 = await nE(n10), a2 = n10 === i2 ? "plain" : "s256";
        return [i2, a2];
      }
      nw.promiseConstructor = Promise;
      let nO = /^2[0-9]{3}-(0[1-9]|1[0-2])-(0[1-9]|1[0-9]|2[0-9]|3[0-1])$/i, nT = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
      function nR(e10) {
        if (!nT.test(e10)) throw Error("@supabase/auth-js: Expected parameter to be UUID but is not");
      }
      function nx() {
        return new Proxy({}, { get: (e10, t10) => {
          if ("__isUserNotAvailableProxy" === t10) return true;
          if ("symbol" == typeof t10) {
            let e11 = t10.toString();
            if ("Symbol(Symbol.toPrimitive)" === e11 || "Symbol(Symbol.toStringTag)" === e11 || "Symbol(util.inspect.custom)" === e11) return;
          }
          throw Error(`@supabase/auth-js: client was created with userStorage option and there was no user stored in the user storage. Accessing the "${t10}" property of the session object is not supported. Please use getUser() instead.`);
        }, set: (e10, t10) => {
          throw Error(`@supabase/auth-js: client was created with userStorage option and there was no user stored in the user storage. Setting the "${t10}" property of the session object is not supported. Please use getUser() to fetch a user object you can manipulate.`);
        }, deleteProperty: (e10, t10) => {
          throw Error(`@supabase/auth-js: client was created with userStorage option and there was no user stored in the user storage. Deleting the "${t10}" property of the session object is not supported. Please use getUser() to fetch a user object you can manipulate.`);
        } });
      }
      function nC(e10) {
        return JSON.parse(JSON.stringify(e10));
      }
      let nj = (e10) => e10.msg || e10.message || e10.error_description || e10.error || JSON.stringify(e10), nP = [502, 503, 504];
      async function nA(e10) {
        var t10;
        let r10, n10;
        if (!("object" == typeof e10 && null !== e10 && "status" in e10 && "ok" in e10 && "json" in e10 && "function" == typeof e10.json)) throw new nr(nj(e10), 0);
        if (nP.includes(e10.status)) throw new nr(nj(e10), e10.status);
        try {
          r10 = await e10.json();
        } catch (e11) {
          throw new r6(nj(e11), e11);
        }
        let s2 = function(e11) {
          let t11 = e11.headers.get(r0);
          if (!t11 || !t11.match(nO)) return null;
          try {
            return /* @__PURE__ */ new Date(`${t11}T00:00:00.0Z`);
          } catch (e12) {
            return null;
          }
        }(e10);
        if (s2 && s2.getTime() >= r1["2024-01-01"].timestamp && "object" == typeof r10 && r10 && "string" == typeof r10.code ? n10 = r10.code : "object" == typeof r10 && r10 && "string" == typeof r10.error_code && (n10 = r10.error_code), n10) {
          if ("weak_password" === n10) throw new ns(nj(r10), e10.status, (null == (t10 = r10.weak_password) ? void 0 : t10.reasons) || []);
          else if ("session_not_found" === n10) throw new r9();
        } else if ("object" == typeof r10 && r10 && "object" == typeof r10.weak_password && r10.weak_password && Array.isArray(r10.weak_password.reasons) && r10.weak_password.reasons.length && r10.weak_password.reasons.reduce((e11, t11) => e11 && "string" == typeof t11, true)) throw new ns(nj(r10), e10.status, r10.weak_password.reasons);
        throw new r5(nj(r10), e10.status || 500, n10);
      }
      async function nI(e10, t10, r10, n10) {
        var s2;
        let i2 = Object.assign({}, null == n10 ? void 0 : n10.headers);
        i2[r0] || (i2[r0] = r1["2024-01-01"].name), (null == n10 ? void 0 : n10.jwt) && (i2.Authorization = `Bearer ${n10.jwt}`);
        let a2 = null != (s2 = null == n10 ? void 0 : n10.query) ? s2 : {};
        (null == n10 ? void 0 : n10.redirectTo) && (a2.redirect_to = n10.redirectTo);
        let o2 = Object.keys(a2).length ? "?" + new URLSearchParams(a2).toString() : "", l2 = await n$(e10, t10, r10 + o2, { headers: i2, noResolveJson: null == n10 ? void 0 : n10.noResolveJson }, {}, null == n10 ? void 0 : n10.body);
        return (null == n10 ? void 0 : n10.xform) ? null == n10 ? void 0 : n10.xform(l2) : { data: Object.assign({}, l2), error: null };
      }
      async function n$(e10, t10, r10, n10, s2, i2) {
        let a2, o2, l2 = (o2 = { method: t10, headers: (null == n10 ? void 0 : n10.headers) || {} }, "GET" === t10 ? o2 : (o2.headers = Object.assign({ "Content-Type": "application/json;charset=UTF-8" }, null == n10 ? void 0 : n10.headers), o2.body = JSON.stringify(i2), Object.assign(Object.assign({}, o2), s2)));
        try {
          a2 = await e10(r10, Object.assign({}, l2));
        } catch (e11) {
          throw console.error(e11), new nr(nj(e11), 0);
        }
        if (a2.ok || await nA(a2), null == n10 ? void 0 : n10.noResolveJson) return a2;
        try {
          return await a2.json();
        } catch (e11) {
          await nA(e11);
        }
      }
      function nN(e10) {
        var t10, r10, n10;
        let s2 = null;
        (n10 = e10).access_token && n10.refresh_token && n10.expires_in && (s2 = Object.assign({}, e10), e10.expires_at || (s2.expires_at = (r10 = e10.expires_in, Math.round(Date.now() / 1e3) + r10)));
        return { data: { session: s2, user: null != (t10 = e10.user) ? t10 : e10 }, error: null };
      }
      function nU(e10) {
        let t10 = nN(e10);
        return !t10.error && e10.weak_password && "object" == typeof e10.weak_password && Array.isArray(e10.weak_password.reasons) && e10.weak_password.reasons.length && e10.weak_password.message && "string" == typeof e10.weak_password.message && e10.weak_password.reasons.reduce((e11, t11) => e11 && "string" == typeof t11, true) && (t10.data.weak_password = e10.weak_password), t10;
      }
      function nD(e10) {
        var t10;
        return { data: { user: null != (t10 = e10.user) ? t10 : e10 }, error: null };
      }
      function nL(e10) {
        return { data: e10, error: null };
      }
      function nq(e10) {
        let { action_link: t10, email_otp: r10, hashed_token: n10, redirect_to: s2, verification_type: i2 } = e10;
        return { data: { properties: { action_link: t10, email_otp: r10, hashed_token: n10, redirect_to: s2, verification_type: i2 }, user: Object.assign({}, (0, t$.__rest)(e10, ["action_link", "email_otp", "hashed_token", "redirect_to", "verification_type"])) }, error: null };
      }
      function nB(e10) {
        return e10;
      }
      let nM = ["global", "local", "others"];
      class nW {
        constructor({ url: e10 = "", headers: t10 = {}, fetch: r10 }) {
          this.url = e10, this.headers = t10, this.fetch = np(r10), this.mfa = { listFactors: this._listFactors.bind(this), deleteFactor: this._deleteFactor.bind(this) }, this.oauth = { listClients: this._listOAuthClients.bind(this), createClient: this._createOAuthClient.bind(this), getClient: this._getOAuthClient.bind(this), updateClient: this._updateOAuthClient.bind(this), deleteClient: this._deleteOAuthClient.bind(this), regenerateClientSecret: this._regenerateOAuthClientSecret.bind(this) };
        }
        async signOut(e10, t10 = nM[0]) {
          if (0 > nM.indexOf(t10)) throw Error(`@supabase/auth-js: Parameter scope must be one of ${nM.join(", ")}`);
          try {
            return await nI(this.fetch, "POST", `${this.url}/logout?scope=${t10}`, { headers: this.headers, jwt: e10, noResolveJson: true }), { data: null, error: null };
          } catch (e11) {
            if (r4(e11)) return { data: null, error: e11 };
            throw e11;
          }
        }
        async inviteUserByEmail(e10, t10 = {}) {
          try {
            return await nI(this.fetch, "POST", `${this.url}/invite`, { body: { email: e10, data: t10.data }, headers: this.headers, redirectTo: t10.redirectTo, xform: nD });
          } catch (e11) {
            if (r4(e11)) return { data: { user: null }, error: e11 };
            throw e11;
          }
        }
        async generateLink(e10) {
          try {
            let { options: t10 } = e10, r10 = (0, t$.__rest)(e10, ["options"]), n10 = Object.assign(Object.assign({}, r10), t10);
            return "newEmail" in r10 && (n10.new_email = null == r10 ? void 0 : r10.newEmail, delete n10.newEmail), await nI(this.fetch, "POST", `${this.url}/admin/generate_link`, { body: n10, headers: this.headers, xform: nq, redirectTo: null == t10 ? void 0 : t10.redirectTo });
          } catch (e11) {
            if (r4(e11)) return { data: { properties: null, user: null }, error: e11 };
            throw e11;
          }
        }
        async createUser(e10) {
          try {
            return await nI(this.fetch, "POST", `${this.url}/admin/users`, { body: e10, headers: this.headers, xform: nD });
          } catch (e11) {
            if (r4(e11)) return { data: { user: null }, error: e11 };
            throw e11;
          }
        }
        async listUsers(e10) {
          var t10, r10, n10, s2, i2, a2, o2;
          try {
            let l2 = { nextPage: null, lastPage: 0, total: 0 }, u2 = await nI(this.fetch, "GET", `${this.url}/admin/users`, { headers: this.headers, noResolveJson: true, query: { page: null != (r10 = null == (t10 = null == e10 ? void 0 : e10.page) ? void 0 : t10.toString()) ? r10 : "", per_page: null != (s2 = null == (n10 = null == e10 ? void 0 : e10.perPage) ? void 0 : n10.toString()) ? s2 : "" }, xform: nB });
            if (u2.error) throw u2.error;
            let c2 = await u2.json(), h2 = null != (i2 = u2.headers.get("x-total-count")) ? i2 : 0, d2 = null != (o2 = null == (a2 = u2.headers.get("link")) ? void 0 : a2.split(",")) ? o2 : [];
            return d2.length > 0 && (d2.forEach((e11) => {
              let t11 = parseInt(e11.split(";")[0].split("=")[1].substring(0, 1)), r11 = JSON.parse(e11.split(";")[1].split("=")[1]);
              l2[`${r11}Page`] = t11;
            }), l2.total = parseInt(h2)), { data: Object.assign(Object.assign({}, c2), l2), error: null };
          } catch (e11) {
            if (r4(e11)) return { data: { users: [] }, error: e11 };
            throw e11;
          }
        }
        async getUserById(e10) {
          nR(e10);
          try {
            return await nI(this.fetch, "GET", `${this.url}/admin/users/${e10}`, { headers: this.headers, xform: nD });
          } catch (e11) {
            if (r4(e11)) return { data: { user: null }, error: e11 };
            throw e11;
          }
        }
        async updateUserById(e10, t10) {
          nR(e10);
          try {
            return await nI(this.fetch, "PUT", `${this.url}/admin/users/${e10}`, { body: t10, headers: this.headers, xform: nD });
          } catch (e11) {
            if (r4(e11)) return { data: { user: null }, error: e11 };
            throw e11;
          }
        }
        async deleteUser(e10, t10 = false) {
          nR(e10);
          try {
            return await nI(this.fetch, "DELETE", `${this.url}/admin/users/${e10}`, { headers: this.headers, body: { should_soft_delete: t10 }, xform: nD });
          } catch (e11) {
            if (r4(e11)) return { data: { user: null }, error: e11 };
            throw e11;
          }
        }
        async _listFactors(e10) {
          nR(e10.userId);
          try {
            let { data: t10, error: r10 } = await nI(this.fetch, "GET", `${this.url}/admin/users/${e10.userId}/factors`, { headers: this.headers, xform: (e11) => ({ data: { factors: e11 }, error: null }) });
            return { data: t10, error: r10 };
          } catch (e11) {
            if (r4(e11)) return { data: null, error: e11 };
            throw e11;
          }
        }
        async _deleteFactor(e10) {
          nR(e10.userId), nR(e10.id);
          try {
            return { data: await nI(this.fetch, "DELETE", `${this.url}/admin/users/${e10.userId}/factors/${e10.id}`, { headers: this.headers }), error: null };
          } catch (e11) {
            if (r4(e11)) return { data: null, error: e11 };
            throw e11;
          }
        }
        async _listOAuthClients(e10) {
          var t10, r10, n10, s2, i2, a2, o2;
          try {
            let l2 = { nextPage: null, lastPage: 0, total: 0 }, u2 = await nI(this.fetch, "GET", `${this.url}/admin/oauth/clients`, { headers: this.headers, noResolveJson: true, query: { page: null != (r10 = null == (t10 = null == e10 ? void 0 : e10.page) ? void 0 : t10.toString()) ? r10 : "", per_page: null != (s2 = null == (n10 = null == e10 ? void 0 : e10.perPage) ? void 0 : n10.toString()) ? s2 : "" }, xform: nB });
            if (u2.error) throw u2.error;
            let c2 = await u2.json(), h2 = null != (i2 = u2.headers.get("x-total-count")) ? i2 : 0, d2 = null != (o2 = null == (a2 = u2.headers.get("link")) ? void 0 : a2.split(",")) ? o2 : [];
            return d2.length > 0 && (d2.forEach((e11) => {
              let t11 = parseInt(e11.split(";")[0].split("=")[1].substring(0, 1)), r11 = JSON.parse(e11.split(";")[1].split("=")[1]);
              l2[`${r11}Page`] = t11;
            }), l2.total = parseInt(h2)), { data: Object.assign(Object.assign({}, c2), l2), error: null };
          } catch (e11) {
            if (r4(e11)) return { data: { clients: [] }, error: e11 };
            throw e11;
          }
        }
        async _createOAuthClient(e10) {
          try {
            return await nI(this.fetch, "POST", `${this.url}/admin/oauth/clients`, { body: e10, headers: this.headers, xform: (e11) => ({ data: e11, error: null }) });
          } catch (e11) {
            if (r4(e11)) return { data: null, error: e11 };
            throw e11;
          }
        }
        async _getOAuthClient(e10) {
          try {
            return await nI(this.fetch, "GET", `${this.url}/admin/oauth/clients/${e10}`, { headers: this.headers, xform: (e11) => ({ data: e11, error: null }) });
          } catch (e11) {
            if (r4(e11)) return { data: null, error: e11 };
            throw e11;
          }
        }
        async _updateOAuthClient(e10, t10) {
          try {
            return await nI(this.fetch, "PUT", `${this.url}/admin/oauth/clients/${e10}`, { body: t10, headers: this.headers, xform: (e11) => ({ data: e11, error: null }) });
          } catch (e11) {
            if (r4(e11)) return { data: null, error: e11 };
            throw e11;
          }
        }
        async _deleteOAuthClient(e10) {
          try {
            return await nI(this.fetch, "DELETE", `${this.url}/admin/oauth/clients/${e10}`, { headers: this.headers, noResolveJson: true }), { data: null, error: null };
          } catch (e11) {
            if (r4(e11)) return { data: null, error: e11 };
            throw e11;
          }
        }
        async _regenerateOAuthClientSecret(e10) {
          try {
            return await nI(this.fetch, "POST", `${this.url}/admin/oauth/clients/${e10}/regenerate_secret`, { headers: this.headers, xform: (e11) => ({ data: e11, error: null }) });
          } catch (e11) {
            if (r4(e11)) return { data: null, error: e11 };
            throw e11;
          }
        }
      }
      function nH(e10 = {}) {
        return { getItem: (t10) => e10[t10] || null, setItem: (t10, r10) => {
          e10[t10] = r10;
        }, removeItem: (t10) => {
          delete e10[t10];
        } };
      }
      globalThis;
      class nV extends Error {
        constructor(e10) {
          super(e10), this.isAcquireTimeout = true;
        }
      }
      function nz(e10) {
        if (!/^0x[a-fA-F0-9]{40}$/.test(e10)) throw Error(`@supabase/auth-js: Address "${e10}" is invalid.`);
        return e10.toLowerCase();
      }
      class nF extends Error {
        constructor({ message: e10, code: t10, cause: r10, name: n10 }) {
          var s2;
          super(e10, { cause: r10 }), this.__isWebAuthnError = true, this.name = null != (s2 = null != n10 ? n10 : r10 instanceof Error ? r10.name : void 0) ? s2 : "Unknown Error", this.code = t10;
        }
      }
      class nK extends nF {
        constructor(e10, t10) {
          super({ code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY", cause: t10, message: e10 }), this.name = "WebAuthnUnknownError", this.originalError = t10;
        }
      }
      let nG = new class {
        createNewAbortSignal() {
          if (this.controller) {
            let e11 = Error("Cancelling existing WebAuthn API call for new one");
            e11.name = "AbortError", this.controller.abort(e11);
          }
          let e10 = new AbortController();
          return this.controller = e10, e10.signal;
        }
        cancelCeremony() {
          if (this.controller) {
            let e10 = Error("Manually cancelling existing WebAuthn API call");
            e10.name = "AbortError", this.controller.abort(e10), this.controller = void 0;
          }
        }
      }();
      function nJ(e10) {
        return "localhost" === e10 || /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i.test(e10);
      }
      async function nX(e10) {
        try {
          let t10 = await navigator.credentials.create(e10);
          if (!t10) return { data: null, error: new nK("Empty credential response", t10) };
          if (!(t10 instanceof PublicKeyCredential)) return { data: null, error: new nK("Browser returned unexpected credential type", t10) };
          return { data: t10, error: null };
        } catch (t10) {
          return { data: null, error: function({ error: e11, options: t11 }) {
            var r10, n10, s2;
            let { publicKey: i2 } = t11;
            if (!i2) throw Error("options was missing required publicKey property");
            if ("AbortError" === e11.name) {
              if (t11.signal instanceof AbortSignal) return new nF({ message: "Registration ceremony was sent an abort signal", code: "ERROR_CEREMONY_ABORTED", cause: e11 });
            } else if ("ConstraintError" === e11.name) {
              if ((null == (r10 = i2.authenticatorSelection) ? void 0 : r10.requireResidentKey) === true) return new nF({ message: "Discoverable credentials were required but no available authenticator supported it", code: "ERROR_AUTHENTICATOR_MISSING_DISCOVERABLE_CREDENTIAL_SUPPORT", cause: e11 });
              else if ("conditional" === t11.mediation && (null == (n10 = i2.authenticatorSelection) ? void 0 : n10.userVerification) === "required") return new nF({ message: "User verification was required during automatic registration but it could not be performed", code: "ERROR_AUTO_REGISTER_USER_VERIFICATION_FAILURE", cause: e11 });
              else if ((null == (s2 = i2.authenticatorSelection) ? void 0 : s2.userVerification) === "required") return new nF({ message: "User verification was required but no available authenticator supported it", code: "ERROR_AUTHENTICATOR_MISSING_USER_VERIFICATION_SUPPORT", cause: e11 });
            } else if ("InvalidStateError" === e11.name) return new nF({ message: "The authenticator was previously registered", code: "ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED", cause: e11 });
            else if ("NotAllowedError" === e11.name) return new nF({ message: e11.message, code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY", cause: e11 });
            else if ("NotSupportedError" === e11.name) return new nF(0 === i2.pubKeyCredParams.filter((e12) => "public-key" === e12.type).length ? { message: 'No entry in pubKeyCredParams was of type "public-key"', code: "ERROR_MALFORMED_PUBKEYCREDPARAMS", cause: e11 } : { message: "No available authenticator supported any of the specified pubKeyCredParams algorithms", code: "ERROR_AUTHENTICATOR_NO_SUPPORTED_PUBKEYCREDPARAMS_ALG", cause: e11 });
            else if ("SecurityError" === e11.name) {
              let t12 = window.location.hostname;
              if (!nJ(t12)) return new nF({ message: `${window.location.hostname} is an invalid domain`, code: "ERROR_INVALID_DOMAIN", cause: e11 });
              if (i2.rp.id !== t12) return new nF({ message: `The RP ID "${i2.rp.id}" is invalid for this domain`, code: "ERROR_INVALID_RP_ID", cause: e11 });
            } else if ("TypeError" === e11.name) {
              if (i2.user.id.byteLength < 1 || i2.user.id.byteLength > 64) return new nF({ message: "User ID was not between 1 and 64 characters", code: "ERROR_INVALID_USER_ID_LENGTH", cause: e11 });
            } else if ("UnknownError" === e11.name) return new nF({ message: "The authenticator was unable to process the specified options, or could not create a new credential", code: "ERROR_AUTHENTICATOR_GENERAL_ERROR", cause: e11 });
            return new nF({ message: "a Non-Webauthn related error has occurred", code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY", cause: e11 });
          }({ error: t10, options: e10 }) };
        }
      }
      async function nY(e10) {
        try {
          let t10 = await navigator.credentials.get(e10);
          if (!t10) return { data: null, error: new nK("Empty credential response", t10) };
          if (!(t10 instanceof PublicKeyCredential)) return { data: null, error: new nK("Browser returned unexpected credential type", t10) };
          return { data: t10, error: null };
        } catch (t10) {
          return { data: null, error: function({ error: e11, options: t11 }) {
            let { publicKey: r10 } = t11;
            if (!r10) throw Error("options was missing required publicKey property");
            if ("AbortError" === e11.name) {
              if (t11.signal instanceof AbortSignal) return new nF({ message: "Authentication ceremony was sent an abort signal", code: "ERROR_CEREMONY_ABORTED", cause: e11 });
            } else if ("NotAllowedError" === e11.name) return new nF({ message: e11.message, code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY", cause: e11 });
            else if ("SecurityError" === e11.name) {
              let t12 = window.location.hostname;
              if (!nJ(t12)) return new nF({ message: `${window.location.hostname} is an invalid domain`, code: "ERROR_INVALID_DOMAIN", cause: e11 });
              if (r10.rpId !== t12) return new nF({ message: `The RP ID "${r10.rpId}" is invalid for this domain`, code: "ERROR_INVALID_RP_ID", cause: e11 });
            } else if ("UnknownError" === e11.name) return new nF({ message: "The authenticator was unable to process the specified options, or could not create a new assertion signature", code: "ERROR_AUTHENTICATOR_GENERAL_ERROR", cause: e11 });
            return new nF({ message: "a Non-Webauthn related error has occurred", code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY", cause: e11 });
          }({ error: t10, options: e10 }) };
        }
      }
      let nQ = { hints: ["security-key"], authenticatorSelection: { authenticatorAttachment: "cross-platform", requireResidentKey: false, userVerification: "preferred", residentKey: "discouraged" }, attestation: "direct" }, nZ = { userVerification: "preferred", hints: ["security-key"], attestation: "direct" };
      function n0(...e10) {
        let t10 = (e11) => null !== e11 && "object" == typeof e11 && !Array.isArray(e11), r10 = (e11) => e11 instanceof ArrayBuffer || ArrayBuffer.isView(e11), n10 = {};
        for (let s2 of e10) if (s2) for (let e11 in s2) {
          let i2 = s2[e11];
          if (void 0 !== i2) if (Array.isArray(i2)) n10[e11] = i2;
          else if (r10(i2)) n10[e11] = i2;
          else if (t10(i2)) {
            let r11 = n10[e11];
            t10(r11) ? n10[e11] = n0(r11, i2) : n10[e11] = n0(i2);
          } else n10[e11] = i2;
        }
        return n10;
      }
      class n1 {
        constructor(e10) {
          this.client = e10, this.enroll = this._enroll.bind(this), this.challenge = this._challenge.bind(this), this.verify = this._verify.bind(this), this.authenticate = this._authenticate.bind(this), this.register = this._register.bind(this);
        }
        async _enroll(e10) {
          return this.client.mfa.enroll(Object.assign(Object.assign({}, e10), { factorType: "webauthn" }));
        }
        async _challenge({ factorId: e10, webauthn: t10, friendlyName: r10, signal: n10 }, s2) {
          try {
            var i2, a2, o2, l2;
            let { data: u2, error: c2 } = await this.client.mfa.challenge({ factorId: e10, webauthn: t10 });
            if (!u2) return { data: null, error: c2 };
            let h2 = null != n10 ? n10 : nG.createNewAbortSignal();
            if ("create" === u2.webauthn.type) {
              let { user: e11 } = u2.webauthn.credential_options.publicKey;
              e11.name || (e11.name = `${e11.id}:${r10}`), e11.displayName || (e11.displayName = e11.name);
            }
            switch (u2.webauthn.type) {
              case "create": {
                let t11 = (i2 = u2.webauthn.credential_options.publicKey, a2 = null == s2 ? void 0 : s2.create, n0(nQ, i2, a2 || {})), { data: r11, error: n11 } = await nX({ publicKey: t11, signal: h2 });
                if (r11) return { data: { factorId: e10, challengeId: u2.id, webauthn: { type: u2.webauthn.type, credential_response: r11 } }, error: null };
                return { data: null, error: n11 };
              }
              case "request": {
                let t11 = (o2 = u2.webauthn.credential_options.publicKey, l2 = null == s2 ? void 0 : s2.request, n0(nZ, o2, l2 || {})), { data: r11, error: n11 } = await nY(Object.assign(Object.assign({}, u2.webauthn.credential_options), { publicKey: t11, signal: h2 }));
                if (r11) return { data: { factorId: e10, challengeId: u2.id, webauthn: { type: u2.webauthn.type, credential_response: r11 } }, error: null };
                return { data: null, error: n11 };
              }
            }
          } catch (e11) {
            if (r4(e11)) return { data: null, error: e11 };
            return { data: null, error: new r6("Unexpected error in challenge", e11) };
          }
        }
        async _verify({ challengeId: e10, factorId: t10, webauthn: r10 }) {
          return this.client.mfa.verify({ factorId: t10, challengeId: e10, webauthn: r10 });
        }
        async _authenticate({ factorId: e10, webauthn: { rpId: t10, rpOrigins: r10, signal: n10 } = {} }, s2) {
          if (!t10) return { data: null, error: new r3("rpId is required for WebAuthn authentication") };
          try {
            1;
            return { data: null, error: new r6("Browser does not support WebAuthn", null) };
          } catch (e11) {
            if (r4(e11)) return { data: null, error: e11 };
            return { data: null, error: new r6("Unexpected error in authenticate", e11) };
          }
        }
        async _register({ friendlyName: e10, webauthn: { rpId: t10, rpOrigins: r10, signal: n10 } = {} }, s2) {
          if (!t10) return { data: null, error: new r3("rpId is required for WebAuthn registration") };
          try {
            1;
            return { data: null, error: new r6("Browser does not support WebAuthn", null) };
          } catch (e11) {
            if (r4(e11)) return { data: null, error: e11 };
            return { data: null, error: new r6("Unexpected error in register", e11) };
          }
        }
      }
      if ("object" != typeof globalThis) try {
        Object.defineProperty(Object.prototype, "__magic__", { get: function() {
          return this;
        }, configurable: true }), __magic__.globalThis = __magic__, delete Object.prototype.__magic__;
      } catch (e10) {
        "undefined" != typeof self && (self.globalThis = self);
      }
      let n2 = { url: "http://localhost:9999", storageKey: "supabase.auth.token", autoRefreshToken: true, persistSession: true, detectSessionInUrl: true, headers: rZ, flowType: "implicit", debug: false, hasCustomAuthorizationHeader: false, throwOnError: false };
      async function n3(e10, t10, r10) {
        return await r10();
      }
      let n4 = {};
      class n5 {
        get jwks() {
          var e10, t10;
          return null != (t10 = null == (e10 = n4[this.storageKey]) ? void 0 : e10.jwks) ? t10 : { keys: [] };
        }
        set jwks(e10) {
          n4[this.storageKey] = Object.assign(Object.assign({}, n4[this.storageKey]), { jwks: e10 });
        }
        get jwks_cached_at() {
          var e10, t10;
          return null != (t10 = null == (e10 = n4[this.storageKey]) ? void 0 : e10.cachedAt) ? t10 : Number.MIN_SAFE_INTEGER;
        }
        set jwks_cached_at(e10) {
          n4[this.storageKey] = Object.assign(Object.assign({}, n4[this.storageKey]), { cachedAt: e10 });
        }
        constructor(e10) {
          var t10;
          this.userStorage = null, this.memoryStorage = null, this.stateChangeEmitters = /* @__PURE__ */ new Map(), this.autoRefreshTicker = null, this.visibilityChangedCallback = null, this.refreshingDeferred = null, this.initializePromise = null, this.detectSessionInUrl = true, this.hasCustomAuthorizationHeader = false, this.suppressGetSessionWarning = false, this.lockAcquired = false, this.pendingInLock = [], this.broadcastChannel = null, this.logger = console.log;
          const r10 = Object.assign(Object.assign({}, n2), e10);
          this.storageKey = r10.storageKey, this.instanceID = null != (t10 = n5.nextInstanceID[this.storageKey]) ? t10 : 0, n5.nextInstanceID[this.storageKey] = this.instanceID + 1, this.logDebugMessages = !!r10.debug, "function" == typeof r10.debug && (this.logger = r10.debug), this.instanceID, this.persistSession = r10.persistSession, this.autoRefreshToken = r10.autoRefreshToken, this.admin = new nW({ url: r10.url, headers: r10.headers, fetch: r10.fetch }), this.url = r10.url, this.headers = r10.headers, this.fetch = np(r10.fetch), this.lock = r10.lock || n3, this.detectSessionInUrl = r10.detectSessionInUrl, this.flowType = r10.flowType, this.hasCustomAuthorizationHeader = r10.hasCustomAuthorizationHeader, this.throwOnError = r10.throwOnError, r10.lock ? this.lock = r10.lock : this.lock = n3, this.jwks || (this.jwks = { keys: [] }, this.jwks_cached_at = Number.MIN_SAFE_INTEGER), this.mfa = { verify: this._verify.bind(this), enroll: this._enroll.bind(this), unenroll: this._unenroll.bind(this), challenge: this._challenge.bind(this), listFactors: this._listFactors.bind(this), challengeAndVerify: this._challengeAndVerify.bind(this), getAuthenticatorAssuranceLevel: this._getAuthenticatorAssuranceLevel.bind(this), webauthn: new n1(this) }, this.oauth = { getAuthorizationDetails: this._getAuthorizationDetails.bind(this), approveAuthorization: this._approveAuthorization.bind(this), denyAuthorization: this._denyAuthorization.bind(this), listGrants: this._listOAuthGrants.bind(this), revokeGrant: this._revokeOAuthGrant.bind(this) }, this.persistSession ? (r10.storage ? this.storage = r10.storage : (this.memoryStorage = {}, this.storage = nH(this.memoryStorage)), r10.userStorage && (this.userStorage = r10.userStorage)) : (this.memoryStorage = {}, this.storage = nH(this.memoryStorage)), this.initialize();
        }
        isThrowOnErrorEnabled() {
          return this.throwOnError;
        }
        _returnResult(e10) {
          if (this.throwOnError && e10 && e10.error) throw e10.error;
          return e10;
        }
        _logPrefix() {
          return `GoTrueClient@${this.storageKey}:${this.instanceID} (${rQ}) ${(/* @__PURE__ */ new Date()).toISOString()}`;
        }
        _debug(...e10) {
          return this.logDebugMessages && this.logger(this._logPrefix(), ...e10), this;
        }
        async initialize() {
          return this.initializePromise || (this.initializePromise = (async () => await this._acquireLock(-1, async () => await this._initialize()))()), await this.initializePromise;
        }
        async _initialize() {
          try {
            return await this._recoverAndRefresh(), { error: null };
          } catch (e10) {
            if (r4(e10)) return this._returnResult({ error: e10 });
            return this._returnResult({ error: new r6("Unexpected error during initialization", e10) });
          } finally {
            await this._handleVisibilityChange(), this._debug("#_initialize()", "end");
          }
        }
        async signInAnonymously(e10) {
          var t10, r10, n10;
          try {
            let { data: s2, error: i2 } = await nI(this.fetch, "POST", `${this.url}/signup`, { headers: this.headers, body: { data: null != (r10 = null == (t10 = null == e10 ? void 0 : e10.options) ? void 0 : t10.data) ? r10 : {}, gotrue_meta_security: { captcha_token: null == (n10 = null == e10 ? void 0 : e10.options) ? void 0 : n10.captchaToken } }, xform: nN });
            if (i2 || !s2) return this._returnResult({ data: { user: null, session: null }, error: i2 });
            let a2 = s2.session, o2 = s2.user;
            return s2.session && (await this._saveSession(s2.session), await this._notifyAllSubscribers("SIGNED_IN", a2)), this._returnResult({ data: { user: o2, session: a2 }, error: null });
          } catch (e11) {
            if (r4(e11)) return this._returnResult({ data: { user: null, session: null }, error: e11 });
            throw e11;
          }
        }
        async signUp(e10) {
          var t10, r10, n10;
          try {
            let s2;
            if ("email" in e10) {
              let { email: r11, password: n11, options: i3 } = e10, a3 = null, o3 = null;
              "pkce" === this.flowType && ([a3, o3] = await nk(this.storage, this.storageKey)), s2 = await nI(this.fetch, "POST", `${this.url}/signup`, { headers: this.headers, redirectTo: null == i3 ? void 0 : i3.emailRedirectTo, body: { email: r11, password: n11, data: null != (t10 = null == i3 ? void 0 : i3.data) ? t10 : {}, gotrue_meta_security: { captcha_token: null == i3 ? void 0 : i3.captchaToken }, code_challenge: a3, code_challenge_method: o3 }, xform: nN });
            } else if ("phone" in e10) {
              let { phone: t11, password: i3, options: a3 } = e10;
              s2 = await nI(this.fetch, "POST", `${this.url}/signup`, { headers: this.headers, body: { phone: t11, password: i3, data: null != (r10 = null == a3 ? void 0 : a3.data) ? r10 : {}, channel: null != (n10 = null == a3 ? void 0 : a3.channel) ? n10 : "sms", gotrue_meta_security: { captcha_token: null == a3 ? void 0 : a3.captchaToken } }, xform: nN });
            } else throw new ne("You must provide either an email or phone number and a password");
            let { data: i2, error: a2 } = s2;
            if (a2 || !i2) return this._returnResult({ data: { user: null, session: null }, error: a2 });
            let o2 = i2.session, l2 = i2.user;
            return i2.session && (await this._saveSession(i2.session), await this._notifyAllSubscribers("SIGNED_IN", o2)), this._returnResult({ data: { user: l2, session: o2 }, error: null });
          } catch (e11) {
            if (r4(e11)) return this._returnResult({ data: { user: null, session: null }, error: e11 });
            throw e11;
          }
        }
        async signInWithPassword(e10) {
          try {
            let t10;
            if ("email" in e10) {
              let { email: r11, password: n11, options: s2 } = e10;
              t10 = await nI(this.fetch, "POST", `${this.url}/token?grant_type=password`, { headers: this.headers, body: { email: r11, password: n11, gotrue_meta_security: { captcha_token: null == s2 ? void 0 : s2.captchaToken } }, xform: nU });
            } else if ("phone" in e10) {
              let { phone: r11, password: n11, options: s2 } = e10;
              t10 = await nI(this.fetch, "POST", `${this.url}/token?grant_type=password`, { headers: this.headers, body: { phone: r11, password: n11, gotrue_meta_security: { captcha_token: null == s2 ? void 0 : s2.captchaToken } }, xform: nU });
            } else throw new ne("You must provide either an email or phone number and a password");
            let { data: r10, error: n10 } = t10;
            if (n10) return this._returnResult({ data: { user: null, session: null }, error: n10 });
            if (!r10 || !r10.session || !r10.user) {
              let e11 = new r7();
              return this._returnResult({ data: { user: null, session: null }, error: e11 });
            }
            return r10.session && (await this._saveSession(r10.session), await this._notifyAllSubscribers("SIGNED_IN", r10.session)), this._returnResult({ data: Object.assign({ user: r10.user, session: r10.session }, r10.weak_password ? { weakPassword: r10.weak_password } : null), error: n10 });
          } catch (e11) {
            if (r4(e11)) return this._returnResult({ data: { user: null, session: null }, error: e11 });
            throw e11;
          }
        }
        async signInWithOAuth(e10) {
          var t10, r10, n10, s2;
          return await this._handleProviderSignIn(e10.provider, { redirectTo: null == (t10 = e10.options) ? void 0 : t10.redirectTo, scopes: null == (r10 = e10.options) ? void 0 : r10.scopes, queryParams: null == (n10 = e10.options) ? void 0 : n10.queryParams, skipBrowserRedirect: null == (s2 = e10.options) ? void 0 : s2.skipBrowserRedirect });
        }
        async exchangeCodeForSession(e10) {
          return await this.initializePromise, this._acquireLock(-1, async () => this._exchangeCodeForSession(e10));
        }
        async signInWithWeb3(e10) {
          let { chain: t10 } = e10;
          switch (t10) {
            case "ethereum":
              return await this.signInWithEthereum(e10);
            case "solana":
              return await this.signInWithSolana(e10);
            default:
              throw Error(`@supabase/auth-js: Unsupported chain "${t10}"`);
          }
        }
        async signInWithEthereum(e10) {
          var t10, r10, n10, s2, i2, a2, o2, l2, u2, c2, h2, d2;
          let f2, p2;
          if ("message" in e10) f2 = e10.message, p2 = e10.signature;
          else {
            let { chain: c3, wallet: h3, statement: g2, options: m2 } = e10;
            if ("object" != typeof h3 || !(null == m2 ? void 0 : m2.url)) throw Error("@supabase/auth-js: Both wallet and url must be specified in non-browser environments.");
            let y2 = new URL(null != (t10 = null == m2 ? void 0 : m2.url) ? t10 : window.location.href), w2 = await h3.request({ method: "eth_requestAccounts" }).then((e11) => e11).catch(() => {
              throw Error("@supabase/auth-js: Wallet method eth_requestAccounts is missing or invalid");
            });
            if (!w2 || 0 === w2.length) throw Error("@supabase/auth-js: No accounts available. Please ensure the wallet is connected.");
            let b2 = nz(w2[0]), v2 = null == (r10 = null == m2 ? void 0 : m2.signInWithEthereum) ? void 0 : r10.chainId;
            v2 || (v2 = parseInt(await h3.request({ method: "eth_chainId" }), 16)), f2 = function(e11) {
              var t11;
              let { chainId: r11, domain: n11, expirationTime: s3, issuedAt: i3 = /* @__PURE__ */ new Date(), nonce: a3, notBefore: o3, requestId: l3, resources: u3, scheme: c4, uri: h4, version: d3 } = e11;
              if (!Number.isInteger(r11)) throw Error(`@supabase/auth-js: Invalid SIWE message field "chainId". Chain ID must be a EIP-155 chain ID. Provided value: ${r11}`);
              if (!n11) throw Error('@supabase/auth-js: Invalid SIWE message field "domain". Domain must be provided.');
              if (a3 && a3.length < 8) throw Error(`@supabase/auth-js: Invalid SIWE message field "nonce". Nonce must be at least 8 characters. Provided value: ${a3}`);
              if (!h4) throw Error('@supabase/auth-js: Invalid SIWE message field "uri". URI must be provided.');
              if ("1" !== d3) throw Error(`@supabase/auth-js: Invalid SIWE message field "version". Version must be '1'. Provided value: ${d3}`);
              if (null == (t11 = e11.statement) ? void 0 : t11.includes("\n")) throw Error(`@supabase/auth-js: Invalid SIWE message field "statement". Statement must not include '\\n'. Provided value: ${e11.statement}`);
              let f3 = nz(e11.address), p3 = c4 ? `${c4}://${n11}` : n11, g3 = e11.statement ? `${e11.statement}
` : "", m3 = `${p3} wants you to sign in with your Ethereum account:
${f3}

${g3}`, y3 = `URI: ${h4}
Version: ${d3}
Chain ID: ${r11}${a3 ? `
Nonce: ${a3}` : ""}
Issued At: ${i3.toISOString()}`;
              if (s3 && (y3 += `
Expiration Time: ${s3.toISOString()}`), o3 && (y3 += `
Not Before: ${o3.toISOString()}`), l3 && (y3 += `
Request ID: ${l3}`), u3) {
                let e12 = "\nResources:";
                for (let t12 of u3) {
                  if (!t12 || "string" != typeof t12) throw Error(`@supabase/auth-js: Invalid SIWE message field "resources". Every resource must be a valid string. Provided value: ${t12}`);
                  e12 += `
- ${t12}`;
                }
                y3 += e12;
              }
              return `${m3}
${y3}`;
            }({ domain: y2.host, address: b2, statement: g2, uri: y2.href, version: "1", chainId: v2, nonce: null == (n10 = null == m2 ? void 0 : m2.signInWithEthereum) ? void 0 : n10.nonce, issuedAt: null != (i2 = null == (s2 = null == m2 ? void 0 : m2.signInWithEthereum) ? void 0 : s2.issuedAt) ? i2 : /* @__PURE__ */ new Date(), expirationTime: null == (a2 = null == m2 ? void 0 : m2.signInWithEthereum) ? void 0 : a2.expirationTime, notBefore: null == (o2 = null == m2 ? void 0 : m2.signInWithEthereum) ? void 0 : o2.notBefore, requestId: null == (l2 = null == m2 ? void 0 : m2.signInWithEthereum) ? void 0 : l2.requestId, resources: null == (u2 = null == m2 ? void 0 : m2.signInWithEthereum) ? void 0 : u2.resources }), p2 = await h3.request({ method: "personal_sign", params: [(d2 = f2, "0x" + Array.from(new TextEncoder().encode(d2), (e11) => e11.toString(16).padStart(2, "0")).join("")), b2] });
          }
          try {
            let { data: t11, error: r11 } = await nI(this.fetch, "POST", `${this.url}/token?grant_type=web3`, { headers: this.headers, body: Object.assign({ chain: "ethereum", message: f2, signature: p2 }, (null == (c2 = e10.options) ? void 0 : c2.captchaToken) ? { gotrue_meta_security: { captcha_token: null == (h2 = e10.options) ? void 0 : h2.captchaToken } } : null), xform: nN });
            if (r11) throw r11;
            if (!t11 || !t11.session || !t11.user) {
              let e11 = new r7();
              return this._returnResult({ data: { user: null, session: null }, error: e11 });
            }
            return t11.session && (await this._saveSession(t11.session), await this._notifyAllSubscribers("SIGNED_IN", t11.session)), this._returnResult({ data: Object.assign({}, t11), error: r11 });
          } catch (e11) {
            if (r4(e11)) return this._returnResult({ data: { user: null, session: null }, error: e11 });
            throw e11;
          }
        }
        async signInWithSolana(e10) {
          var t10, r10, n10, s2, i2, a2, o2, l2, u2, c2, h2, d2;
          let f2, p2;
          if ("message" in e10) f2 = e10.message, p2 = e10.signature;
          else {
            let { chain: h3, wallet: d3, statement: g2, options: m2 } = e10;
            if ("object" != typeof d3 || !(null == m2 ? void 0 : m2.url)) throw Error("@supabase/auth-js: Both wallet and url must be specified in non-browser environments.");
            let y2 = new URL(null != (t10 = null == m2 ? void 0 : m2.url) ? t10 : window.location.href);
            if ("signIn" in d3 && d3.signIn) {
              let e11, t11 = await d3.signIn(Object.assign(Object.assign(Object.assign({ issuedAt: (/* @__PURE__ */ new Date()).toISOString() }, null == m2 ? void 0 : m2.signInWithSolana), { version: "1", domain: y2.host, uri: y2.href }), g2 ? { statement: g2 } : null));
              if (Array.isArray(t11) && t11[0] && "object" == typeof t11[0]) e11 = t11[0];
              else if (t11 && "object" == typeof t11 && "signedMessage" in t11 && "signature" in t11) e11 = t11;
              else throw Error("@supabase/auth-js: Wallet method signIn() returned unrecognized value");
              if ("signedMessage" in e11 && "signature" in e11 && ("string" == typeof e11.signedMessage || e11.signedMessage instanceof Uint8Array) && e11.signature instanceof Uint8Array) f2 = "string" == typeof e11.signedMessage ? e11.signedMessage : new TextDecoder().decode(e11.signedMessage), p2 = e11.signature;
              else throw Error("@supabase/auth-js: Wallet method signIn() API returned object without signedMessage and signature fields");
            } else {
              if (!("signMessage" in d3) || "function" != typeof d3.signMessage || !("publicKey" in d3) || "object" != typeof d3 || !d3.publicKey || !("toBase58" in d3.publicKey) || "function" != typeof d3.publicKey.toBase58) throw Error("@supabase/auth-js: Wallet does not have a compatible signMessage() and publicKey.toBase58() API");
              f2 = [`${y2.host} wants you to sign in with your Solana account:`, d3.publicKey.toBase58(), ...g2 ? ["", g2, ""] : [""], "Version: 1", `URI: ${y2.href}`, `Issued At: ${null != (n10 = null == (r10 = null == m2 ? void 0 : m2.signInWithSolana) ? void 0 : r10.issuedAt) ? n10 : (/* @__PURE__ */ new Date()).toISOString()}`, ...(null == (s2 = null == m2 ? void 0 : m2.signInWithSolana) ? void 0 : s2.notBefore) ? [`Not Before: ${m2.signInWithSolana.notBefore}`] : [], ...(null == (i2 = null == m2 ? void 0 : m2.signInWithSolana) ? void 0 : i2.expirationTime) ? [`Expiration Time: ${m2.signInWithSolana.expirationTime}`] : [], ...(null == (a2 = null == m2 ? void 0 : m2.signInWithSolana) ? void 0 : a2.chainId) ? [`Chain ID: ${m2.signInWithSolana.chainId}`] : [], ...(null == (o2 = null == m2 ? void 0 : m2.signInWithSolana) ? void 0 : o2.nonce) ? [`Nonce: ${m2.signInWithSolana.nonce}`] : [], ...(null == (l2 = null == m2 ? void 0 : m2.signInWithSolana) ? void 0 : l2.requestId) ? [`Request ID: ${m2.signInWithSolana.requestId}`] : [], ...(null == (c2 = null == (u2 = null == m2 ? void 0 : m2.signInWithSolana) ? void 0 : u2.resources) ? void 0 : c2.length) ? ["Resources", ...m2.signInWithSolana.resources.map((e12) => `- ${e12}`)] : []].join("\n");
              let e11 = await d3.signMessage(new TextEncoder().encode(f2), "utf8");
              if (!e11 || !(e11 instanceof Uint8Array)) throw Error("@supabase/auth-js: Wallet signMessage() API returned an recognized value");
              p2 = e11;
            }
          }
          try {
            let { data: t11, error: r11 } = await nI(this.fetch, "POST", `${this.url}/token?grant_type=web3`, { headers: this.headers, body: Object.assign({ chain: "solana", message: f2, signature: nf(p2) }, (null == (h2 = e10.options) ? void 0 : h2.captchaToken) ? { gotrue_meta_security: { captcha_token: null == (d2 = e10.options) ? void 0 : d2.captchaToken } } : null), xform: nN });
            if (r11) throw r11;
            if (!t11 || !t11.session || !t11.user) {
              let e11 = new r7();
              return this._returnResult({ data: { user: null, session: null }, error: e11 });
            }
            return t11.session && (await this._saveSession(t11.session), await this._notifyAllSubscribers("SIGNED_IN", t11.session)), this._returnResult({ data: Object.assign({}, t11), error: r11 });
          } catch (e11) {
            if (r4(e11)) return this._returnResult({ data: { user: null, session: null }, error: e11 });
            throw e11;
          }
        }
        async _exchangeCodeForSession(e10) {
          let t10 = await nm(this.storage, `${this.storageKey}-code-verifier`), [r10, n10] = (null != t10 ? t10 : "").split("/");
          try {
            let { data: t11, error: s2 } = await nI(this.fetch, "POST", `${this.url}/token?grant_type=pkce`, { headers: this.headers, body: { auth_code: e10, code_verifier: r10 }, xform: nN });
            if (await ny(this.storage, `${this.storageKey}-code-verifier`), s2) throw s2;
            if (!t11 || !t11.session || !t11.user) {
              let e11 = new r7();
              return this._returnResult({ data: { user: null, session: null, redirectType: null }, error: e11 });
            }
            return t11.session && (await this._saveSession(t11.session), await this._notifyAllSubscribers("SIGNED_IN", t11.session)), this._returnResult({ data: Object.assign(Object.assign({}, t11), { redirectType: null != n10 ? n10 : null }), error: s2 });
          } catch (e11) {
            if (r4(e11)) return this._returnResult({ data: { user: null, session: null, redirectType: null }, error: e11 });
            throw e11;
          }
        }
        async signInWithIdToken(e10) {
          try {
            let { options: t10, provider: r10, token: n10, access_token: s2, nonce: i2 } = e10, { data: a2, error: o2 } = await nI(this.fetch, "POST", `${this.url}/token?grant_type=id_token`, { headers: this.headers, body: { provider: r10, id_token: n10, access_token: s2, nonce: i2, gotrue_meta_security: { captcha_token: null == t10 ? void 0 : t10.captchaToken } }, xform: nN });
            if (o2) return this._returnResult({ data: { user: null, session: null }, error: o2 });
            if (!a2 || !a2.session || !a2.user) {
              let e11 = new r7();
              return this._returnResult({ data: { user: null, session: null }, error: e11 });
            }
            return a2.session && (await this._saveSession(a2.session), await this._notifyAllSubscribers("SIGNED_IN", a2.session)), this._returnResult({ data: a2, error: o2 });
          } catch (e11) {
            if (r4(e11)) return this._returnResult({ data: { user: null, session: null }, error: e11 });
            throw e11;
          }
        }
        async signInWithOtp(e10) {
          var t10, r10, n10, s2, i2;
          try {
            if ("email" in e10) {
              let { email: n11, options: s3 } = e10, i3 = null, a2 = null;
              "pkce" === this.flowType && ([i3, a2] = await nk(this.storage, this.storageKey));
              let { error: o2 } = await nI(this.fetch, "POST", `${this.url}/otp`, { headers: this.headers, body: { email: n11, data: null != (t10 = null == s3 ? void 0 : s3.data) ? t10 : {}, create_user: null == (r10 = null == s3 ? void 0 : s3.shouldCreateUser) || r10, gotrue_meta_security: { captcha_token: null == s3 ? void 0 : s3.captchaToken }, code_challenge: i3, code_challenge_method: a2 }, redirectTo: null == s3 ? void 0 : s3.emailRedirectTo });
              return this._returnResult({ data: { user: null, session: null }, error: o2 });
            }
            if ("phone" in e10) {
              let { phone: t11, options: r11 } = e10, { data: a2, error: o2 } = await nI(this.fetch, "POST", `${this.url}/otp`, { headers: this.headers, body: { phone: t11, data: null != (n10 = null == r11 ? void 0 : r11.data) ? n10 : {}, create_user: null == (s2 = null == r11 ? void 0 : r11.shouldCreateUser) || s2, gotrue_meta_security: { captcha_token: null == r11 ? void 0 : r11.captchaToken }, channel: null != (i2 = null == r11 ? void 0 : r11.channel) ? i2 : "sms" } });
              return this._returnResult({ data: { user: null, session: null, messageId: null == a2 ? void 0 : a2.message_id }, error: o2 });
            }
            throw new ne("You must provide either an email or phone number.");
          } catch (e11) {
            if (r4(e11)) return this._returnResult({ data: { user: null, session: null }, error: e11 });
            throw e11;
          }
        }
        async verifyOtp(e10) {
          var t10, r10;
          try {
            let n10, s2;
            "options" in e10 && (n10 = null == (t10 = e10.options) ? void 0 : t10.redirectTo, s2 = null == (r10 = e10.options) ? void 0 : r10.captchaToken);
            let { data: i2, error: a2 } = await nI(this.fetch, "POST", `${this.url}/verify`, { headers: this.headers, body: Object.assign(Object.assign({}, e10), { gotrue_meta_security: { captcha_token: s2 } }), redirectTo: n10, xform: nN });
            if (a2) throw a2;
            if (!i2) throw Error("An error occurred on token verification.");
            let o2 = i2.session, l2 = i2.user;
            return (null == o2 ? void 0 : o2.access_token) && (await this._saveSession(o2), await this._notifyAllSubscribers("recovery" == e10.type ? "PASSWORD_RECOVERY" : "SIGNED_IN", o2)), this._returnResult({ data: { user: l2, session: o2 }, error: null });
          } catch (e11) {
            if (r4(e11)) return this._returnResult({ data: { user: null, session: null }, error: e11 });
            throw e11;
          }
        }
        async signInWithSSO(e10) {
          var t10, r10, n10, s2;
          try {
            let i2 = null, a2 = null;
            "pkce" === this.flowType && ([i2, a2] = await nk(this.storage, this.storageKey));
            let o2 = await nI(this.fetch, "POST", `${this.url}/sso`, { body: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, "providerId" in e10 ? { provider_id: e10.providerId } : null), "domain" in e10 ? { domain: e10.domain } : null), { redirect_to: null != (r10 = null == (t10 = e10.options) ? void 0 : t10.redirectTo) ? r10 : void 0 }), (null == (n10 = null == e10 ? void 0 : e10.options) ? void 0 : n10.captchaToken) ? { gotrue_meta_security: { captcha_token: e10.options.captchaToken } } : null), { skip_http_redirect: true, code_challenge: i2, code_challenge_method: a2 }), headers: this.headers, xform: nL });
            return null == (s2 = o2.data) || s2.url, this._returnResult(o2);
          } catch (e11) {
            if (r4(e11)) return this._returnResult({ data: null, error: e11 });
            throw e11;
          }
        }
        async reauthenticate() {
          return await this.initializePromise, await this._acquireLock(-1, async () => await this._reauthenticate());
        }
        async _reauthenticate() {
          try {
            return await this._useSession(async (e10) => {
              let { data: { session: t10 }, error: r10 } = e10;
              if (r10) throw r10;
              if (!t10) throw new r9();
              let { error: n10 } = await nI(this.fetch, "GET", `${this.url}/reauthenticate`, { headers: this.headers, jwt: t10.access_token });
              return this._returnResult({ data: { user: null, session: null }, error: n10 });
            });
          } catch (e10) {
            if (r4(e10)) return this._returnResult({ data: { user: null, session: null }, error: e10 });
            throw e10;
          }
        }
        async resend(e10) {
          try {
            let t10 = `${this.url}/resend`;
            if ("email" in e10) {
              let { email: r10, type: n10, options: s2 } = e10, { error: i2 } = await nI(this.fetch, "POST", t10, { headers: this.headers, body: { email: r10, type: n10, gotrue_meta_security: { captcha_token: null == s2 ? void 0 : s2.captchaToken } }, redirectTo: null == s2 ? void 0 : s2.emailRedirectTo });
              return this._returnResult({ data: { user: null, session: null }, error: i2 });
            }
            if ("phone" in e10) {
              let { phone: r10, type: n10, options: s2 } = e10, { data: i2, error: a2 } = await nI(this.fetch, "POST", t10, { headers: this.headers, body: { phone: r10, type: n10, gotrue_meta_security: { captcha_token: null == s2 ? void 0 : s2.captchaToken } } });
              return this._returnResult({ data: { user: null, session: null, messageId: null == i2 ? void 0 : i2.message_id }, error: a2 });
            }
            throw new ne("You must provide either an email or phone number and a type");
          } catch (e11) {
            if (r4(e11)) return this._returnResult({ data: { user: null, session: null }, error: e11 });
            throw e11;
          }
        }
        async getSession() {
          return await this.initializePromise, await this._acquireLock(-1, async () => this._useSession(async (e10) => e10));
        }
        async _acquireLock(e10, t10) {
          this._debug("#_acquireLock", "begin", e10);
          try {
            if (this.lockAcquired) {
              let e11 = this.pendingInLock.length ? this.pendingInLock[this.pendingInLock.length - 1] : Promise.resolve(), r10 = (async () => (await e11, await t10()))();
              return this.pendingInLock.push((async () => {
                try {
                  await r10;
                } catch (e12) {
                }
              })()), r10;
            }
            return await this.lock(`lock:${this.storageKey}`, e10, async () => {
              this._debug("#_acquireLock", "lock acquired for storage key", this.storageKey);
              try {
                this.lockAcquired = true;
                let e11 = t10();
                for (this.pendingInLock.push((async () => {
                  try {
                    await e11;
                  } catch (e12) {
                  }
                })()), await e11; this.pendingInLock.length; ) {
                  let e12 = [...this.pendingInLock];
                  await Promise.all(e12), this.pendingInLock.splice(0, e12.length);
                }
                return await e11;
              } finally {
                this._debug("#_acquireLock", "lock released for storage key", this.storageKey), this.lockAcquired = false;
              }
            });
          } finally {
            this._debug("#_acquireLock", "end");
          }
        }
        async _useSession(e10) {
          this._debug("#_useSession", "begin");
          try {
            let t10 = await this.__loadSession();
            return await e10(t10);
          } finally {
            this._debug("#_useSession", "end");
          }
        }
        async __loadSession() {
          this._debug("#__loadSession()", "begin"), this.lockAcquired || this._debug("#__loadSession()", "used outside of an acquired lock!", Error().stack);
          try {
            let t10 = null, r10 = await nm(this.storage, this.storageKey);
            if (this._debug("#getSession()", "session from storage", r10), null !== r10 && (this._isValidSession(r10) ? t10 = r10 : (this._debug("#getSession()", "session from storage is not valid"), await this._removeSession())), !t10) return { data: { session: null }, error: null };
            let n10 = !!t10.expires_at && 1e3 * t10.expires_at - Date.now() < 9e4;
            if (this._debug("#__loadSession()", `session has${n10 ? "" : " not"} expired`, "expires_at", t10.expires_at), !n10) {
              if (this.userStorage) {
                let e11 = await nm(this.userStorage, this.storageKey + "-user");
                (null == e11 ? void 0 : e11.user) ? t10.user = e11.user : t10.user = nx();
              }
              if (this.storage.isServer && t10.user && !t10.user.__isUserNotAvailableProxy) {
                var e10;
                let r11 = { value: this.suppressGetSessionWarning };
                t10.user = (e10 = t10.user, new Proxy(e10, { get: (e11, t11, n11) => {
                  if ("__isInsecureUserWarningProxy" === t11) return true;
                  if ("symbol" == typeof t11) {
                    let r12 = t11.toString();
                    if ("Symbol(Symbol.toPrimitive)" === r12 || "Symbol(Symbol.toStringTag)" === r12 || "Symbol(util.inspect.custom)" === r12 || "Symbol(nodejs.util.inspect.custom)" === r12) return Reflect.get(e11, t11, n11);
                  }
                  return r11.value || "string" != typeof t11 || (console.warn("Using the user object as returned from supabase.auth.getSession() or from some supabase.auth.onAuthStateChange() events could be insecure! This value comes directly from the storage medium (usually cookies on the server) and may not be authentic. Use supabase.auth.getUser() instead which authenticates the data by contacting the Supabase Auth server."), r11.value = true), Reflect.get(e11, t11, n11);
                } })), r11.value && (this.suppressGetSessionWarning = true);
              }
              return { data: { session: t10 }, error: null };
            }
            let { data: s2, error: i2 } = await this._callRefreshToken(t10.refresh_token);
            if (i2) return this._returnResult({ data: { session: null }, error: i2 });
            return this._returnResult({ data: { session: s2 }, error: null });
          } finally {
            this._debug("#__loadSession()", "end");
          }
        }
        async getUser(e10) {
          return e10 ? await this._getUser(e10) : (await this.initializePromise, await this._acquireLock(-1, async () => await this._getUser()));
        }
        async _getUser(e10) {
          try {
            if (e10) return await nI(this.fetch, "GET", `${this.url}/user`, { headers: this.headers, jwt: e10, xform: nD });
            return await this._useSession(async (e11) => {
              var t10, r10, n10;
              let { data: s2, error: i2 } = e11;
              if (i2) throw i2;
              return (null == (t10 = s2.session) ? void 0 : t10.access_token) || this.hasCustomAuthorizationHeader ? await nI(this.fetch, "GET", `${this.url}/user`, { headers: this.headers, jwt: null != (n10 = null == (r10 = s2.session) ? void 0 : r10.access_token) ? n10 : void 0, xform: nD }) : { data: { user: null }, error: new r9() };
            });
          } catch (e11) {
            if (r4(e11)) return r4(e11) && "AuthSessionMissingError" === e11.name && (await this._removeSession(), await ny(this.storage, `${this.storageKey}-code-verifier`)), this._returnResult({ data: { user: null }, error: e11 });
            throw e11;
          }
        }
        async updateUser(e10, t10 = {}) {
          return await this.initializePromise, await this._acquireLock(-1, async () => await this._updateUser(e10, t10));
        }
        async _updateUser(e10, t10 = {}) {
          try {
            return await this._useSession(async (r10) => {
              let { data: n10, error: s2 } = r10;
              if (s2) throw s2;
              if (!n10.session) throw new r9();
              let i2 = n10.session, a2 = null, o2 = null;
              "pkce" === this.flowType && null != e10.email && ([a2, o2] = await nk(this.storage, this.storageKey));
              let { data: l2, error: u2 } = await nI(this.fetch, "PUT", `${this.url}/user`, { headers: this.headers, redirectTo: null == t10 ? void 0 : t10.emailRedirectTo, body: Object.assign(Object.assign({}, e10), { code_challenge: a2, code_challenge_method: o2 }), jwt: i2.access_token, xform: nD });
              if (u2) throw u2;
              return i2.user = l2.user, await this._saveSession(i2), await this._notifyAllSubscribers("USER_UPDATED", i2), this._returnResult({ data: { user: i2.user }, error: null });
            });
          } catch (e11) {
            if (r4(e11)) return this._returnResult({ data: { user: null }, error: e11 });
            throw e11;
          }
        }
        async setSession(e10) {
          return await this.initializePromise, await this._acquireLock(-1, async () => await this._setSession(e10));
        }
        async _setSession(e10) {
          try {
            if (!e10.access_token || !e10.refresh_token) throw new r9();
            let t10 = Date.now() / 1e3, r10 = t10, n10 = true, s2 = null, { payload: i2 } = nb(e10.access_token);
            if (i2.exp && (n10 = (r10 = i2.exp) <= t10), n10) {
              let { data: t11, error: r11 } = await this._callRefreshToken(e10.refresh_token);
              if (r11) return this._returnResult({ data: { user: null, session: null }, error: r11 });
              if (!t11) return { data: { user: null, session: null }, error: null };
              s2 = t11;
            } else {
              let { data: n11, error: i3 } = await this._getUser(e10.access_token);
              if (i3) throw i3;
              s2 = { access_token: e10.access_token, refresh_token: e10.refresh_token, user: n11.user, token_type: "bearer", expires_in: r10 - t10, expires_at: r10 }, await this._saveSession(s2), await this._notifyAllSubscribers("SIGNED_IN", s2);
            }
            return this._returnResult({ data: { user: s2.user, session: s2 }, error: null });
          } catch (e11) {
            if (r4(e11)) return this._returnResult({ data: { session: null, user: null }, error: e11 });
            throw e11;
          }
        }
        async refreshSession(e10) {
          return await this.initializePromise, await this._acquireLock(-1, async () => await this._refreshSession(e10));
        }
        async _refreshSession(e10) {
          try {
            return await this._useSession(async (t10) => {
              var r10;
              if (!e10) {
                let { data: n11, error: s3 } = t10;
                if (s3) throw s3;
                e10 = null != (r10 = n11.session) ? r10 : void 0;
              }
              if (!(null == e10 ? void 0 : e10.refresh_token)) throw new r9();
              let { data: n10, error: s2 } = await this._callRefreshToken(e10.refresh_token);
              return s2 ? this._returnResult({ data: { user: null, session: null }, error: s2 }) : n10 ? this._returnResult({ data: { user: n10.user, session: n10 }, error: null }) : this._returnResult({ data: { user: null, session: null }, error: null });
            });
          } catch (e11) {
            if (r4(e11)) return this._returnResult({ data: { user: null, session: null }, error: e11 });
            throw e11;
          }
        }
        async _getSessionFromURL(e10, t10) {
          try {
            throw new nt("No browser detected.");
          } catch (e11) {
            if (r4(e11)) return this._returnResult({ data: { session: null, redirectType: null }, error: e11 });
            throw e11;
          }
        }
        _isImplicitGrantCallback(e10) {
          return !!(e10.access_token || e10.error_description);
        }
        async _isPKCECallback(e10) {
          let t10 = await nm(this.storage, `${this.storageKey}-code-verifier`);
          return !!(e10.code && t10);
        }
        async signOut(e10 = { scope: "global" }) {
          return await this.initializePromise, await this._acquireLock(-1, async () => await this._signOut(e10));
        }
        async _signOut({ scope: e10 } = { scope: "global" }) {
          return await this._useSession(async (t10) => {
            var r10;
            let { data: n10, error: s2 } = t10;
            if (s2) return this._returnResult({ error: s2 });
            let i2 = null == (r10 = n10.session) ? void 0 : r10.access_token;
            if (i2) {
              let { error: t11 } = await this.admin.signOut(i2, e10);
              if (t11 && !(r4(t11) && "AuthApiError" === t11.name && (404 === t11.status || 401 === t11.status || 403 === t11.status))) return this._returnResult({ error: t11 });
            }
            return "others" !== e10 && (await this._removeSession(), await ny(this.storage, `${this.storageKey}-code-verifier`)), this._returnResult({ error: null });
          });
        }
        onAuthStateChange(e10) {
          let t10 = Symbol("auth-callback"), r10 = { id: t10, callback: e10, unsubscribe: () => {
            this._debug("#unsubscribe()", "state change callback with id removed", t10), this.stateChangeEmitters.delete(t10);
          } };
          return this._debug("#onAuthStateChange()", "registered callback with id", t10), this.stateChangeEmitters.set(t10, r10), (async () => {
            await this.initializePromise, await this._acquireLock(-1, async () => {
              this._emitInitialSession(t10);
            });
          })(), { data: { subscription: r10 } };
        }
        async _emitInitialSession(e10) {
          return await this._useSession(async (t10) => {
            var r10, n10;
            try {
              let { data: { session: n11 }, error: s2 } = t10;
              if (s2) throw s2;
              await (null == (r10 = this.stateChangeEmitters.get(e10)) ? void 0 : r10.callback("INITIAL_SESSION", n11)), this._debug("INITIAL_SESSION", "callback id", e10, "session", n11);
            } catch (t11) {
              await (null == (n10 = this.stateChangeEmitters.get(e10)) ? void 0 : n10.callback("INITIAL_SESSION", null)), this._debug("INITIAL_SESSION", "callback id", e10, "error", t11), console.error(t11);
            }
          });
        }
        async resetPasswordForEmail(e10, t10 = {}) {
          let r10 = null, n10 = null;
          "pkce" === this.flowType && ([r10, n10] = await nk(this.storage, this.storageKey, true));
          try {
            return await nI(this.fetch, "POST", `${this.url}/recover`, { body: { email: e10, code_challenge: r10, code_challenge_method: n10, gotrue_meta_security: { captcha_token: t10.captchaToken } }, headers: this.headers, redirectTo: t10.redirectTo });
          } catch (e11) {
            if (r4(e11)) return this._returnResult({ data: null, error: e11 });
            throw e11;
          }
        }
        async getUserIdentities() {
          var e10;
          try {
            let { data: t10, error: r10 } = await this.getUser();
            if (r10) throw r10;
            return this._returnResult({ data: { identities: null != (e10 = t10.user.identities) ? e10 : [] }, error: null });
          } catch (e11) {
            if (r4(e11)) return this._returnResult({ data: null, error: e11 });
            throw e11;
          }
        }
        async linkIdentity(e10) {
          return "token" in e10 ? this.linkIdentityIdToken(e10) : this.linkIdentityOAuth(e10);
        }
        async linkIdentityOAuth(e10) {
          try {
            let { data: t10, error: r10 } = await this._useSession(async (t11) => {
              var r11, n10, s2, i2, a2;
              let { data: o2, error: l2 } = t11;
              if (l2) throw l2;
              let u2 = await this._getUrlForProvider(`${this.url}/user/identities/authorize`, e10.provider, { redirectTo: null == (r11 = e10.options) ? void 0 : r11.redirectTo, scopes: null == (n10 = e10.options) ? void 0 : n10.scopes, queryParams: null == (s2 = e10.options) ? void 0 : s2.queryParams, skipBrowserRedirect: true });
              return await nI(this.fetch, "GET", u2, { headers: this.headers, jwt: null != (a2 = null == (i2 = o2.session) ? void 0 : i2.access_token) ? a2 : void 0 });
            });
            if (r10) throw r10;
            return this._returnResult({ data: { provider: e10.provider, url: null == t10 ? void 0 : t10.url }, error: null });
          } catch (t10) {
            if (r4(t10)) return this._returnResult({ data: { provider: e10.provider, url: null }, error: t10 });
            throw t10;
          }
        }
        async linkIdentityIdToken(e10) {
          return await this._useSession(async (t10) => {
            var r10;
            try {
              let { error: n10, data: { session: s2 } } = t10;
              if (n10) throw n10;
              let { options: i2, provider: a2, token: o2, access_token: l2, nonce: u2 } = e10, { data: c2, error: h2 } = await nI(this.fetch, "POST", `${this.url}/token?grant_type=id_token`, { headers: this.headers, jwt: null != (r10 = null == s2 ? void 0 : s2.access_token) ? r10 : void 0, body: { provider: a2, id_token: o2, access_token: l2, nonce: u2, link_identity: true, gotrue_meta_security: { captcha_token: null == i2 ? void 0 : i2.captchaToken } }, xform: nN });
              if (h2) return this._returnResult({ data: { user: null, session: null }, error: h2 });
              if (!c2 || !c2.session || !c2.user) return this._returnResult({ data: { user: null, session: null }, error: new r7() });
              return c2.session && (await this._saveSession(c2.session), await this._notifyAllSubscribers("USER_UPDATED", c2.session)), this._returnResult({ data: c2, error: h2 });
            } catch (e11) {
              if (r4(e11)) return this._returnResult({ data: { user: null, session: null }, error: e11 });
              throw e11;
            }
          });
        }
        async unlinkIdentity(e10) {
          try {
            return await this._useSession(async (t10) => {
              var r10, n10;
              let { data: s2, error: i2 } = t10;
              if (i2) throw i2;
              return await nI(this.fetch, "DELETE", `${this.url}/user/identities/${e10.identity_id}`, { headers: this.headers, jwt: null != (n10 = null == (r10 = s2.session) ? void 0 : r10.access_token) ? n10 : void 0 });
            });
          } catch (e11) {
            if (r4(e11)) return this._returnResult({ data: null, error: e11 });
            throw e11;
          }
        }
        async _refreshAccessToken(e10) {
          let t10 = `#_refreshAccessToken(${e10.substring(0, 5)}...)`;
          this._debug(t10, "begin");
          try {
            var r10, n10;
            let s2 = Date.now();
            return await (r10 = async (r11) => (r11 > 0 && await nv(200 * Math.pow(2, r11 - 1)), this._debug(t10, "refreshing attempt", r11), await nI(this.fetch, "POST", `${this.url}/token?grant_type=refresh_token`, { body: { refresh_token: e10 }, headers: this.headers, xform: nN })), n10 = (e11, t11) => {
              let r11 = 200 * Math.pow(2, e11);
              return t11 && nn(t11) && Date.now() + r11 - s2 < 3e4;
            }, new Promise((e11, t11) => {
              (async () => {
                for (let s3 = 0; s3 < 1 / 0; s3++) try {
                  let t12 = await r10(s3);
                  if (!n10(s3, null, t12)) return void e11(t12);
                } catch (e12) {
                  if (!n10(s3, e12)) return void t11(e12);
                }
              })();
            }));
          } catch (e11) {
            if (this._debug(t10, "error", e11), r4(e11)) return this._returnResult({ data: { session: null, user: null }, error: e11 });
            throw e11;
          } finally {
            this._debug(t10, "end");
          }
        }
        _isValidSession(e10) {
          return "object" == typeof e10 && null !== e10 && "access_token" in e10 && "refresh_token" in e10 && "expires_at" in e10;
        }
        async _handleProviderSignIn(e10, t10) {
          let r10 = await this._getUrlForProvider(`${this.url}/authorize`, e10, { redirectTo: t10.redirectTo, scopes: t10.scopes, queryParams: t10.queryParams });
          return this._debug("#_handleProviderSignIn()", "provider", e10, "options", t10, "url", r10), { data: { provider: e10, url: r10 }, error: null };
        }
        async _recoverAndRefresh() {
          var e10, t10;
          let r10 = "#_recoverAndRefresh()";
          this._debug(r10, "begin");
          try {
            let n10 = await nm(this.storage, this.storageKey);
            if (n10 && this.userStorage) {
              let t11 = await nm(this.userStorage, this.storageKey + "-user");
              !this.storage.isServer && Object.is(this.storage, this.userStorage) && !t11 && (t11 = { user: n10.user }, await ng(this.userStorage, this.storageKey + "-user", t11)), n10.user = null != (e10 = null == t11 ? void 0 : t11.user) ? e10 : nx();
            } else if (n10 && !n10.user && !n10.user) {
              let e11 = await nm(this.storage, this.storageKey + "-user");
              e11 && (null == e11 ? void 0 : e11.user) ? (n10.user = e11.user, await ny(this.storage, this.storageKey + "-user"), await ng(this.storage, this.storageKey, n10)) : n10.user = nx();
            }
            if (this._debug(r10, "session from storage", n10), !this._isValidSession(n10)) {
              this._debug(r10, "session is not valid"), null !== n10 && await this._removeSession();
              return;
            }
            let s2 = (null != (t10 = n10.expires_at) ? t10 : 1 / 0) * 1e3 - Date.now() < 9e4;
            if (this._debug(r10, `session has${s2 ? "" : " not"} expired with margin of 90000s`), s2) {
              if (this.autoRefreshToken && n10.refresh_token) {
                let { error: e11 } = await this._callRefreshToken(n10.refresh_token);
                e11 && (console.error(e11), nn(e11) || (this._debug(r10, "refresh failed with a non-retryable error, removing the session", e11), await this._removeSession()));
              }
            } else if (n10.user && true === n10.user.__isUserNotAvailableProxy) try {
              let { data: e11, error: t11 } = await this._getUser(n10.access_token);
              !t11 && (null == e11 ? void 0 : e11.user) ? (n10.user = e11.user, await this._saveSession(n10), await this._notifyAllSubscribers("SIGNED_IN", n10)) : this._debug(r10, "could not get user data, skipping SIGNED_IN notification");
            } catch (e11) {
              console.error("Error getting user data:", e11), this._debug(r10, "error getting user data, skipping SIGNED_IN notification", e11);
            }
            else await this._notifyAllSubscribers("SIGNED_IN", n10);
          } catch (e11) {
            this._debug(r10, "error", e11), console.error(e11);
            return;
          } finally {
            this._debug(r10, "end");
          }
        }
        async _callRefreshToken(e10) {
          var t10, r10;
          if (!e10) throw new r9();
          if (this.refreshingDeferred) return this.refreshingDeferred.promise;
          let n10 = `#_callRefreshToken(${e10.substring(0, 5)}...)`;
          this._debug(n10, "begin");
          try {
            this.refreshingDeferred = new nw();
            let { data: t11, error: r11 } = await this._refreshAccessToken(e10);
            if (r11) throw r11;
            if (!t11.session) throw new r9();
            await this._saveSession(t11.session), await this._notifyAllSubscribers("TOKEN_REFRESHED", t11.session);
            let n11 = { data: t11.session, error: null };
            return this.refreshingDeferred.resolve(n11), n11;
          } catch (e11) {
            if (this._debug(n10, "error", e11), r4(e11)) {
              let r11 = { data: null, error: e11 };
              return nn(e11) || await this._removeSession(), null == (t10 = this.refreshingDeferred) || t10.resolve(r11), r11;
            }
            throw null == (r10 = this.refreshingDeferred) || r10.reject(e11), e11;
          } finally {
            this.refreshingDeferred = null, this._debug(n10, "end");
          }
        }
        async _notifyAllSubscribers(e10, t10, r10 = true) {
          let n10 = `#_notifyAllSubscribers(${e10})`;
          this._debug(n10, "begin", t10, `broadcast = ${r10}`);
          try {
            this.broadcastChannel && r10 && this.broadcastChannel.postMessage({ event: e10, session: t10 });
            let n11 = [], s2 = Array.from(this.stateChangeEmitters.values()).map(async (r11) => {
              try {
                await r11.callback(e10, t10);
              } catch (e11) {
                n11.push(e11);
              }
            });
            if (await Promise.all(s2), n11.length > 0) {
              for (let e11 = 0; e11 < n11.length; e11 += 1) console.error(n11[e11]);
              throw n11[0];
            }
          } finally {
            this._debug(n10, "end");
          }
        }
        async _saveSession(e10) {
          this._debug("#_saveSession()", e10), this.suppressGetSessionWarning = true;
          let t10 = Object.assign({}, e10), r10 = t10.user && true === t10.user.__isUserNotAvailableProxy;
          if (this.userStorage) {
            !r10 && t10.user && await ng(this.userStorage, this.storageKey + "-user", { user: t10.user });
            let e11 = Object.assign({}, t10);
            delete e11.user;
            let n10 = nC(e11);
            await ng(this.storage, this.storageKey, n10);
          } else {
            let e11 = nC(t10);
            await ng(this.storage, this.storageKey, e11);
          }
        }
        async _removeSession() {
          this._debug("#_removeSession()"), await ny(this.storage, this.storageKey), await ny(this.storage, this.storageKey + "-code-verifier"), await ny(this.storage, this.storageKey + "-user"), this.userStorage && await ny(this.userStorage, this.storageKey + "-user"), await this._notifyAllSubscribers("SIGNED_OUT", null);
        }
        _removeVisibilityChangedCallback() {
          this._debug("#_removeVisibilityChangedCallback()"), this.visibilityChangedCallback, this.visibilityChangedCallback = null;
        }
        async _startAutoRefresh() {
          await this._stopAutoRefresh(), this._debug("#_startAutoRefresh()");
          let e10 = setInterval(() => this._autoRefreshTokenTick(), 3e4);
          this.autoRefreshTicker = e10, e10 && "object" == typeof e10 && "function" == typeof e10.unref ? e10.unref() : "undefined" != typeof Deno && "function" == typeof Deno.unrefTimer && Deno.unrefTimer(e10), setTimeout(async () => {
            await this.initializePromise, await this._autoRefreshTokenTick();
          }, 0);
        }
        async _stopAutoRefresh() {
          this._debug("#_stopAutoRefresh()");
          let e10 = this.autoRefreshTicker;
          this.autoRefreshTicker = null, e10 && clearInterval(e10);
        }
        async startAutoRefresh() {
          this._removeVisibilityChangedCallback(), await this._startAutoRefresh();
        }
        async stopAutoRefresh() {
          this._removeVisibilityChangedCallback(), await this._stopAutoRefresh();
        }
        async _autoRefreshTokenTick() {
          this._debug("#_autoRefreshTokenTick()", "begin");
          try {
            await this._acquireLock(0, async () => {
              try {
                let e10 = Date.now();
                try {
                  return await this._useSession(async (t10) => {
                    let { data: { session: r10 } } = t10;
                    if (!r10 || !r10.refresh_token || !r10.expires_at) return void this._debug("#_autoRefreshTokenTick()", "no session");
                    let n10 = Math.floor((1e3 * r10.expires_at - e10) / 3e4);
                    this._debug("#_autoRefreshTokenTick()", `access token expires in ${n10} ticks, a tick lasts 30000ms, refresh threshold is 3 ticks`), n10 <= 3 && await this._callRefreshToken(r10.refresh_token);
                  });
                } catch (e11) {
                  console.error("Auto refresh tick failed with error. This is likely a transient error.", e11);
                }
              } finally {
                this._debug("#_autoRefreshTokenTick()", "end");
              }
            });
          } catch (e10) {
            if (e10.isAcquireTimeout || e10 instanceof nV) this._debug("auto refresh token tick lock not available");
            else throw e10;
          }
        }
        async _handleVisibilityChange() {
          return this._debug("#_handleVisibilityChange()"), this.autoRefreshToken && this.startAutoRefresh(), false;
        }
        async _onVisibilityChanged(e10) {
          let t10 = `#_onVisibilityChanged(${e10})`;
          this._debug(t10, "visibilityState", document.visibilityState), "visible" === document.visibilityState ? (this.autoRefreshToken && this._startAutoRefresh(), e10 || (await this.initializePromise, await this._acquireLock(-1, async () => {
            "visible" !== document.visibilityState ? this._debug(t10, "acquired the lock to recover the session, but the browser visibilityState is no longer visible, aborting") : await this._recoverAndRefresh();
          }))) : "hidden" === document.visibilityState && this.autoRefreshToken && this._stopAutoRefresh();
        }
        async _getUrlForProvider(e10, t10, r10) {
          let n10 = [`provider=${encodeURIComponent(t10)}`];
          if ((null == r10 ? void 0 : r10.redirectTo) && n10.push(`redirect_to=${encodeURIComponent(r10.redirectTo)}`), (null == r10 ? void 0 : r10.scopes) && n10.push(`scopes=${encodeURIComponent(r10.scopes)}`), "pkce" === this.flowType) {
            let [e11, t11] = await nk(this.storage, this.storageKey), r11 = new URLSearchParams({ code_challenge: `${encodeURIComponent(e11)}`, code_challenge_method: `${encodeURIComponent(t11)}` });
            n10.push(r11.toString());
          }
          if (null == r10 ? void 0 : r10.queryParams) {
            let e11 = new URLSearchParams(r10.queryParams);
            n10.push(e11.toString());
          }
          return (null == r10 ? void 0 : r10.skipBrowserRedirect) && n10.push(`skip_http_redirect=${r10.skipBrowserRedirect}`), `${e10}?${n10.join("&")}`;
        }
        async _unenroll(e10) {
          try {
            return await this._useSession(async (t10) => {
              var r10;
              let { data: n10, error: s2 } = t10;
              return s2 ? this._returnResult({ data: null, error: s2 }) : await nI(this.fetch, "DELETE", `${this.url}/factors/${e10.factorId}`, { headers: this.headers, jwt: null == (r10 = null == n10 ? void 0 : n10.session) ? void 0 : r10.access_token });
            });
          } catch (e11) {
            if (r4(e11)) return this._returnResult({ data: null, error: e11 });
            throw e11;
          }
        }
        async _enroll(e10) {
          try {
            return await this._useSession(async (t10) => {
              var r10, n10;
              let { data: s2, error: i2 } = t10;
              if (i2) return this._returnResult({ data: null, error: i2 });
              let a2 = Object.assign({ friendly_name: e10.friendlyName, factor_type: e10.factorType }, "phone" === e10.factorType ? { phone: e10.phone } : "totp" === e10.factorType ? { issuer: e10.issuer } : {}), { data: o2, error: l2 } = await nI(this.fetch, "POST", `${this.url}/factors`, { body: a2, headers: this.headers, jwt: null == (r10 = null == s2 ? void 0 : s2.session) ? void 0 : r10.access_token });
              return l2 ? this._returnResult({ data: null, error: l2 }) : ("totp" === e10.factorType && "totp" === o2.type && (null == (n10 = null == o2 ? void 0 : o2.totp) ? void 0 : n10.qr_code) && (o2.totp.qr_code = `data:image/svg+xml;utf-8,${o2.totp.qr_code}`), this._returnResult({ data: o2, error: null }));
            });
          } catch (e11) {
            if (r4(e11)) return this._returnResult({ data: null, error: e11 });
            throw e11;
          }
        }
        async _verify(e10) {
          return this._acquireLock(-1, async () => {
            try {
              return await this._useSession(async (t10) => {
                var r10, n10, s2;
                let { data: i2, error: a2 } = t10;
                if (a2) return this._returnResult({ data: null, error: a2 });
                let o2 = Object.assign({ challenge_id: e10.challengeId }, "webauthn" in e10 ? { webauthn: Object.assign(Object.assign({}, e10.webauthn), { credential_response: "create" === e10.webauthn.type ? (n10 = e10.webauthn.credential_response, "toJSON" in n10 && "function" == typeof n10.toJSON ? n10.toJSON() : { id: n10.id, rawId: n10.id, response: { attestationObject: nf(new Uint8Array(n10.response.attestationObject)), clientDataJSON: nf(new Uint8Array(n10.response.clientDataJSON)) }, type: "public-key", clientExtensionResults: n10.getClientExtensionResults(), authenticatorAttachment: null != (s2 = n10.authenticatorAttachment) ? s2 : void 0 }) : function(e11) {
                  var t11;
                  if ("toJSON" in e11 && "function" == typeof e11.toJSON) return e11.toJSON();
                  let r11 = e11.getClientExtensionResults(), n11 = e11.response;
                  return { id: e11.id, rawId: e11.id, response: { authenticatorData: nf(new Uint8Array(n11.authenticatorData)), clientDataJSON: nf(new Uint8Array(n11.clientDataJSON)), signature: nf(new Uint8Array(n11.signature)), userHandle: n11.userHandle ? nf(new Uint8Array(n11.userHandle)) : void 0 }, type: "public-key", clientExtensionResults: r11, authenticatorAttachment: null != (t11 = e11.authenticatorAttachment) ? t11 : void 0 };
                }(e10.webauthn.credential_response) }) } : { code: e10.code }), { data: l2, error: u2 } = await nI(this.fetch, "POST", `${this.url}/factors/${e10.factorId}/verify`, { body: o2, headers: this.headers, jwt: null == (r10 = null == i2 ? void 0 : i2.session) ? void 0 : r10.access_token });
                return u2 ? this._returnResult({ data: null, error: u2 }) : (await this._saveSession(Object.assign({ expires_at: Math.round(Date.now() / 1e3) + l2.expires_in }, l2)), await this._notifyAllSubscribers("MFA_CHALLENGE_VERIFIED", l2), this._returnResult({ data: l2, error: u2 }));
              });
            } catch (e11) {
              if (r4(e11)) return this._returnResult({ data: null, error: e11 });
              throw e11;
            }
          });
        }
        async _challenge(e10) {
          return this._acquireLock(-1, async () => {
            try {
              return await this._useSession(async (t10) => {
                var r10;
                let { data: n10, error: s2 } = t10;
                if (s2) return this._returnResult({ data: null, error: s2 });
                let i2 = await nI(this.fetch, "POST", `${this.url}/factors/${e10.factorId}/challenge`, { body: e10, headers: this.headers, jwt: null == (r10 = null == n10 ? void 0 : n10.session) ? void 0 : r10.access_token });
                if (i2.error) return i2;
                let { data: a2 } = i2;
                if ("webauthn" !== a2.type) return { data: a2, error: null };
                switch (a2.webauthn.type) {
                  case "create":
                    return { data: Object.assign(Object.assign({}, a2), { webauthn: Object.assign(Object.assign({}, a2.webauthn), { credential_options: Object.assign(Object.assign({}, a2.webauthn.credential_options), { publicKey: function(e11) {
                      if (!e11) throw Error("Credential creation options are required");
                      if ("undefined" != typeof PublicKeyCredential && "parseCreationOptionsFromJSON" in PublicKeyCredential && "function" == typeof PublicKeyCredential.parseCreationOptionsFromJSON) return PublicKeyCredential.parseCreationOptionsFromJSON(e11);
                      let { challenge: t11, user: r11, excludeCredentials: n11 } = e11, s3 = (0, t$.__rest)(e11, ["challenge", "user", "excludeCredentials"]), i3 = nd(t11).buffer, a3 = Object.assign(Object.assign({}, r11), { id: nd(r11.id).buffer }), o2 = Object.assign(Object.assign({}, s3), { challenge: i3, user: a3 });
                      if (n11 && n11.length > 0) {
                        o2.excludeCredentials = Array(n11.length);
                        for (let e12 = 0; e12 < n11.length; e12++) {
                          let t12 = n11[e12];
                          o2.excludeCredentials[e12] = Object.assign(Object.assign({}, t12), { id: nd(t12.id).buffer, type: t12.type || "public-key", transports: t12.transports });
                        }
                      }
                      return o2;
                    }(a2.webauthn.credential_options.publicKey) }) }) }), error: null };
                  case "request":
                    return { data: Object.assign(Object.assign({}, a2), { webauthn: Object.assign(Object.assign({}, a2.webauthn), { credential_options: Object.assign(Object.assign({}, a2.webauthn.credential_options), { publicKey: function(e11) {
                      if (!e11) throw Error("Credential request options are required");
                      if ("undefined" != typeof PublicKeyCredential && "parseRequestOptionsFromJSON" in PublicKeyCredential && "function" == typeof PublicKeyCredential.parseRequestOptionsFromJSON) return PublicKeyCredential.parseRequestOptionsFromJSON(e11);
                      let { challenge: t11, allowCredentials: r11 } = e11, n11 = (0, t$.__rest)(e11, ["challenge", "allowCredentials"]), s3 = nd(t11).buffer, i3 = Object.assign(Object.assign({}, n11), { challenge: s3 });
                      if (r11 && r11.length > 0) {
                        i3.allowCredentials = Array(r11.length);
                        for (let e12 = 0; e12 < r11.length; e12++) {
                          let t12 = r11[e12];
                          i3.allowCredentials[e12] = Object.assign(Object.assign({}, t12), { id: nd(t12.id).buffer, type: t12.type || "public-key", transports: t12.transports });
                        }
                      }
                      return i3;
                    }(a2.webauthn.credential_options.publicKey) }) }) }), error: null };
                }
              });
            } catch (e11) {
              if (r4(e11)) return this._returnResult({ data: null, error: e11 });
              throw e11;
            }
          });
        }
        async _challengeAndVerify(e10) {
          let { data: t10, error: r10 } = await this._challenge({ factorId: e10.factorId });
          return r10 ? this._returnResult({ data: null, error: r10 }) : await this._verify({ factorId: e10.factorId, challengeId: t10.id, code: e10.code });
        }
        async _listFactors() {
          var e10;
          let { data: { user: t10 }, error: r10 } = await this.getUser();
          if (r10) return { data: null, error: r10 };
          let n10 = { all: [], phone: [], totp: [], webauthn: [] };
          for (let r11 of null != (e10 = null == t10 ? void 0 : t10.factors) ? e10 : []) n10.all.push(r11), "verified" === r11.status && n10[r11.factor_type].push(r11);
          return { data: n10, error: null };
        }
        async _getAuthenticatorAssuranceLevel() {
          var e10, t10;
          let { data: { session: r10 }, error: n10 } = await this.getSession();
          if (n10) return this._returnResult({ data: null, error: n10 });
          if (!r10) return { data: { currentLevel: null, nextLevel: null, currentAuthenticationMethods: [] }, error: null };
          let { payload: s2 } = nb(r10.access_token), i2 = null;
          s2.aal && (i2 = s2.aal);
          let a2 = i2;
          return (null != (t10 = null == (e10 = r10.user.factors) ? void 0 : e10.filter((e11) => "verified" === e11.status)) ? t10 : []).length > 0 && (a2 = "aal2"), { data: { currentLevel: i2, nextLevel: a2, currentAuthenticationMethods: s2.amr || [] }, error: null };
        }
        async _getAuthorizationDetails(e10) {
          try {
            return await this._useSession(async (t10) => {
              let { data: { session: r10 }, error: n10 } = t10;
              return n10 ? this._returnResult({ data: null, error: n10 }) : r10 ? await nI(this.fetch, "GET", `${this.url}/oauth/authorizations/${e10}`, { headers: this.headers, jwt: r10.access_token, xform: (e11) => ({ data: e11, error: null }) }) : this._returnResult({ data: null, error: new r9() });
            });
          } catch (e11) {
            if (r4(e11)) return this._returnResult({ data: null, error: e11 });
            throw e11;
          }
        }
        async _approveAuthorization(e10, t10) {
          try {
            return await this._useSession(async (t11) => {
              let { data: { session: r10 }, error: n10 } = t11;
              if (n10) return this._returnResult({ data: null, error: n10 });
              if (!r10) return this._returnResult({ data: null, error: new r9() });
              let s2 = await nI(this.fetch, "POST", `${this.url}/oauth/authorizations/${e10}/consent`, { headers: this.headers, jwt: r10.access_token, body: { action: "approve" }, xform: (e11) => ({ data: e11, error: null }) });
              return s2.data && s2.data.redirect_url, s2;
            });
          } catch (e11) {
            if (r4(e11)) return this._returnResult({ data: null, error: e11 });
            throw e11;
          }
        }
        async _denyAuthorization(e10, t10) {
          try {
            return await this._useSession(async (t11) => {
              let { data: { session: r10 }, error: n10 } = t11;
              if (n10) return this._returnResult({ data: null, error: n10 });
              if (!r10) return this._returnResult({ data: null, error: new r9() });
              let s2 = await nI(this.fetch, "POST", `${this.url}/oauth/authorizations/${e10}/consent`, { headers: this.headers, jwt: r10.access_token, body: { action: "deny" }, xform: (e11) => ({ data: e11, error: null }) });
              return s2.data && s2.data.redirect_url, s2;
            });
          } catch (e11) {
            if (r4(e11)) return this._returnResult({ data: null, error: e11 });
            throw e11;
          }
        }
        async _listOAuthGrants() {
          try {
            return await this._useSession(async (e10) => {
              let { data: { session: t10 }, error: r10 } = e10;
              return r10 ? this._returnResult({ data: null, error: r10 }) : t10 ? await nI(this.fetch, "GET", `${this.url}/user/oauth/grants`, { headers: this.headers, jwt: t10.access_token, xform: (e11) => ({ data: e11, error: null }) }) : this._returnResult({ data: null, error: new r9() });
            });
          } catch (e10) {
            if (r4(e10)) return this._returnResult({ data: null, error: e10 });
            throw e10;
          }
        }
        async _revokeOAuthGrant(e10) {
          try {
            return await this._useSession(async (t10) => {
              let { data: { session: r10 }, error: n10 } = t10;
              return n10 ? this._returnResult({ data: null, error: n10 }) : r10 ? (await nI(this.fetch, "DELETE", `${this.url}/user/oauth/grants`, { headers: this.headers, jwt: r10.access_token, query: { client_id: e10.clientId }, noResolveJson: true }), { data: {}, error: null }) : this._returnResult({ data: null, error: new r9() });
            });
          } catch (e11) {
            if (r4(e11)) return this._returnResult({ data: null, error: e11 });
            throw e11;
          }
        }
        async fetchJwk(e10, t10 = { keys: [] }) {
          let r10 = t10.keys.find((t11) => t11.kid === e10);
          if (r10) return r10;
          let n10 = Date.now();
          if ((r10 = this.jwks.keys.find((t11) => t11.kid === e10)) && this.jwks_cached_at + 6e5 > n10) return r10;
          let { data: s2, error: i2 } = await nI(this.fetch, "GET", `${this.url}/.well-known/jwks.json`, { headers: this.headers });
          if (i2) throw i2;
          return s2.keys && 0 !== s2.keys.length && (this.jwks = s2, this.jwks_cached_at = n10, r10 = s2.keys.find((t11) => t11.kid === e10)) ? r10 : null;
        }
        async getClaims(e10, t10 = {}) {
          try {
            var r10;
            let n10, s2 = e10;
            if (!s2) {
              let { data: e11, error: t11 } = await this.getSession();
              if (t11 || !e11.session) return this._returnResult({ data: null, error: t11 });
              s2 = e11.session.access_token;
            }
            let { header: i2, payload: a2, signature: o2, raw: { header: l2, payload: u2 } } = nb(s2);
            (null == t10 ? void 0 : t10.allowExpired) || function(e11) {
              if (!e11) throw Error("Missing exp claim");
              if (e11 <= Math.floor(Date.now() / 1e3)) throw Error("JWT has expired");
            }(a2.exp);
            let c2 = !i2.alg || i2.alg.startsWith("HS") || !i2.kid || !("crypto" in globalThis && "subtle" in globalThis.crypto) ? null : await this.fetchJwk(i2.kid, (null == t10 ? void 0 : t10.keys) ? { keys: t10.keys } : null == t10 ? void 0 : t10.jwks);
            if (!c2) {
              let { error: e11 } = await this.getUser(s2);
              if (e11) throw e11;
              return { data: { claims: a2, header: i2, signature: o2 }, error: null };
            }
            let h2 = function(e11) {
              switch (e11) {
                case "RS256":
                  return { name: "RSASSA-PKCS1-v1_5", hash: { name: "SHA-256" } };
                case "ES256":
                  return { name: "ECDSA", namedCurve: "P-256", hash: { name: "SHA-256" } };
                default:
                  throw Error("Invalid alg claim");
              }
            }(i2.alg), d2 = await crypto.subtle.importKey("jwk", c2, h2, true, ["verify"]);
            if (!await crypto.subtle.verify(h2, d2, o2, (r10 = `${l2}.${u2}`, n10 = [], !function(e11, t11) {
              for (let r11 = 0; r11 < e11.length; r11 += 1) {
                let n11 = e11.charCodeAt(r11);
                if (n11 > 55295 && n11 <= 56319) {
                  let t12 = (n11 - 55296) * 1024 & 65535;
                  n11 = (e11.charCodeAt(r11 + 1) - 56320 & 65535 | t12) + 65536, r11 += 1;
                }
                !function(e12, t12) {
                  if (e12 <= 127) return t12(e12);
                  if (e12 <= 2047) {
                    t12(192 | e12 >> 6), t12(128 | 63 & e12);
                    return;
                  }
                  if (e12 <= 65535) {
                    t12(224 | e12 >> 12), t12(128 | e12 >> 6 & 63), t12(128 | 63 & e12);
                    return;
                  }
                  if (e12 <= 1114111) {
                    t12(240 | e12 >> 18), t12(128 | e12 >> 12 & 63), t12(128 | e12 >> 6 & 63), t12(128 | 63 & e12);
                    return;
                  }
                  throw Error(`Unrecognized Unicode codepoint: ${e12.toString(16)}`);
                }(n11, t11);
              }
            }(r10, (e11) => n10.push(e11)), new Uint8Array(n10)))) throw new ni("Invalid JWT signature");
            return { data: { claims: a2, header: i2, signature: o2 }, error: null };
          } catch (e11) {
            if (r4(e11)) return this._returnResult({ data: null, error: e11 });
            throw e11;
          }
        }
      }
      n5.nextInstanceID = {};
      let n6 = n5;
      class n8 extends n6 {
        constructor(e10) {
          super(e10);
        }
      }
      class n9 {
        constructor(e10, t10, r10) {
          var n10, s2, i2;
          this.supabaseUrl = e10, this.supabaseKey = t10;
          const a2 = function(e11) {
            let t11 = null == e11 ? void 0 : e11.trim();
            if (!t11) throw Error("supabaseUrl is required.");
            if (!t11.match(/^https?:\/\//i)) throw Error("Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL.");
            try {
              return new URL(t11.endsWith("/") ? t11 : t11 + "/");
            } catch (e12) {
              throw Error("Invalid supabaseUrl: Provided URL is malformed.");
            }
          }(e10);
          if (!t10) throw Error("supabaseKey is required.");
          this.realtimeUrl = new URL("realtime/v1", a2), this.realtimeUrl.protocol = this.realtimeUrl.protocol.replace("http", "ws"), this.authUrl = new URL("auth/v1", a2), this.storageUrl = new URL("storage/v1", a2), this.functionsUrl = new URL("functions/v1", a2);
          const o2 = `sb-${a2.hostname.split(".")[0]}-auth-token`, l2 = function(e11, t11) {
            var r11, n11;
            let { db: s3, auth: i3, realtime: a3, global: o3 } = e11, { db: l3, auth: u2, realtime: c2, global: h2 } = t11, d2 = { db: Object.assign(Object.assign({}, l3), s3), auth: Object.assign(Object.assign({}, u2), i3), realtime: Object.assign(Object.assign({}, c2), a3), storage: {}, global: Object.assign(Object.assign(Object.assign({}, h2), o3), { headers: Object.assign(Object.assign({}, null != (r11 = null == h2 ? void 0 : h2.headers) ? r11 : {}), null != (n11 = null == o3 ? void 0 : o3.headers) ? n11 : {}) }), accessToken: async () => "" };
            return e11.accessToken ? d2.accessToken = e11.accessToken : delete d2.accessToken, d2;
          }(null != r10 ? r10 : {}, { db: rJ, realtime: rY, auth: Object.assign(Object.assign({}, rX), { storageKey: o2 }), global: rG });
          this.storageKey = null != (n10 = l2.auth.storageKey) ? n10 : "", this.headers = null != (s2 = l2.global.headers) ? s2 : {}, l2.accessToken ? (this.accessToken = l2.accessToken, this.auth = new Proxy({}, { get: (e11, t11) => {
            throw Error(`@supabase/supabase-js: Supabase Client is configured with the accessToken option, accessing supabase.auth.${String(t11)} is not possible`);
          } })) : this.auth = this._initSupabaseAuthClient(null != (i2 = l2.auth) ? i2 : {}, this.headers, l2.global.fetch), this.fetch = /* @__PURE__ */ ((e11, t11, r11) => {
            let n11 = r11 ? (...e12) => r11(...e12) : (...e12) => fetch(...e12), s3 = Headers;
            return async (r12, i3) => {
              var a3;
              let o3 = null != (a3 = await t11()) ? a3 : e11, l3 = new s3(null == i3 ? void 0 : i3.headers);
              return l3.has("apikey") || l3.set("apikey", e11), l3.has("Authorization") || l3.set("Authorization", `Bearer ${o3}`), n11(r12, Object.assign(Object.assign({}, i3), { headers: l3 }));
            };
          })(t10, this._getAccessToken.bind(this), l2.global.fetch), this.realtime = this._initRealtimeClient(Object.assign({ headers: this.headers, accessToken: this._getAccessToken.bind(this) }, l2.realtime)), this.accessToken && this.accessToken().then((e11) => this.realtime.setAuth(e11)).catch((e11) => console.warn("Failed to set initial Realtime auth token:", e11)), this.rest = new tM(new URL("rest/v1", a2).href, { headers: this.headers, schema: l2.db.schema, fetch: this.fetch }), this.storage = new rF(this.storageUrl.href, this.headers, this.fetch, null == r10 ? void 0 : r10.storage), l2.accessToken || this._listenForAuthEvents();
        }
        get functions() {
          return new tq(this.functionsUrl.href, { headers: this.headers, customFetch: this.fetch });
        }
        from(e10) {
          return this.rest.from(e10);
        }
        schema(e10) {
          return this.rest.schema(e10);
        }
        rpc(e10, t10 = {}, r10 = { head: false, get: false, count: void 0 }) {
          return this.rest.rpc(e10, t10, r10);
        }
        channel(e10, t10 = { config: {} }) {
          return this.realtime.channel(e10, t10);
        }
        getChannels() {
          return this.realtime.getChannels();
        }
        removeChannel(e10) {
          return this.realtime.removeChannel(e10);
        }
        removeAllChannels() {
          return this.realtime.removeAllChannels();
        }
        async _getAccessToken() {
          var e10, t10;
          if (this.accessToken) return await this.accessToken();
          let { data: r10 } = await this.auth.getSession();
          return null != (t10 = null == (e10 = r10.session) ? void 0 : e10.access_token) ? t10 : this.supabaseKey;
        }
        _initSupabaseAuthClient({ autoRefreshToken: e10, persistSession: t10, detectSessionInUrl: r10, storage: n10, userStorage: s2, storageKey: i2, flowType: a2, lock: o2, debug: l2, throwOnError: u2 }, c2, h2) {
          let d2 = { Authorization: `Bearer ${this.supabaseKey}`, apikey: `${this.supabaseKey}` };
          return new n8({ url: this.authUrl.href, headers: Object.assign(Object.assign({}, d2), c2), storageKey: i2, autoRefreshToken: e10, persistSession: t10, detectSessionInUrl: r10, storage: n10, userStorage: s2, flowType: a2, lock: o2, debug: l2, throwOnError: u2, fetch: h2, hasCustomAuthorizationHeader: Object.keys(this.headers).some((e11) => "authorization" === e11.toLowerCase()) });
        }
        _initRealtimeClient(e10) {
          return new rn(this.realtimeUrl.href, Object.assign(Object.assign({}, e10), { params: Object.assign({ apikey: this.supabaseKey }, null == e10 ? void 0 : e10.params) }));
        }
        _listenForAuthEvents() {
          return this.auth.onAuthStateChange((e10, t10) => {
            this._handleTokenChanged(e10, "CLIENT", null == t10 ? void 0 : t10.access_token);
          });
        }
        _handleTokenChanged(e10, t10, r10) {
          ("TOKEN_REFRESHED" === e10 || "SIGNED_IN" === e10) && this.changedAccessToken !== r10 ? (this.changedAccessToken = r10, this.realtime.setAuth(r10)) : "SIGNED_OUT" === e10 && (this.realtime.setAuth(), "STORAGE" == t10 && this.auth.signOut(), this.changedAccessToken = void 0);
        }
      }
      (function() {
        if ("undefined" == typeof process) return false;
        let e10 = process.version;
        if (null == e10) return false;
        let t10 = e10.match(/^v(\d+)\./);
        return !!t10 && 18 >= parseInt(t10[1], 10);
      })() && console.warn(`\u26A0\uFE0F  Node.js 18 and below are deprecated and will no longer be supported in future versions of @supabase/supabase-js. Please upgrade to Node.js 20 or later. For more information, visit: https://github.com/orgs/supabase/discussions/37217`);
      var n7 = e.i(99929);
      n7.parse, n7.serialize;
      let se = { path: "/", sameSite: "lax", httpOnly: false, maxAge: 3456e4 }, st = /^(.*)[.](0|[1-9][0-9]*)$/;
      function sr(e10, t10) {
        if (e10 === t10) return true;
        let r10 = e10.match(st);
        return !!r10 && r10[1] === t10;
      }
      function sn(e10, t10, r10) {
        let n10 = r10 ?? 3180, s2 = encodeURIComponent(t10);
        if (s2.length <= n10) return [{ name: e10, value: t10 }];
        let i2 = [];
        for (; s2.length > 0; ) {
          let e11 = s2.slice(0, n10), t11 = e11.lastIndexOf("%");
          t11 > n10 - 3 && (e11 = e11.slice(0, t11));
          let r11 = "";
          for (; e11.length > 0; ) try {
            r11 = decodeURIComponent(e11);
            break;
          } catch (t12) {
            if (t12 instanceof URIError && "%" === e11.at(-3) && e11.length > 3) e11 = e11.slice(0, e11.length - 3);
            else throw t12;
          }
          i2.push(r11), s2 = s2.slice(e11.length);
        }
        return i2.map((t11, r11) => ({ name: `${e10}.${r11}`, value: t11 }));
      }
      async function ss(e10, t10) {
        let r10 = await t10(e10);
        if (r10) return r10;
        let n10 = [];
        for (let r11 = 0; ; r11++) {
          let s2 = `${e10}.${r11}`, i2 = await t10(s2);
          if (!i2) break;
          n10.push(i2);
        }
        return n10.length > 0 ? n10.join("") : null;
      }
      let si = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_".split(""), sa = " 	\n\r=".split(""), so = (() => {
        let e10 = Array(128);
        for (let t10 = 0; t10 < e10.length; t10 += 1) e10[t10] = -1;
        for (let t10 = 0; t10 < sa.length; t10 += 1) e10[sa[t10].charCodeAt(0)] = -2;
        for (let t10 = 0; t10 < si.length; t10 += 1) e10[si[t10].charCodeAt(0)] = t10;
        return e10;
      })();
      function sl(e10) {
        let t10 = [], r10 = 0, n10 = 0;
        if (function(e11, t11) {
          for (let r11 = 0; r11 < e11.length; r11 += 1) {
            let n11 = e11.charCodeAt(r11);
            if (n11 > 55295 && n11 <= 56319) {
              let t12 = (n11 - 55296) * 1024 & 65535;
              n11 = (e11.charCodeAt(r11 + 1) - 56320 & 65535 | t12) + 65536, r11 += 1;
            }
            !function(e12, t12) {
              if (e12 <= 127) return t12(e12);
              if (e12 <= 2047) {
                t12(192 | e12 >> 6), t12(128 | 63 & e12);
                return;
              }
              if (e12 <= 65535) {
                t12(224 | e12 >> 12), t12(128 | e12 >> 6 & 63), t12(128 | 63 & e12);
                return;
              }
              if (e12 <= 1114111) {
                t12(240 | e12 >> 18), t12(128 | e12 >> 12 & 63), t12(128 | e12 >> 6 & 63), t12(128 | 63 & e12);
                return;
              }
              throw Error(`Unrecognized Unicode codepoint: ${e12.toString(16)}`);
            }(n11, t11);
          }
        }(e10, (e11) => {
          for (r10 = r10 << 8 | e11, n10 += 8; n10 >= 6; ) {
            let e12 = r10 >> n10 - 6 & 63;
            t10.push(si[e12]), n10 -= 6;
          }
        }), n10 > 0) for (r10 <<= 6 - n10, n10 = 6; n10 >= 6; ) {
          let e11 = r10 >> n10 - 6 & 63;
          t10.push(si[e11]), n10 -= 6;
        }
        return t10.join("");
      }
      function su(e10) {
        let t10 = [], r10 = (e11) => {
          t10.push(String.fromCodePoint(e11));
        }, n10 = { utf8seq: 0, codepoint: 0 }, s2 = 0, i2 = 0;
        for (let t11 = 0; t11 < e10.length; t11 += 1) {
          let a2 = so[e10.charCodeAt(t11)];
          if (a2 > -1) for (s2 = s2 << 6 | a2, i2 += 6; i2 >= 8; ) (function(e11, t12, r11) {
            if (0 === t12.utf8seq) {
              if (e11 <= 127) return r11(e11);
              for (let r12 = 1; r12 < 6; r12 += 1) if ((e11 >> 7 - r12 & 1) == 0) {
                t12.utf8seq = r12;
                break;
              }
              if (2 === t12.utf8seq) t12.codepoint = 31 & e11;
              else if (3 === t12.utf8seq) t12.codepoint = 15 & e11;
              else if (4 === t12.utf8seq) t12.codepoint = 7 & e11;
              else throw Error("Invalid UTF-8 sequence");
              t12.utf8seq -= 1;
            } else if (t12.utf8seq > 0) {
              if (e11 <= 127) throw Error("Invalid UTF-8 sequence");
              t12.codepoint = t12.codepoint << 6 | 63 & e11, t12.utf8seq -= 1, 0 === t12.utf8seq && r11(t12.codepoint);
            }
          })(s2 >> i2 - 8 & 255, n10, r10), i2 -= 8;
          else if (-2 === a2) continue;
          else throw Error(`Invalid Base64-URL character "${e10.at(t11)}" at position ${t11}`);
        }
        return t10.join("");
      }
      let sc = "base64-";
      async function sh({ getAll: e10, setAll: t10, setItems: r10, removedItems: n10 }, s2) {
        let i2 = s2.cookieEncoding, a2 = s2.cookieOptions ?? null, o2 = await e10([...r10 ? Object.keys(r10) : [], ...n10 ? Object.keys(n10) : []]), l2 = o2?.map(({ name: e11 }) => e11) || [], u2 = Object.keys(n10).flatMap((e11) => l2.filter((t11) => sr(t11, e11))), c2 = Object.keys(r10).flatMap((e11) => {
          let t11 = new Set(l2.filter((t12) => sr(t12, e11))), n11 = r10[e11];
          "base64url" === i2 && (n11 = sc + sl(n11));
          let s3 = sn(e11, n11);
          return s3.forEach((e12) => {
            t11.delete(e12.name);
          }), u2.push(...t11), s3;
        }), h2 = { ...se, ...a2, maxAge: 0 }, d2 = { ...se, ...a2, maxAge: se.maxAge };
        delete h2.name, delete d2.name, await t10([...u2.map((e11) => ({ name: e11, value: "", options: h2 })), ...c2.map(({ name: e11, value: t11 }) => ({ name: e11, value: t11, options: d2 }))]);
      }
      if (e.i(39990), "undefined" != typeof process && process.env?.npm_package_name) {
        let e10 = process.env.npm_package_name;
        ["@supabase/auth-helpers-nextjs", "@supabase/auth-helpers-react", "@supabase/auth-helpers-remix", "@supabase/auth-helpers-sveltekit"].includes(e10) && console.warn(`
\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557
\u2551 \u26A0\uFE0F  IMPORTANT: Package Consolidation Notice                                \u2551
\u2551                                                                            \u2551
\u2551 The ${e10.padEnd(35)} package name is deprecated.  \u2551
\u2551                                                                            \u2551
\u2551 You are now using @supabase/ssr - a unified solution for all frameworks.  \u2551
\u2551                                                                            \u2551
\u2551 The auth-helpers packages have been consolidated into @supabase/ssr       \u2551
\u2551 to provide better maintenance and consistent APIs across frameworks.      \u2551
\u2551                                                                            \u2551
\u2551 Please update your package.json to use @supabase/ssr directly:            \u2551
\u2551   npm uninstall ${e10.padEnd(42)} \u2551
\u2551   npm install @supabase/ssr                                               \u2551
\u2551                                                                            \u2551
\u2551 For more information, visit:                                              \u2551
\u2551 https://supabase.com/docs/guides/auth/server-side                         \u2551
\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D
    `);
      }
      async function sd(e10) {
        let t10 = eE.next({ request: e10 }), r10 = function(e11, t11, r11) {
          if (!e11 || !t11) throw Error(`Your project's URL and Key are required to create a Supabase client!

Check your Supabase project's API settings to find these values

https://supabase.com/dashboard/project/_/settings/api`);
          let { storage: n11, getAll: s3, setAll: i3, setItems: a3, removedItems: o2 } = function(e12, t12) {
            let r12, n12, s4 = e12.cookies ?? null, i4 = e12.cookieEncoding, a4 = {}, o3 = {};
            if (s4) if ("get" in s4) {
              let e13 = async (e14) => {
                let t13 = e14.flatMap((e15) => [e15, ...Array.from({ length: 5 }).map((t14, r14) => `${e15}.${r14}`)]), r13 = [];
                for (let e15 = 0; e15 < t13.length; e15 += 1) {
                  let n13 = await s4.get(t13[e15]);
                  (n13 || "string" == typeof n13) && r13.push({ name: t13[e15], value: n13 });
                }
                return r13;
              };
              if (r12 = async (t13) => await e13(t13), "set" in s4 && "remove" in s4) n12 = async (e14) => {
                for (let t13 = 0; t13 < e14.length; t13 += 1) {
                  let { name: r13, value: n13, options: i5 } = e14[t13];
                  n13 ? await s4.set(r13, n13, i5) : await s4.remove(r13, i5);
                }
              };
              else if (t12) n12 = async () => {
                console.warn("@supabase/ssr: createServerClient was configured without set and remove cookie methods, but the client needs to set cookies. This can lead to issues such as random logouts, early session termination or increased token refresh requests. If in NextJS, check your middleware.ts file, route handlers and server actions for correctness. Consider switching to the getAll and setAll cookie methods instead of get, set and remove which are deprecated and can be difficult to use correctly.");
              };
              else throw Error("@supabase/ssr: createBrowserClient requires configuring a getAll and setAll cookie method (deprecated: alternatively both get, set and remove can be used)");
            } else if ("getAll" in s4) if (r12 = async () => await s4.getAll(), "setAll" in s4) n12 = s4.setAll;
            else if (t12) n12 = async () => {
              console.warn("@supabase/ssr: createServerClient was configured without the setAll cookie method, but the client needs to set cookies. This can lead to issues such as random logouts, early session termination or increased token refresh requests. If in NextJS, check your middleware.ts file, route handlers and server actions for correctness.");
            };
            else throw Error("@supabase/ssr: createBrowserClient requires configuring both getAll and setAll cookie methods (deprecated: alternatively both get, set and remove can be used)");
            else throw Error(`@supabase/ssr: ${t12 ? "createServerClient" : "createBrowserClient"} requires configuring getAll and setAll cookie methods (deprecated: alternatively use get, set and remove).`);
            else if (t12 || 1) if (t12) throw Error("@supabase/ssr: createServerClient must be initialized with cookie options that specify getAll and setAll functions (deprecated, not recommended: alternatively use get, set and remove)");
            else r12 = () => [], n12 = () => {
              throw Error("@supabase/ssr: createBrowserClient in non-browser runtimes (including Next.js pre-rendering mode) was not initialized cookie options that specify getAll and setAll functions (deprecated: alternatively use get, set and remove), but they were needed");
            };
            else r12 = () => {
              let e13;
              return Object.keys(e13 = (0, n7.parse)(document.cookie)).map((t13) => ({ name: t13, value: e13[t13] ?? "" }));
            }, n12 = (e13) => {
              e13.forEach(({ name: e14, value: t13, options: r13 }) => {
                document.cookie = (0, n7.serialize)(e14, t13, r13);
              });
            };
            return t12 ? { getAll: r12, setAll: n12, setItems: a4, removedItems: o3, storage: { isServer: true, getItem: async (e13) => {
              if ("string" == typeof a4[e13]) return a4[e13];
              if (o3[e13]) return null;
              let t13 = await r12([e13]), n13 = await ss(e13, async (e14) => {
                let r13 = t13?.find(({ name: t14 }) => t14 === e14) || null;
                return r13 ? r13.value : null;
              });
              if (!n13) return null;
              let s5 = n13;
              return "string" == typeof n13 && n13.startsWith(sc) && (s5 = su(n13.substring(sc.length))), s5;
            }, setItem: async (t13, s5) => {
              t13.endsWith("-code-verifier") && await sh({ getAll: r12, setAll: n12, setItems: { [t13]: s5 }, removedItems: {} }, { cookieOptions: e12?.cookieOptions ?? null, cookieEncoding: i4 }), a4[t13] = s5, delete o3[t13];
            }, removeItem: async (e13) => {
              delete a4[e13], o3[e13] = true;
            } } } : { getAll: r12, setAll: n12, setItems: a4, removedItems: o3, storage: { isServer: false, getItem: async (e13) => {
              let t13 = await r12([e13]), n13 = await ss(e13, async (e14) => {
                let r13 = t13?.find(({ name: t14 }) => t14 === e14) || null;
                return r13 ? r13.value : null;
              });
              if (!n13) return null;
              let s5 = n13;
              return n13.startsWith(sc) && (s5 = su(n13.substring(sc.length))), s5;
            }, setItem: async (t13, s5) => {
              let a5 = await r12([t13]), o4 = new Set((a5?.map(({ name: e13 }) => e13) || []).filter((e13) => sr(e13, t13))), l3 = s5;
              "base64url" === i4 && (l3 = sc + sl(s5));
              let u2 = sn(t13, l3);
              u2.forEach(({ name: e13 }) => {
                o4.delete(e13);
              });
              let c2 = { ...se, ...e12?.cookieOptions, maxAge: 0 }, h2 = { ...se, ...e12?.cookieOptions, maxAge: se.maxAge };
              delete c2.name, delete h2.name;
              let d2 = [...[...o4].map((e13) => ({ name: e13, value: "", options: c2 })), ...u2.map(({ name: e13, value: t14 }) => ({ name: e13, value: t14, options: h2 }))];
              d2.length > 0 && await n12(d2);
            }, removeItem: async (t13) => {
              let s5 = await r12([t13]), i5 = (s5?.map(({ name: e13 }) => e13) || []).filter((e13) => sr(e13, t13)), a5 = { ...se, ...e12?.cookieOptions, maxAge: 0 };
              delete a5.name, i5.length > 0 && await n12(i5.map((e13) => ({ name: e13, value: "", options: a5 })));
            } } };
          }({ ...r11, cookieEncoding: r11?.cookieEncoding ?? "base64url" }, true), l2 = new n9(e11, t11, { ...r11, global: { ...r11?.global, headers: { ...r11?.global?.headers, "X-Client-Info": "supabase-ssr/0.8.0 createServerClient" } }, auth: { ...r11?.cookieOptions?.name ? { storageKey: r11.cookieOptions.name } : null, ...r11?.auth, flowType: "pkce", autoRefreshToken: false, detectSessionInUrl: false, persistSession: true, storage: n11, ...r11?.cookies && "encode" in r11.cookies && "tokens-only" === r11.cookies.encode ? { userStorage: r11?.auth?.userStorage ?? /* @__PURE__ */ function(e12 = {}) {
            return { getItem: (t12) => e12[t12] || null, setItem: (t12, r12) => {
              e12[t12] = r12;
            }, removeItem: (t12) => {
              delete e12[t12];
            } };
          }() } : null } });
          return l2.auth.onAuthStateChange(async (e12) => {
            (Object.keys(a3).length > 0 || Object.keys(o2).length > 0) && ("SIGNED_IN" === e12 || "TOKEN_REFRESHED" === e12 || "USER_UPDATED" === e12 || "PASSWORD_RECOVERY" === e12 || "SIGNED_OUT" === e12 || "MFA_CHALLENGE_VERIFIED" === e12) && await sh({ getAll: s3, setAll: i3, setItems: a3, removedItems: o2 }, { cookieOptions: r11?.cookieOptions ?? null, cookieEncoding: r11?.cookieEncoding ?? "base64url" });
          }), l2;
        }("https://mpicqllpqtwfafqppwal.supabase.co", "sb_publishable_Nz8fiV2WC3Md7Sfw0YEe9Q_LiJ3fJs-", { cookies: { getAll: () => e10.cookies.getAll(), setAll(r11) {
          r11.forEach(({ name: t11, value: r12 }) => e10.cookies.set(t11, r12)), t10 = eE.next({ request: e10 }), r11.forEach(({ name: e11, value: r12, options: n11 }) => t10.cookies.set(e11, r12, { ...n11, sameSite: "lax", secure: true }));
        } } }), { data: n10 } = await r10.auth.getClaims(), s2 = n10?.claims ?? null, { data: i2 } = await r10.auth.getSession(), a2 = i2?.session?.access_token ?? null;
        return { supabaseResponse: t10, claims: s2, accessToken: a2 };
      }
      async function sf(e10) {
        let { pathname: t10 } = e10.nextUrl;
        if (t10.startsWith("/.well-known")) return eE.next();
        let r10 = ["/", "/auth/login", "/auth/signup", "/auth/callback", "/auth/finalize", "/auth/auth-code-error", "/api/auth/signout", "/legal", "/witness"].some((e11) => "/" === e11 ? "/" === t10 : t10 === e11 || t10.startsWith(e11 + "/")), n10 = ["/onboarding", "/billing/success", "/setup", "/checkout"].some((e11) => t10 === e11 || t10.startsWith(e11 + "/")), { supabaseResponse: s2, claims: i2 } = await sd(e10), a2 = i2?.sub ? i2 : null;
        if (r10 || n10) return s2;
        let o2 = t10.startsWith("/checkout/welcome");
        if (!a2) {
          if (o2) {
            let r12 = new URL("/auth/login", e10.url);
            return r12.searchParams.set("next", t10), eE.redirect(r12);
          }
          let r11 = new URL("/auth/login", e10.url);
          return eE.redirect(r11);
        }
        return s2;
      }
      e.s(["config", 0, { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"] }, "middleware", () => sf], 96592);
      var sp = e.i(96592);
      Object.values({ NOT_FOUND: 404, FORBIDDEN: 403, UNAUTHORIZED: 401 });
      let sg = { ...sp }, sm = "/middleware", sy = sg.middleware || sg.default;
      if ("function" != typeof sy) throw new class extends Error {
        constructor(e10) {
          super(e10), this.stack = "";
        }
      }(`The Middleware file "${sm}" must export a function named \`middleware\` or a default function.`);
      function sw(e10) {
        return tA({ ...e10, page: sm, handler: async (...e11) => {
          try {
            return await sy(...e11);
          } catch (s2) {
            let t10 = e11[0], r10 = new URL(t10.url), n10 = r10.pathname + r10.search;
            throw await a(s2, { path: n10, method: t10.method, headers: Object.fromEntries(t10.headers.entries()) }, { routerKind: "Pages Router", routePath: "/proxy", routeType: "proxy", revalidateReason: void 0 }), s2;
          }
        } });
      }
      e.s(["default", () => sw], 58217);
    }]);
  }
});

// .next/server/edge/chunks/turbopack-edge-wrapper_77d18414.js
var require_turbopack_edge_wrapper_77d18414 = __commonJS({
  ".next/server/edge/chunks/turbopack-edge-wrapper_77d18414.js"() {
    "use strict";
    (globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push(["chunks/turbopack-edge-wrapper_77d18414.js", { otherChunks: ["chunks/edge-wrapper_fa177864.js", "chunks/[root-of-the-server]__398964b2._.js"], runtimeModuleIds: [88912] }]), (() => {
      let e;
      if (!Array.isArray(globalThis.TURBOPACK)) return;
      let t = /* @__PURE__ */ new WeakMap();
      function r(e2, t2) {
        this.m = e2, this.e = t2;
      }
      let n = r.prototype, o = Object.prototype.hasOwnProperty, u = "undefined" != typeof Symbol && Symbol.toStringTag;
      function l(e2, t2, r2) {
        o.call(e2, t2) || Object.defineProperty(e2, t2, r2);
      }
      function i(e2, t2) {
        let r2 = e2[t2];
        return r2 || (r2 = a(t2), e2[t2] = r2), r2;
      }
      function a(e2) {
        return { exports: {}, error: void 0, id: e2, namespaceObject: void 0 };
      }
      function s(e2, t2) {
        l(e2, "__esModule", { value: true }), u && l(e2, u, { value: "Module" });
        let r2 = 0;
        for (; r2 < t2.length; ) {
          let n2 = t2[r2++], o2 = t2[r2++];
          if ("number" == typeof o2) if (0 === o2) l(e2, n2, { value: t2[r2++], enumerable: true, writable: false });
          else throw Error(`unexpected tag: ${o2}`);
          else "function" == typeof t2[r2] ? l(e2, n2, { get: o2, set: t2[r2++], enumerable: true }) : l(e2, n2, { get: o2, enumerable: true });
        }
        Object.seal(e2);
      }
      n.s = function(e2, t2) {
        let r2, n2;
        null != t2 ? n2 = (r2 = i(this.c, t2)).exports : (r2 = this.m, n2 = this.e), r2.namespaceObject = n2, s(n2, e2);
      }, n.j = function(e2, r2) {
        var n2, u2;
        let l2, a2, s2;
        null != r2 ? a2 = (l2 = i(this.c, r2)).exports : (l2 = this.m, a2 = this.e);
        let c2 = (n2 = l2, u2 = a2, (s2 = t.get(n2)) || (t.set(n2, s2 = []), n2.exports = n2.namespaceObject = new Proxy(u2, { get(e3, t2) {
          if (o.call(e3, t2) || "default" === t2 || "__esModule" === t2) return Reflect.get(e3, t2);
          for (let e4 of s2) {
            let r3 = Reflect.get(e4, t2);
            if (void 0 !== r3) return r3;
          }
        }, ownKeys(e3) {
          let t2 = Reflect.ownKeys(e3);
          for (let e4 of s2) for (let r3 of Reflect.ownKeys(e4)) "default" === r3 || t2.includes(r3) || t2.push(r3);
          return t2;
        } })), s2);
        "object" == typeof e2 && null !== e2 && c2.push(e2);
      }, n.v = function(e2, t2) {
        (null != t2 ? i(this.c, t2) : this.m).exports = e2;
      }, n.n = function(e2, t2) {
        let r2;
        (r2 = null != t2 ? i(this.c, t2) : this.m).exports = r2.namespaceObject = e2;
      };
      let c = Object.getPrototypeOf ? (e2) => Object.getPrototypeOf(e2) : (e2) => e2.__proto__, f = [null, c({}), c([]), c(c)];
      function d(e2, t2, r2) {
        let n2 = [], o2 = -1;
        for (let t3 = e2; ("object" == typeof t3 || "function" == typeof t3) && !f.includes(t3); t3 = c(t3)) for (let r3 of Object.getOwnPropertyNames(t3)) n2.push(r3, /* @__PURE__ */ function(e3, t4) {
          return () => e3[t4];
        }(e2, r3)), -1 === o2 && "default" === r3 && (o2 = n2.length - 1);
        return r2 && o2 >= 0 || (o2 >= 0 ? n2.splice(o2, 1, 0, e2) : n2.push("default", 0, e2)), s(t2, n2), t2;
      }
      function p(e2) {
        return "function" == typeof e2 ? function(...t2) {
          return e2.apply(this, t2);
        } : /* @__PURE__ */ Object.create(null);
      }
      function h(e2) {
        let t2 = S(e2, this.m);
        if (t2.namespaceObject) return t2.namespaceObject;
        let r2 = t2.exports;
        return t2.namespaceObject = d(r2, p(r2), r2 && r2.__esModule);
      }
      function m(e2) {
        return "string" == typeof e2 ? e2 : e2.path;
      }
      function b() {
        let e2, t2;
        return { promise: new Promise((r2, n2) => {
          t2 = n2, e2 = r2;
        }), resolve: e2, reject: t2 };
      }
      n.i = h, n.A = function(e2) {
        return this.r(e2)(h.bind(this));
      }, n.t = "function" == typeof __require ? __require : function() {
        throw Error("Unexpected use of runtime require");
      }, n.r = function(e2) {
        return S(e2, this.m).exports;
      }, n.f = function(e2) {
        function t2(t3) {
          if (o.call(e2, t3)) return e2[t3].module();
          let r2 = Error(`Cannot find module '${t3}'`);
          throw r2.code = "MODULE_NOT_FOUND", r2;
        }
        return t2.keys = () => Object.keys(e2), t2.resolve = (t3) => {
          if (o.call(e2, t3)) return e2[t3].id();
          let r2 = Error(`Cannot find module '${t3}'`);
          throw r2.code = "MODULE_NOT_FOUND", r2;
        }, t2.import = async (e3) => await t2(e3), t2;
      };
      let y = Symbol("turbopack queues"), O = Symbol("turbopack exports"), g = Symbol("turbopack error");
      function w(e2) {
        e2 && 1 !== e2.status && (e2.status = 1, e2.forEach((e3) => e3.queueCount--), e2.forEach((e3) => e3.queueCount-- ? e3.queueCount++ : e3()));
      }
      n.a = function(e2, t2) {
        let r2 = this.m, n2 = t2 ? Object.assign([], { status: -1 }) : void 0, o2 = /* @__PURE__ */ new Set(), { resolve: u2, reject: l2, promise: i2 } = b(), a2 = Object.assign(i2, { [O]: r2.exports, [y]: (e3) => {
          n2 && e3(n2), o2.forEach(e3), a2.catch(() => {
          });
        } }), s2 = { get: () => a2, set(e3) {
          e3 !== a2 && (a2[O] = e3);
        } };
        Object.defineProperty(r2, "exports", s2), Object.defineProperty(r2, "namespaceObject", s2), e2(function(e3) {
          let t3 = e3.map((e4) => {
            if (null !== e4 && "object" == typeof e4) {
              if (y in e4) return e4;
              if (null != e4 && "object" == typeof e4 && "then" in e4 && "function" == typeof e4.then) {
                let t4 = Object.assign([], { status: 0 }), r4 = { [O]: {}, [y]: (e5) => e5(t4) };
                return e4.then((e5) => {
                  r4[O] = e5, w(t4);
                }, (e5) => {
                  r4[g] = e5, w(t4);
                }), r4;
              }
            }
            return { [O]: e4, [y]: () => {
            } };
          }), r3 = () => t3.map((e4) => {
            if (e4[g]) throw e4[g];
            return e4[O];
          }), { promise: u3, resolve: l3 } = b(), i3 = Object.assign(() => l3(r3), { queueCount: 0 });
          function a3(e4) {
            e4 !== n2 && !o2.has(e4) && (o2.add(e4), e4 && 0 === e4.status && (i3.queueCount++, e4.push(i3)));
          }
          return t3.map((e4) => e4[y](a3)), i3.queueCount ? u3 : r3();
        }, function(e3) {
          e3 ? l2(a2[g] = e3) : u2(a2[O]), w(n2);
        }), n2 && -1 === n2.status && (n2.status = 0);
      };
      let j = function(e2) {
        let t2 = new URL(e2, "x:/"), r2 = {};
        for (let e3 in t2) r2[e3] = t2[e3];
        for (let t3 in r2.href = e2, r2.pathname = e2.replace(/[?#].*/, ""), r2.origin = r2.protocol = "", r2.toString = r2.toJSON = (...t4) => e2, r2) Object.defineProperty(this, t3, { enumerable: true, configurable: true, value: r2[t3] });
      };
      function C(e2, t2) {
        throw Error(`Invariant: ${t2(e2)}`);
      }
      j.prototype = URL.prototype, n.U = j, n.z = function(e2) {
        throw Error("dynamic usage of require is not supported");
      }, n.g = globalThis;
      let _ = r.prototype;
      var k, R = ((k = R || {})[k.Runtime = 0] = "Runtime", k[k.Parent = 1] = "Parent", k[k.Update = 2] = "Update", k);
      let U = /* @__PURE__ */ new Map();
      n.M = U;
      let v = /* @__PURE__ */ new Map(), P = /* @__PURE__ */ new Map();
      async function T(e2, t2, r2) {
        let n2;
        if ("string" == typeof r2) return M(e2, t2, x(r2));
        let o2 = r2.included || [], u2 = o2.map((e3) => !!U.has(e3) || v.get(e3));
        if (u2.length > 0 && u2.every((e3) => e3)) return void await Promise.all(u2);
        let l2 = r2.moduleChunks || [], i2 = l2.map((e3) => P.get(e3)).filter((e3) => e3);
        if (i2.length > 0) {
          if (i2.length === l2.length) return void await Promise.all(i2);
          let r3 = /* @__PURE__ */ new Set();
          for (let e3 of l2) P.has(e3) || r3.add(e3);
          for (let n3 of r3) {
            let r4 = M(e2, t2, x(n3));
            P.set(n3, r4), i2.push(r4);
          }
          n2 = Promise.all(i2);
        } else {
          for (let o3 of (n2 = M(e2, t2, x(r2.path)), l2)) P.has(o3) || P.set(o3, n2);
        }
        for (let e3 of o2) v.has(e3) || v.set(e3, n2);
        await n2;
      }
      _.l = function(e2) {
        return T(1, this.m.id, e2);
      };
      let $ = Promise.resolve(void 0), E = /* @__PURE__ */ new WeakMap();
      function M(t2, r2, n2) {
        let o2 = e.loadChunkCached(t2, n2), u2 = E.get(o2);
        if (void 0 === u2) {
          let e2 = E.set.bind(E, o2, $);
          u2 = o2.then(e2).catch((e3) => {
            let o3;
            switch (t2) {
              case 0:
                o3 = `as a runtime dependency of chunk ${r2}`;
                break;
              case 1:
                o3 = `from module ${r2}`;
                break;
              case 2:
                o3 = "from an HMR update";
                break;
              default:
                C(t2, (e4) => `Unknown source type: ${e4}`);
            }
            throw Error(`Failed to load chunk ${n2} ${o3}${e3 ? `: ${e3}` : ""}`, e3 ? { cause: e3 } : void 0);
          }), E.set(o2, u2);
        }
        return u2;
      }
      function x(e2) {
        return `${e2.split("/").map((e3) => encodeURIComponent(e3)).join("/")}`;
      }
      _.L = function(e2) {
        return M(1, this.m.id, e2);
      }, _.R = function(e2) {
        let t2 = this.r(e2);
        return t2?.default ?? t2;
      }, _.P = function(e2) {
        return `/ROOT/${e2 ?? ""}`;
      }, _.b = function(e2) {
        let t2 = new Blob([`self.TURBOPACK_WORKER_LOCATION = ${JSON.stringify(location.origin)};
self.TURBOPACK_NEXT_CHUNK_URLS = ${JSON.stringify(e2.reverse().map(x), null, 2)};
importScripts(...self.TURBOPACK_NEXT_CHUNK_URLS.map(c => self.TURBOPACK_WORKER_LOCATION + c).reverse());`], { type: "text/javascript" });
        return URL.createObjectURL(t2);
      };
      let A = /\.js(?:\?[^#]*)?(?:#.*)?$/;
      n.w = function(t2, r2, n2) {
        return e.loadWebAssembly(1, this.m.id, t2, r2, n2);
      }, n.u = function(t2, r2) {
        return e.loadWebAssemblyModule(1, this.m.id, t2, r2);
      };
      let K = {};
      n.c = K;
      let S = (e2, t2) => {
        let r2 = K[e2];
        if (r2) {
          if (r2.error) throw r2.error;
          return r2;
        }
        return N(e2, R.Parent, t2.id);
      };
      function N(e2, t2, n2) {
        let o2 = U.get(e2);
        if ("function" != typeof o2) throw Error(function(e3, t3, r2) {
          let n3;
          switch (t3) {
            case 0:
              n3 = `as a runtime entry of chunk ${r2}`;
              break;
            case 1:
              n3 = `because it was required from module ${r2}`;
              break;
            case 2:
              n3 = "because of an HMR update";
              break;
            default:
              C(t3, (e4) => `Unknown source type: ${e4}`);
          }
          return `Module ${e3} was instantiated ${n3}, but the module factory is not available.`;
        }(e2, t2, n2));
        let u2 = a(e2), l2 = u2.exports;
        K[e2] = u2;
        let i2 = new r(u2, l2);
        try {
          o2(i2, u2, l2);
        } catch (e3) {
          throw u2.error = e3, e3;
        }
        return u2.namespaceObject && u2.exports !== u2.namespaceObject && d(u2.exports, u2.namespaceObject), u2;
      }
      function q(t2) {
        let r2, n2 = function(e2) {
          if ("string" == typeof e2) return e2;
          let t3 = decodeURIComponent(("undefined" != typeof TURBOPACK_NEXT_CHUNK_URLS ? TURBOPACK_NEXT_CHUNK_URLS.pop() : e2.getAttribute("src")).replace(/[?#].*$/, ""));
          return t3.startsWith("") ? t3.slice(0) : t3;
        }(t2[0]);
        return 2 === t2.length ? r2 = t2[1] : (r2 = void 0, !function(e2, t3, r3, n3) {
          let o2 = 1;
          for (; o2 < e2.length; ) {
            let t4 = e2[o2], n4 = o2 + 1;
            for (; n4 < e2.length && "function" != typeof e2[n4]; ) n4++;
            if (n4 === e2.length) throw Error("malformed chunk format, expected a factory function");
            if (!r3.has(t4)) {
              let u2 = e2[n4];
              for (Object.defineProperty(u2, "name", { value: "module evaluation" }); o2 < n4; o2++) t4 = e2[o2], r3.set(t4, u2);
            }
            o2 = n4 + 1;
          }
        }(t2, 0, U)), e.registerChunk(n2, r2);
      }
      function L(e2, t2, r2 = false) {
        let n2;
        try {
          n2 = t2();
        } catch (t3) {
          throw Error(`Failed to load external module ${e2}: ${t3}`);
        }
        return !r2 || n2.__esModule ? n2 : d(n2, p(n2), true);
      }
      n.y = async function(e2) {
        let t2;
        try {
          t2 = await import(e2);
        } catch (t3) {
          throw Error(`Failed to load external module ${e2}: ${t3}`);
        }
        return t2 && t2.__esModule && t2.default && "default" in t2.default ? d(t2.default, p(t2), true) : t2;
      }, L.resolve = (e2, t2) => __require.resolve(e2, t2), n.x = L, e = { registerChunk(e2, t2) {
        B.add(e2), function(e3) {
          let t3 = W.get(e3);
          if (null != t3) {
            for (let r2 of t3) r2.requiredChunks.delete(e3), 0 === r2.requiredChunks.size && I(r2.runtimeModuleIds, r2.chunkPath);
            W.delete(e3);
          }
        }(e2), null != t2 && (0 === t2.otherChunks.length ? I(t2.runtimeModuleIds, e2) : function(e3, t3, r2) {
          let n2 = /* @__PURE__ */ new Set(), o2 = { runtimeModuleIds: r2, chunkPath: e3, requiredChunks: n2 };
          for (let e4 of t3) {
            let t4 = m(e4);
            if (B.has(t4)) continue;
            n2.add(t4);
            let r3 = W.get(t4);
            null == r3 && (r3 = /* @__PURE__ */ new Set(), W.set(t4, r3)), r3.add(o2);
          }
          0 === o2.requiredChunks.size && I(o2.runtimeModuleIds, o2.chunkPath);
        }(e2, t2.otherChunks.filter((e3) => {
          var t3;
          return t3 = m(e3), A.test(t3);
        }), t2.runtimeModuleIds));
      }, loadChunkCached(e2, t2) {
        throw Error("chunk loading is not supported");
      }, async loadWebAssembly(e2, t2, r2, n2, o2) {
        let u2 = await H(r2, n2);
        return await WebAssembly.instantiate(u2, o2);
      }, loadWebAssemblyModule: async (e2, t2, r2, n2) => H(r2, n2) };
      let B = /* @__PURE__ */ new Set(), W = /* @__PURE__ */ new Map();
      function I(e2, t2) {
        for (let r2 of e2) !function(e3, t3) {
          let r3 = K[t3];
          if (r3) {
            if (r3.error) throw r3.error;
            return;
          }
          N(t3, R.Runtime, e3);
        }(t2, r2);
      }
      async function H(e2, t2) {
        let r2;
        try {
          r2 = t2();
        } catch (e3) {
        }
        if (!r2) throw Error(`dynamically loading WebAssembly is not supported in this runtime as global was not injected for chunk '${e2}'`);
        return r2;
      }
      let F = globalThis.TURBOPACK;
      globalThis.TURBOPACK = { push: q }, F.forEach(q);
    })();
  }
});

// node_modules/@opennextjs/aws/dist/core/edgeFunctionHandler.js
var edgeFunctionHandler_exports = {};
__export(edgeFunctionHandler_exports, {
  default: () => edgeFunctionHandler
});
async function edgeFunctionHandler(request) {
  const path3 = new URL(request.url).pathname;
  const routes = globalThis._ROUTES;
  const correspondingRoute = routes.find((route) => route.regex.some((r) => new RegExp(r).test(path3)));
  if (!correspondingRoute) {
    throw new Error(`No route found for ${request.url}`);
  }
  const entry = await self._ENTRIES[`middleware_${correspondingRoute.name}`];
  const result = await entry.default({
    page: correspondingRoute.page,
    request: {
      ...request,
      page: {
        name: correspondingRoute.name
      }
    }
  });
  globalThis.__openNextAls.getStore()?.pendingPromiseRunner.add(result.waitUntil);
  const response = result.response;
  return response;
}
var init_edgeFunctionHandler = __esm({
  "node_modules/@opennextjs/aws/dist/core/edgeFunctionHandler.js"() {
    globalThis._ENTRIES = {};
    globalThis.self = globalThis;
    globalThis._ROUTES = [{ "name": "middleware", "page": "/", "regex": ["^(?:\\/(_next\\/data\\/[^/]{1,}))?(?:\\/((?!_next\\/static|_next\\/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*))(\\\\.json)?[\\/#\\?]?$"] }];
    require_edge_wrapper_fa177864();
    require_root_of_the_server_398964b2();
    require_turbopack_edge_wrapper_77d18414();
  }
});

// node_modules/@opennextjs/aws/dist/utils/promise.js
init_logger();
var DetachedPromise = class {
  resolve;
  reject;
  promise;
  constructor() {
    let resolve;
    let reject;
    this.promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    this.resolve = resolve;
    this.reject = reject;
  }
};
var DetachedPromiseRunner = class {
  promises = [];
  withResolvers() {
    const detachedPromise = new DetachedPromise();
    this.promises.push(detachedPromise);
    return detachedPromise;
  }
  add(promise) {
    const detachedPromise = new DetachedPromise();
    this.promises.push(detachedPromise);
    promise.then(detachedPromise.resolve, detachedPromise.reject);
  }
  async await() {
    debug(`Awaiting ${this.promises.length} detached promises`);
    const results = await Promise.allSettled(this.promises.map((p) => p.promise));
    const rejectedPromises = results.filter((r) => r.status === "rejected");
    rejectedPromises.forEach((r) => {
      error(r.reason);
    });
  }
};
async function awaitAllDetachedPromise() {
  const store = globalThis.__openNextAls.getStore();
  const promisesToAwait = store?.pendingPromiseRunner.await() ?? Promise.resolve();
  if (store?.waitUntil) {
    store.waitUntil(promisesToAwait);
    return;
  }
  await promisesToAwait;
}
function provideNextAfterProvider() {
  const NEXT_REQUEST_CONTEXT_SYMBOL = Symbol.for("@next/request-context");
  const VERCEL_REQUEST_CONTEXT_SYMBOL = Symbol.for("@vercel/request-context");
  const store = globalThis.__openNextAls.getStore();
  const waitUntil = store?.waitUntil ?? ((promise) => store?.pendingPromiseRunner.add(promise));
  const nextAfterContext = {
    get: () => ({
      waitUntil
    })
  };
  globalThis[NEXT_REQUEST_CONTEXT_SYMBOL] = nextAfterContext;
  if (process.env.EMULATE_VERCEL_REQUEST_CONTEXT) {
    globalThis[VERCEL_REQUEST_CONTEXT_SYMBOL] = nextAfterContext;
  }
}
function runWithOpenNextRequestContext({ isISRRevalidation, waitUntil, requestId = Math.random().toString(36) }, fn) {
  return globalThis.__openNextAls.run({
    requestId,
    pendingPromiseRunner: new DetachedPromiseRunner(),
    isISRRevalidation,
    waitUntil,
    writtenTags: /* @__PURE__ */ new Set()
  }, async () => {
    provideNextAfterProvider();
    let result;
    try {
      result = await fn();
    } finally {
      await awaitAllDetachedPromise();
    }
    return result;
  });
}

// node_modules/@opennextjs/aws/dist/adapters/middleware.js
init_logger();

// node_modules/@opennextjs/aws/dist/core/createGenericHandler.js
init_logger();

// node_modules/@opennextjs/aws/dist/core/resolve.js
async function resolveConverter(converter2) {
  if (typeof converter2 === "function") {
    return converter2();
  }
  const m_1 = await Promise.resolve().then(() => (init_edge(), edge_exports));
  return m_1.default;
}
async function resolveWrapper(wrapper) {
  if (typeof wrapper === "function") {
    return wrapper();
  }
  const m_1 = await Promise.resolve().then(() => (init_cloudflare_edge(), cloudflare_edge_exports));
  return m_1.default;
}
async function resolveOriginResolver(originResolver) {
  if (typeof originResolver === "function") {
    return originResolver();
  }
  const m_1 = await Promise.resolve().then(() => (init_pattern_env(), pattern_env_exports));
  return m_1.default;
}
async function resolveAssetResolver(assetResolver) {
  if (typeof assetResolver === "function") {
    return assetResolver();
  }
  const m_1 = await Promise.resolve().then(() => (init_dummy(), dummy_exports));
  return m_1.default;
}
async function resolveProxyRequest(proxyRequest) {
  if (typeof proxyRequest === "function") {
    return proxyRequest();
  }
  const m_1 = await Promise.resolve().then(() => (init_fetch(), fetch_exports));
  return m_1.default;
}

// node_modules/@opennextjs/aws/dist/core/createGenericHandler.js
async function createGenericHandler(handler3) {
  const config = await import("./open-next.config.mjs").then((m) => m.default);
  globalThis.openNextConfig = config;
  const handlerConfig = config[handler3.type];
  const override = handlerConfig && "override" in handlerConfig ? handlerConfig.override : void 0;
  const converter2 = await resolveConverter(override?.converter);
  const { name, wrapper } = await resolveWrapper(override?.wrapper);
  debug("Using wrapper", name);
  return wrapper(handler3.handler, converter2);
}

// node_modules/@opennextjs/aws/dist/core/routing/util.js
import crypto2 from "node:crypto";
import { parse as parseQs, stringify as stringifyQs } from "node:querystring";

// node_modules/@opennextjs/aws/dist/adapters/config/index.js
init_logger();
import path from "node:path";
globalThis.__dirname ??= "";
var NEXT_DIR = path.join(__dirname, ".next");
var OPEN_NEXT_DIR = path.join(__dirname, ".open-next");
debug({ NEXT_DIR, OPEN_NEXT_DIR });
var NextConfig = { "env": {}, "webpack": null, "typescript": { "ignoreBuildErrors": false }, "typedRoutes": false, "distDir": ".next", "cleanDistDir": true, "assetPrefix": "", "cacheMaxMemorySize": 52428800, "configOrigin": "next.config.ts", "useFileSystemPublicRoutes": true, "generateEtags": true, "pageExtensions": ["tsx", "ts", "jsx", "js"], "poweredByHeader": true, "compress": true, "images": { "deviceSizes": [640, 750, 828, 1080, 1200, 1920, 2048, 3840], "imageSizes": [32, 48, 64, 96, 128, 256, 384], "path": "/_next/image", "loader": "default", "loaderFile": "", "domains": [], "disableStaticImages": false, "minimumCacheTTL": 14400, "formats": ["image/webp"], "maximumRedirects": 3, "dangerouslyAllowLocalIP": false, "dangerouslyAllowSVG": false, "contentSecurityPolicy": "script-src 'none'; frame-src 'none'; sandbox;", "contentDispositionType": "attachment", "localPatterns": [{ "pathname": "**", "search": "" }], "remotePatterns": [], "qualities": [75], "unoptimized": false }, "devIndicators": { "position": "bottom-left" }, "onDemandEntries": { "maxInactiveAge": 6e4, "pagesBufferLength": 5 }, "basePath": "", "sassOptions": {}, "trailingSlash": false, "i18n": null, "productionBrowserSourceMaps": false, "excludeDefaultMomentLocales": true, "reactProductionProfiling": false, "reactStrictMode": null, "reactMaxHeadersLength": 6e3, "httpAgentOptions": { "keepAlive": true }, "logging": {}, "compiler": {}, "expireTime": 31536e3, "staticPageGenerationTimeout": 60, "output": "standalone", "modularizeImports": { "@mui/icons-material": { "transform": "@mui/icons-material/{{member}}" }, "lodash": { "transform": "lodash/{{member}}" } }, "outputFileTracingRoot": "/Users/rinshin/Code/apps/youplus-web/web", "cacheComponents": false, "cacheLife": { "default": { "stale": 300, "revalidate": 900, "expire": 4294967294 }, "seconds": { "stale": 30, "revalidate": 1, "expire": 60 }, "minutes": { "stale": 300, "revalidate": 60, "expire": 3600 }, "hours": { "stale": 300, "revalidate": 3600, "expire": 86400 }, "days": { "stale": 300, "revalidate": 86400, "expire": 604800 }, "weeks": { "stale": 300, "revalidate": 604800, "expire": 2592e3 }, "max": { "stale": 300, "revalidate": 2592e3, "expire": 31536e3 } }, "cacheHandlers": {}, "experimental": { "useSkewCookie": false, "cssChunking": true, "multiZoneDraftMode": false, "appNavFailHandling": false, "prerenderEarlyExit": true, "serverMinification": true, "serverSourceMaps": false, "linkNoTouchStart": false, "caseSensitiveRoutes": false, "dynamicOnHover": false, "preloadEntriesOnStart": true, "clientRouterFilter": true, "clientRouterFilterRedirects": false, "fetchCacheKeyPrefix": "", "proxyPrefetch": "flexible", "optimisticClientCache": true, "manualClientBasePath": false, "cpus": 11, "memoryBasedWorkersCount": false, "imgOptConcurrency": null, "imgOptTimeoutInSeconds": 7, "imgOptMaxInputPixels": 268402689, "imgOptSequentialRead": null, "imgOptSkipMetadata": null, "isrFlushToDisk": true, "workerThreads": false, "optimizeCss": false, "nextScriptWorkers": false, "scrollRestoration": false, "externalDir": false, "disableOptimizedLoading": false, "gzipSize": true, "craCompat": false, "esmExternals": true, "fullySpecified": false, "swcTraceProfiling": false, "forceSwcTransforms": false, "largePageDataBytes": 128e3, "typedEnv": false, "parallelServerCompiles": false, "parallelServerBuildTraces": false, "ppr": false, "authInterrupts": false, "webpackMemoryOptimizations": false, "optimizeServerReact": true, "viewTransition": false, "removeUncaughtErrorAndRejectionListeners": false, "validateRSCRequestHeaders": false, "staleTimes": { "dynamic": 0, "static": 300 }, "reactDebugChannel": false, "serverComponentsHmrCache": true, "staticGenerationMaxConcurrency": 8, "staticGenerationMinPagesPerWorker": 25, "inlineCss": false, "useCache": false, "globalNotFound": false, "browserDebugInfoInTerminal": false, "lockDistDir": true, "isolatedDevBuild": true, "proxyClientMaxBodySize": 10485760, "hideLogsAfterAbort": false, "mcpServer": true, "optimizePackageImports": ["lucide-react", "date-fns", "lodash-es", "ramda", "antd", "react-bootstrap", "ahooks", "@ant-design/icons", "@headlessui/react", "@headlessui-float/react", "@heroicons/react/20/solid", "@heroicons/react/24/solid", "@heroicons/react/24/outline", "@visx/visx", "@tremor/react", "rxjs", "@mui/material", "@mui/icons-material", "recharts", "react-use", "effect", "@effect/schema", "@effect/platform", "@effect/platform-node", "@effect/platform-browser", "@effect/platform-bun", "@effect/sql", "@effect/sql-mssql", "@effect/sql-mysql2", "@effect/sql-pg", "@effect/sql-sqlite-node", "@effect/sql-sqlite-bun", "@effect/sql-sqlite-wasm", "@effect/sql-sqlite-react-native", "@effect/rpc", "@effect/rpc-http", "@effect/typeclass", "@effect/experimental", "@effect/opentelemetry", "@material-ui/core", "@material-ui/icons", "@tabler/icons-react", "mui-core", "react-icons/ai", "react-icons/bi", "react-icons/bs", "react-icons/cg", "react-icons/ci", "react-icons/di", "react-icons/fa", "react-icons/fa6", "react-icons/fc", "react-icons/fi", "react-icons/gi", "react-icons/go", "react-icons/gr", "react-icons/hi", "react-icons/hi2", "react-icons/im", "react-icons/io", "react-icons/io5", "react-icons/lia", "react-icons/lib", "react-icons/lu", "react-icons/md", "react-icons/pi", "react-icons/ri", "react-icons/rx", "react-icons/si", "react-icons/sl", "react-icons/tb", "react-icons/tfi", "react-icons/ti", "react-icons/vsc", "react-icons/wi"], "trustHostHeader": false, "isExperimentalCompile": false }, "htmlLimitedBots": "[\\w-]+-Google|Google-[\\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight", "bundlePagesRouterDependencies": false, "configFileName": "next.config.ts", "turbopack": { "root": "/Users/rinshin/Code/apps/youplus-web/web" }, "distDirRoot": ".next" };
var BuildId = "Hn_BOoXIsYT2Oz4WTsh9y";
var RoutesManifest = { "basePath": "", "rewrites": { "beforeFiles": [], "afterFiles": [], "fallback": [] }, "redirects": [{ "source": "/:path+/", "destination": "/:path+", "internal": true, "priority": true, "statusCode": 308, "regex": "^(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))/$" }], "routes": { "static": [{ "page": "/", "regex": "^/(?:/)?$", "routeKeys": {}, "namedRegex": "^/(?:/)?$" }, { "page": "/_global-error", "regex": "^/_global\\-error(?:/)?$", "routeKeys": {}, "namedRegex": "^/_global\\-error(?:/)?$" }, { "page": "/_not-found", "regex": "^/_not\\-found(?:/)?$", "routeKeys": {}, "namedRegex": "^/_not\\-found(?:/)?$" }, { "page": "/account/settings", "regex": "^/account/settings(?:/)?$", "routeKeys": {}, "namedRegex": "^/account/settings(?:/)?$" }, { "page": "/api/auth/signout", "regex": "^/api/auth/signout(?:/)?$", "routeKeys": {}, "namedRegex": "^/api/auth/signout(?:/)?$" }, { "page": "/auth/auth-code-error", "regex": "^/auth/auth\\-code\\-error(?:/)?$", "routeKeys": {}, "namedRegex": "^/auth/auth\\-code\\-error(?:/)?$" }, { "page": "/auth/callback", "regex": "^/auth/callback(?:/)?$", "routeKeys": {}, "namedRegex": "^/auth/callback(?:/)?$" }, { "page": "/auth/finalize", "regex": "^/auth/finalize(?:/)?$", "routeKeys": {}, "namedRegex": "^/auth/finalize(?:/)?$" }, { "page": "/auth/login", "regex": "^/auth/login(?:/)?$", "routeKeys": {}, "namedRegex": "^/auth/login(?:/)?$" }, { "page": "/auth/signup", "regex": "^/auth/signup(?:/)?$", "routeKeys": {}, "namedRegex": "^/auth/signup(?:/)?$" }, { "page": "/billing/success", "regex": "^/billing/success(?:/)?$", "routeKeys": {}, "namedRegex": "^/billing/success(?:/)?$" }, { "page": "/checkout", "regex": "^/checkout(?:/)?$", "routeKeys": {}, "namedRegex": "^/checkout(?:/)?$" }, { "page": "/checkout/welcome", "regex": "^/checkout/welcome(?:/)?$", "routeKeys": {}, "namedRegex": "^/checkout/welcome(?:/)?$" }, { "page": "/dashboard", "regex": "^/dashboard(?:/)?$", "routeKeys": {}, "namedRegex": "^/dashboard(?:/)?$" }, { "page": "/favicon.ico", "regex": "^/favicon\\.ico(?:/)?$", "routeKeys": {}, "namedRegex": "^/favicon\\.ico(?:/)?$" }, { "page": "/legal/privacy", "regex": "^/legal/privacy(?:/)?$", "routeKeys": {}, "namedRegex": "^/legal/privacy(?:/)?$" }, { "page": "/legal/terms", "regex": "^/legal/terms(?:/)?$", "routeKeys": {}, "namedRegex": "^/legal/terms(?:/)?$" }, { "page": "/onboarding", "regex": "^/onboarding(?:/)?$", "routeKeys": {}, "namedRegex": "^/onboarding(?:/)?$" }, { "page": "/onboarding/returning", "regex": "^/onboarding/returning(?:/)?$", "routeKeys": {}, "namedRegex": "^/onboarding/returning(?:/)?$" }, { "page": "/setup", "regex": "^/setup(?:/)?$", "routeKeys": {}, "namedRegex": "^/setup(?:/)?$" }, { "page": "/witness", "regex": "^/witness(?:/)?$", "routeKeys": {}, "namedRegex": "^/witness(?:/)?$" }], "dynamic": [], "data": { "static": [], "dynamic": [] } }, "locales": [] };
var ConfigHeaders = [];
var PrerenderManifest = { "version": 4, "routes": { "/_global-error": { "experimentalBypassFor": [{ "type": "header", "key": "next-action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": false, "srcRoute": "/_global-error", "dataRoute": "/_global-error.rsc", "prefetchDataRoute": null, "allowHeader": ["host", "x-matched-path", "x-prerender-revalidate", "x-prerender-revalidate-if-generated", "x-next-revalidated-tags", "x-next-revalidate-tag-token"] }, "/_not-found": { "initialStatus": 404, "experimentalBypassFor": [{ "type": "header", "key": "next-action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": false, "srcRoute": "/_not-found", "dataRoute": "/_not-found.rsc", "prefetchDataRoute": null, "allowHeader": ["host", "x-matched-path", "x-prerender-revalidate", "x-prerender-revalidate-if-generated", "x-next-revalidated-tags", "x-next-revalidate-tag-token"] }, "/account/settings": { "experimentalBypassFor": [{ "type": "header", "key": "next-action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": false, "srcRoute": "/account/settings", "dataRoute": "/account/settings.rsc", "prefetchDataRoute": null, "allowHeader": ["host", "x-matched-path", "x-prerender-revalidate", "x-prerender-revalidate-if-generated", "x-next-revalidated-tags", "x-next-revalidate-tag-token"] }, "/auth/auth-code-error": { "experimentalBypassFor": [{ "type": "header", "key": "next-action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": false, "srcRoute": "/auth/auth-code-error", "dataRoute": "/auth/auth-code-error.rsc", "prefetchDataRoute": null, "allowHeader": ["host", "x-matched-path", "x-prerender-revalidate", "x-prerender-revalidate-if-generated", "x-next-revalidated-tags", "x-next-revalidate-tag-token"] }, "/auth/finalize": { "experimentalBypassFor": [{ "type": "header", "key": "next-action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": false, "srcRoute": "/auth/finalize", "dataRoute": "/auth/finalize.rsc", "prefetchDataRoute": null, "allowHeader": ["host", "x-matched-path", "x-prerender-revalidate", "x-prerender-revalidate-if-generated", "x-next-revalidated-tags", "x-next-revalidate-tag-token"] }, "/auth/login": { "experimentalBypassFor": [{ "type": "header", "key": "next-action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": false, "srcRoute": "/auth/login", "dataRoute": "/auth/login.rsc", "prefetchDataRoute": null, "allowHeader": ["host", "x-matched-path", "x-prerender-revalidate", "x-prerender-revalidate-if-generated", "x-next-revalidated-tags", "x-next-revalidate-tag-token"] }, "/auth/signup": { "experimentalBypassFor": [{ "type": "header", "key": "next-action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": false, "srcRoute": "/auth/signup", "dataRoute": "/auth/signup.rsc", "prefetchDataRoute": null, "allowHeader": ["host", "x-matched-path", "x-prerender-revalidate", "x-prerender-revalidate-if-generated", "x-next-revalidated-tags", "x-next-revalidate-tag-token"] }, "/billing/success": { "experimentalBypassFor": [{ "type": "header", "key": "next-action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": false, "srcRoute": "/billing/success", "dataRoute": "/billing/success.rsc", "prefetchDataRoute": null, "allowHeader": ["host", "x-matched-path", "x-prerender-revalidate", "x-prerender-revalidate-if-generated", "x-next-revalidated-tags", "x-next-revalidate-tag-token"] }, "/checkout": { "experimentalBypassFor": [{ "type": "header", "key": "next-action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": false, "srcRoute": "/checkout", "dataRoute": "/checkout.rsc", "prefetchDataRoute": null, "allowHeader": ["host", "x-matched-path", "x-prerender-revalidate", "x-prerender-revalidate-if-generated", "x-next-revalidated-tags", "x-next-revalidate-tag-token"] }, "/checkout/welcome": { "experimentalBypassFor": [{ "type": "header", "key": "next-action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": false, "srcRoute": "/checkout/welcome", "dataRoute": "/checkout/welcome.rsc", "prefetchDataRoute": null, "allowHeader": ["host", "x-matched-path", "x-prerender-revalidate", "x-prerender-revalidate-if-generated", "x-next-revalidated-tags", "x-next-revalidate-tag-token"] }, "/dashboard": { "experimentalBypassFor": [{ "type": "header", "key": "next-action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": false, "srcRoute": "/dashboard", "dataRoute": "/dashboard.rsc", "prefetchDataRoute": null, "allowHeader": ["host", "x-matched-path", "x-prerender-revalidate", "x-prerender-revalidate-if-generated", "x-next-revalidated-tags", "x-next-revalidate-tag-token"] }, "/favicon.ico": { "initialHeaders": { "cache-control": "public, max-age=0, must-revalidate", "content-type": "image/x-icon", "x-next-cache-tags": "_N_T_/layout,_N_T_/favicon.ico/layout,_N_T_/favicon.ico/route,_N_T_/favicon.ico" }, "experimentalBypassFor": [{ "type": "header", "key": "next-action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": false, "srcRoute": "/favicon.ico", "dataRoute": null, "prefetchDataRoute": null, "allowHeader": ["host", "x-matched-path", "x-prerender-revalidate", "x-prerender-revalidate-if-generated", "x-next-revalidated-tags", "x-next-revalidate-tag-token"] }, "/legal/privacy": { "experimentalBypassFor": [{ "type": "header", "key": "next-action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": false, "srcRoute": "/legal/privacy", "dataRoute": "/legal/privacy.rsc", "prefetchDataRoute": null, "allowHeader": ["host", "x-matched-path", "x-prerender-revalidate", "x-prerender-revalidate-if-generated", "x-next-revalidated-tags", "x-next-revalidate-tag-token"] }, "/legal/terms": { "experimentalBypassFor": [{ "type": "header", "key": "next-action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": false, "srcRoute": "/legal/terms", "dataRoute": "/legal/terms.rsc", "prefetchDataRoute": null, "allowHeader": ["host", "x-matched-path", "x-prerender-revalidate", "x-prerender-revalidate-if-generated", "x-next-revalidated-tags", "x-next-revalidate-tag-token"] }, "/onboarding": { "experimentalBypassFor": [{ "type": "header", "key": "next-action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": false, "srcRoute": "/onboarding", "dataRoute": "/onboarding.rsc", "prefetchDataRoute": null, "allowHeader": ["host", "x-matched-path", "x-prerender-revalidate", "x-prerender-revalidate-if-generated", "x-next-revalidated-tags", "x-next-revalidate-tag-token"] }, "/onboarding/returning": { "experimentalBypassFor": [{ "type": "header", "key": "next-action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": false, "srcRoute": "/onboarding/returning", "dataRoute": "/onboarding/returning.rsc", "prefetchDataRoute": null, "allowHeader": ["host", "x-matched-path", "x-prerender-revalidate", "x-prerender-revalidate-if-generated", "x-next-revalidated-tags", "x-next-revalidate-tag-token"] }, "/": { "experimentalBypassFor": [{ "type": "header", "key": "next-action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": false, "srcRoute": "/", "dataRoute": "/index.rsc", "prefetchDataRoute": null, "allowHeader": ["host", "x-matched-path", "x-prerender-revalidate", "x-prerender-revalidate-if-generated", "x-next-revalidated-tags", "x-next-revalidate-tag-token"] }, "/setup": { "experimentalBypassFor": [{ "type": "header", "key": "next-action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": false, "srcRoute": "/setup", "dataRoute": "/setup.rsc", "prefetchDataRoute": null, "allowHeader": ["host", "x-matched-path", "x-prerender-revalidate", "x-prerender-revalidate-if-generated", "x-next-revalidated-tags", "x-next-revalidate-tag-token"] }, "/witness": { "experimentalBypassFor": [{ "type": "header", "key": "next-action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": false, "srcRoute": "/witness", "dataRoute": "/witness.rsc", "prefetchDataRoute": null, "allowHeader": ["host", "x-matched-path", "x-prerender-revalidate", "x-prerender-revalidate-if-generated", "x-next-revalidated-tags", "x-next-revalidate-tag-token"] } }, "dynamicRoutes": {}, "notFoundRoutes": [], "preview": { "previewModeId": "889061f372a7ae38e6cba45950dbcdbc", "previewModeSigningKey": "601fb093748957d5a9b2fc082f9e54b6331a091b95288b1452fbe35b4f3ed59d", "previewModeEncryptionKey": "baa587c01dbf66a1a5ceff436c9b64bcdd90e2d862f75749d4af06fa73af8da9" } };
var MiddlewareManifest = { "version": 3, "middleware": { "/": { "files": ["server/edge/chunks/edge-wrapper_fa177864.js", "server/edge/chunks/[root-of-the-server]__398964b2._.js", "server/edge/chunks/turbopack-edge-wrapper_77d18414.js"], "name": "middleware", "page": "/", "matchers": [{ "regexp": "^(?:\\/(_next\\/data\\/[^/]{1,}))?(?:\\/((?!_next\\/static|_next\\/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*))(\\\\.json)?[\\/#\\?]?$", "originalSource": "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)" }], "wasm": [], "assets": [], "env": { "__NEXT_BUILD_ID": "Hn_BOoXIsYT2Oz4WTsh9y", "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY": "rgF5hGq+gKUU9+4/em94SZoeFzm9pQmxDq9ziaW4hyw=", "__NEXT_PREVIEW_MODE_ID": "889061f372a7ae38e6cba45950dbcdbc", "__NEXT_PREVIEW_MODE_ENCRYPTION_KEY": "baa587c01dbf66a1a5ceff436c9b64bcdd90e2d862f75749d4af06fa73af8da9", "__NEXT_PREVIEW_MODE_SIGNING_KEY": "601fb093748957d5a9b2fc082f9e54b6331a091b95288b1452fbe35b4f3ed59d" } } }, "sortedMiddleware": ["/"], "functions": {} };
var AppPathRoutesManifest = { "/_global-error/page": "/_global-error", "/_not-found/page": "/_not-found", "/account/settings/page": "/account/settings", "/api/auth/signout/route": "/api/auth/signout", "/auth/auth-code-error/page": "/auth/auth-code-error", "/auth/callback/route": "/auth/callback", "/auth/finalize/page": "/auth/finalize", "/auth/login/page": "/auth/login", "/auth/signup/page": "/auth/signup", "/billing/success/page": "/billing/success", "/checkout/page": "/checkout", "/checkout/welcome/page": "/checkout/welcome", "/dashboard/page": "/dashboard", "/favicon.ico/route": "/favicon.ico", "/legal/privacy/page": "/legal/privacy", "/legal/terms/page": "/legal/terms", "/onboarding/page": "/onboarding", "/onboarding/returning/page": "/onboarding/returning", "/page": "/", "/setup/page": "/setup", "/witness/page": "/witness" };
var FunctionsConfigManifest = { "version": 1, "functions": {} };
var PagesManifest = { "/404": "pages/404.html", "/500": "pages/500.html" };
process.env.NEXT_BUILD_ID = BuildId;
process.env.NEXT_PREVIEW_MODE_ID = PrerenderManifest?.preview?.previewModeId;

// node_modules/@opennextjs/aws/dist/http/openNextResponse.js
init_logger();
init_util();
import { Transform } from "node:stream";

// node_modules/@opennextjs/aws/dist/core/routing/util.js
init_util();
init_logger();
import { ReadableStream as ReadableStream3 } from "node:stream/web";

// node_modules/@opennextjs/aws/dist/utils/binary.js
var commonBinaryMimeTypes = /* @__PURE__ */ new Set([
  "application/octet-stream",
  // Docs
  "application/epub+zip",
  "application/msword",
  "application/pdf",
  "application/rtf",
  "application/vnd.amazon.ebook",
  "application/vnd.ms-excel",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  // Fonts
  "font/otf",
  "font/woff",
  "font/woff2",
  // Images
  "image/bmp",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/tiff",
  "image/vnd.microsoft.icon",
  "image/webp",
  // Audio
  "audio/3gpp",
  "audio/aac",
  "audio/basic",
  "audio/flac",
  "audio/mpeg",
  "audio/ogg",
  "audio/wavaudio/webm",
  "audio/x-aiff",
  "audio/x-midi",
  "audio/x-wav",
  // Video
  "video/3gpp",
  "video/mp2t",
  "video/mpeg",
  "video/ogg",
  "video/quicktime",
  "video/webm",
  "video/x-msvideo",
  // Archives
  "application/java-archive",
  "application/vnd.apple.installer+xml",
  "application/x-7z-compressed",
  "application/x-apple-diskimage",
  "application/x-bzip",
  "application/x-bzip2",
  "application/x-gzip",
  "application/x-java-archive",
  "application/x-rar-compressed",
  "application/x-tar",
  "application/x-zip",
  "application/zip",
  // Serialized data
  "application/x-protobuf"
]);
function isBinaryContentType(contentType) {
  if (!contentType)
    return false;
  const value = contentType.split(";")[0];
  return commonBinaryMimeTypes.has(value);
}

// node_modules/@opennextjs/aws/dist/core/routing/i18n/index.js
init_stream();
init_logger();

// node_modules/@opennextjs/aws/dist/core/routing/i18n/accept-header.js
function parse(raw, preferences, options) {
  const lowers = /* @__PURE__ */ new Map();
  const header = raw.replace(/[ \t]/g, "");
  if (preferences) {
    let pos = 0;
    for (const preference of preferences) {
      const lower = preference.toLowerCase();
      lowers.set(lower, { orig: preference, pos: pos++ });
      if (options.prefixMatch) {
        const parts2 = lower.split("-");
        while (parts2.pop(), parts2.length > 0) {
          const joined = parts2.join("-");
          if (!lowers.has(joined)) {
            lowers.set(joined, { orig: preference, pos: pos++ });
          }
        }
      }
    }
  }
  const parts = header.split(",");
  const selections = [];
  const map = /* @__PURE__ */ new Set();
  for (let i = 0; i < parts.length; ++i) {
    const part = parts[i];
    if (!part) {
      continue;
    }
    const params = part.split(";");
    if (params.length > 2) {
      throw new Error(`Invalid ${options.type} header`);
    }
    const token = params[0].toLowerCase();
    if (!token) {
      throw new Error(`Invalid ${options.type} header`);
    }
    const selection = { token, pos: i, q: 1 };
    if (preferences && lowers.has(token)) {
      selection.pref = lowers.get(token).pos;
    }
    map.add(selection.token);
    if (params.length === 2) {
      const q = params[1];
      const [key, value] = q.split("=");
      if (!value || key !== "q" && key !== "Q") {
        throw new Error(`Invalid ${options.type} header`);
      }
      const score = Number.parseFloat(value);
      if (score === 0) {
        continue;
      }
      if (Number.isFinite(score) && score <= 1 && score >= 1e-3) {
        selection.q = score;
      }
    }
    selections.push(selection);
  }
  selections.sort((a, b) => {
    if (b.q !== a.q) {
      return b.q - a.q;
    }
    if (b.pref !== a.pref) {
      if (a.pref === void 0) {
        return 1;
      }
      if (b.pref === void 0) {
        return -1;
      }
      return a.pref - b.pref;
    }
    return a.pos - b.pos;
  });
  const values = selections.map((selection) => selection.token);
  if (!preferences || !preferences.length) {
    return values;
  }
  const preferred = [];
  for (const selection of values) {
    if (selection === "*") {
      for (const [preference, value] of lowers) {
        if (!map.has(preference)) {
          preferred.push(value.orig);
        }
      }
    } else {
      const lower = selection.toLowerCase();
      if (lowers.has(lower)) {
        preferred.push(lowers.get(lower).orig);
      }
    }
  }
  return preferred;
}
function acceptLanguage(header = "", preferences) {
  return parse(header, preferences, {
    type: "accept-language",
    prefixMatch: true
  })[0] || void 0;
}

// node_modules/@opennextjs/aws/dist/core/routing/i18n/index.js
function isLocalizedPath(path3) {
  return NextConfig.i18n?.locales.includes(path3.split("/")[1].toLowerCase()) ?? false;
}
function getLocaleFromCookie(cookies) {
  const i18n = NextConfig.i18n;
  const nextLocale = cookies.NEXT_LOCALE?.toLowerCase();
  return nextLocale ? i18n?.locales.find((locale) => nextLocale === locale.toLowerCase()) : void 0;
}
function detectDomainLocale({ hostname, detectedLocale }) {
  const i18n = NextConfig.i18n;
  const domains = i18n?.domains;
  if (!domains) {
    return;
  }
  const lowercasedLocale = detectedLocale?.toLowerCase();
  for (const domain of domains) {
    const domainHostname = domain.domain.split(":", 1)[0].toLowerCase();
    if (hostname === domainHostname || lowercasedLocale === domain.defaultLocale.toLowerCase() || domain.locales?.some((locale) => lowercasedLocale === locale.toLowerCase())) {
      return domain;
    }
  }
}
function detectLocale(internalEvent, i18n) {
  const domainLocale = detectDomainLocale({
    hostname: internalEvent.headers.host
  });
  if (i18n.localeDetection === false) {
    return domainLocale?.defaultLocale ?? i18n.defaultLocale;
  }
  const cookiesLocale = getLocaleFromCookie(internalEvent.cookies);
  const preferredLocale = acceptLanguage(internalEvent.headers["accept-language"], i18n?.locales);
  debug({
    cookiesLocale,
    preferredLocale,
    defaultLocale: i18n.defaultLocale,
    domainLocale
  });
  return domainLocale?.defaultLocale ?? cookiesLocale ?? preferredLocale ?? i18n.defaultLocale;
}
function localizePath(internalEvent) {
  const i18n = NextConfig.i18n;
  if (!i18n) {
    return internalEvent.rawPath;
  }
  if (isLocalizedPath(internalEvent.rawPath)) {
    return internalEvent.rawPath;
  }
  const detectedLocale = detectLocale(internalEvent, i18n);
  return `/${detectedLocale}${internalEvent.rawPath}`;
}
function handleLocaleRedirect(internalEvent) {
  const i18n = NextConfig.i18n;
  if (!i18n || i18n.localeDetection === false || internalEvent.rawPath !== "/") {
    return false;
  }
  const preferredLocale = acceptLanguage(internalEvent.headers["accept-language"], i18n?.locales);
  const detectedLocale = detectLocale(internalEvent, i18n);
  const domainLocale = detectDomainLocale({
    hostname: internalEvent.headers.host
  });
  const preferredDomain = detectDomainLocale({
    detectedLocale: preferredLocale
  });
  if (domainLocale && preferredDomain) {
    const isPDomain = preferredDomain.domain === domainLocale.domain;
    const isPLocale = preferredDomain.defaultLocale === preferredLocale;
    if (!isPDomain || !isPLocale) {
      const scheme = `http${preferredDomain.http ? "" : "s"}`;
      const rlocale = isPLocale ? "" : preferredLocale;
      return {
        type: "core",
        statusCode: 307,
        headers: {
          Location: `${scheme}://${preferredDomain.domain}/${rlocale}`
        },
        body: emptyReadableStream(),
        isBase64Encoded: false
      };
    }
  }
  const defaultLocale = domainLocale?.defaultLocale ?? i18n.defaultLocale;
  if (detectedLocale.toLowerCase() !== defaultLocale.toLowerCase()) {
    return {
      type: "core",
      statusCode: 307,
      headers: {
        Location: constructNextUrl(internalEvent.url, `/${detectedLocale}`)
      },
      body: emptyReadableStream(),
      isBase64Encoded: false
    };
  }
  return false;
}

// node_modules/@opennextjs/aws/dist/core/routing/queue.js
function generateShardId(rawPath, maxConcurrency, prefix) {
  let a = cyrb128(rawPath);
  let t = a += 1831565813;
  t = Math.imul(t ^ t >>> 15, t | 1);
  t ^= t + Math.imul(t ^ t >>> 7, t | 61);
  const randomFloat = ((t ^ t >>> 14) >>> 0) / 4294967296;
  const randomInt = Math.floor(randomFloat * maxConcurrency);
  return `${prefix}-${randomInt}`;
}
function generateMessageGroupId(rawPath) {
  const maxConcurrency = Number.parseInt(process.env.MAX_REVALIDATE_CONCURRENCY ?? "10");
  return generateShardId(rawPath, maxConcurrency, "revalidate");
}
function cyrb128(str) {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;
  for (let i = 0, k; i < str.length; i++) {
    k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ h1 >>> 18, 597399067);
  h2 = Math.imul(h4 ^ h2 >>> 22, 2869860233);
  h3 = Math.imul(h1 ^ h3 >>> 17, 951274213);
  h4 = Math.imul(h2 ^ h4 >>> 19, 2716044179);
  h1 ^= h2 ^ h3 ^ h4, h2 ^= h1, h3 ^= h1, h4 ^= h1;
  return h1 >>> 0;
}

// node_modules/@opennextjs/aws/dist/core/routing/util.js
function isExternal(url, host) {
  if (!url)
    return false;
  const pattern = /^https?:\/\//;
  if (!pattern.test(url))
    return false;
  if (host) {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.host !== host;
    } catch {
      return !url.includes(host);
    }
  }
  return true;
}
function convertFromQueryString(query) {
  if (query === "")
    return {};
  const queryParts = query.split("&");
  return getQueryFromIterator(queryParts.map((p) => {
    const [key, value] = p.split("=");
    return [key, value];
  }));
}
function getUrlParts(url, isExternal2) {
  if (!isExternal2) {
    const regex2 = /\/([^?]*)\??(.*)/;
    const match3 = url.match(regex2);
    return {
      hostname: "",
      pathname: match3?.[1] ? `/${match3[1]}` : url,
      protocol: "",
      queryString: match3?.[2] ?? ""
    };
  }
  const regex = /^(https?:)\/\/?([^\/\s]+)(\/[^?]*)?(\?.*)?/;
  const match2 = url.match(regex);
  if (!match2) {
    throw new Error(`Invalid external URL: ${url}`);
  }
  return {
    protocol: match2[1] ?? "https:",
    hostname: match2[2],
    pathname: match2[3] ?? "",
    queryString: match2[4]?.slice(1) ?? ""
  };
}
function constructNextUrl(baseUrl, path3) {
  const nextBasePath = NextConfig.basePath ?? "";
  const url = new URL(`${nextBasePath}${path3}`, baseUrl);
  return url.href;
}
function convertToQueryString(query) {
  const queryStrings = [];
  Object.entries(query).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => queryStrings.push(`${key}=${entry}`));
    } else {
      queryStrings.push(`${key}=${value}`);
    }
  });
  return queryStrings.length > 0 ? `?${queryStrings.join("&")}` : "";
}
function getMiddlewareMatch(middlewareManifest2, functionsManifest) {
  if (functionsManifest?.functions?.["/_middleware"]) {
    return functionsManifest.functions["/_middleware"].matchers?.map(({ regexp }) => new RegExp(regexp)) ?? [/.*/];
  }
  const rootMiddleware = middlewareManifest2.middleware["/"];
  if (!rootMiddleware?.matchers)
    return [];
  return rootMiddleware.matchers.map(({ regexp }) => new RegExp(regexp));
}
function escapeRegex(str, { isPath } = {}) {
  const result = str.replaceAll("(.)", "_\xB51_").replaceAll("(..)", "_\xB52_").replaceAll("(...)", "_\xB53_");
  return isPath ? result : result.replaceAll("+", "_\xB54_");
}
function unescapeRegex(str) {
  return str.replaceAll("_\xB51_", "(.)").replaceAll("_\xB52_", "(..)").replaceAll("_\xB53_", "(...)").replaceAll("_\xB54_", "+");
}
function convertBodyToReadableStream(method, body) {
  if (method === "GET" || method === "HEAD")
    return void 0;
  if (!body)
    return void 0;
  return new ReadableStream3({
    start(controller) {
      controller.enqueue(body);
      controller.close();
    }
  });
}
var CommonHeaders;
(function(CommonHeaders2) {
  CommonHeaders2["CACHE_CONTROL"] = "cache-control";
  CommonHeaders2["NEXT_CACHE"] = "x-nextjs-cache";
})(CommonHeaders || (CommonHeaders = {}));
function normalizeLocationHeader(location2, baseUrl, encodeQuery = false) {
  if (!URL.canParse(location2)) {
    return location2;
  }
  const locationURL = new URL(location2);
  const origin = new URL(baseUrl).origin;
  let search = locationURL.search;
  if (encodeQuery && search) {
    search = `?${stringifyQs(parseQs(search.slice(1)))}`;
  }
  const href = `${locationURL.origin}${locationURL.pathname}${search}${locationURL.hash}`;
  if (locationURL.origin === origin) {
    return href.slice(origin.length);
  }
  return href;
}

// node_modules/@opennextjs/aws/dist/core/routingHandler.js
init_logger();

// node_modules/@opennextjs/aws/dist/core/routing/cacheInterceptor.js
import { createHash } from "node:crypto";
init_stream();

// node_modules/@opennextjs/aws/dist/utils/cache.js
init_logger();
async function hasBeenRevalidated(key, tags, cacheEntry) {
  if (globalThis.openNextConfig.dangerous?.disableTagCache) {
    return false;
  }
  const value = cacheEntry.value;
  if (!value) {
    return true;
  }
  if ("type" in cacheEntry && cacheEntry.type === "page") {
    return false;
  }
  const lastModified = cacheEntry.lastModified ?? Date.now();
  if (globalThis.tagCache.mode === "nextMode") {
    return tags.length === 0 ? false : await globalThis.tagCache.hasBeenRevalidated(tags, lastModified);
  }
  const _lastModified = await globalThis.tagCache.getLastModified(key, lastModified);
  return _lastModified === -1;
}
function getTagsFromValue(value) {
  if (!value) {
    return [];
  }
  try {
    const cacheTags = value.meta?.headers?.["x-next-cache-tags"]?.split(",") ?? [];
    delete value.meta?.headers?.["x-next-cache-tags"];
    return cacheTags;
  } catch (e) {
    return [];
  }
}

// node_modules/@opennextjs/aws/dist/core/routing/cacheInterceptor.js
init_logger();
var CACHE_ONE_YEAR = 60 * 60 * 24 * 365;
var CACHE_ONE_MONTH = 60 * 60 * 24 * 30;
var VARY_HEADER = "RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch, Next-Url";
var NEXT_SEGMENT_PREFETCH_HEADER = "next-router-segment-prefetch";
var NEXT_PRERENDER_HEADER = "x-nextjs-prerender";
var NEXT_POSTPONED_HEADER = "x-nextjs-postponed";
async function computeCacheControl(path3, body, host, revalidate, lastModified) {
  let finalRevalidate = CACHE_ONE_YEAR;
  const existingRoute = Object.entries(PrerenderManifest?.routes ?? {}).find((p) => p[0] === path3)?.[1];
  if (revalidate === void 0 && existingRoute) {
    finalRevalidate = existingRoute.initialRevalidateSeconds === false ? CACHE_ONE_YEAR : existingRoute.initialRevalidateSeconds;
  } else if (revalidate !== void 0) {
    finalRevalidate = revalidate === false ? CACHE_ONE_YEAR : revalidate;
  }
  const age = Math.round((Date.now() - (lastModified ?? 0)) / 1e3);
  const hash = (str) => createHash("md5").update(str).digest("hex");
  const etag = hash(body);
  if (revalidate === 0) {
    return {
      "cache-control": "private, no-cache, no-store, max-age=0, must-revalidate",
      "x-opennext-cache": "ERROR",
      etag
    };
  }
  if (finalRevalidate !== CACHE_ONE_YEAR) {
    const sMaxAge = Math.max(finalRevalidate - age, 1);
    debug("sMaxAge", {
      finalRevalidate,
      age,
      lastModified,
      revalidate
    });
    const isStale = sMaxAge === 1;
    if (isStale) {
      let url = NextConfig.trailingSlash ? `${path3}/` : path3;
      if (NextConfig.basePath) {
        url = `${NextConfig.basePath}${url}`;
      }
      await globalThis.queue.send({
        MessageBody: {
          host,
          url,
          eTag: etag,
          lastModified: lastModified ?? Date.now()
        },
        MessageDeduplicationId: hash(`${path3}-${lastModified}-${etag}`),
        MessageGroupId: generateMessageGroupId(path3)
      });
    }
    return {
      "cache-control": `s-maxage=${sMaxAge}, stale-while-revalidate=${CACHE_ONE_MONTH}`,
      "x-opennext-cache": isStale ? "STALE" : "HIT",
      etag
    };
  }
  return {
    "cache-control": `s-maxage=${CACHE_ONE_YEAR}, stale-while-revalidate=${CACHE_ONE_MONTH}`,
    "x-opennext-cache": "HIT",
    etag
  };
}
function getBodyForAppRouter(event, cachedValue) {
  if (cachedValue.type !== "app") {
    throw new Error("getBodyForAppRouter called with non-app cache value");
  }
  try {
    const segmentHeader = `${event.headers[NEXT_SEGMENT_PREFETCH_HEADER]}`;
    const isSegmentResponse = Boolean(segmentHeader) && segmentHeader in (cachedValue.segmentData || {});
    const body = isSegmentResponse ? cachedValue.segmentData[segmentHeader] : cachedValue.rsc;
    return {
      body,
      additionalHeaders: isSegmentResponse ? { [NEXT_PRERENDER_HEADER]: "1", [NEXT_POSTPONED_HEADER]: "2" } : {}
    };
  } catch (e) {
    error("Error while getting body for app router from cache:", e);
    return { body: cachedValue.rsc, additionalHeaders: {} };
  }
}
async function generateResult(event, localizedPath, cachedValue, lastModified) {
  debug("Returning result from experimental cache");
  let body = "";
  let type = "application/octet-stream";
  let isDataRequest = false;
  let additionalHeaders = {};
  if (cachedValue.type === "app") {
    isDataRequest = Boolean(event.headers.rsc);
    if (isDataRequest) {
      const { body: appRouterBody, additionalHeaders: appHeaders } = getBodyForAppRouter(event, cachedValue);
      body = appRouterBody;
      additionalHeaders = appHeaders;
    } else {
      body = cachedValue.html;
    }
    type = isDataRequest ? "text/x-component" : "text/html; charset=utf-8";
  } else if (cachedValue.type === "page") {
    isDataRequest = Boolean(event.query.__nextDataReq);
    body = isDataRequest ? JSON.stringify(cachedValue.json) : cachedValue.html;
    type = isDataRequest ? "application/json" : "text/html; charset=utf-8";
  } else {
    throw new Error("generateResult called with unsupported cache value type, only 'app' and 'page' are supported");
  }
  const cacheControl = await computeCacheControl(localizedPath, body, event.headers.host, cachedValue.revalidate, lastModified);
  return {
    type: "core",
    // Sometimes other status codes can be cached, like 404. For these cases, we should return the correct status code
    // Also set the status code to the rewriteStatusCode if defined
    // This can happen in handleMiddleware in routingHandler.
    // `NextResponse.rewrite(url, { status: xxx})
    // The rewrite status code should take precedence over the cached one
    statusCode: event.rewriteStatusCode ?? cachedValue.meta?.status ?? 200,
    body: toReadableStream(body, false),
    isBase64Encoded: false,
    headers: {
      ...cacheControl,
      "content-type": type,
      ...cachedValue.meta?.headers,
      vary: VARY_HEADER,
      ...additionalHeaders
    }
  };
}
function escapePathDelimiters(segment, escapeEncoded) {
  return segment.replace(new RegExp(`([/#?]${escapeEncoded ? "|%(2f|23|3f|5c)" : ""})`, "gi"), (char) => encodeURIComponent(char));
}
function decodePathParams(pathname) {
  return pathname.split("/").map((segment) => {
    try {
      return escapePathDelimiters(decodeURIComponent(segment), true);
    } catch (e) {
      return segment;
    }
  }).join("/");
}
async function cacheInterceptor(event) {
  if (Boolean(event.headers["next-action"]) || Boolean(event.headers["x-prerender-revalidate"]))
    return event;
  const cookies = event.headers.cookie || "";
  const hasPreviewData = cookies.includes("__prerender_bypass") || cookies.includes("__next_preview_data");
  if (hasPreviewData) {
    debug("Preview mode detected, passing through to handler");
    return event;
  }
  let localizedPath = localizePath(event);
  if (NextConfig.basePath) {
    localizedPath = localizedPath.replace(NextConfig.basePath, "");
  }
  localizedPath = localizedPath.replace(/\/$/, "");
  localizedPath = decodePathParams(localizedPath);
  debug("Checking cache for", localizedPath, PrerenderManifest);
  const isISR = Object.keys(PrerenderManifest?.routes ?? {}).includes(localizedPath ?? "/") || Object.values(PrerenderManifest?.dynamicRoutes ?? {}).some((dr) => new RegExp(dr.routeRegex).test(localizedPath));
  debug("isISR", isISR);
  if (isISR) {
    try {
      const cachedData = await globalThis.incrementalCache.get(localizedPath ?? "/index");
      debug("cached data in interceptor", cachedData);
      if (!cachedData?.value) {
        return event;
      }
      if (cachedData.value?.type === "app" || cachedData.value?.type === "route") {
        const tags = getTagsFromValue(cachedData.value);
        const _hasBeenRevalidated = cachedData.shouldBypassTagCache ? false : await hasBeenRevalidated(localizedPath, tags, cachedData);
        if (_hasBeenRevalidated) {
          return event;
        }
      }
      const host = event.headers.host;
      switch (cachedData?.value?.type) {
        case "app":
        case "page":
          return generateResult(event, localizedPath, cachedData.value, cachedData.lastModified);
        case "redirect": {
          const cacheControl = await computeCacheControl(localizedPath, "", host, cachedData.value.revalidate, cachedData.lastModified);
          return {
            type: "core",
            statusCode: cachedData.value.meta?.status ?? 307,
            body: emptyReadableStream(),
            headers: {
              ...cachedData.value.meta?.headers ?? {},
              ...cacheControl
            },
            isBase64Encoded: false
          };
        }
        case "route": {
          const cacheControl = await computeCacheControl(localizedPath, cachedData.value.body, host, cachedData.value.revalidate, cachedData.lastModified);
          const isBinary = isBinaryContentType(String(cachedData.value.meta?.headers?.["content-type"]));
          return {
            type: "core",
            statusCode: event.rewriteStatusCode ?? cachedData.value.meta?.status ?? 200,
            body: toReadableStream(cachedData.value.body, isBinary),
            headers: {
              ...cacheControl,
              ...cachedData.value.meta?.headers,
              vary: VARY_HEADER
            },
            isBase64Encoded: isBinary
          };
        }
        default:
          return event;
      }
    } catch (e) {
      debug("Error while fetching cache", e);
      return event;
    }
  }
  return event;
}

// node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
function parse2(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path3 = "";
  var tryConsume = function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  };
  var mustConsume = function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  };
  var consumeText = function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  };
  var isSafe = function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  };
  var safePattern = function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  };
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path3 += prefix;
        prefix = "";
      }
      if (path3) {
        result.push(path3);
        path3 = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path3 += value;
      continue;
    }
    if (path3) {
      result.push(path3);
      path3 = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
function compile(str, options) {
  return tokensToFunction(parse2(str, options), options);
}
function tokensToFunction(tokens, options) {
  if (options === void 0) {
    options = {};
  }
  var reFlags = flags(options);
  var _a = options.encode, encode = _a === void 0 ? function(x) {
    return x;
  } : _a, _b = options.validate, validate = _b === void 0 ? true : _b;
  var matches = tokens.map(function(token) {
    if (typeof token === "object") {
      return new RegExp("^(?:".concat(token.pattern, ")$"), reFlags);
    }
  });
  return function(data) {
    var path3 = "";
    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i];
      if (typeof token === "string") {
        path3 += token;
        continue;
      }
      var value = data ? data[token.name] : void 0;
      var optional = token.modifier === "?" || token.modifier === "*";
      var repeat = token.modifier === "*" || token.modifier === "+";
      if (Array.isArray(value)) {
        if (!repeat) {
          throw new TypeError('Expected "'.concat(token.name, '" to not repeat, but got an array'));
        }
        if (value.length === 0) {
          if (optional)
            continue;
          throw new TypeError('Expected "'.concat(token.name, '" to not be empty'));
        }
        for (var j = 0; j < value.length; j++) {
          var segment = encode(value[j], token);
          if (validate && !matches[i].test(segment)) {
            throw new TypeError('Expected all "'.concat(token.name, '" to match "').concat(token.pattern, '", but got "').concat(segment, '"'));
          }
          path3 += token.prefix + segment + token.suffix;
        }
        continue;
      }
      if (typeof value === "string" || typeof value === "number") {
        var segment = encode(String(value), token);
        if (validate && !matches[i].test(segment)) {
          throw new TypeError('Expected "'.concat(token.name, '" to match "').concat(token.pattern, '", but got "').concat(segment, '"'));
        }
        path3 += token.prefix + segment + token.suffix;
        continue;
      }
      if (optional)
        continue;
      var typeOfMessage = repeat ? "an array" : "a string";
      throw new TypeError('Expected "'.concat(token.name, '" to be ').concat(typeOfMessage));
    }
    return path3;
  };
}
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path3 = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    };
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path: path3, index, params };
  };
}
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
function regexpToRegexp(path3, keys) {
  if (!keys)
    return path3;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path3.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path3.source);
  }
  return path3;
}
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path3) {
    return pathToRegexp(path3, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
function stringToRegexp(path3, keys, options) {
  return tokensToRegexp(parse2(path3, options), keys, options);
}
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
function pathToRegexp(path3, keys, options) {
  if (path3 instanceof RegExp)
    return regexpToRegexp(path3, keys);
  if (Array.isArray(path3))
    return arrayToRegexp(path3, keys, options);
  return stringToRegexp(path3, keys, options);
}

// node_modules/@opennextjs/aws/dist/utils/normalize-path.js
import path2 from "node:path";
function normalizeRepeatedSlashes(url) {
  const urlNoQuery = url.host + url.pathname;
  return `${url.protocol}//${urlNoQuery.replace(/\\/g, "/").replace(/\/\/+/g, "/")}${url.search}`;
}

// node_modules/@opennextjs/aws/dist/core/routing/matcher.js
init_stream();
init_logger();

// node_modules/@opennextjs/aws/dist/core/routing/routeMatcher.js
var optionalLocalePrefixRegex = `^/(?:${RoutesManifest.locales.map((locale) => `${locale}/?`).join("|")})?`;
var optionalBasepathPrefixRegex = RoutesManifest.basePath ? `^${RoutesManifest.basePath}/?` : "^/";
var optionalPrefix = optionalLocalePrefixRegex.replace("^/", optionalBasepathPrefixRegex);
function routeMatcher(routeDefinitions) {
  const regexp = routeDefinitions.map((route) => ({
    page: route.page,
    regexp: new RegExp(route.regex.replace("^/", optionalPrefix))
  }));
  const appPathsSet = /* @__PURE__ */ new Set();
  const routePathsSet = /* @__PURE__ */ new Set();
  for (const [k, v] of Object.entries(AppPathRoutesManifest)) {
    if (k.endsWith("page")) {
      appPathsSet.add(v);
    } else if (k.endsWith("route")) {
      routePathsSet.add(v);
    }
  }
  return function matchRoute(path3) {
    const foundRoutes = regexp.filter((route) => route.regexp.test(path3));
    return foundRoutes.map((foundRoute) => {
      let routeType = "page";
      if (appPathsSet.has(foundRoute.page)) {
        routeType = "app";
      } else if (routePathsSet.has(foundRoute.page)) {
        routeType = "route";
      }
      return {
        route: foundRoute.page,
        type: routeType
      };
    });
  };
}
var staticRouteMatcher = routeMatcher([
  ...RoutesManifest.routes.static,
  ...getStaticAPIRoutes()
]);
var dynamicRouteMatcher = routeMatcher(RoutesManifest.routes.dynamic);
function getStaticAPIRoutes() {
  const createRouteDefinition = (route) => ({
    page: route,
    regex: `^${route}(?:/)?$`
  });
  const dynamicRoutePages = new Set(RoutesManifest.routes.dynamic.map(({ page }) => page));
  const pagesStaticAPIRoutes = Object.keys(PagesManifest).filter((route) => route.startsWith("/api/") && !dynamicRoutePages.has(route)).map(createRouteDefinition);
  const appPathsStaticAPIRoutes = Object.values(AppPathRoutesManifest).filter((route) => (route.startsWith("/api/") || route === "/api") && !dynamicRoutePages.has(route)).map(createRouteDefinition);
  return [...pagesStaticAPIRoutes, ...appPathsStaticAPIRoutes];
}

// node_modules/@opennextjs/aws/dist/core/routing/matcher.js
var routeHasMatcher = (headers, cookies, query) => (redirect) => {
  switch (redirect.type) {
    case "header":
      return !!headers?.[redirect.key.toLowerCase()] && new RegExp(redirect.value ?? "").test(headers[redirect.key.toLowerCase()] ?? "");
    case "cookie":
      return !!cookies?.[redirect.key] && new RegExp(redirect.value ?? "").test(cookies[redirect.key] ?? "");
    case "query":
      return query[redirect.key] && Array.isArray(redirect.value) ? redirect.value.reduce((prev, current) => prev || new RegExp(current).test(query[redirect.key]), false) : new RegExp(redirect.value ?? "").test(query[redirect.key] ?? "");
    case "host":
      return headers?.host !== "" && new RegExp(redirect.value ?? "").test(headers.host);
    default:
      return false;
  }
};
function checkHas(matcher, has, inverted = false) {
  return has ? has.reduce((acc, cur) => {
    if (acc === false)
      return false;
    return inverted ? !matcher(cur) : matcher(cur);
  }, true) : true;
}
var getParamsFromSource = (source) => (value) => {
  debug("value", value);
  const _match = source(value);
  return _match ? _match.params : {};
};
var computeParamHas = (headers, cookies, query) => (has) => {
  if (!has.value)
    return {};
  const matcher = new RegExp(`^${has.value}$`);
  const fromSource = (value) => {
    const matches = value.match(matcher);
    return matches?.groups ?? {};
  };
  switch (has.type) {
    case "header":
      return fromSource(headers[has.key.toLowerCase()] ?? "");
    case "cookie":
      return fromSource(cookies[has.key] ?? "");
    case "query":
      return Array.isArray(query[has.key]) ? fromSource(query[has.key].join(",")) : fromSource(query[has.key] ?? "");
    case "host":
      return fromSource(headers.host ?? "");
  }
};
function convertMatch(match2, toDestination, destination) {
  if (!match2) {
    return destination;
  }
  const { params } = match2;
  const isUsingParams = Object.keys(params).length > 0;
  return isUsingParams ? toDestination(params) : destination;
}
function getNextConfigHeaders(event, configHeaders) {
  if (!configHeaders) {
    return {};
  }
  const matcher = routeHasMatcher(event.headers, event.cookies, event.query);
  const requestHeaders = {};
  const localizedRawPath = localizePath(event);
  for (const { headers, has, missing, regex, source, locale } of configHeaders) {
    const path3 = locale === false ? event.rawPath : localizedRawPath;
    if (new RegExp(regex).test(path3) && checkHas(matcher, has) && checkHas(matcher, missing, true)) {
      const fromSource = match(source);
      const _match = fromSource(path3);
      headers.forEach((h) => {
        try {
          const key = convertMatch(_match, compile(h.key), h.key);
          const value = convertMatch(_match, compile(h.value), h.value);
          requestHeaders[key] = value;
        } catch {
          debug(`Error matching header ${h.key} with value ${h.value}`);
          requestHeaders[h.key] = h.value;
        }
      });
    }
  }
  return requestHeaders;
}
function handleRewrites(event, rewrites) {
  const { rawPath, headers, query, cookies, url } = event;
  const localizedRawPath = localizePath(event);
  const matcher = routeHasMatcher(headers, cookies, query);
  const computeHas = computeParamHas(headers, cookies, query);
  const rewrite = rewrites.find((route) => {
    const path3 = route.locale === false ? rawPath : localizedRawPath;
    return new RegExp(route.regex).test(path3) && checkHas(matcher, route.has) && checkHas(matcher, route.missing, true);
  });
  let finalQuery = query;
  let rewrittenUrl = url;
  const isExternalRewrite = isExternal(rewrite?.destination);
  debug("isExternalRewrite", isExternalRewrite);
  if (rewrite) {
    const { pathname, protocol, hostname, queryString } = getUrlParts(rewrite.destination, isExternalRewrite);
    const pathToUse = rewrite.locale === false ? rawPath : localizedRawPath;
    debug("urlParts", { pathname, protocol, hostname, queryString });
    const toDestinationPath = compile(escapeRegex(pathname, { isPath: true }));
    const toDestinationHost = compile(escapeRegex(hostname));
    const toDestinationQuery = compile(escapeRegex(queryString));
    const params = {
      // params for the source
      ...getParamsFromSource(match(escapeRegex(rewrite.source, { isPath: true })))(pathToUse),
      // params for the has
      ...rewrite.has?.reduce((acc, cur) => {
        return Object.assign(acc, computeHas(cur));
      }, {}),
      // params for the missing
      ...rewrite.missing?.reduce((acc, cur) => {
        return Object.assign(acc, computeHas(cur));
      }, {})
    };
    const isUsingParams = Object.keys(params).length > 0;
    let rewrittenQuery = queryString;
    let rewrittenHost = hostname;
    let rewrittenPath = pathname;
    if (isUsingParams) {
      rewrittenPath = unescapeRegex(toDestinationPath(params));
      rewrittenHost = unescapeRegex(toDestinationHost(params));
      rewrittenQuery = unescapeRegex(toDestinationQuery(params));
    }
    if (NextConfig.i18n && !isExternalRewrite) {
      const strippedPathLocale = rewrittenPath.replace(new RegExp(`^/(${NextConfig.i18n.locales.join("|")})`), "");
      if (strippedPathLocale.startsWith("/api/")) {
        rewrittenPath = strippedPathLocale;
      }
    }
    rewrittenUrl = isExternalRewrite ? `${protocol}//${rewrittenHost}${rewrittenPath}` : new URL(rewrittenPath, event.url).href;
    finalQuery = {
      ...query,
      ...convertFromQueryString(rewrittenQuery)
    };
    rewrittenUrl += convertToQueryString(finalQuery);
    debug("rewrittenUrl", { rewrittenUrl, finalQuery, isUsingParams });
  }
  return {
    internalEvent: {
      ...event,
      query: finalQuery,
      rawPath: new URL(rewrittenUrl).pathname,
      url: rewrittenUrl
    },
    __rewrite: rewrite,
    isExternalRewrite
  };
}
function handleRepeatedSlashRedirect(event) {
  if (event.rawPath.match(/(\\|\/\/)/)) {
    return {
      type: event.type,
      statusCode: 308,
      headers: {
        Location: normalizeRepeatedSlashes(new URL(event.url))
      },
      body: emptyReadableStream(),
      isBase64Encoded: false
    };
  }
  return false;
}
function handleTrailingSlashRedirect(event) {
  const url = new URL(event.rawPath, "http://localhost");
  if (
    // Someone is trying to redirect to a different origin, let's not do that
    url.host !== "localhost" || NextConfig.skipTrailingSlashRedirect || // We should not apply trailing slash redirect to API routes
    event.rawPath.startsWith("/api/")
  ) {
    return false;
  }
  const emptyBody = emptyReadableStream();
  if (NextConfig.trailingSlash && !event.headers["x-nextjs-data"] && !event.rawPath.endsWith("/") && !event.rawPath.match(/[\w-]+\.[\w]+$/g)) {
    const headersLocation = event.url.split("?");
    return {
      type: event.type,
      statusCode: 308,
      headers: {
        Location: `${headersLocation[0]}/${headersLocation[1] ? `?${headersLocation[1]}` : ""}`
      },
      body: emptyBody,
      isBase64Encoded: false
    };
  }
  if (!NextConfig.trailingSlash && event.rawPath.endsWith("/") && event.rawPath !== "/") {
    const headersLocation = event.url.split("?");
    return {
      type: event.type,
      statusCode: 308,
      headers: {
        Location: `${headersLocation[0].replace(/\/$/, "")}${headersLocation[1] ? `?${headersLocation[1]}` : ""}`
      },
      body: emptyBody,
      isBase64Encoded: false
    };
  }
  return false;
}
function handleRedirects(event, redirects) {
  const repeatedSlashRedirect = handleRepeatedSlashRedirect(event);
  if (repeatedSlashRedirect)
    return repeatedSlashRedirect;
  const trailingSlashRedirect = handleTrailingSlashRedirect(event);
  if (trailingSlashRedirect)
    return trailingSlashRedirect;
  const localeRedirect = handleLocaleRedirect(event);
  if (localeRedirect)
    return localeRedirect;
  const { internalEvent, __rewrite } = handleRewrites(event, redirects.filter((r) => !r.internal));
  if (__rewrite && !__rewrite.internal) {
    return {
      type: event.type,
      statusCode: __rewrite.statusCode ?? 308,
      headers: {
        Location: internalEvent.url
      },
      body: emptyReadableStream(),
      isBase64Encoded: false
    };
  }
}
function fixDataPage(internalEvent, buildId) {
  const { rawPath, query } = internalEvent;
  const basePath = NextConfig.basePath ?? "";
  const dataPattern = `${basePath}/_next/data/${buildId}`;
  if (rawPath.startsWith("/_next/data") && !rawPath.startsWith(dataPattern)) {
    return {
      type: internalEvent.type,
      statusCode: 404,
      body: toReadableStream("{}"),
      headers: {
        "Content-Type": "application/json"
      },
      isBase64Encoded: false
    };
  }
  if (rawPath.startsWith(dataPattern) && rawPath.endsWith(".json")) {
    const newPath = `${basePath}${rawPath.slice(dataPattern.length, -".json".length).replace(/^\/index$/, "/")}`;
    query.__nextDataReq = "1";
    return {
      ...internalEvent,
      rawPath: newPath,
      query,
      url: new URL(`${newPath}${convertToQueryString(query)}`, internalEvent.url).href
    };
  }
  return internalEvent;
}
function handleFallbackFalse(internalEvent, prerenderManifest) {
  const { rawPath } = internalEvent;
  const { dynamicRoutes = {}, routes = {} } = prerenderManifest ?? {};
  const prerenderedFallbackRoutes = Object.entries(dynamicRoutes).filter(([, { fallback }]) => fallback === false);
  const routeFallback = prerenderedFallbackRoutes.some(([, { routeRegex }]) => {
    const routeRegexExp = new RegExp(routeRegex);
    return routeRegexExp.test(rawPath);
  });
  const locales = NextConfig.i18n?.locales;
  const routesAlreadyHaveLocale = locales?.includes(rawPath.split("/")[1]) || // If we don't use locales, we don't need to add the default locale
  locales === void 0;
  let localizedPath = routesAlreadyHaveLocale ? rawPath : `/${NextConfig.i18n?.defaultLocale}${rawPath}`;
  if (
    // Not if localizedPath is "/" tho, because that would not make it find `isPregenerated` below since it would be try to match an empty string.
    localizedPath !== "/" && NextConfig.trailingSlash && localizedPath.endsWith("/")
  ) {
    localizedPath = localizedPath.slice(0, -1);
  }
  const matchedStaticRoute = staticRouteMatcher(localizedPath);
  const prerenderedFallbackRoutesName = prerenderedFallbackRoutes.map(([name]) => name);
  const matchedDynamicRoute = dynamicRouteMatcher(localizedPath).filter(({ route }) => !prerenderedFallbackRoutesName.includes(route));
  const isPregenerated = Object.keys(routes).includes(localizedPath);
  if (routeFallback && !isPregenerated && matchedStaticRoute.length === 0 && matchedDynamicRoute.length === 0) {
    return {
      event: {
        ...internalEvent,
        rawPath: "/404",
        url: constructNextUrl(internalEvent.url, "/404"),
        headers: {
          ...internalEvent.headers,
          "x-invoke-status": "404"
        }
      },
      isISR: false
    };
  }
  return {
    event: internalEvent,
    isISR: routeFallback || isPregenerated
  };
}

// node_modules/@opennextjs/aws/dist/core/routing/middleware.js
init_stream();
init_utils();
var middlewareManifest = MiddlewareManifest;
var functionsConfigManifest = FunctionsConfigManifest;
var middleMatch = getMiddlewareMatch(middlewareManifest, functionsConfigManifest);
var REDIRECTS = /* @__PURE__ */ new Set([301, 302, 303, 307, 308]);
function defaultMiddlewareLoader() {
  return Promise.resolve().then(() => (init_edgeFunctionHandler(), edgeFunctionHandler_exports));
}
async function handleMiddleware(internalEvent, initialSearch, middlewareLoader = defaultMiddlewareLoader) {
  const headers = internalEvent.headers;
  if (headers["x-isr"] && headers["x-prerender-revalidate"] === PrerenderManifest?.preview?.previewModeId)
    return internalEvent;
  const normalizedPath = localizePath(internalEvent);
  const hasMatch = middleMatch.some((r) => r.test(normalizedPath));
  if (!hasMatch)
    return internalEvent;
  const initialUrl = new URL(normalizedPath, internalEvent.url);
  initialUrl.search = initialSearch;
  const url = initialUrl.href;
  const middleware = await middlewareLoader();
  const result = await middleware.default({
    // `geo` is pre Next 15.
    geo: {
      // The city name is percent-encoded.
      // See https://github.com/vercel/vercel/blob/4cb6143/packages/functions/src/headers.ts#L94C19-L94C37
      city: decodeURIComponent(headers["x-open-next-city"]),
      country: headers["x-open-next-country"],
      region: headers["x-open-next-region"],
      latitude: headers["x-open-next-latitude"],
      longitude: headers["x-open-next-longitude"]
    },
    headers,
    method: internalEvent.method || "GET",
    nextConfig: {
      basePath: NextConfig.basePath,
      i18n: NextConfig.i18n,
      trailingSlash: NextConfig.trailingSlash
    },
    url,
    body: convertBodyToReadableStream(internalEvent.method, internalEvent.body)
  });
  const statusCode = result.status;
  const responseHeaders = result.headers;
  const reqHeaders = {};
  const resHeaders = {};
  const filteredHeaders = [
    "x-middleware-override-headers",
    "x-middleware-next",
    "x-middleware-rewrite",
    // We need to drop `content-encoding` because it will be decoded
    "content-encoding"
  ];
  const xMiddlewareKey = "x-middleware-request-";
  responseHeaders.forEach((value, key) => {
    if (key.startsWith(xMiddlewareKey)) {
      const k = key.substring(xMiddlewareKey.length);
      reqHeaders[k] = value;
    } else {
      if (filteredHeaders.includes(key.toLowerCase()))
        return;
      if (key.toLowerCase() === "set-cookie") {
        resHeaders[key] = resHeaders[key] ? [...resHeaders[key], value] : [value];
      } else if (REDIRECTS.has(statusCode) && key.toLowerCase() === "location") {
        resHeaders[key] = normalizeLocationHeader(value, internalEvent.url);
      } else {
        resHeaders[key] = value;
      }
    }
  });
  const rewriteUrl = responseHeaders.get("x-middleware-rewrite");
  let isExternalRewrite = false;
  let middlewareQuery = internalEvent.query;
  let newUrl = internalEvent.url;
  if (rewriteUrl) {
    newUrl = rewriteUrl;
    if (isExternal(newUrl, internalEvent.headers.host)) {
      isExternalRewrite = true;
    } else {
      const rewriteUrlObject = new URL(rewriteUrl);
      middlewareQuery = getQueryFromSearchParams(rewriteUrlObject.searchParams);
      if ("__nextDataReq" in internalEvent.query) {
        middlewareQuery.__nextDataReq = internalEvent.query.__nextDataReq;
      }
    }
  }
  if (!rewriteUrl && !responseHeaders.get("x-middleware-next")) {
    const body = result.body ?? emptyReadableStream();
    return {
      type: internalEvent.type,
      statusCode,
      headers: resHeaders,
      body,
      isBase64Encoded: false
    };
  }
  return {
    responseHeaders: resHeaders,
    url: newUrl,
    rawPath: new URL(newUrl).pathname,
    type: internalEvent.type,
    headers: { ...internalEvent.headers, ...reqHeaders },
    body: internalEvent.body,
    method: internalEvent.method,
    query: middlewareQuery,
    cookies: internalEvent.cookies,
    remoteAddress: internalEvent.remoteAddress,
    isExternalRewrite,
    rewriteStatusCode: rewriteUrl && !isExternalRewrite ? statusCode : void 0
  };
}

// node_modules/@opennextjs/aws/dist/core/routingHandler.js
var MIDDLEWARE_HEADER_PREFIX = "x-middleware-response-";
var MIDDLEWARE_HEADER_PREFIX_LEN = MIDDLEWARE_HEADER_PREFIX.length;
var INTERNAL_HEADER_PREFIX = "x-opennext-";
var INTERNAL_HEADER_INITIAL_URL = `${INTERNAL_HEADER_PREFIX}initial-url`;
var INTERNAL_HEADER_LOCALE = `${INTERNAL_HEADER_PREFIX}locale`;
var INTERNAL_HEADER_RESOLVED_ROUTES = `${INTERNAL_HEADER_PREFIX}resolved-routes`;
var INTERNAL_HEADER_REWRITE_STATUS_CODE = `${INTERNAL_HEADER_PREFIX}rewrite-status-code`;
var INTERNAL_EVENT_REQUEST_ID = `${INTERNAL_HEADER_PREFIX}request-id`;
var geoHeaderToNextHeader = {
  "x-open-next-city": "x-vercel-ip-city",
  "x-open-next-country": "x-vercel-ip-country",
  "x-open-next-region": "x-vercel-ip-country-region",
  "x-open-next-latitude": "x-vercel-ip-latitude",
  "x-open-next-longitude": "x-vercel-ip-longitude"
};
function applyMiddlewareHeaders(eventOrResult, middlewareHeaders) {
  const isResult = isInternalResult(eventOrResult);
  const headers = eventOrResult.headers;
  const keyPrefix = isResult ? "" : MIDDLEWARE_HEADER_PREFIX;
  Object.entries(middlewareHeaders).forEach(([key, value]) => {
    if (value) {
      headers[keyPrefix + key] = Array.isArray(value) ? value.join(",") : value;
    }
  });
}
async function routingHandler(event, { assetResolver }) {
  try {
    for (const [openNextGeoName, nextGeoName] of Object.entries(geoHeaderToNextHeader)) {
      const value = event.headers[openNextGeoName];
      if (value) {
        event.headers[nextGeoName] = value;
      }
    }
    for (const key of Object.keys(event.headers)) {
      if (key.startsWith(INTERNAL_HEADER_PREFIX) || key.startsWith(MIDDLEWARE_HEADER_PREFIX)) {
        delete event.headers[key];
      }
    }
    let headers = getNextConfigHeaders(event, ConfigHeaders);
    let eventOrResult = fixDataPage(event, BuildId);
    if (isInternalResult(eventOrResult)) {
      return eventOrResult;
    }
    const redirect = handleRedirects(eventOrResult, RoutesManifest.redirects);
    if (redirect) {
      redirect.headers.Location = normalizeLocationHeader(redirect.headers.Location, event.url, true);
      debug("redirect", redirect);
      return redirect;
    }
    const middlewareEventOrResult = await handleMiddleware(
      eventOrResult,
      // We need to pass the initial search without any decoding
      // TODO: we'd need to refactor InternalEvent to include the initial querystring directly
      // Should be done in another PR because it is a breaking change
      new URL(event.url).search
    );
    if (isInternalResult(middlewareEventOrResult)) {
      return middlewareEventOrResult;
    }
    const middlewareHeadersPrioritized = globalThis.openNextConfig.dangerous?.middlewareHeadersOverrideNextConfigHeaders ?? false;
    if (middlewareHeadersPrioritized) {
      headers = {
        ...headers,
        ...middlewareEventOrResult.responseHeaders
      };
    } else {
      headers = {
        ...middlewareEventOrResult.responseHeaders,
        ...headers
      };
    }
    let isExternalRewrite = middlewareEventOrResult.isExternalRewrite ?? false;
    eventOrResult = middlewareEventOrResult;
    if (!isExternalRewrite) {
      const beforeRewrite = handleRewrites(eventOrResult, RoutesManifest.rewrites.beforeFiles);
      eventOrResult = beforeRewrite.internalEvent;
      isExternalRewrite = beforeRewrite.isExternalRewrite;
      if (!isExternalRewrite) {
        const assetResult = await assetResolver?.maybeGetAssetResult?.(eventOrResult);
        if (assetResult) {
          applyMiddlewareHeaders(assetResult, headers);
          return assetResult;
        }
      }
    }
    const foundStaticRoute = staticRouteMatcher(eventOrResult.rawPath);
    const isStaticRoute = !isExternalRewrite && foundStaticRoute.length > 0;
    if (!(isStaticRoute || isExternalRewrite)) {
      const afterRewrite = handleRewrites(eventOrResult, RoutesManifest.rewrites.afterFiles);
      eventOrResult = afterRewrite.internalEvent;
      isExternalRewrite = afterRewrite.isExternalRewrite;
    }
    let isISR = false;
    if (!isExternalRewrite) {
      const fallbackResult = handleFallbackFalse(eventOrResult, PrerenderManifest);
      eventOrResult = fallbackResult.event;
      isISR = fallbackResult.isISR;
    }
    const foundDynamicRoute = dynamicRouteMatcher(eventOrResult.rawPath);
    const isDynamicRoute = !isExternalRewrite && foundDynamicRoute.length > 0;
    if (!(isDynamicRoute || isStaticRoute || isExternalRewrite)) {
      const fallbackRewrites = handleRewrites(eventOrResult, RoutesManifest.rewrites.fallback);
      eventOrResult = fallbackRewrites.internalEvent;
      isExternalRewrite = fallbackRewrites.isExternalRewrite;
    }
    const isNextImageRoute = eventOrResult.rawPath.startsWith("/_next/image");
    const isRouteFoundBeforeAllRewrites = isStaticRoute || isDynamicRoute || isExternalRewrite;
    if (!(isRouteFoundBeforeAllRewrites || isNextImageRoute || // We need to check again once all rewrites have been applied
    staticRouteMatcher(eventOrResult.rawPath).length > 0 || dynamicRouteMatcher(eventOrResult.rawPath).length > 0)) {
      eventOrResult = {
        ...eventOrResult,
        rawPath: "/404",
        url: constructNextUrl(eventOrResult.url, "/404"),
        headers: {
          ...eventOrResult.headers,
          "x-middleware-response-cache-control": "private, no-cache, no-store, max-age=0, must-revalidate"
        }
      };
    }
    if (globalThis.openNextConfig.dangerous?.enableCacheInterception && !isInternalResult(eventOrResult)) {
      debug("Cache interception enabled");
      eventOrResult = await cacheInterceptor(eventOrResult);
      if (isInternalResult(eventOrResult)) {
        applyMiddlewareHeaders(eventOrResult, headers);
        return eventOrResult;
      }
    }
    applyMiddlewareHeaders(eventOrResult, headers);
    const resolvedRoutes = [
      ...foundStaticRoute,
      ...foundDynamicRoute
    ];
    debug("resolvedRoutes", resolvedRoutes);
    return {
      internalEvent: eventOrResult,
      isExternalRewrite,
      origin: false,
      isISR,
      resolvedRoutes,
      initialURL: event.url,
      locale: NextConfig.i18n ? detectLocale(eventOrResult, NextConfig.i18n) : void 0,
      rewriteStatusCode: middlewareEventOrResult.rewriteStatusCode
    };
  } catch (e) {
    error("Error in routingHandler", e);
    return {
      internalEvent: {
        type: "core",
        method: "GET",
        rawPath: "/500",
        url: constructNextUrl(event.url, "/500"),
        headers: {
          ...event.headers
        },
        query: event.query,
        cookies: event.cookies,
        remoteAddress: event.remoteAddress
      },
      isExternalRewrite: false,
      origin: false,
      isISR: false,
      resolvedRoutes: [],
      initialURL: event.url,
      locale: NextConfig.i18n ? detectLocale(event, NextConfig.i18n) : void 0
    };
  }
}
function isInternalResult(eventOrResult) {
  return eventOrResult != null && "statusCode" in eventOrResult;
}

// node_modules/@opennextjs/aws/dist/adapters/middleware.js
globalThis.internalFetch = fetch;
globalThis.__openNextAls = new AsyncLocalStorage();
var defaultHandler = async (internalEvent, options) => {
  const middlewareConfig = globalThis.openNextConfig.middleware;
  const originResolver = await resolveOriginResolver(middlewareConfig?.originResolver);
  const externalRequestProxy = await resolveProxyRequest(middlewareConfig?.override?.proxyExternalRequest);
  const assetResolver = await resolveAssetResolver(middlewareConfig?.assetResolver);
  const requestId = Math.random().toString(36);
  return runWithOpenNextRequestContext({
    isISRRevalidation: internalEvent.headers["x-isr"] === "1",
    waitUntil: options?.waitUntil,
    requestId
  }, async () => {
    const result = await routingHandler(internalEvent, { assetResolver });
    if ("internalEvent" in result) {
      debug("Middleware intercepted event", internalEvent);
      if (!result.isExternalRewrite) {
        const origin = await originResolver.resolve(result.internalEvent.rawPath);
        return {
          type: "middleware",
          internalEvent: {
            ...result.internalEvent,
            headers: {
              ...result.internalEvent.headers,
              [INTERNAL_HEADER_INITIAL_URL]: internalEvent.url,
              [INTERNAL_HEADER_RESOLVED_ROUTES]: JSON.stringify(result.resolvedRoutes),
              [INTERNAL_EVENT_REQUEST_ID]: requestId,
              [INTERNAL_HEADER_REWRITE_STATUS_CODE]: String(result.rewriteStatusCode)
            }
          },
          isExternalRewrite: result.isExternalRewrite,
          origin,
          isISR: result.isISR,
          initialURL: result.initialURL,
          resolvedRoutes: result.resolvedRoutes
        };
      }
      try {
        return externalRequestProxy.proxy(result.internalEvent);
      } catch (e) {
        error("External request failed.", e);
        return {
          type: "middleware",
          internalEvent: {
            ...result.internalEvent,
            headers: {
              ...result.internalEvent.headers,
              [INTERNAL_EVENT_REQUEST_ID]: requestId
            },
            rawPath: "/500",
            url: constructNextUrl(result.internalEvent.url, "/500"),
            method: "GET"
          },
          // On error we need to rewrite to the 500 page which is an internal rewrite
          isExternalRewrite: false,
          origin: false,
          isISR: result.isISR,
          initialURL: result.internalEvent.url,
          resolvedRoutes: [{ route: "/500", type: "page" }]
        };
      }
    }
    if (process.env.OPEN_NEXT_REQUEST_ID_HEADER || globalThis.openNextDebug) {
      result.headers[INTERNAL_EVENT_REQUEST_ID] = requestId;
    }
    debug("Middleware response", result);
    return result;
  });
};
var handler2 = await createGenericHandler({
  handler: defaultHandler,
  type: "middleware"
});
var middleware_default = {
  fetch: handler2
};
export {
  middleware_default as default,
  handler2 as handler
};
