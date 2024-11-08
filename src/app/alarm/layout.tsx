import { Inter } from 'next/font/google'
import 'antd/dist/reset.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'MQTT Alarm System',
  description: 'Ein System zur Überwachung von MQTT-Alarmen',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body className={inter.className}>{children}</body>
    </html>
  )
}