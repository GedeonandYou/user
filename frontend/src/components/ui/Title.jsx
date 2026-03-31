export function Title({ children, sub, isNarrow }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h2 style={{
        color: 'var(--text)', fontSize: isNarrow ? 22 : 26, fontWeight: 750,
        margin: 0, lineHeight: 1.2, fontFamily: "'DM Sans', -apple-system, sans-serif",
        letterSpacing: -0.2,
      }}>
        {children}
      </h2>
      {sub && (
        <p style={{ color: 'var(--text-sub)', fontSize: isNarrow ? 13 : 14, margin: '8px 0 0', lineHeight: 1.55 }}>
          {sub}
        </p>
      )}
    </div>
  )
}
