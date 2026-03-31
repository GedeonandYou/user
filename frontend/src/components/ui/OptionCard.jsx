export function OptionCard({ label, sub, selected, onClick, emoji, disabled, badge, isNarrow }) {
  return (
    <button onClick={disabled ? undefined : onClick} type="button" style={{
      width: '100%', padding: isNarrow ? '14px 16px' : '16px 18px',
      background: selected ? 'var(--card-selected-bg)' : 'var(--card-bg)',
      border: selected ? '1.5px solid #FF6B35' : '1.5px solid var(--border)',
      borderRadius: 14, color: 'var(--text)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'flex', alignItems: 'center', gap: 12,
      transition: 'all 0.2s ease', textAlign: 'left',
      opacity: disabled ? 0.4 : 1, filter: disabled ? 'grayscale(0.3)' : 'none',
    }}>
      {emoji && <span style={{ fontSize: 22 }}>{emoji}</span>}
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {label}
          {badge && (
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '2px 7px',
              background: 'rgba(255,179,71,0.15)', color: '#FFB347', borderRadius: 20,
              border: '1px solid rgba(255,179,71,0.25)', letterSpacing: 0.3, textTransform: 'uppercase',
            }}>
              {badge}
            </span>
          )}
        </div>
        {sub && (
          <div style={{ fontSize: 11, color: 'var(--text-sub)', marginTop: 2, lineHeight: 1.35 }}>
            {sub}
          </div>
        )}
      </div>
      <div style={{
        width: 20, height: 20, borderRadius: 10, flexShrink: 0,
        border: selected ? '2px solid #FF6B35' : '2px solid var(--radio-border)',
        background: selected ? '#FF6B35' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s ease',
      }}>
        {selected && <span style={{ color: '#fff', fontSize: 12 }}>✓</span>}
      </div>
    </button>
  )
}
