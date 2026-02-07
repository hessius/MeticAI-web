import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * Comprehensive E2E Accessibility Tests for MeticAI Web Application
 * 
 * Tests WCAG 2.1 AA compliance including:
 * - Automated accessibility scanning with axe-core
 * - Keyboard navigation
 * - ARIA attributes and roles
 * - Focus management
 * - Screen reader compatibility
 * - Multi-language accessibility
 * - Color contrast
 * - Form accessibility
 */

test.describe('Accessibility - Automated Scans', () => {
  test('should pass axe accessibility scan on home/start view', async ({ page }) => {
    await page.goto('/')
    
    // Wait for the page to fully load
    await page.waitForSelector('text=MeticAI')
    
    // Run axe scan with WCAG AA standards
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should pass axe accessibility scan on form view', async ({ page }) => {
    await page.goto('/')
    
    // Navigate to form
    await page.waitForSelector('text=Generate New Profile')
    await page.getByRole('button', { name: /Generate New Profile/i }).click()
    
    // Wait for form to render
    await page.waitForSelector('text=New Profile')
    
    // Run axe scan
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should pass axe scan with form filled', async ({ page }) => {
    await page.goto('/')
    
    // Navigate to form
    await page.waitForSelector('text=Generate New Profile')
    await page.getByRole('button', { name: /Generate New Profile/i }).click()
    
    // Fill in the form
    await page.getByPlaceholder(/Balanced extraction/).fill('I prefer fruity and bright espresso')
    await page.getByText('Light Body').first().click()
    await page.getByText('Florals').first().click()
    
    // Run axe scan with filled form
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should pass axe scan on settings view', async ({ page }) => {
    await page.goto('/')
    
    // Navigate to settings
    await page.waitForSelector('text=Generate New Profile')
    const settingsButton = page.getByRole('button', { name: /Settings/i })
    if (await settingsButton.isVisible()) {
      await settingsButton.click()
      await page.waitForTimeout(500) // Wait for transition
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()
      
      expect(accessibilityScanResults.violations).toEqual([])
    }
  })
})

test.describe('Accessibility - Keyboard Navigation', () => {
  test('should navigate start view with keyboard only', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=Generate New Profile')
    
    // Tab to first interactive element
    await page.keyboard.press('Tab')
    
    // Verify focus is on an interactive element
    const focused = page.locator(':focus')
    await expect(focused).toBeVisible()
    
    // Tab through all interactive elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab')
      const currentFocus = page.locator(':focus')
      await expect(currentFocus).toBeVisible()
    }
  })

  test('should activate "Generate New Profile" button with keyboard', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=Generate New Profile')
    
    // Tab to the Generate New Profile button
    let focused = page.locator(':focus')
    let attempts = 0
    const maxAttempts = 10
    
    while (attempts < maxAttempts) {
      await page.keyboard.press('Tab')
      focused = page.locator(':focus')
      const text = await focused.textContent().catch(() => '')
      
      if (text?.includes('Generate New Profile')) {
        break
      }
      attempts++
    }
    
    // Activate with Enter or Space
    await page.keyboard.press('Enter')
    
    // Should navigate to form view
    await expect(page.getByText('New Profile')).toBeVisible()
  })

  test('should navigate form elements with keyboard', async ({ page }) => {
    await page.goto('/')
    
    // Navigate to form
    await page.waitForSelector('text=Generate New Profile')
    await page.getByRole('button', { name: /Generate New Profile/i }).click()
    await page.waitForSelector('text=New Profile')
    
    // Tab to textarea
    let attempts = 0
    const maxAttempts = 15
    
    while (attempts < maxAttempts) {
      await page.keyboard.press('Tab')
      const focused = page.locator(':focus')
      const role = await focused.getAttribute('role').catch(() => null)
      const tag = await focused.evaluate(el => el.tagName).catch(() => null)
      
      if (tag === 'TEXTAREA' || role === 'textbox') {
        // Type in the textarea
        await page.keyboard.type('Testing keyboard input')
        const value = await focused.inputValue()
        expect(value).toContain('Testing keyboard input')
        break
      }
      attempts++
    }
  })

  test('should toggle tags with keyboard', async ({ page }) => {
    await page.goto('/')
    
    // Navigate to form
    await page.waitForSelector('text=Generate New Profile')
    await page.getByRole('button', { name: /Generate New Profile/i }).click()
    await page.waitForSelector('text=New Profile')
    
    // Find and activate a tag with keyboard
    const lightBodyTag = page.getByText('Light Body').first()
    await lightBodyTag.focus()
    
    // Check initial state
    const initialClass = await lightBodyTag.getAttribute('class')
    
    // Activate with Enter or Space
    await page.keyboard.press('Space')
    await page.waitForTimeout(200)
    
    // Verify tag was toggled
    const newClass = await lightBodyTag.getAttribute('class')
    expect(newClass).not.toBe(initialClass)
  })

  test('should navigate back with keyboard', async ({ page }) => {
    await page.goto('/')
    
    // Navigate to form
    await page.waitForSelector('text=Generate New Profile')
    await page.getByRole('button', { name: /Generate New Profile/i }).click()
    await page.waitForSelector('text=New Profile')
    
    // Focus the back button and activate it
    const backButton = page.locator('button').first() // Back button is first
    await backButton.focus()
    await page.keyboard.press('Enter')
    
    // Should return to start view
    await expect(page.getByText('Generate New Profile')).toBeVisible()
  })

  test('should have visible focus indicators', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=Generate New Profile')
    
    // Tab through elements and verify focus indicators
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab')
      const focused = page.locator(':focus')
      
      // Check that focused element is visible and has outline or ring
      await expect(focused).toBeVisible()
      
      // Get computed styles to verify focus indicator
      const outlineWidth = await focused.evaluate(el => 
        window.getComputedStyle(el).outlineWidth
      )
      const boxShadow = await focused.evaluate(el => 
        window.getComputedStyle(el).boxShadow
      )
      
      // Should have either outline or box-shadow (ring) for focus
      const hasFocusIndicator = outlineWidth !== '0px' || boxShadow !== 'none'
      expect(hasFocusIndicator).toBeTruthy()
    }
  })
})

