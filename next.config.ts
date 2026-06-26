import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	// Static export — no serverless functions at all.
	// Pages are pre-rendered at build time and served from Vercel's CDN edge.
	// This eliminates the 250 MB function size limit entirely.
	output: "export",

	// next/image requires a custom loader in static export mode
	// (no server to run Sharp). unoptimized passes the src through as-is.
	images: {
		unoptimized: true,
	},

	// Trailing slash so static HTML files resolve correctly on the CDN
	trailingSlash: true,
};

export default nextConfig;
