// Mirrors the web app's highlighter palette: cool grey surfaces, ink text, and one yellow accent.
// The yellow is too light to read as text on these surfaces, so it is only ever a fill under ink.
export const NAV_THEME = {
	light: {
		background: "#F1F2F5",
		border: "#D5D7DE",
		card: "#FBFBFC",
		muted: "#4A4A55",
		notification: "#BE2F2C",
		primary: "#FFD83D",
		primaryForeground: "#16161B",
		text: "#16161B",
	},
	dark: {
		background: "#121215",
		border: "#2D2D35",
		card: "#202026",
		muted: "#B6B6C2",
		notification: "#F97770",
		primary: "#FFD83D",
		primaryForeground: "#16161B",
		text: "#F1F1F4",
	},
};

// The PostScript name, which iOS looks fonts up by, and the file name in assets/fonts, which
// Android does; expo-font's config plugin embeds it at build time.
export const DISPLAY_FONT = "BricolageGrotesque-SemiBold";

/** Durations in ms, and the entrance rise in pt. */
export const MOTION = { fast: 150, base: 200, slow: 300, stagger: 50, rise: 8 };