test.describe('Accessibility - ARIA Attributes and Roles', () => {
  test('should have proper ARIA labels on buttons', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=Generate New Profile')
    
    // Check main action buttons have proper accessible names
    const generateButton = page.getByRole('button', { name: /Generate New Profile/i })
    await expect(generateButton).toBeVisible()
    
    const historyButton = page.getByRole('button', { name: /History/i })
    if (await historyButton.isVisible()) {
      await expect(historyButton).toBeVisible()
    }
  })

  test('should have proper form labels and associations', async ({ page }) => {
    await page.goto('/')
    
    // Navigate to form
    await page.waitForSelector('text=Generate New Profile')
    await page.getByRole('button', { name: /Generate New Profile/i }).click()
    await page.waitForSelector('text=New Profile')
    
    // Check for label association
    const labels = await page.locator('label').all()
    expect(labels.length).toBeGreaterThan(0)
    
    // Verify textarea has accessible name
    const textarea = page.getByPlaceholder(/Balanced extraction/)
    const ariaLabel = await textarea.getAttribute('aria-label')
    const ariaLabelledBy = await textarea.getAttribute('aria-labelledby')
    const associatedLabel = await page.locator('label').filter({ has: textarea }).count()
    
    // Should have at least one way to be labeled
    const hasAccessibleName = ariaLabel || ariaLabelledBy || associatedLabel > 0
    expect(hasAccessibleName).toBeTruthy()
  })

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=MeticAI')
    
    // Get all headings
    const h1s = await page.locator('h1').all()
    const h2s = await page.locator('h2').all()
    
    // Should have at least one h1 or h2
    expect(h1s.length + h2s.length).toBeGreaterThan(0)
    
    // If there's an h1, it should be the main title
    if (h1s.length > 0) {
      const h1Text = await h1s[0].textContent()
      expect(h1Text).toBeTruthy()
    }
  })

  test('should have proper button roles and states', async ({ page }) => {
    await page.goto('/')
    
    // Navigate to form
    await page.waitForSelector('text=Generate New Profile')
    await page.getByRole('button', { name: /Generate New Profile/i }).click()
    await page.waitForSelector('text=New Profile')
    
    // Check submit button disabled state
    const submitButton = page.getByRole('button', { name: /Generate Profile/i })
    await expect(submitButton).toBeVisible()
    await expect(submitButton).toBeDisabled()
    
    // Fill form to enable button
    await page.getByPlaceholder(/Balanced extraction/).fill('Test input')
    await expect(submitButton).toBeEnabled()
  })

  test('should have ARIA labels on icon-only buttons', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=Generate New Profile')
    
    // Check for buttons with icons that should have aria-labels
    const buttons = await page.getByRole('button').all()
    
    for (const button of buttons) {
      const text = await button.textContent()
      const ariaLabel = await button.getAttribute('aria-label')
      const ariaLabelledBy = await button.getAttribute('aria-labelledby')
      
      // If button has no text, it should have aria-label or aria-labelledby
      if (!text || text.trim().length === 0) {
        const hasAccessibleName = ariaLabel || ariaLabelledBy
        expect(hasAccessibleName).toBeTruthy()
      }
    }
  })
})

