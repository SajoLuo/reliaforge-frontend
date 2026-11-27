/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import {
  THEME_TOKEN_KEYS,
  type ConsoleThemeDefinition,
  type ThemeTokenKey,
} from "@reliaforge/plugin-sdk"

export const DEFAULT_THEME_ID = "reliaforge"
const THEME_STORAGE_KEY = "reliaforge.console.theme"
const THEME_ID_PATTERN = /^[a-z0-9-]+$/
const RGB_TRIPLET_PATTERN = /^\d{1,3} \d{1,3} \d{1,3}$/
const ALLOWED_TOKEN_KEYS = new Set<string>(THEME_TOKEN_KEYS)

export interface RegisteredConsoleTheme extends ConsoleThemeDefinition {
  pluginId: string
}

export interface ThemeContextValue {
  themes: RegisteredConsoleTheme[]
  activeThemeId: string
  selectedThemeId: string
  setTheme: (themeId: string) => void
  registerThemes: (pluginId: string, definitions: ConsoleThemeDefinition[]) => void
  unregisterPluginThemes: (pluginId: string) => void
  markCatalogSettled: (settled: boolean) => void
}

const defaultThemes: RegisteredConsoleTheme[] = [
  {
    id: DEFAULT_THEME_ID,
    pluginId: "platform",
    label: "ReliaForge",
    labelZh: "ReliaForge 默认",
    cssClass: "theme-reliaforge",
    tokens: {},
  },
]

const ThemeContext = createContext<ThemeContextValue>({
  themes: defaultThemes,
  activeThemeId: DEFAULT_THEME_ID,
  selectedThemeId: DEFAULT_THEME_ID,
  setTheme: () => undefined,
  registerThemes: () => undefined,
  unregisterPluginThemes: () => undefined,
  markCatalogSettled: () => undefined,
})

function isValidRgbTriplet(value: string): boolean {
  if (!RGB_TRIPLET_PATTERN.test(value)) return false
  return value.split(" ").every((channel) => {
    const parsed = Number(channel)
    return Number.isInteger(parsed) && parsed >= 0 && parsed <= 255
  })
}

export function validateThemeDefinition(definition: ConsoleThemeDefinition): ConsoleThemeDefinition | null {
  if (!THEME_ID_PATTERN.test(definition.id) || definition.id === DEFAULT_THEME_ID) {
    return null
  }
  if (!THEME_ID_PATTERN.test(definition.cssClass)) {
    return null
  }
  if (!definition.label.trim()) return null

  const cleanTokens: Partial<Record<ThemeTokenKey, string>> = {}
  for (const [key, value] of Object.entries(definition.tokens)) {
    if (typeof value !== "string" || !ALLOWED_TOKEN_KEYS.has(key) || !isValidRgbTriplet(value)) {
      return null
    }
    cleanTokens[key as ThemeTokenKey] = value
  }
  return {
    id: definition.id,
    label: definition.label,
    labelZh: definition.labelZh,
    cssClass: definition.cssClass,
    tokens: cleanTokens,
  }
}

function readStoredThemeId(): string {
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY)
    return saved && THEME_ID_PATTERN.test(saved) ? saved : DEFAULT_THEME_ID
  } catch {
    return DEFAULT_THEME_ID
  }
}

function writeStoredThemeId(themeId: string): void {
  try {
    if (themeId === DEFAULT_THEME_ID) {
      window.localStorage.removeItem(THEME_STORAGE_KEY)
    } else {
      window.localStorage.setItem(THEME_STORAGE_KEY, themeId)
    }
  } catch {
    // Ignore restricted storage environments.
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [pluginThemes, setPluginThemes] = useState<RegisteredConsoleTheme[]>([])
  const [selectedThemeId, setSelectedThemeId] = useState<string>(readStoredThemeId)
  const pluginThemesRef = useRef<RegisteredConsoleTheme[]>([])

  useEffect(() => {
    pluginThemesRef.current = pluginThemes
  }, [pluginThemes])

  const themes = useMemo<RegisteredConsoleTheme[]>(
    () => [...defaultThemes, ...pluginThemes],
    [pluginThemes],
  )

  const activeTheme = useMemo<RegisteredConsoleTheme>(
    () => themes.find((theme) => theme.id === selectedThemeId) ?? defaultThemes[0],
    [selectedThemeId, themes],
  )

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute("data-console-theme", activeTheme.id)
    if (activeTheme.id !== DEFAULT_THEME_ID) {
      root.classList.add(activeTheme.cssClass)
    }
    for (const [key, value] of Object.entries(activeTheme.tokens)) {
      if (value) root.style.setProperty(`--${key}`, value)
    }

    return () => {
      if (activeTheme.id !== DEFAULT_THEME_ID) {
        root.classList.remove(activeTheme.cssClass)
      }
      for (const key of Object.keys(activeTheme.tokens)) {
        root.style.removeProperty(`--${key}`)
      }
    }
  }, [activeTheme])

  const fallbackIfMissing = useCallback((availableThemes: RegisteredConsoleTheme[]) => {
    setSelectedThemeId((current) => {
      if (current !== DEFAULT_THEME_ID && !availableThemes.some((theme) => theme.id === current)) {
        writeStoredThemeId(DEFAULT_THEME_ID)
        return DEFAULT_THEME_ID
      }
      return current
    })
  }, [])

  const setTheme = useCallback((themeId: string) => {
    const nextId = THEME_ID_PATTERN.test(themeId) ? themeId : DEFAULT_THEME_ID
    setSelectedThemeId(nextId)
    writeStoredThemeId(nextId)
  }, [])

  const registerThemes = useCallback((pluginId: string, definitions: ConsoleThemeDefinition[]) => {
    const validated: RegisteredConsoleTheme[] = []
    for (const definition of definitions) {
      const clean = validateThemeDefinition(definition)
      if (clean) validated.push({ ...clean, pluginId })
    }
    const next = [
      ...pluginThemesRef.current.filter((theme) => theme.pluginId !== pluginId),
      ...validated,
    ]
    pluginThemesRef.current = next
    setPluginThemes(next)
  }, [])

  const unregisterPluginThemes = useCallback((pluginId: string) => {
    const removed = pluginThemesRef.current.filter((theme) => theme.pluginId === pluginId)
    if (removed.length === 0) return
    const next = pluginThemesRef.current.filter((theme) => theme.pluginId !== pluginId)
    pluginThemesRef.current = next
    setPluginThemes(next)
    setSelectedThemeId((current) => {
      if (removed.some((theme) => theme.id === current)) {
        writeStoredThemeId(DEFAULT_THEME_ID)
        return DEFAULT_THEME_ID
      }
      return current
    })
  }, [])

  const markCatalogSettled = useCallback((settled: boolean) => {
    if (!settled) return
    fallbackIfMissing([...defaultThemes, ...pluginThemesRef.current])
  }, [fallbackIfMissing])

  const value = useMemo<ThemeContextValue>(() => ({
    themes,
    activeThemeId: activeTheme.id,
    selectedThemeId,
    setTheme,
    registerThemes,
    unregisterPluginThemes,
    markCatalogSettled,
  }), [activeTheme.id, markCatalogSettled, registerThemes, selectedThemeId, setTheme, themes, unregisterPluginThemes])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext)
}
