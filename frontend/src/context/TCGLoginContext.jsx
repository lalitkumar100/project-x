import React, { createContext, useContext, useState, useCallback } from "react";

const TCGLoginContext = createContext(null);

/**
 * Wrap your layout with this provider to enable the TCG login dialog
 * anywhere in the tree via `useTCGLogin()`.
 */
export function TCGLoginProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  const openTCGLogin  = useCallback(() => setIsOpen(true),  []);
  const closeTCGLogin = useCallback(() => setIsOpen(false), []);

  return (
    <TCGLoginContext.Provider value={{ isOpen, openTCGLogin, closeTCGLogin }}>
      {children}
    </TCGLoginContext.Provider>
  );
}

/**
 * Hook — use this anywhere under MainLayout to open/close the dialog.
 *
 * @example
 * const { openTCGLogin } = useTCGLogin();
 * <button onClick={openTCGLogin}>Connect TCG</button>
 */
export function useTCGLogin() {
  const ctx = useContext(TCGLoginContext);
  if (!ctx) {
    throw new Error("useTCGLogin must be used inside <TCGLoginProvider>");
  }
  return ctx;
}