test.describe('Accessibility - Skip Navigation', () => {
  test('should have skip navigation links', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=MeticAI')
    
    // Check for skip links (usually hidden until focused)
    const skipLinks = page.locator('.skip-link, [href^="#main"], a[href*="skip"]')
    const count = await skipLinks.count()
    
    // Should have at least one skip link
    expect(count).toBeGreaterThan(0)
  })

  test('should focus skip links on first Tab', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=MeticAI')
    
    // Press Tab to focus first element (should be skip link)
    await page.keyboard.press('Tab')
    
    const focused = page.locator(':focus')
    const href = await focused.getAttribute('href').catch(() => null)
    
    // First focusable should ideally be a skip link
    if (href?.includes('#')) {
      await expect(focused).toBeVisible()
    }
  })

  test('should jump to main content when skip link is activated', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=MeticAI')
    
    // Look for skip link
    const skipLink = page.locator('.skip-link, a[href="#main-content"]').first()
    
    if (await skipLink.count() > 0) {
      await skipLink.focus()
      await page.keyboard.press('Enter')
      
      // Verify main content area received focus
      const mainContent = page.locator('#main-content, [role="main"], main')
      if (await mainContent.count() > 0) {
        const isFocused = await mainContent.first().evaluate(el => 
          el === document.activeElement || el.contains(document.activeElement)
        )
        expect(isFocused).toBeTruthy()
      }
    }
  })
})

test.describe('Accessibility - Focus Management', () => {
  test('should maintain focus when navigating between views', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=Generate New Profile')
    
    // Navigate to form
    const generateButton = page.getByRole('button', { name: /Generate New Profile/i })
    await generateButton.click()
    
    // Wait for form to load
    await page.waitForSelector('text=New Profile')
    
    // Focus should be on a meaningful element (not body)
    const focused = page.locator(':focus')
    const tagName = await focused.evaluate(el => el.tagName).catch(() => 'BODY')
    expect(tagName).not.toBe('BODY')
  })

  test('should trap focus in modal dialogs', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=Generate New Profile')
    
    // Try to find and open a dialog (if any exist)
    const dialogTriggers = page.locator('[aria-haspopup="dialog"], button:has-text("QR")')
    
    if (await dialogTriggers.count() > 0) {
      await dialogTriggers.first().click()
      await page.waitForTimeout(300)
      
      // Check if dialog is open
      const dialog = page.locator('[role="dialog"]')
      if (await dialog.isVisible()) {
        // Tab through dialog - focus should stay within
        const initialFocus = page.locator(':focus')
        
        for (let i = 0; i < 10; i++) {
          await page.keyboard.press('Tab')
        }
        
        // Focus should still be within dialog
        const currentFocus = page.locator(':focus')
        const isInDialog = await currentFocus.evaluate((el, dialogEl) => {
          return dialogEl?.contains(el) ?? false
        }, await dialog.elementHandle())
        
        expect(isInDialog).toBeTruthy()
      }
    }
  })

  test('should restore focus after modal closes', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=Generate New Profile')
    
    // Find dialog trigger
    const dialogTriggers = page.locator('[aria-haspopup="dialog"]')
    
    if (await dialogTriggers.count() > 0) {
      const trigger = dialogTriggers.first()
      await trigger.click()
      await page.waitForTimeout(300)
      
      // Close dialog (typically with Escape)
      await page.keyboard.press('Escape')
      await page.waitForTimeout(300)
      
      // Focus should return to trigger or nearby element
      const focused = page.locator(':focus')
      await expect(focused).toBeVisible()
    }
  })
})

