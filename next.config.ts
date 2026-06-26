import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	// Disable server-side image optimization.
	// All manga pages are static files in public/ — they don't need Sharp/resizing.
	// This keeps the serverless function well under Vercel's 250 MB limit.
	images: {
		unoptimized: true,
	},
};

export default nextConfig;
