import { useEffect, useRef } from 'react'

/**
 * Watches the FullCalendar column header row. When it scrolls out of
 * view, a fixed clone is created at the top of the viewport. When the
 * real header comes back into view, the clone is removed.
 *
 * Pass the ref of a wrapper <div> that contains the <FullCalendar />.
 */
export function useStickyCalendarHeader(wrapperRef: React.RefObject<HTMLDivElement | null>) {
  const cloneRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function update() {
      const wrapper = wrapperRef.current
      if (!wrapper) return

      const header = wrapper.querySelector<HTMLElement>('.fc-col-header')
      if (!header) return

      const headerRect = header.getBoundingClientRect()
      const wrapperRect = wrapper.getBoundingClientRect()

      // Header has scrolled above the viewport AND calendar body is still visible
      const shouldPin = headerRect.bottom < 0 && wrapperRect.bottom > 100

      if (shouldPin && !cloneRef.current) {
        // Create a fixed clone
        const clone = document.createElement('div')
        clone.className = 'fc-sticky-header-clone'
        clone.style.left = `${headerRect.left}px`
        clone.style.width = `${headerRect.width}px`
        clone.innerHTML = header.outerHTML
        document.body.appendChild(clone)
        cloneRef.current = clone
      } else if (shouldPin && cloneRef.current) {
        // Update position/width in case of resize
        cloneRef.current.style.left = `${headerRect.left}px`
        cloneRef.current.style.width = `${headerRect.width}px`
        cloneRef.current.innerHTML = header.outerHTML
      } else if (!shouldPin && cloneRef.current) {
        // Remove clone
        cloneRef.current.remove()
        cloneRef.current = null
      }
    }

    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update, { passive: true })

    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      if (cloneRef.current) {
        cloneRef.current.remove()
        cloneRef.current = null
      }
    }
  }, [wrapperRef])
}