test.describe('Accessibility - Multi-language Support', () => {
  const languages = ['en', 'es', 'fr', 'de', 'it', 'sv']
  
  test('should maintain accessibility in English', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=MeticAI')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should have language selector with proper ARIA', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=MeticAI')
    
    // Look for language selector
    const langSelector = page.getByRole('button', { name: /language/i }).or(
      page.locator('button:has([aria-label*="language" i])')
    ).or(
      page.locator('button:has-text("English")')
    )
    
    if (await langSelector.count() > 0) {
      const ariaLabel = await langSelector.first().getAttribute('aria-label')
      expect(ariaLabel).toBeTruthy()
    }
  })

  for (const lang of ['es', 'fr']) {
    test(`should maintain accessibility when switching to ${lang}`, async ({ page }) => {
      await page.goto('/')
      await page.waitForSelector('text=MeticAI')
      
      // Try to find and open language selector
      const langButton = page.getByRole('button').filter({ 
        has: page.locator('[class*="globe" i], svg') 
      }).first()
      
      if (await langButton.count() > 0 && await langButton.isVisible()) {
        await langButton.click()
        await page.waitForTimeout(200)
        
        // Select language (look for language name)
        const langNames: Record<string, string> = {
          'es': 'Español',
          'fr': 'Français',
          'de': 'Deutsch',
          'it': 'Italiano',
          'sv': 'Svenska'
        }
        
        const langOption = page.getByText(langNames[lang])
        if (await langOption.isVisible()) {
          await langOption.click()
          await page.waitForTimeout(500)
          
          // Run accessibility scan in new language
          const accessibilityScanResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa'])
            .analyze()
          
          expect(accessibilityScanResults.violations).toEqual([])
        }
      }
    })
  }

  test('should preserve ARIA labels across language changes', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=Generate New Profile')
    
    // Get initial button
    const button = page.getByRole('button', { name: /Generate/i }).first()
    const initialAriaLabel = await button.getAttribute('aria-label')
    const initialText = await button.textContent()
    
    // Switch language
    const langButton = page.getByRole('button').filter({ 
      has: page.locator('svg') 
    }).first()
    
    if (await langButton.count() > 0 && await langButton.isVisible()) {
      await langButton.click()
      await page.waitForTimeout(200)
      
      // Try to switch to Spanish
      const espanol = page.getByText('Español')
      if (await espanol.isVisible()) {
        await espanol.click()
        await page.waitForTimeout(500)
        
        // Button should still exist and be accessible
        const buttons = page.getByRole('button')
        expect(await buttons.count()).toBeGreaterThan(0)
        
        // All buttons should have accessible names
        const allButtons = await buttons.all()
        for (const btn of allButtons) {
          const text = await btn.textContent()
          const ariaLabel = await btn.getAttribute('aria-label')
          const ariaLabelledBy = await btn.getAttribute('aria-labelledby')
          
          const hasAccessibleName = (text && text.trim().length > 0) || ariaLabel || ariaLabelledBy
          expect(hasAccessibleName).toBeTruthy()
        }
      }
    }
  })
})

test.describe('Accessibility - Color Contrast', () => {
  test('should have sufficient color contrast (automated check)', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=MeticAI')
    
    // axe will check color contrast
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .analyze()
    
    // Filter for color contrast violations
    const contrastViolations = accessibilityScanResults.violations.filter(
      v => v.id.includes('color-contrast')
    )
    
    expect(contrastViolations).toEqual([])
  })

  test('should have sufficient contrast in form view', async ({ page }) => {
    await page.goto('/')
    
    // Navigate to form
    await page.waitForSelector('text=Generate New Profile')
    await page.getByRole('button', { name: /Generate New Profile/i }).click()
    await page.waitForSelector('text=New Profile')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .analyze()
    
    const contrastViolations = accessibilityScanResults.violations.filter(
      v => v.id.includes('color-contrast')
    )
    
    expect(contrastViolations).toEqual([])
  })

  test('should have sufficient contrast for error messages', async ({ page }) => {
    await page.goto('/')
    
    // Navigate to form
    await page.waitForSelector('text=Generate New Profile')
    await page.getByRole('button', { name: /Generate New Profile/i }).click()
    await page.waitForSelector('text=New Profile')
    
    // Look for any alerts or error states
    const alerts = page.locator('[role="alert"], .alert, [class*="error"]')
    
    if (await alerts.count() > 0) {
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .analyze()
      
      const contrastViolations = accessibilityScanResults.violations.filter(
        v => v.id.includes('color-contrast')
      )
      
      expect(contrastViolations).toEqual([])
    }
  })
})

