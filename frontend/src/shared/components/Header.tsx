import { Flex, Heading, HStack, Avatar, Menu, MenuButton, MenuList, MenuItem, Button, VStack, Text, Box, IconButton } from '@chakra-ui/react'
import { FiLogOut, FiArrowLeft } from 'react-icons/fi'
import { useNavigate, useLocation } from 'react-router-dom'
import { authStore } from '../../features/auth/store/authStore'

export function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = authStore()

  const handleLogout = () => {
    logout()
    navigate('/signin')
  }

  if (location.pathname === '/signin') {
    return null
  }

  const isHome = location.pathname === '/'

  return (
    <VStack spacing={0} as="header" bg="brand.800" color="white" boxShadow="0 2px 12px rgba(0, 0, 0, 0.08)" borderBottom="1px solid rgba(255, 255, 255, 0.1)" w="full">
      <Flex w="full" px={8} py={4} align="center" justify="space-between">
        <HStack spacing={3}>
          {!isHome && (
            <IconButton
              aria-label="Back"
              icon={<FiArrowLeft />}
              variant="ghost"
              color="white"
              _hover={{ bg: 'rgba(255, 255, 255, 0.15)' }}
              onClick={() => navigate(-1)}
            />
          )}
          <Heading
            size="lg"
            cursor="pointer"
            onClick={() => navigate('/')}
            fontWeight={700}
            letterSpacing="-0.5px"
            _hover={{ opacity: 0.85, transition: 'opacity 0.2s' }}
          >
            Meet Sync
          </Heading>
        </HStack>

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
    </VStack>
  )
}
