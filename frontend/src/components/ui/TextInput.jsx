export function TextInput({ isNarrow, style, ...props }) {
  return (
    <input
      {...props}
      style={{
        width: '100%', padding: isNarrow ? '14px 16px' : '15px 16px',
        background: 'var(--input-bg)', border: '1.5px solid var(--input-border)',
        borderRadius: 12, color: 'var(--text)', fontSize: 15, outline: 'none',
        boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif",
        ...(style || {}),
      }}
    />
  )
}
