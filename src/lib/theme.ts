// Theme state lives on <html> as data-palette and data-mode, saved to localStorage.
// The inline script in Base.astro mirrors resolveTheme so the page paints in the right theme.

export type Palette = 'rust' | 'dusk';
export type Mode = 'auto' | 'dark' | 'light';
export type ResolvedMode = Exclude<Mode, 'auto'>;

export interface ThemeOption<T extends string> {
  value: T;
  label: string;
}

export const PALETTES: ThemeOption<Palette>[] = [
  { value: 'rust', label: 'Rust' },
  { value: 'dusk', label: 'Dusk' },
];

export const MODES: ThemeOption<Mode>[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
];

export const STORAGE_KEYS = { palette: 'llf-palette', mode: 'llf-mode' } as const;
export type ThemeSetting = keyof typeof STORAGE_KEYS;

const DEFAULT_PALETTE: Palette = 'rust';
const DEFAULT_MODE: Mode = 'auto';
const LIGHT_QUERY = '(prefers-color-scheme: light)';

const isPalette = (value: string | null): value is Palette =>
  PALETTES.some(option => option.value === value);

const isMode = (value: string | null): value is Mode =>
  MODES.some(option => option.value === value);

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function getPalette(): Palette {
  const stored = read(STORAGE_KEYS.palette);
  return isPalette(stored) ? stored : DEFAULT_PALETTE;
}

export function getMode(): Mode {
  const stored = read(STORAGE_KEYS.mode);
  return isMode(stored) ? stored : DEFAULT_MODE;
}

export function save(setting: ThemeSetting, value: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS[setting], value);
  } catch {
    // Storage blocked (private mode, etc.): the choice still applies for this page view.
  }
}

export function resolveMode(mode: Mode): ResolvedMode {
  if (mode !== 'auto') return mode;
  return matchMedia(LIGHT_QUERY).matches ? 'light' : 'dark';
}

export function applyTheme(): void {
  const root = document.documentElement;
  root.dataset.palette = getPalette();
  root.dataset.mode = resolveMode(getMode());
}

export function onSystemModeChange(callback: () => void): void {
  matchMedia(LIGHT_QUERY).addEventListener('change', callback);
}
