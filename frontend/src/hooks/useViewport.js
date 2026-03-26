import { useState, useEffect } from 'react'

export function useViewport() {
  const get = () => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 1024,
    h: typeof window !== 'undefined' ? window.innerHeight : 768,
  })

  const [vp, setVp] = useState(get)

  useEffect(() => {
    const onResize = () => setVp(get())
    window.addEventListener('resize', onResize, { passive: true })
    window.addEventListener('orientationchange', onResize, { passive: true })
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
    }
  }, [])

  return vp
}
