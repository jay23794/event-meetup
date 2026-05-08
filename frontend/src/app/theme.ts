import { extendTheme } from '@chakra-ui/react'

export const theme = extendTheme({
  colors: {
    brand: {
      900: '#03045e',
      800: '#023e8a',
      700: '#0077b6',
      600: '#0096c7',
      500: '#48cae4',
      400: '#90e0ef',
      300: '#ade8f4',
      200: '#caf0f8',
    },
  },
  fonts: {
    heading: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    body: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  styles: {
    global: {
      body: {
        bg: 'brand.200',
        color: 'brand.900',
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
