import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import React from 'react'

const renderMock = vi.fn()
const createRootMock = vi.fn(() => ({ render: renderMock }))

vi.mock('react-dom/client', () => ({
  default: { createRoot: createRootMock },
  createRoot: createRootMock
}))

const AppStub = () => React.createElement('div', { 'data-testid': 'heatseeker-app' })
const AnalyticsStub = () => React.createElement('div', { 'data-testid': 'vercel-analytics' })
const SpeedInsightsStub = () => React.createElement('div', { 'data-testid': 'vercel-speed' })

vi.mock('../src/App', () => ({
  default: AppStub
}))

vi.mock('@vercel/analytics/react', () => ({
  Analytics: AnalyticsStub
}))

vi.mock('@vercel/speed-insights/react', () => ({
  SpeedInsights: SpeedInsightsStub
}))

describe('main entry point', () => {
  beforeEach(() => {
    renderMock.mockReset()
    createRootMock.mockReset()
    createRootMock.mockImplementation(() => ({ render: renderMock }))
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    vi.resetModules()
    document.body.innerHTML = ''
  })

  it('renders the application with analytics instrumentation', async () => {
    await import('../src/main')

    const rootElement = document.getElementById('root')
    expect(rootElement).not.toBeNull()

    expect(createRootMock).toHaveBeenCalledWith(rootElement)
    expect(renderMock).toHaveBeenCalledTimes(1)

    const renderArg = renderMock.mock.calls[0][0]
    expect(React.isValidElement(renderArg)).toBe(true)

    const renderedChildren = React.Children.toArray(renderArg.props.children)
    const elementChildren = renderedChildren.filter((child) => React.isValidElement(child))
    expect(elementChildren).toHaveLength(3)

    const childTypes = elementChildren.map((child) => (child as React.ReactElement).type)
    expect(childTypes).toEqual(expect.arrayContaining([
      AppStub,
      AnalyticsStub,
      SpeedInsightsStub
    ]))
  })
})
