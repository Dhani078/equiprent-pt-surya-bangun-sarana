import React from 'react';
import { Truck, Shield } from 'lucide-react';
import { STITCH_IMAGES } from '../../lib/stitchAssets';

/** Panel kiri halaman login — ilustrasi + branding perusahaan (replikasi Stitch). */
export const LoginBrandPanel: React.FC = () => (
  <div
    style={{
      flex: '1 1 50%',
      backgroundColor: 'var(--text-heading)',
      backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.08) 1.5px, transparent 1.5px)',
      backgroundSize: '28px 28px',
      padding: '48px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      color: '#FFFFFF',
      position: 'relative',
    }}
    className="hidden md:flex"
  >
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          marginBottom: '32px',
          paddingBottom: '20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        <div
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <Truck size={26} color="#93C5FD" />
        </div>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.1 }}>
            EquipRent MS
          </h1>
          <p
            style={{
              fontSize: '10px',
              color: '#93C5FD',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              margin: '4px 0 0 0',
            }}
          >
            PT. SURYA BANGUN SARANA
          </p>
        </div>
      </div>

      <h2
        style={
          {
            fontSize: '30px',
            fontWeight: 800,
            lineHeight: 1.25,
            letterSpacing: '-0.02em',
            margin: '0 0 14px 0',
            textWrap: 'balance',
          } as React.CSSProperties
        }
      >
        Andal di setiap <span style={{ color: '#93C5FD' }}>operasi alat berat.</span>
      </h2>

      <p style={{ fontSize: '14.5px', color: '#CBD5E1', lineHeight: 1.6, margin: 0, maxWidth: '420px' }}>
        Sistem manajemen armada kelas perusahaan untuk operasi konstruksi, logistik, dan alat berat di Kalimantan Selatan.
      </p>
    </div>

    <div
      style={{
        margin: '28px 0',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 20px 30px rgba(0, 0, 0, 0.4)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        maxHeight: '220px',
        position: 'relative',
      }}
    >
      <img
        src={STITCH_IMAGES.LOGIN_HERO}
        alt="Armada excavator alat berat"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(0,30,64,0.02) 0%, rgba(0,30,64,0.6) 100%)',
        }}
      />
    </div>

    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '11px',
        color: 'rgba(203, 213, 225, 0.7)',
      }}
    >
      <span style={{ letterSpacing: '0.05em' }}>&copy; 2026 EquipRent MS</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Shield size={12} color="#10B981" /> Data Terlindungi
      </span>
    </div>
  </div>
);
