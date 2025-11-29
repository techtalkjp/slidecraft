// Google Analytics event tracking helpers

declare global {
  interface Window {
    gtag?: (
      command: string,
      ...args: (string | Record<string, unknown>)[]
    ) => void
  }
}

// Helper to check if analytics should be enabled
// 本番環境（VERCEL_ENV === 'production'）でのみ有効化
function isAnalyticsEnabled(): boolean {
  return (
    import.meta.env.VERCEL_ENV === 'production' &&
    typeof window !== 'undefined' &&
    !!window.gtag
  )
}

export function trackEvent(
  eventName: string,
  parameters?: Record<string, unknown>,
) {
  if (isAnalyticsEnabled() && window.gtag) {
    if (parameters) {
      window.gtag('event', eventName, parameters)
    } else {
      window.gtag('event', eventName)
    }
  }
}

// Page view tracking for client-side navigation
export function trackPageView(path: string, title?: string) {
  if (isAnalyticsEnabled() && window.gtag) {
    window.gtag('config', 'G-MYGWWZDCP2', {
      page_path: path,
      page_title: title || document.title,
    })
  }
}

// Project events
export function trackProjectCreated() {
  trackEvent('project_created')
}

export function trackPdfUploaded(pageCount: number) {
  trackEvent('pdf_uploaded', {
    page_count: pageCount,
  })
}

// Generation events
export function trackGenerationStarted(candidateCount: number) {
  trackEvent('generation_started', {
    candidate_count: candidateCount,
  })
}

export function trackGenerationCompleted(
  candidateCount: number,
  duration: number,
) {
  trackEvent('generation_completed', {
    candidate_count: candidateCount,
    duration_ms: duration,
  })
}

export function trackGenerationFailed(error: string) {
  trackEvent('generation_failed', {
    error_message: error,
  })
}

// Export events
export function trackPdfExported(pageCount: number) {
  trackEvent('pdf_exported', {
    page_count: pageCount,
  })
}

// PPTX Export events
export function trackPptxExportClick() {
  trackEvent('pptx_export_click')
}

export function trackPptxExportAnalyzeComplete(model: string) {
  trackEvent('pptx_export_analyze_complete', {
    model,
  })
}

export function trackPptxExportDownload(model: string) {
  trackEvent('pptx_export_download', {
    model,
  })
}

// API Key events
export function trackApiKeySet() {
  trackEvent('api_key_set')
}

export function trackApiKeyRemoved() {
  trackEvent('api_key_removed')
}

// Conversion events
export function trackFirstGenerationCompleted(
  candidateCount: number,
  duration: number,
) {
  // Check if this is the first generation
  const hasGeneratedBefore = localStorage.getItem('has_generated_slide')

  if (!hasGeneratedBefore) {
    trackEvent('first_generation_completed', {
      candidate_count: candidateCount,
      duration_ms: duration,
    })
    localStorage.setItem('has_generated_slide', 'true')
  }
}

export function trackRepeatUser() {
  if (
    import.meta.env.VERCEL_ENV !== 'production' ||
    typeof window === 'undefined'
  ) {
    return
  }

  const visitCount = Number.parseInt(
    localStorage.getItem('visit_count') || '0',
    10,
  )

  if (visitCount > 0) {
    trackEvent('repeat_user', {
      visit_count: visitCount + 1,
    })
  }

  localStorage.setItem('visit_count', String(visitCount + 1))
}
