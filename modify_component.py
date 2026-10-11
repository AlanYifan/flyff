#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
修改DatabaseQueryModal.vue文件,添加掉落查询功能
"""

# 读取文件
with open(r'd:\FF\FLYFF\src\components\modals\DatabaseQueryModal.vue', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 添加import语句
import_statement = "import { showItemDropMonsters, showMonsterDropItems } from '@/composables/useDropQuery'"
if import_statement not in content:
    # 在import { useItemsStore } from '@/store/items'后添加
    content = content.replace(
        "import { useItemsStore } from '@/store/items'",
        "import { useItemsStore } from '@/store/items'\n  " + import_statement
    )
    print('Added import statement')
else:
    print('Import statement already exists')

# 2. 修改showItemDetail函数
old_function = '''  /**
   * 显示物品详情
   * @param {Object} item - 物品数据
   */
  function showItemDetail (item) {
    selectedItem.value = item
  }'''

new_function = '''  /**
   * 显示物品详情
   * @param {Object} item - 物品数据
   */
  function showItemDetail (item) {
    selectedItem.value = item
    // 如果是物品,查找掉落该物品的怪物
    if (item._dataType === 'item') {
      showItemDropMonsters(item)
    } else if (item._dataType === 'monster') {
      // 如果是怪物,显示掉落物品列表
      showMonsterDropItems(item)
    }
  }'''

if old_function in content:
    content = content.replace(old_function, new_function)
    print('Updated showItemDetail function')
else:
    print('showItemDetail function not found or already updated')

# 写回文件
with open(r'd:\FF\FLYFF\src\components\modals\DatabaseQueryModal.vue', 'w', encoding='utf-8') as f:
    f.write(content)

print('File updated successfully')
