export function PrimaryButton({ children, onClick, disabled, isNarrow }) {
  return (
    <button onClick={onClick} disabled={disabled} type="button" style={{
      width: '100%', padding: isNarrow ? '15px 18px' : '16px 18px',
      background: disabled ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #FF6B35, #E8530E)',
      color: disabled ? '#555' : '#fff', border: 'none', borderRadius: 14,
      fontSize: isNarrow ? 15 : 16, fontWeight: 650,
      cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease',
      fontFamily: "'DM Sans', -apple-system, sans-serif", letterSpacing: 0.3,
    }}>
      {children}
    </button>
  )
}
