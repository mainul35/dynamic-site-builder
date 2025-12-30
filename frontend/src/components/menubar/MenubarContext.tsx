import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

interface MenubarContextValue {
  // Active menu tracking
  activeMenuId: string | null;
  openSubMenuPath: string[];

  // Menu state actions
  openMenu: (menuId: string) => void;
  closeMenu: () => void;
  closeAllMenus: () => void;
  isMenuOpen: (menuId: string) => boolean;

  // Submenu handling
  openSubMenu: (submenuId: string) => void;
  closeSubMenu: (submenuId: string) => void;
  isSubMenuOpen: (submenuId: string) => boolean;

  // Hover behavior for traditional desktop menus
  isAnyMenuOpen: boolean;
  setHoverEnabled: (enabled: boolean) => void;
  hoverEnabled: boolean;

  // Keyboard navigation
  focusedItemIndex: number;
  setFocusedItemIndex: (index: number) => void;

  // Refs for focus management
  menubarRef: React.RefObject<HTMLElement>;
}

const MenubarContext = createContext<MenubarContextValue | null>(null);

interface MenubarProviderProps {
  children: React.ReactNode;
}

export const MenubarProvider: React.FC<MenubarProviderProps> = ({ children }) => {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [openSubMenuPath, setOpenSubMenuPath] = useState<string[]>([]);
  const [hoverEnabled, setHoverEnabled] = useState(false);
  const [focusedItemIndex, setFocusedItemIndex] = useState(-1);
  const menubarRef = useRef<HTMLElement>(null);

  const openMenu = useCallback((menuId: string) => {
    setActiveMenuId(menuId);
    setOpenSubMenuPath([]);
    setHoverEnabled(true); // Enable hover switching between menus
    setFocusedItemIndex(0);
  }, []);

  const closeMenu = useCallback(() => {
    setActiveMenuId(null);
    setOpenSubMenuPath([]);
    setHoverEnabled(false);
    setFocusedItemIndex(-1);
  }, []);

  const closeAllMenus = useCallback(() => {
    setActiveMenuId(null);
    setOpenSubMenuPath([]);
    setHoverEnabled(false);
    setFocusedItemIndex(-1);
  }, []);

  const isMenuOpen = useCallback((menuId: string) => {
    return activeMenuId === menuId;
  }, [activeMenuId]);

  const openSubMenu = useCallback((submenuId: string) => {
    setOpenSubMenuPath(prev => [...prev, submenuId]);
  }, []);

  const closeSubMenu = useCallback((submenuId: string) => {
    setOpenSubMenuPath(prev => {
      const index = prev.indexOf(submenuId);
      if (index >= 0) {
        return prev.slice(0, index);
      }
      return prev;
    });
  }, []);

  const isSubMenuOpen = useCallback((submenuId: string) => {
    return openSubMenuPath.includes(submenuId);
  }, [openSubMenuPath]);

  const isAnyMenuOpen = activeMenuId !== null;

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menubarRef.current && !menubarRef.current.contains(event.target as Node)) {
        closeAllMenus();
      }
    };

    if (isAnyMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isAnyMenuOpen, closeAllMenus]);

  // Close menus on escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isAnyMenuOpen) {
        closeAllMenus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isAnyMenuOpen, closeAllMenus]);

  const value: MenubarContextValue = {
    activeMenuId,
    openSubMenuPath,
    openMenu,
    closeMenu,
    closeAllMenus,
    isMenuOpen,
    openSubMenu,
    closeSubMenu,
    isSubMenuOpen,
    isAnyMenuOpen,
    setHoverEnabled,
    hoverEnabled,
    focusedItemIndex,
    setFocusedItemIndex,
    menubarRef,
  };

  return (
    <MenubarContext.Provider value={value}>
      {children}
    </MenubarContext.Provider>
  );
};

export const useMenubar = (): MenubarContextValue => {
  const context = useContext(MenubarContext);
  if (!context) {
    throw new Error('useMenubar must be used within a MenubarProvider');
  }
  return context;
};

export default MenubarContext;
