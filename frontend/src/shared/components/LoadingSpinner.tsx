import { Flex, Spinner } from '@chakra-ui/react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  fullPage?: boolean
}

export function LoadingSpinner({
  size = 'md',
  fullPage = false,
}: LoadingSpinnerProps) {
  return (
    <Flex
      justify="center"
      align="center"
      h={fullPage ? '100vh' : '200px'}
    >
      <Spinner
        size={size}
        color="brand.800"
        thickness="4px"
        speed="0.8s"
      />
    </Flex>
  )
}
