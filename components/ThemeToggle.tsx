"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

type Theme = "dark" | "light";

export function ThemeToggle() {
	const [theme, setTheme] = useState<Theme>("dark");
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
		const saved = localStorage.getItem("manga-theme") as Theme | null;
		if (saved) setTheme(saved);
	}, []);

	const toggle = () => {
		const next: Theme = theme === "dark" ? "light" : "dark";
		setTheme(next);
		localStorage.setItem("manga-theme", next);
		// Optionally sync a data-theme attribute on <html> for CSS variables
		document.documentElement.setAttribute("data-theme", next);
	};

	// Avoid hydration mismatch — render nothing until mounted
	if (!mounted) return <div className="w-8 h-8" />;

	return (
		<button
			onClick={toggle}
			className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 text-white/50 hover:text-white hover:bg-white/8"
			aria-label={
				theme === "dark"
					? "Switch to light mode"
					: "Switch to dark mode"
			}
		>
			{theme === "dark" ? (
				<Sun className="w-4 h-4" />
			) : (
				<Moon className="w-4 h-4" />
			)}
		</button>
	);
}
