export function AppShell({ children, isNarrow }) {
  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      padding: isNarrow ? 12 : 24,
      boxSizing: 'border-box',
      background: 'radial-gradient(1200px 600px at 50% 10%, rgba(255,107,53,0.12), transparent 60%), linear-gradient(180deg, #070712, #05050c 65%, #04040a)',
      display: 'flex',
      alignItems: isNarrow ? 'stretch' : 'center',
      justifyContent: 'center',
    }}>
      {children}
    </div>
  )
}
