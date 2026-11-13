import Script from 'next/script';
import { HOME_HTML } from '@/lib/home';
import { EVENT_START } from '@/lib/themes';
export default function HomePage(){return <><div dangerouslySetInnerHTML={{__html:HOME_HTML}}/><Script id="event-config" strategy="beforeInteractive" dangerouslySetInnerHTML={{__html:`window.AKH_EVENT_START=${JSON.stringify(EVENT_START)};`}} /><Script src="/demo.js" strategy="afterInteractive" /></>}
