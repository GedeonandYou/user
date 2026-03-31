export function ProgressBar({ step, totalSteps, progressPercent, isNarrow, goBack }) {
  if (!(step > 0 && step < totalSteps - 1)) return null
  return (
    <div style={{
      padding: isNarrow ? '48px 20px 8px' : '22px 24px 10px',
      display: 'flex', alignItems: 'center', gap: 12,
      borderBottom: isNarrow ? 'none' : '1px solid var(--border-progress)',
    }}>
      {step > 0 && (
        <button onClick={goBack} type="button" style={{
          background: 'none', border: 'none', color: 'var(--text-dim)',
          fontSize: 20, cursor: 'pointer', padding: 6, borderRadius: 10,
        }}>←</button>
      )}
      <div style={{
        flex: 1, height: 3, background: 'var(--progress-track)',
        borderRadius: 2, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${progressPercent}%`,
          background: 'linear-gradient(90deg, #FF6B35, #FFB347)',
          borderRadius: 2, transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
      </div>
      <span style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'monospace', minWidth: 38, textAlign: 'right' }}>
        {Math.round(progressPercent)}%
      </span>
    </div>
  )
}
