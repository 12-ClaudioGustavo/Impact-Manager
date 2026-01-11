import React, { createContext, useState, useContext, useEffect } from 'react';
import { Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const lightTheme = {
  // Cores principais
  primary: '#2563EB',
  primaryDark: '#1E40AF',
  primaryLight: '#3B82F6',

  // Cores de fundo
  background: '#F9FAFB',
  backgroundCard: '#FFFFFF',
  backgroundHeader: '#2563EB',

  // Cores de texto
  text: '#1F2937',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  textOnPrimary: '#FFFFFF',

  // Cores de borda
  border: '#E5E7EB',
  borderLight: '#F3F4F6',

  // Cores de input
  inputBackground: '#FFFFFF',
  inputBorder: '#D1D5DB',
  inputPlaceholder: '#9CA3AF',
  inputDisabled: '#F3F4F6',

  // Cores de status
  success: '#10B981',
  successLight: '#D1FAE5',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // Cores de sombra
  shadow: '#000000',
  shadowOpacity: 0.1,

  // Gradientes
  gradientStart: '#2563EB',
  gradientEnd: '#1E40AF',

  // Ícones de cores
  iconColor: '#4B5563',
  iconColorLight: '#9CA3AF',

  // Status bar
  statusBarStyle: 'dark-content',
};

export const darkTheme = {
  // Cores principais
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  primaryLight: '#60A5FA',

  // Cores de fundo
  background: '#111827',
  backgroundCard: '#1F2937',
  backgroundHeader: '#1F2937',

  // Cores de texto
  text: '#F9FAFB',
  textSecondary: '#D1D5DB',
  textLight: '#9CA3AF',
  textOnPrimary: '#FFFFFF',

  // Cores de borda
  border: '#374151',
  borderLight: '#4B5563',

  // Cores de input
  inputBackground: '#1F2937',
  inputBorder: '#4B5563',
  inputPlaceholder: '#6B7280',
  inputDisabled: '#374151',

  // Cores de status
  success: '#10B981',
  successLight: '#064E3B',
  error: '#EF4444',
  errorLight: '#7F1D1D',
  warning: '#F59E0B',
  warningLight: '#78350F',
  info: '#3B82F6',
  infoLight: '#1E3A8A',

  // Cores de sombra
  shadow: '#000000',
  shadowOpacity: 0.3,

  // Gradientes
  gradientStart: '#1F2937',
  gradientEnd: '#111827',

  // Ícones de cores
  iconColor: '#D1D5DB',
  iconColorLight: '#9CA3AF',

  // Status bar
  statusBarStyle: 'light-content',
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [theme, setTheme] = useState(lightTheme);
  const fadeAnim = new Animated.Value(1);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('isDarkMode');
      if (savedTheme !== null) {
        const isDark = JSON.parse(savedTheme);
        setIsDarkMode(isDark);
        setTheme(isDark ? darkTheme : lightTheme);
      }
    } catch (error) {
      console.log('Error loading theme:', error);
    }
  };

  const toggleTheme = async () => {
    // Animação de fade
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    const newIsDarkMode = !isDarkMode;
    setIsDarkMode(newIsDarkMode);
    setTheme(newIsDarkMode ? darkTheme : lightTheme);

    try {
      await AsyncStorage.setItem('isDarkMode', JSON.stringify(newIsDarkMode));
    } catch (error) {
      console.log('Error saving theme:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme, fadeAnim }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
