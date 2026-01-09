import '@testing-library/jest-dom'
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock FileReader
global.FileReader = class FileReader {
  result: string | ArrayBuffer | null = null
  error: DOMException | null = null
  readyState: number = 0
  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null
  onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null
  onloadend: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null

  readAsDataURL(blob: Blob): void {
    this.readyState = 2
    setTimeout(() => {
      this.result = 'data:image/png;base64,mockBase64Data'
      if (this.onloadend) {
        this.onloadend({} as ProgressEvent<FileReader>)
      }
    }, 0)
  }

  readAsText(blob: Blob): void {
    this.readyState = 2
    setTimeout(() => {
      this.result = 'mock text data'
      if (this.onloadend) {
        this.onloadend({} as ProgressEvent<FileReader>)
      }
    }, 0)
  }

  abort(): void {
    this.readyState = 2
  }

  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() { return true }
  
  static EMPTY = 0
  static LOADING = 1
  static DONE = 2
}
