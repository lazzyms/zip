import { ImageResponse } from 'next/og';

// Image metadata for iOS
export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

// Image generation optimized for iOS
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Subtle inner shadow for depth */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            boxShadow: 'inset 0 2px 12px rgba(0, 0, 0, 0.1)',
          }}
        />
        
        {/* Main Z letter */}
        <div
          style={{
            fontSize: 100,
            color: 'white',
            fontWeight: 900,
            transform: 'rotate(-90deg)',
            display: 'flex',
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: '-0.02em',
          }}
        >
          Z
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
