import { AppShell } from './AppShell'

export function PhoneFrame({ children, isNarrow, isTablet, frameHeightMobile, frameHeightWide, frameWidthWide }) {
  if (isNarrow) {
    return (
      <AppShell isNarrow={isNarrow}>
        <div style={{
          width: '100%', maxWidth: 420, margin: '20px auto',
          background: 'var(--frame-outer-bg)', borderRadius: 40, padding: 12,
          boxShadow: '0 25px 60px rgba(0,0,0,0.3)', position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
            width: 120, height: 28, background: '#111', borderRadius: '0 0 16px 16px',
            zIndex: 10, opacity: 0.95, pointerEvents: 'none',
          }} />
          <div style={{
            background: 'var(--frame-inner-bg)', borderRadius: 30,
            minHeight: frameHeightMobile, maxHeight: frameHeightMobile,
            overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative',
          }}>
            {children}
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell isNarrow={isNarrow}>
      <div style={{
        width: '100%', maxWidth: frameWidthWide,
        background: 'var(--frame-wide-bg)', borderRadius: 26,
        padding: isTablet ? 12 : 14,
        boxShadow: 'var(--frame-wide-shadow)',
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{
          background: 'var(--frame-inner-bg)', borderRadius: 20,
          minHeight: frameHeightWide, maxHeight: frameHeightWide,
          overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative',
        }}>
          {children}
        </div>
      </div>
    </AppShell>
  )
}
