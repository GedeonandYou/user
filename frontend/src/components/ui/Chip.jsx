export function Chip({ label, selected, onClick, emoji }) {
  return (
    <button onClick={onClick} type="button" style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '9px 14px',
      background: selected ? 'rgba(255,107,53,0.15)' : 'var(--chip-bg)',
      border: selected ? '1.5px solid #FF6B35' : '1.5px solid var(--chip-border)',
      borderRadius: 20, color: selected ? '#FFB347' : 'var(--chip-text)',
      fontSize: 13, cursor: 'pointer', transition: 'all 0.2s ease',
      fontFamily: "'DM Sans', -apple-system, sans-serif", whiteSpace: 'nowrap',
    }}>
      {emoji && <span style={{ fontSize: 15 }}>{emoji}</span>}
      {label}
    </button>
  )
}
