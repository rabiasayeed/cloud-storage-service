export const NAME_MAX = 255;
export const cleanName = (value, max = NAME_MAX) => String(value ?? "").normalize("NFKC").replace(/[\\/?%*:|"<>\u0000-\u001f]/g, "_").replace(/\.{2,}/g, ".").trim().slice(0, max);
export const validateName = (value, label = "Name") => { const name = cleanName(value); if (!name || name === "." || name === "..") return label + " is required"; return null; };
export const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").toLowerCase());
