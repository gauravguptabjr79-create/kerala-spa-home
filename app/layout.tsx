import './globals.css';
import type { Metadata } from 'next';
export const metadata: Metadata = {title:'Kerala Spa Home | Premium Ayurvedic Wellness at Home',description:'Premium Kerala-inspired wellness experiences at your doorstep in Dehradun.'};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en"><body>{children}</body></html>}
