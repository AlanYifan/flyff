/**
 * 优化的LRU缓存实现
 * 使用双向链表 + Map实现，提供O(1)的get/set操作
 * 支持TTL过期和统计功能
 */
export class OptimizedLRUCache {
  constructor (options = {}) {
    const { maxSize = 100, ttl = 30000, enableStats = true } = options

    this.maxSize = maxSize
    this.ttl = ttl
    this.enableStats = enableStats

    this.cache = new Map()
    this.head = null
    this.tail = null

    if (this.enableStats) {
      this.stats = {
        hits: 0,
        misses: 0,
        evictions: 0,
        expirations: 0
      }
    }
  }

  get (key) {
    const node = this.cache.get(key)

    if (!node) {
      if (this.enableStats) {
        this.stats.misses++
      }
      return undefined
    }

    const now = Date.now()
    if (now - node.timestamp > this.ttl) {
      this.delete(key)
      if (this.enableStats) {
        this.stats.expirations++
        this.stats.misses++
      }
      return undefined
    }

    if (this.enableStats) {
      this.stats.hits++
    }

    this.moveToHead(node)
    return node.value
  }

  set (key, value) {
    if (this.cache.has(key)) {
      const node = this.cache.get(key)
      node.value = value
      node.timestamp = Date.now()
      this.moveToHead(node)
      return
    }

    if (this.cache.size >= this.maxSize) {
      this.removeTail()
      if (this.enableStats) {
        this.stats.evictions++
      }
    }

    const node = {
      key,
      value,
      timestamp: Date.now(),
      prev: null,
      next: null
    }

    this.cache.set(key, node)
    this.addToHead(node)
  }

  has (key) {
    return this.get(key) !== undefined
  }

  delete (key) {
    const node = this.cache.get(key)
    if (!node) {
      return false
    }

    this.cache.delete(key)
    this.removeNode(node)
    return true
  }

  clear () {
    this.cache.clear()
    this.head = null
    this.tail = null

    if (this.enableStats) {
      this.stats.hits = 0
      this.stats.misses = 0
      this.stats.evictions = 0
      this.stats.expirations = 0
    }
  }

  moveToHead (node) {
    this.removeNode(node)
    this.addToHead(node)
  }

  addToHead (node) {
    node.prev = null
    node.next = this.head

    if (this.head) {
      this.head.prev = node
    }

    this.head = node

    if (!this.tail) {
      this.tail = node
    }
  }

  removeNode (node) {
    if (node.prev) {
      node.prev.next = node.next
    } else {
      this.head = node.next
    }

    if (node.next) {
      node.next.prev = node.prev
    } else {
      this.tail = node.prev
    }
  }

  removeTail () {
    if (!this.tail) {
      return
    }

    const tailKey = this.tail.key
    this.delete(tailKey)
  }

  get size () {
    return this.cache.size
  }

  getStats () {
    if (!this.enableStats) {
      return null
    }

    const totalRequests = this.stats.hits + this.stats.misses
    return {
      ...this.stats,
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl,
      hitRate: totalRequests > 0 ? ((this.stats.hits / totalRequests) * 100).toFixed(2) + '%' : '0%'
    }
  }

  resetStats () {
    if (this.enableStats) {
      this.stats.hits = 0
      this.stats.misses = 0
      this.stats.evictions = 0
      this.stats.expirations = 0
    }
  }
}

export default OptimizedLRUCache
