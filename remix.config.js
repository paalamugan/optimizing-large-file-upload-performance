const isProd = process.env.NODE_ENV === "production";

/**
 * @type {import('@remix-run/dev').AppConfig}
 */
const config = {
  cacheDirectory: "./node_modules/.cache/remix",
  ignoredRouteFiles: ["**/.*", "**/*.css", "**/*.test.{js,jsx,ts,tsx}"],
};

if (isProd) {
  config.serverBuildTarget = "vercel";
  // When running locally in development mode, we use the built in remix
  // server. This does not understand the vercel lambda module format,
  // so we default back to the standard build output.
  config.server = "./vercel-server.js";
}

module.exports = config;
