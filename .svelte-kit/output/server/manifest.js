export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["robots.txt"]),
	mimeTypes: {".txt":"text/plain"},
	_: {
		client: {start:"_app/immutable/entry/start.Dx3aLs7T.js",app:"_app/immutable/entry/app.CjImgnH9.js",imports:["_app/immutable/entry/start.Dx3aLs7T.js","_app/immutable/chunks/Bju_0ad6.js","_app/immutable/chunks/I6fbWUjK.js","_app/immutable/chunks/CMbe3k5-.js","_app/immutable/entry/app.CjImgnH9.js","_app/immutable/chunks/I6fbWUjK.js","_app/immutable/chunks/LeO-fAKs.js","_app/immutable/chunks/CJcJB-l1.js","_app/immutable/chunks/CMbe3k5-.js","_app/immutable/chunks/_2VpBOS6.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js'))
		],
		remotes: {
			'62b3f9': __memo(() => import('./chunks/remote-62b3f9.js'))
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			}
		],
		prerendered_routes: new Set(["/_app/remote/62b3f9/testFn"]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