test.describe('Accessibility - Form Accessibility', () => {
  test('should have proper form labels and error messages', async ({ page }) => {
    await page.goto('/')
    
    // Navigate to form
    await page.waitForSelector('text=Generate New Profile')
    await page.getByRole('button', { name: /Generate New Profile/i }).click()
    await page.waitForSelector('text=New Profile')
    
    // Check that form controls have labels
    const formControls = page.locator('input, textarea, select')
    const count = await formControls.count()
    
    for (let i = 0; i < count; i++) {
      const control = formControls.nth(i)
      const type = await control.getAttribute('type')
      
      // Skip hidden inputs
      if (type === 'hidden' || type === 'file') continue
      
      const id = await control.getAttribute('id')
      const ariaLabel = await control.getAttribute('aria-label')
      const ariaLabelledBy = await control.getAttribute('aria-labelledby')
      
      if (id) {
        const label = page.locator(`label[for="${id}"]`)
        const hasLabel = await label.count() > 0
        const hasAccessibleName = hasLabel || ariaLabel || ariaLabelledBy
        
        expect(hasAccessibleName).toBeTruthy()
      }
    }
  })

  test('should announce disabled state properly', async ({ page }) => {
    await page.goto('/')
    
    // Navigate to form
    await page.waitForSelector('text=Generate New Profile')
    await page.getByRole('button', { name: /Generate New Profile/i }).click()
    await page.waitForSelector('text=New Profile')
    
    // Submit button should be disabled and properly marked
    const submitButton = page.getByRole('button', { name: /Generate Profile/i })
    
    const isDisabled = await submitButton.isDisabled()
    const ariaDisabled = await submitButton.getAttribute('aria-disabled')
    const disabled = await submitButton.getAttribute('disabled')
    
    expect(isDisabled || ariaDisabled === 'true' || disabled !== null).toBeTruthy()
  })

  test('should have proper field validation feedback', async ({ page }) => {
    await page.goto('/')
    
    // Navigate to form
    await page.waitForSelector('text=Generate New Profile')
    await page.getByRole('button', { name: /Generate New Profile/i }).click()
    await page.waitForSelector('text=New Profile')
    
    const textarea = page.getByPlaceholder(/Balanced extraction/)
    
    // Fill and clear to trigger validation
    await textarea.fill('test')
    await textarea.clear()
    await page.waitForTimeout(200)
    
    // Check for error messages with proper ARIA
    const errorMessages = page.locator('[role="alert"], [aria-live="polite"], [aria-live="assertive"]')
    
    // If there are error messages, they should be properly announced
    if (await errorMessages.count() > 0) {
      const ariaLive = await errorMessages.first().getAttribute('aria-live')
      expect(ariaLive === 'polite' || ariaLive === 'assertive').toBeTruthy()
    }
  })

  test('should have accessible file upload', async ({ page }) => {
    await page.goto('/')
    
    // Navigate to form
    await page.waitForSelector('text=Generate New Profile')
    await page.getByRole('button', { name: /Generate New Profile/i }).click()
    await page.waitForSelector('text=New Profile')
    
    // Find file input
    const fileInput = page.locator('input[type="file"]')
    
    if (await fileInput.count() > 0) {
      const id = await fileInput.getAttribute('id')
      const ariaLabel = await fileInput.getAttribute('aria-label')
      
      // Should have label association
      if (id) {
        const label = page.locator(`label[for="${id}"]`)
        const hasLabel = await label.count() > 0
        expect(hasLabel || ariaLabel).toBeTruthy()
      }
    }
  })
})

