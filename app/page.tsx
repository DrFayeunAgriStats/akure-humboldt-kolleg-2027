import Script from 'next/script';
import { HOME_HTML } from '@/lib/home';
export default function HomePage(){return <><div dangerouslySetInnerHTML={{__html:HOME_HTML}}/><Script src="/demo.js" strategy="afterInteractive" /></>}
