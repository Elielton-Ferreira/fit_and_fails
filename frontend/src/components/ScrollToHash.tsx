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
    const timeout = window.setTimeout(scroll, 200)
    return () => window.clearTimeout(timeout)
  }, [location.hash, location.pathname])

  return null
}

export default ScrollToHash

