import { ImageResponse } from 'next/og';

// Image metadata
export const size = {
  width: 512,
  height: 512,
};
export const contentType = 'image/png';

// Image generation
export default function Icon() {
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
          borderRadius: 96,
          position: 'relative',
        }}
      >
        {/* Subtle inner shadow for depth */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 96,
            boxShadow: 'inset 0 2px 20px rgba(0, 0, 0, 0.1)',
          }}
        />
        
        {/* Lightning bolt */}
        <svg width="280" height="280" viewBox="0 0 24 24" fill="none">
          <path 
            d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" 
            fill="white" 
            stroke="white" 
            strokeWidth="0.3"
            strokeLinejoin="round"
            style={{ filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.2))' }}
          />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
