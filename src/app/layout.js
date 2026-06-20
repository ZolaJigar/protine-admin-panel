import { Inter } from 'next/font/google';
import './globals.css';
import MuiThemeProvider from '@/components/MuiThemeProvider';
import ToastProvider from '@/components/ToastProvider';
import { AdminProvider } from '@/context/AdminContext';
import EmotionRegistry from '@/components/EmotionRegistry';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });

export const metadata = {
  title: 'Protine Web — Admin Panel',
  description: 'Admin dashboard for Protine Web management.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <EmotionRegistry>
          <MuiThemeProvider>
            <AdminProvider>{children}</AdminProvider>
            <ToastProvider />
          </MuiThemeProvider>
        </EmotionRegistry>
      </body>
    </html>
  );
}
