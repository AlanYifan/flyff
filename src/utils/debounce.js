/**
 * 防抖工具函数
 * 用于优化频繁触发的操作
 */

export function debounce (func, wait = 300, immediate = false) {
  let timeout
  let lastArgs

  const debounced = (...args) => {
    lastArgs = args

    const later = () => {
      timeout = null
      if (!immediate) {
        func.apply(undefined, lastArgs)
      }
    }

    const callNow = immediate && !timeout

    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(later, wait)

    if (callNow) {
      func.apply(undefined, lastArgs)
    }
  }

  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout)
      timeout = null
    }
  }

  debounced.flush = () => {
    if (timeout) {
      const result = lastArgs ? func.apply(undefined, lastArgs) : undefined
      clearTimeout(timeout)
      timeout = null
      return result
    }
  }

  debounced.pending = () => {
    return timeout !== null
  }

  return debounced
}

export function createDebouncedUpdate (updateFn, options = {}) {
  const { wait = 300, immediate = false, onUpdateStart = null, onUpdateEnd = null } = options

  const debouncedUpdate = debounce(updateFn, wait, immediate)

  const wrappedUpdate = (...args) => {
    if (onUpdateStart) {
      onUpdateStart()
    }

    debouncedUpdate(...args)

    if (onUpdateEnd) {
      setTimeout(() => {
        if (!debouncedUpdate.pending()) {
          onUpdateEnd()
        }
      }, wait + 50)
    }
  }

  wrappedUpdate.cancel = debouncedUpdate.cancel
  wrappedUpdate.flush = debouncedUpdate.flush
  wrappedUpdate.pending = debouncedUpdate.pending

  return wrappedUpdate
}

export class DebouncedConfigUpdater {
  constructor (options = {}) {
    this.updateFn = options.updateFn || (() => {})
    this.wait = options.wait || 300
    this.immediate = options.immediate || false
    this.onUpdateStart = options.onUpdateStart || null
    this.onUpdateEnd = options.onUpdateEnd || null
    this.pendingUpdates = new Map()
    this.updateCount = 0
    this.successCount = 0
    this.errorCount = 0
  }

  update (key, value, options = {}) {
    const { immediate = this.immediate, wait = this.wait } = options

    if (this.pendingUpdates.has(key)) {
      this.pendingUpdates.get(key).cancel()
    }

    const updateFn = () => {
      try {
        this.updateFn(key, value)
        this.successCount++
        this.pendingUpdates.delete(key)
      } catch (error) {
        this.errorCount++
        console.error(`配置更新失败 [${key}]:`, error)
        this.pendingUpdates.delete(key)
      }
    }

    const debouncedFn = debounce(updateFn, wait, immediate)
    this.pendingUpdates.set(key, debouncedFn)
    this.updateCount++

    if (this.onUpdateStart) {
      this.onUpdateStart(key, value)
    }

    debouncedFn()

    return {
      cancel: () => {
        if (this.pendingUpdates.has(key)) {
          this.pendingUpdates.get(key).cancel()
          this.pendingUpdates.delete(key)
        }
      },
      pending: () => this.pendingUpdates.has(key)
    }
  }

  updateBatch (updates, options = {}) {
    const { immediate = false, wait = this.wait } = options

    const batchKey = `batch_${Date.now()}`

    const updateFn = () => {
      try {
        updates.forEach(({ key, value }) => {
          this.updateFn(key, value)
        })
        this.successCount += updates.length
        this.pendingUpdates.delete(batchKey)
      } catch (error) {
        this.errorCount++
        console.error('批量配置更新失败:', error)
        this.pendingUpdates.delete(batchKey)
      }
    }

    const debouncedFn = debounce(updateFn, wait, immediate)
    this.pendingUpdates.set(batchKey, debouncedFn)
    this.updateCount++

    if (this.onUpdateStart) {
      this.onUpdateStart('batch', updates)
    }

    debouncedFn()

    return {
      cancel: () => {
        if (this.pendingUpdates.has(batchKey)) {
          this.pendingUpdates.get(batchKey).cancel()
          this.pendingUpdates.delete(batchKey)
        }
      },
      pending: () => this.pendingUpdates.has(batchKey)
    }
  }

  cancelAll () {
    this.pendingUpdates.forEach(debouncedFn => {
      debouncedFn.cancel()
    })
    this.pendingUpdates.clear()
  }

  cancel (key) {
    if (this.pendingUpdates.has(key)) {
      this.pendingUpdates.get(key).cancel()
      this.pendingUpdates.delete(key)
      return true
    }
    return false
  }

  flushAll () {
    this.pendingUpdates.forEach(debouncedFn => {
      debouncedFn.flush()
    })
  }

  flush (key) {
    if (this.pendingUpdates.has(key)) {
      this.pendingUpdates.get(key).flush()
      return true
    }
    return false
  }

  getStats () {
    return {
      updateCount: this.updateCount,
      successCount: this.successCount,
      errorCount: this.errorCount,
      pendingCount: this.pendingUpdates.size,
      successRate:
        this.updateCount > 0
          ? ((this.successCount / this.updateCount) * 100).toFixed(2) + '%'
          : '0%'
    }
  }

  resetStats () {
    this.updateCount = 0
    this.successCount = 0
    this.errorCount = 0
  }

  isPending (key) {
    return this.pendingUpdates.has(key)
  }

  getPendingKeys () {
    return Array.from(this.pendingUpdates.keys())
  }
}
