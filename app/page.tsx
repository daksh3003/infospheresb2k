export default function Home() {
  // Middleware handles all routing logic:
  // - If authenticated: redirects to role-based dashboard
  // - If not authenticated: redirects to /auth/login
  // This page should never actually render due to middleware
  return null;
}
