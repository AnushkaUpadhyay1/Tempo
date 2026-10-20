import { createContext, useContext } from 'react';

export interface ShellApi {
  openPalette: () => void;
  openAdd: () => void;
}

export const ShellContext = createContext<ShellApi>({ openPalette: () => {}, openAdd: () => {} });

/** Lets screens open the command menu and the add sheet that live in the shell. */
export const useShell = () => useContext(ShellContext);
