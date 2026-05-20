import React, { createContext, useContext, useState, useCallback } from 'react';

type PortalContextType = {
  portalContent: React.ReactNode | null;
  setPortalContent: (content: React.ReactNode | null) => void;
};

const PortalContext = createContext<PortalContextType | null>(null);

export const PortalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [portalContent, setPortalContent] = useState<React.ReactNode | null>(null);

  return (
    <PortalContext.Provider value={{ portalContent, setPortalContent }}>
      {children}
      {portalContent}
    </PortalContext.Provider>
  );
};

export const usePortal = () => {
  const context = useContext(PortalContext);
  if (!context) {
    throw new Error('usePortal must be used within a PortalProvider');
  }
  return context;
};

export const Portal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setPortalContent } = usePortal();

  React.useEffect(() => {
    setPortalContent(children);
    return () => setPortalContent(null);
  }, [children, setPortalContent]);

  return null;
};
