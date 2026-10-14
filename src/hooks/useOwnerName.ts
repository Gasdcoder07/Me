import { createContext, useContext } from 'react';

// Provided by LaunchGate once the welcome is done, so every screen below it already has the name.
export const OwnerNameContext = createContext<string | null>(null);

export function useOwnerName(): string {
  const name = useContext(OwnerNameContext);
  if (name === null) throw new Error('useOwnerName must be used inside LaunchGate, after the welcome.');
  return name;
}
