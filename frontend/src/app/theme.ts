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
  // Mobile-first font sizes (xs..3xl scaled down for mobile, larger from md breakpoint up)
  fontSizes: {
    xs: '0.7rem',     // 11.2px
    sm: '0.8125rem',  // 13px
    md: '0.9375rem',  // 15px
    lg: '1.0625rem',  // 17px
    xl: '1.1875rem',  // 19px
    '2xl': '1.375rem', // 22px
    '3xl': '1.625rem', // 26px
    '4xl': '2rem',     // 32px
    '5xl': '2.5rem',   // 40px
    '6xl': '3rem',     // 48px
  },
  styles: {
    global: {
      body: {
        bg: 'brand.200',
        color: 'brand.600',
        fontSize: { base: 'sm', md: 'md' },
      },
    },
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'brand',
      },
      sizes: {
        lg: { fontSize: { base: 'md', md: 'lg' }, h: { base: '2.75rem', md: '3rem' }, px: 6 },
        md: { fontSize: { base: 'sm', md: 'md' }, h: { base: '2.25rem', md: '2.5rem' }, px: 4 },
        sm: { fontSize: { base: 'xs', md: 'sm' }, h: { base: '1.875rem', md: '2rem' }, px: 3 },
      },
    },
    Heading: {
      sizes: {
        '4xl': { fontSize: { base: '3xl', md: '5xl' }, lineHeight: 1.1 },
        '3xl': { fontSize: { base: '2xl', md: '4xl' }, lineHeight: 1.15 },
        '2xl': { fontSize: { base: 'xl', md: '3xl' }, lineHeight: 1.2 },
        xl: { fontSize: { base: 'lg', md: '2xl' }, lineHeight: 1.25 },
        lg: { fontSize: { base: 'md', md: 'xl' }, lineHeight: 1.3 },
        md: { fontSize: { base: 'sm', md: 'lg' }, lineHeight: 1.35 },
        sm: { fontSize: { base: 'xs', md: 'md' }, lineHeight: 1.4 },
        xs: { fontSize: { base: 'xs', md: 'sm' }, lineHeight: 1.4 },
      },
    },
    FormLabel: {
      baseStyle: {
        fontSize: { base: 'sm', md: 'md' },
      },
    },
    Input: {
      sizes: {
        md: {
          field: { fontSize: { base: 'sm', md: 'md' } },
        },
      },
    },
    Textarea: {
      sizes: {
        md: { fontSize: { base: 'sm', md: 'md' } },
      },
    },
  },
})
