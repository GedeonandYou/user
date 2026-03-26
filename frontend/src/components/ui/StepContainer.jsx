export function StepContainer({ children, centered = false, isNarrow, animating }) {
  return (
    <div style={{
      flex: 1,
      padding: isNarrow ? '16px 24px 24px' : '22px 28px 28px',
      display: 'flex', flexDirection: 'column',
      justifyContent: centered ? 'center' : 'flex-start',
      opacity: animating ? 0 : 1,
      transform: animating ? 'translateX(18px)' : 'translateX(0)',
      transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
      overflowY: 'auto', boxSizing: 'border-box',
      width: '100%', maxWidth: isNarrow ? 'none' : 620,
      margin: isNarrow ? '0' : '0 auto',
    }}>
      {children}
    </div>
  )
}
