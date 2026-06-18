// src/context/ThemeContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
 
const ThemeContext = createContext();
 
export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(true); // default dark
 
  useEffect(() => {
    isDark
      ? document.documentElement.classList.add('dark')
      : document.documentElement.classList.remove('dark');
  }, [isDark]);
 
  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme: () => setIsDark(d => !d) }}>
      {children}
    </ThemeContext.Provider>
  );
};
 
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
