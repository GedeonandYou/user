export function AppShell({ children, isNarrow }) {
  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      padding: isNarrow ? 12 : 24,
      boxSizing: 'border-box',
      background: 'var(--shell-bg)',
      display: 'flex',
      alignItems: isNarrow ? 'stretch' : 'center',
      justifyContent: 'center',
    }}>
      {children}
    </div>
  )
}
