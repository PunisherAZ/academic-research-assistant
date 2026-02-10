import type { Metadata } from 'next'
import { Inter, Merriweather } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const merriweather = Merriweather({
    weight: ['300', '400', '700', '900'],
    subsets: ['latin'],
    variable: '--font-merriweather'
})

export const metadata: Metadata = {
    title: 'Academic Research Assistant',
    description: 'AI-powered research for clinical mental health counseling.',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={`${inter.variable} ${merriweather.variable} min-h-screen bg-background text-foreground antialiased`}>
                {children}
            </body>
        </html>
    )
}
