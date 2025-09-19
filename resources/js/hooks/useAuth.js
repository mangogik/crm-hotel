// resources/js/hooks/useAuth.js
import { usePage } from '@inertiajs/react'

export default function useAuth() {
  const { props } = usePage()
  const user = props?.auth?.user ?? null

  let roles = []
  if (user) {
    if (Array.isArray(user.roles)) {
      roles = user.roles
    } else if (typeof user.role === 'string') {
      roles = [user.role]
    }
  }

  const hasRole = (role) => roles.includes(role)
  const hasAnyRole = (checkRoles) => checkRoles.some(r => roles.includes(r))

  return { user, roles, hasRole, hasAnyRole }
}
