import React, { createContext, useState, useContext, ReactNode } from 'react';

interface TabVisibilityContextProps {
  tabBarVisible: boolean;
  setTabBarVisible: (visible: boolean) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const TabVisibilityContext = createContext<TabVisibilityContextProps>({
  tabBarVisible: true,
  setTabBarVisible: () => {},
  loading: false,
  setLoading: () => {},
});

export const TabVisibilityProvider = ({ children }: { children: ReactNode }) => {
  const [tabBarVisible, setTabBarVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  
  return (
    <TabVisibilityContext.Provider value={{ 
      tabBarVisible, 
      setTabBarVisible,
      loading,
      setLoading,
    }}>
      {children}
    </TabVisibilityContext.Provider>
  );
};

export const useTabVisibility = () => useContext(TabVisibilityContext);
