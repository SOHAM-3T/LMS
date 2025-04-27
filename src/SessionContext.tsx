import React, { createContext, useContext, useState, useEffect } from 'react';

interface SessionContextType {
  sessionExpired: boolean;
  setSessionExpired: (expired: boolean) => void;
}

// Global setter for use outside React components (e.g., in api.ts)
export let setSessionExpiredGlobal: ((expired: boolean) => void) | undefined = undefined;

const SessionContext = createContext<SessionContextType>({
  sessionExpired: false,
  setSessionExpired: () => {},
});

export const useSession = () => useContext(SessionContext);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    setSessionExpiredGlobal = setSessionExpired;
    return () => {
      setSessionExpiredGlobal = undefined;
    };
  }, []);

  return (
    <SessionContext.Provider value={{ sessionExpired, setSessionExpired }}>
      {children}
    </SessionContext.Provider>
  );
};
