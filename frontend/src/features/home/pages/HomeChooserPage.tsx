import { useNavigate } from 'react-router-dom'
import {
  Card,
  CardBody,
  Heading,
  HStack,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react'
import { FiUsers, FiCamera } from 'react-icons/fi'
import { Layout } from '../../../shared/components/Layout'
import { PageContainer } from '../../../shared/components/PageContainer'
import { LegalFooter } from '../../../shared/components/LegalFooter'

interface ChooserCardProps {
  title: string
  description: string
  icon: React.ReactNode
  onClick: () => void
}

function ChooserCard({ title, description, icon, onClick }: ChooserCardProps) {
  return (
    <Card
      as="button"
      type="button"
      onClick={onClick}
      cursor="pointer"
      transition="transform 0.15s, box-shadow 0.15s"
      _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
      textAlign="left"
    >
      <CardBody>
        <VStack align="start" spacing={4}>
          <HStack spacing={3}>
            <Text fontSize="2xl" color="brand.700">
              {icon}
            </Text>
            <Heading size="md" color="brand.900">
              {title}
            </Heading>
          </HStack>
          <Text color="gray.600" fontSize="sm">
            {description}
          </Text>
        </VStack>
      </CardBody>
    </Card>
  )
}

export function HomeChooserPage() {
  const navigate = useNavigate()

  return (
    <Layout>
      <PageContainer>
        <VStack align="stretch" spacing={6} maxW="3xl" mx="auto">
          <VStack align="start" spacing={1}>
            <Heading size="lg" color="brand.900">
              How are you using Meet Sync today?
            </Heading>
            <Text color="gray.600">
              Pick a mode — you can switch any time from the home button.
            </Text>
          </VStack>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <ChooserCard
              title="Exhibitor"
              description="Set up your booth, upload brochures or business cards, and get a QR code visitors can scan."
              icon={<FiUsers />}
              onClick={() => navigate('/exhibitor')}
            />
            <ChooserCard
              title="Visitor"
              description="Walking the floor — scan a booth's QR code, or capture a card or brochure if there's no QR."
              icon={<FiCamera />}
              onClick={() => navigate('/visitor')}
            />
          </SimpleGrid>

          <LegalFooter />
        </VStack>
      </PageContainer>
    </Layout>
  )
}
