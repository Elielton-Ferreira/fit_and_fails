import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const ScrollToHash = () => {
  const location = useLocation()

  useEffect(() => {
    if (!location.hash) return

    const id = decodeURIComponent(location.hash.slice(1))
    if (!id) return

    const scroll = () => {
      const el = document.getElementById(id)
      if (!el) return false
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return true
    }

    if (scroll()) return

    let attempts = 0
    const maxAttempts = 25
    const intervalMs = 200
    let timeout: number | undefined

    const tick = () => {
      if (scroll()) return
      attempts += 1
      if (attempts >= maxAttempts) return
      timeout = window.setTimeout(tick, intervalMs)
    }

    timeout = window.setTimeout(tick, intervalMs)
    return () => window.clearTimeout(timeout)
  }, [location.hash, location.pathname])

  return null
}

export default ScrollToHash
