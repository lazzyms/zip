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
        
        {/* Lightning bolt */}
        <svg width="100" height="100" viewBox="0 0 24 24" fill="none">
          <path 
            d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" 
            fill="white" 
            stroke="white" 
            strokeWidth="0.3"
            strokeLinejoin="round"
            style={{ filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.2))' }}
          />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
