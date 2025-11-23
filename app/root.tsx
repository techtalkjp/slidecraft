import { useEffect } from 'react'
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
} from 'react-router'

import type { Route } from './+types/root'
import './app.css'
import { trackPageView, trackRepeatUser } from './lib/analytics'

export const links: Route.LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
  },
]

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <link rel="canonical" href="https://www.slidecraft.work" />
        {/* Google Analytics */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-MYGWWZDCP2"
        />
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Google Analytics initialization requires inline script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-MYGWWZDCP2');
            `,
          }}
        />
        {/* Structured Data (JSON-LD) */}
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Structured data requires inline JSON-LD
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'SlideCraft',
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web Browser',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'JPY',
              },
              description:
                'AI生成スライドを1枚単位で修正できるWebアプリケーション。Notebook LMやNano Banana Proで生成したスライドのピンポイント修正が可能。',
              url: 'https://www.slidecraft.work',
              author: {
                '@type': 'Organization',
                name: 'TechTalk Inc.',
                url: 'https://www.techtalk.jp',
              },
              softwareVersion: '1.0',
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '5',
                ratingCount: '1',
              },
            }),
          }}
        />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  const location = useLocation()

  // Sync with localStorage to track repeat users
  // External system: localStorage (visit_count)
  useEffect(() => {
    trackRepeatUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync with Google Analytics on route changes
  // External system: Google Analytics (gtag)
  useEffect(() => {
    trackPageView(location.pathname + location.search)
  }, [location])

  return <Outlet />
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!'
  let details = 'An unexpected error occurred.'
  let stack: string | undefined

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error'
    details =
      error.status === 404
        ? 'The requested page could not be found.'
        : error.statusText || details
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message
    stack = error.stack
  }

  return (
    <main className="container mx-auto p-4 pt-16">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full overflow-x-auto p-4">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  )
}
