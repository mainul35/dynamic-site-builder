import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * UI Preferences Store
 *
 * Manages user interface preferences like view toggles,
 * zoom level, and panel visibility. Persisted to localStorage.
 */

export interface UIPreferencesState {
  // View toggles
  showGrid: boolean;
  showRulers: boolean;
  showComponentOutlines: boolean;

  // Appearance
  darkMode: boolean;
  compactMode: boolean;

  // Notifications
  autoSaveNotifications: boolean;

  // Zoom
  zoomLevel: number;
  zoomLevels: number[];

  // Panel visibility
  leftPanelCollapsed: boolean;
  rightPanelCollapsed: boolean;

  // Actions
  toggleGrid: () => void;
  toggleRulers: () => void;
  toggleComponentOutlines: () => void;
  toggleDarkMode: () => void;
  toggleCompactMode: () => void;
  toggleAutoSaveNotifications: () => void;
  setZoomLevel: (level: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  setLeftPanelCollapsed: (collapsed: boolean) => void;
  setRightPanelCollapsed: (collapsed: boolean) => void;

  // Reset all preferences
  resetPreferences: () => void;
}

const DEFAULT_PREFERENCES = {
  showGrid: true,
  showRulers: false,
  showComponentOutlines: false,
  darkMode: false,
  compactMode: false,
  autoSaveNotifications: true,
  zoomLevel: 100,
  leftPanelCollapsed: false,
  rightPanelCollapsed: false,
};

const ZOOM_LEVELS = [25, 50, 75, 100, 125, 150, 200];
const MIN_ZOOM = 25;
const MAX_ZOOM = 200;

export const useUIPreferencesStore = create<UIPreferencesState>()(
  persist(
    (set, get) => ({
      // Initial state
      ...DEFAULT_PREFERENCES,
      zoomLevels: ZOOM_LEVELS,

      // View toggles
      toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),

      toggleRulers: () => set((state) => ({ showRulers: !state.showRulers })),

      toggleComponentOutlines: () =>
        set((state) => ({ showComponentOutlines: !state.showComponentOutlines })),

      // Appearance toggles
      toggleDarkMode: () => {
        set((state) => {
          const newDarkMode = !state.darkMode;
          // Apply dark mode class to document
          if (newDarkMode) {
            document.documentElement.classList.add('dark-mode');
          } else {
            document.documentElement.classList.remove('dark-mode');
          }
          return { darkMode: newDarkMode };
        });
      },

      toggleCompactMode: () => {
        set((state) => {
          const newCompactMode = !state.compactMode;
          // Apply compact mode class to document
          if (newCompactMode) {
            document.documentElement.classList.add('compact-mode');
          } else {
            document.documentElement.classList.remove('compact-mode');
          }
          return { compactMode: newCompactMode };
        });
      },

      toggleAutoSaveNotifications: () =>
        set((state) => ({ autoSaveNotifications: !state.autoSaveNotifications })),

      // Zoom controls
      setZoomLevel: (level: number) => {
        const clampedLevel = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, level));
        set({ zoomLevel: clampedLevel });
      },

      zoomIn: () => {
        const currentZoom = get().zoomLevel;
        const nextLevel = ZOOM_LEVELS.find((level) => level > currentZoom);
        if (nextLevel) {
          set({ zoomLevel: nextLevel });
        }
      },

      zoomOut: () => {
        const currentZoom = get().zoomLevel;
        const prevLevels = ZOOM_LEVELS.filter((level) => level < currentZoom);
        if (prevLevels.length > 0) {
          set({ zoomLevel: prevLevels[prevLevels.length - 1] });
        }
      },

      resetZoom: () => set({ zoomLevel: 100 }),

      // Panel visibility
      toggleLeftPanel: () =>
        set((state) => ({ leftPanelCollapsed: !state.leftPanelCollapsed })),

      toggleRightPanel: () =>
        set((state) => ({ rightPanelCollapsed: !state.rightPanelCollapsed })),

      setLeftPanelCollapsed: (collapsed: boolean) =>
        set({ leftPanelCollapsed: collapsed }),

      setRightPanelCollapsed: (collapsed: boolean) =>
        set({ rightPanelCollapsed: collapsed }),

      // Reset
      resetPreferences: () => set(DEFAULT_PREFERENCES),
    }),
    {
      name: 'ui-preferences-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Selector hooks for convenience
export const useShowGrid = () => useUIPreferencesStore((state) => state.showGrid);
export const useShowRulers = () => useUIPreferencesStore((state) => state.showRulers);
export const useZoomLevel = () => useUIPreferencesStore((state) => state.zoomLevel);
export const useLeftPanelCollapsed = () =>
  useUIPreferencesStore((state) => state.leftPanelCollapsed);
export const useRightPanelCollapsed = () =>
  useUIPreferencesStore((state) => state.rightPanelCollapsed);
export const useDarkMode = () => useUIPreferencesStore((state) => state.darkMode);
export const useCompactMode = () => useUIPreferencesStore((state) => state.compactMode);
export const useAutoSaveNotifications = () =>
  useUIPreferencesStore((state) => state.autoSaveNotifications);

/**
 * Initialize UI preferences on app load
 * Apply persisted dark mode and compact mode classes to document
 */
export const initializeUIPreferences = () => {
  const state = useUIPreferencesStore.getState();
  if (state.darkMode) {
    document.documentElement.classList.add('dark-mode');
  }
  if (state.compactMode) {
    document.documentElement.classList.add('compact-mode');
  }
};

export default useUIPreferencesStore;
