/**
 * 从ITEM_INFO.js中提取所有唯一的category和subcategory值
 */
const data = require('../src/data/ITEM_INFO.js')
const items = data.ITEM_INFO || data.default || data

const cats = new Set()
const subcats = new Set()

if (Array.isArray(items)) {
  items.forEach(i => {
    if (i.category) cats.add(i.category)
    if (i.subcategory) subcats.add(i.subcategory)
  })
} else if (typeof items === 'object') {
  Object.values(items).forEach(i => {
    if (i && i.category) cats.add(i.category)
    if (i && i.subcategory) subcats.add(i.subcategory)
  })
}

console.log('=== CATEGORIES ===')
;[...cats].sort().forEach(c => console.log(c))
console.log('=== SUBCATEGORIES ===')
;[...subcats].sort().forEach(s => console.log(s))