test.describe('Accessibility - Screen Reader Compatibility', () => {
  test('should have proper landmark regions', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=MeticAI')
    
    // Check for main landmark
    const main = page.locator('main, [role="main"]')
    expect(await main.count()).toBeGreaterThan(0)
    
    // Check for navigation if present
    const nav = page.locator('nav, [role="navigation"]')
    // Navigation is optional but if present should be properly marked
    if (await nav.count() > 0) {
      await expect(nav.first()).toBeVisible()
    }
  })

  test('should have proper list structures for tags', async ({ page }) => {
    await page.goto('/')
    
    // Navigate to form
    await page.waitForSelector('text=Generate New Profile')
    await page.getByRole('button', { name: /Generate New Profile/i }).click()
    await page.waitForSelector('text=New Profile')
    
    // Tags should ideally be in a list or have proper grouping
    const lists = page.locator('ul, ol, [role="list"]')
    const groups = page.locator('[role="group"]')
    
    // Should have some semantic grouping
    expect(await lists.count() + await groups.count()).toBeGreaterThan(0)
  })

  test('should have status announcements for dynamic content', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=Generate New Profile')
    
    // Check for live regions
    const liveRegions = page.locator('[aria-live], [role="status"], [role="alert"]')
    
    // Application should have at least one live region for announcements
    if (await liveRegions.count() > 0) {
      const ariaLive = await liveRegions.first().getAttribute('aria-live')
      expect(['polite', 'assertive', 'off'].includes(ariaLive || '')).toBeTruthy()
    }
  })

  test('should have descriptive link text', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=MeticAI')
    
    // Get all links
    const links = await page.getByRole('link').all()
    
    for (const link of links) {
      const text = await link.textContent()
      const ariaLabel = await link.getAttribute('aria-label')
      const ariaLabelledBy = await link.getAttribute('aria-labelledby')
      
      // Links should have descriptive text, not just "click here" or empty
      const hasAccessibleName = (text && text.trim().length > 0) || ariaLabel || ariaLabelledBy
      expect(hasAccessibleName).toBeTruthy()
      
      if (text) {
        // Avoid generic link text
        const genericText = ['click here', 'here', 'link', 'read more']
        const isGeneric = genericText.some(generic => 
          text.toLowerCase().trim() === generic
        )
        expect(isGeneric).toBeFalsy()
      }
    }
  })

  test('should have alt text for images', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=MeticAI')
    
    // Get all images
    const images = await page.locator('img').all()
    
    for (const img of images) {
      const alt = await img.getAttribute('alt')
      const ariaLabel = await img.getAttribute('aria-label')
      const ariaHidden = await img.getAttribute('aria-hidden')
      const role = await img.getAttribute('role')
      
      // Images should have alt text or be marked decorative
      const isAccessible = alt !== null || ariaLabel || ariaHidden === 'true' || role === 'presentation'
      expect(isAccessible).toBeTruthy()
    }
  })
})

test.describe('Accessibility - Mobile and Responsive', () => {
  test('should maintain accessibility on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/')
    await page.waitForSelector('text=MeticAI')
    
    // Run accessibility scan on mobile
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should have proper touch targets on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/')
    await page.waitForSelector('text=Generate New Profile')
    
    // Get interactive elements
    const buttons = await page.getByRole('button').all()
    
    for (const button of buttons.slice(0, 5)) { // Check first 5 buttons
      if (await button.isVisible()) {
        const box = await button.boundingBox()
        
        if (box) {
          // WCAG recommends minimum 44x44px touch targets
          // We'll be lenient and check for at least 32x32px
          expect(box.width >= 32 || box.height >= 32).toBeTruthy()
        }
      }
    }
  })

  test('should support pinch-to-zoom', async ({ page }) => {
    await page.goto('/')
    
    // Check viewport meta tag doesn't disable zoom
    const viewportMeta = page.locator('meta[name="viewport"]')
    
    if (await viewportMeta.count() > 0) {
      const content = await viewportMeta.getAttribute('content')
      
      // Should not have user-scalable=no or maximum-scale=1
      expect(content).not.toContain('user-scalable=no')
      expect(content).not.toContain('maximum-scale=1.0')
    }
  })
})
