export function TextInput({ isNarrow, style, ...props }) {
  return (
    <input
      {...props}
      style={{
        width: '100%', padding: isNarrow ? '14px 16px' : '15px 16px',
        background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)',
        borderRadius: 12, color: '#fff', fontSize: 15, outline: 'none',
        boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif",
        ...(style || {}),
      }}
    />
  )
}
