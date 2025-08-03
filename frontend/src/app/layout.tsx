import  Provider from '../components/provider'
import './globals.css'

export const metadata = {
  title: 'Cardano 1inch Fusion+',
  description: 'Cross-chain DeFi application bridging Cardano and Ethereum',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Provider>
          {children}
        </Provider>
      </body>
    </html>
  )
}