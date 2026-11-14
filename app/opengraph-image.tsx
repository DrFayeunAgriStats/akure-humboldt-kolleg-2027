import { ImageResponse } from 'next/og';

export const alt = 'Akure Humboldt Kolleg 2027 — Biodiversity, Climate Change and Food Security';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%', height: '100%', padding: '70px 78px', background: 'linear-gradient(125deg, #092a22 0%, #175141 72%, #2c6046 100%)', color: '#f7f5ed', fontFamily: 'Georgia, serif' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', color: '#cbe1c9', fontFamily: 'Arial, sans-serif', fontSize: 22, letterSpacing: 3, fontWeight: 600 }}>
          PROPOSED HUMBOLDT KOLLEG · AKURE, NIGERIA
        </div>
        <div style={{ display: 'flex', fontSize: 65, fontWeight: 700, lineHeight: 1.15, maxWidth: 1020 }}>
          Biodiversity, Climate Change and Food Security
        </div>
        <div style={{ display: 'flex', color: '#d7e8d5', fontSize: 28, lineHeight: 1.35 }}>
          The role of science, innovation and community engagement
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '2px solid #5d8568', paddingTop: 26, fontFamily: 'Arial, sans-serif', fontSize: 23 }}>
        <div style={{ display: 'flex' }}>22–25 February 2027</div>
        <div style={{ display: 'flex', fontWeight: 700 }}>FUTA · AKURE, NIGERIA</div>
      </div>
    </div>,
    size
  );
}
