import './globals.css';
import { Inter, Nunito } from 'next/font/google';
import { AppProvider } from '@/lib/store';
import { Metadata } from 'next';

const nunito = Nunito({ 
  subsets: ['latin', 'vietnamese'], 
  weight: ['400', '600', '700', '800', '900'],
  variable: '--font-nunito' 
});

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter'
});

export const metadata: Metadata = {
  title: 'VocaVibe - Nền tảng học từ vựng đỉnh cao',
  description: 'Học từ vựng, luyện nghe nói tiếng Anh dễ dàng cùng VocaVibe.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${nunito.variable} ${inter.variable}`}>
      <body className="font-sans antialiased bg-[#E8EBF5] text-[#0D1A63]">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
