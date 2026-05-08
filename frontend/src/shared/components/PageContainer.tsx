import { Container, ContainerProps } from '@chakra-ui/react'

interface PageContainerProps extends ContainerProps {
  children: React.ReactNode
}

export function PageContainer({
  children,
  ...props
}: PageContainerProps) {
  return (
    <Container
      maxW="container.lg"
      py={6}
      px={{ base: 4, md: 6 }}
      {...props}
    >
      {children}
    </Container>
  )
}
