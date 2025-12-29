import { ImageResponse } from 'next/og';

// Generate splash screens for iOS devices
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const width = parseInt(searchParams.get('w') || '1170');
  const height = parseInt(searchParams.get('h') || '2532');

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(180deg, #fff7ed 0%, #fae8ff 50%, #eff6ff 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Subtle grid pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.05,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='%23f97316' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%' height='100%' fill='url(%23grid)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Logo Icon */}
        <div
          style={{
            background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
            width: width > 1000 ? 240 : 180,
            height: width > 1000 ? 240 : 180,
            borderRadius: width > 1000 ? 48 : 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
            boxShadow: '0 8px 32px rgba(249, 115, 22, 0.3)',
          }}
        >
          <svg width={width > 1000 ? "140" : "100"} height={width > 1000 ? "140" : "100"} viewBox="0 0 24 24" fill="none">
            <path 
              d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" 
              fill="white" 
              stroke="white" 
              strokeWidth="0.3"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* App Name */}
        <div
          style={{
            fontSize: width > 1000 ? 80 : 60,
            fontWeight: 900,
            background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
            backgroundClip: 'text',
            color: 'transparent',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: '-0.03em',
          }}
        >
          Zip
        </div>
      </div>
    ),
    {
      width,
      height,
    }
  );
}
