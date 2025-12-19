import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/candidate(.*)',
  '/reference(.*)',
  '/api/reference-check(.*)',
  '/api/create-candidate-request',
  '/api/submit-references',
  '/api/phone-reference(.*)',
  '/api/schedule-phone-check',
  '/api/webhooks(.*)',
  '/api/vapi(.*)',
  '/api/cron(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
