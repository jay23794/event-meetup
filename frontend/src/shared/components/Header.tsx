import { Flex, Heading, HStack, Avatar, Menu, MenuButton, MenuList, MenuItem, Breadcrumb, BreadcrumbItem, BreadcrumbLink, Button, VStack, Text, Box } from '@chakra-ui/react'
import { FiLogOut, FiChevronRight, FiHome } from 'react-icons/fi'
import { useNavigate, useLocation } from 'react-router-dom'
import { authStore } from '../../features/auth/store/authStore'

function getBreadcrumbs(pathname: string) {
  const paths = pathname.split('/').filter(Boolean)
  const breadcrumbs: Array<{ label: string; path: string }> = [
    { label: 'Events', path: '/events' },
  ]

  if (paths.length > 1) {
    if (paths[0] === 'events') {
      if (paths[1] === 'new') {
        breadcrumbs.push({ label: 'Create Event', path: '/events/new' })
      } else if (paths.length > 1) {
        breadcrumbs.push({ label: 'Event Details', path: `/events/${paths[1]}` })
        if (paths[2] === 'booths' && paths[3] === 'new') {
          breadcrumbs.push({ label: 'New Booth', path: `/events/${paths[1]}/booths/new` })
        }
      }
    }
  }

  return breadcrumbs
}

export function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = authStore()

  const breadcrumbs = location.pathname !== '/signin' ? getBreadcrumbs(location.pathname) : []

  const handleLogout = () => {
    logout()
    navigate('/signin')
  }

  if (location.pathname === '/signin') {
    return null
  }

  return (
    <VStack spacing={0} as="header" bg="brand.700" color="white" boxShadow="0 2px 12px rgba(0, 0, 0, 0.08)" borderBottom="1px solid rgba(255, 255, 255, 0.1)" w="full">
      {/* Top: Branding & User Menu */}
      <Flex w="full" px={8} py={4} align="center" justify="space-between">
        <Heading
          size="lg"
          cursor="pointer"
          onClick={() => navigate('/events')}
          fontWeight={700}
          letterSpacing="-0.5px"
          _hover={{ opacity: 0.85, transition: 'opacity 0.2s' }}
        >
          Meet Sync
        </Heading>

        {/* Right: Actions & User Menu */}
        <HStack spacing={4}>
        <Menu>
          <MenuButton
            as={Avatar}
            name={user?.name || 'User'}
            cursor="pointer"
            size="md"
            _hover={{ boxShadow: '0 0 0 3px rgba(255, 255, 255, 0.2)', transition: 'all 0.2s' }}
          />
          <MenuList bg="white" color="brand.900">
            <Box px={4} py={3} borderBottom="1px solid" borderColor="gray.100">
              <Text fontSize="sm" fontWeight={600}>{user?.name}</Text>
              <Text fontSize="xs" color="gray.500">{user?.email}</Text>
            </Box>
            <MenuItem onClick={handleLogout} icon={<FiLogOut />}>
              Logout
            </MenuItem>
          </MenuList>
        </Menu>
      </HStack>
      </Flex>

      {/* Bottom: Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <Flex w="full" px={8} py={3} align="center" bg="rgba(0, 0, 0, 0.1)">
          <Breadcrumb spacing={2} separator={<FiChevronRight size={16} />}>
            {breadcrumbs.map((breadcrumb, index) => (
              <BreadcrumbItem key={breadcrumb.path}>
                <BreadcrumbLink
                  onClick={() => navigate(breadcrumb.path)}
                  cursor="pointer"
                  opacity={index === breadcrumbs.length - 1 ? 1 : 0.8}
                  fontWeight={index === breadcrumbs.length - 1 ? 600 : 500}
                  fontSize="sm"
                  _hover={{ opacity: 1 }}
                >
                  {breadcrumb.label}
                </BreadcrumbLink>
              </BreadcrumbItem>
            ))}
          </Breadcrumb>
        </Flex>
      )}
    </VStack>
  )
}
