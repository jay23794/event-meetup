import { Flex, Heading, HStack, IconButton, Avatar, Menu, MenuButton, MenuList, MenuItem } from '@chakra-ui/react'
import { FiLogOut } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { authStore } from '../../features/auth/store/authStore'

export function Header() {
  const navigate = useNavigate()
  const { user, logout } = authStore()

  const handleLogout = () => {
    logout()
    navigate('/signin')
  }

  return (
    <Flex
      as="header"
      bg="brand.800"
      color="white"
      px={6}
      py={4}
      align="center"
      justify="space-between"
      boxShadow="sm"
    >
      <Heading size="md" cursor="pointer" onClick={() => navigate('/events')}>
        Meet Sync
      </Heading>

      <HStack spacing={4}>
        <Menu>
          <MenuButton
            as={Avatar}
            name={user?.name || 'User'}
            cursor="pointer"
            size="sm"
          />
          <MenuList>
            <MenuItem onClick={handleLogout}>
              <HStack spacing={2}>
                <FiLogOut />
                <span>Logout</span>
              </HStack>
            </MenuItem>
          </MenuList>
        </Menu>
      </HStack>
    </Flex>
  )
}
