import { extendTheme } from '@chakra-ui/react'

export const theme = extendTheme({
  colors: {
    brand: {
      900: '#003F8F',
      800: '#003F8F',
      700: '#001F54',
      600: '#848484',
      500: '#9A9A9A',
      400: '#B8B8B8',
      300: '#D4DEEB',
      200: '#FFFFFF',
      100: '#F7F9FC',
      50: '#F0F4F9',
    },
    subheading: '#001F54',
  },
  fonts: {
    heading: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    body: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  styles: {
    global: {
      body: {
        bg: 'brand.200',
        color: 'brand.600',
      },
    },
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'brand',
      },
    },
  },
})
