import { useEffect, useRef } from 'react'

/**
 * Creates a persistent overlay clone of the FullCalendar column header.
 * - When the header is in view: clone sits directly on top (absolute), invisible transition.
 * - When the header scrolls out: clone switches to fixed at the top of the viewport.
 *
 * Pass the ref of a wrapper <div> that contains the <FullCalendar />.
 */
export function useStickyCalendarHeader(wrapperRef: React.RefObject<HTMLDivElement | null>) {
  const cloneRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let raf = 0

    function ensureClone(header: HTMLElement): HTMLDivElement {
      if (cloneRef.current) return cloneRef.current

      const clone = document.createElement('div')
      clone.className = 'fc-sticky-header-clone'
      document.body.appendChild(clone)
      cloneRef.current = clone

      // Sync content once on create
      clone.innerHTML = header.outerHTML
      return clone
    }

    function update() {
      const wrapper = wrapperRef.current
      if (!wrapper) return

      const header = wrapper.querySelector<HTMLElement>('.fc-col-header')
      if (!header) return

      const headerRect = header.getBoundingClientRect()
      const wrapperRect = wrapper.getBoundingClientRect()

      // Don't show clone if calendar body is mostly off screen
      if (wrapperRect.bottom < 50) {
        if (cloneRef.current) {
          cloneRef.current.style.display = 'none'
        }
        return
      }

      const clone = ensureClone(header)
      clone.style.display = ''
      clone.style.width = `${headerRect.width}px`

      // Sync content on every frame for accuracy
      clone.innerHTML = header.outerHTML

      const scrolledPast = headerRect.top < 0

      if (scrolledPast) {
        // Fixed to top of viewport
        clone.style.position = 'fixed'
        clone.style.top = '0px'
        clone.style.left = `${headerRect.left}px`
        clone.classList.add('fc-sticky-header-pinned')
      } else {
        // Overlay directly on top of the real header (no visual difference)
        clone.style.position = 'fixed'
        clone.style.top = `${headerRect.top}px`
        clone.style.left = `${headerRect.left}px`
        clone.classList.remove('fc-sticky-header-pinned')
      }
    }

    function onScroll() {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(update)
    }

    // Initial render
    requestAnimationFrame(update)

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
      if (cloneRef.current) {
        cloneRef.current.remove()
        cloneRef.current = null
      }
    }
  }, [wrapperRef])
}
