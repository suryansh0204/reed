import { authMiddleware } from '@kinde-oss/kinde-auth-nextjs/server'

export const config = {
  matcher: ['/dashboard/:path*', '/auth-callback'],//these are the pages we wanna protect so only logged in users can visit it
}

export default authMiddleware