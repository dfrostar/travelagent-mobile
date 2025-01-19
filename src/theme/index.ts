import { Platform } from 'react-native'

export const colors = {
  primary: '#2196F3',
  secondary: '#1976D2',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  error: '#B00020',
  text: '#000000',
  textSecondary: '#757575',
  border: '#E0E0E0',
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
}

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: Platform.select({ ios: '600', android: 'bold' }),
  },
  h2: {
    fontSize: 24,
    fontWeight: Platform.select({ ios: '600', android: 'bold' }),
  },
  body: {
    fontSize: 16,
    fontWeight: 'normal',
  },
  caption: {
    fontSize: 14,
    fontWeight: 'normal',
  },
}

export const shadows = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  android: {
    elevation: 5,
  },
})

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
}
