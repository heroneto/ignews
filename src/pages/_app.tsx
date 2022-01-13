import { AppProps } from 'next/app'
import { Header } from '../components/Header'
import '../styles/global.scss'
import { SessionProvider as NextAuthProvider, SessionProvider, useSession } from 'next-auth/react'

function MyApp({ Component, pageProps }: AppProps) {

  return (
    <SessionProvider>
      <NextAuthProvider session={pageProps.session}>
        <Auth>
          <Header />
          <Component {...pageProps} />

        </Auth>
      </NextAuthProvider>
    </SessionProvider>
  )
}

function Auth({ children }) {
  const { status } = useSession({ required: true })

  if (status === 'loading') {
    return (
      <h1>Loding...</h1>
    )
  }

  return children
}

export default MyApp
