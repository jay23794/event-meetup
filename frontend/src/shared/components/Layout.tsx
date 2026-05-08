import { Box, VStack } from '@chakra-ui/react'
import { Header } from './Header'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <VStack spacing={0} minH="100vh" w="full">
      <Header />
      <Box flex={1} w="full" bg="brand.200">
        {children}
      </Box>
    </VStack>
  )
}
