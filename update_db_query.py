#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
更新DatabaseQueryModal.vue文件,添加掉落查询功能
"""

# 读取文件
with open(r'd:\FF\FLYFF\src\components\modals\DatabaseQueryModal.vue', 'r', encoding='utf-8') as f:
    content = f.read()

# 定义要替换的旧函数
old_function = '''  /**
   * 显示物品详情
   * @param {Object} item - 物品数据
   */
  function showItemDetail (item) {
    selectedItem.value = item
  }'''

# 定义新函数(包含所有新功能)
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
  }

  /**
   * 显示掉落该物品的怪物列表
   * @param {Object} item - 物品数据
   */
  function showItemDropMonsters (item) {
    const monsters = []
    const itemId = item.id

    // 遍历所有怪物,查找掉落该物品的怪物
    try {
      const monsterKeys = Object.keys(MONSTER_INFO)
      for (let i = 0; i < monsterKeys.length; i++) {
        const key = monsterKeys[i]
        const monster = MONSTER_INFO[key]
        if (!monster || !monster.id || !monster.drops) continue

        // 检查是否掉落该物品
        const hasDrop = monster.drops.some(drop => drop.item === itemId)
        if (hasDrop) {
          monsters.push({ ...monster, _dataType: 'monster' })
        }
      }
    } catch (e) {
      console.error('查找掉落怪物时出错:', e)
    }

    // 显示掉落怪物列表面板
    showDropMonstersPanel(item, monsters)
  }

  /**
   * 显示怪物掉落的物品列表
   * @param {Object} monster - 怪物数据
   */
  function showMonsterDropItems (monster) {
    if (!monster.drops || monster.drops.length === 0) {
      // 没有掉落物品
      showNoDropItemsPanel(monster)
      return
    }

    // 获取掉落物品详情
    const dropItems = []
    try {
      monster.drops.forEach(drop => {
        const itemInfo = ITEM_INFO[drop.item]
        if (itemInfo) {
          dropItems.push({
            ...itemInfo,
            _dataType: 'item',
            dropProbability: drop.probabilityRange || drop.prob || '',
            dropCommon: drop.common
          })
        }
      })
    } catch (e) {
      console.error('获取掉落物品时出错:', e)
    }

    // 显示掉落物品列表面板
    showDropItemsPanel(monster, dropItems)
  }

  /**
   * 显示掉落怪物的面板
   * @param {Object} item - 物品数据
   * @param {Array} monsters - 掉落该物品的怪物列表
   */
  function showDropMonstersPanel (item, monsters) {
    // 移除已存在的面板
    const existingPanel = document.getElementById('drop-monsters-panel')
    if (existingPanel) {
      existingPanel.remove()
    }

    // 创建面板
    const panel = document.createElement('div')
    panel.id = 'drop-monsters-panel'
    panel.className = 'drop-monsters-panel'
    panel.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(180deg, rgba(20, 15, 30, 0.98) 0%, rgba(10, 8, 20, 0.99) 100%);
      border: 2px solid #8b5a2b;
      border-radius: 12px;
      padding: 16px;
      min-width: 400px;
      max-width: 600px;
      max-height: 500px;
      overflow-y: auto;
      box-shadow: 0 5px 30px rgba(0, 0, 0, 0.8);
      z-index: 1200;
    `

    // 创建标题
    const header = document.createElement('div')
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid #8b5a2b;
    `
    header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 18px; font-weight: bold; color: #ffd700;">掉落怪物列表</span>
        <span style="font-size: 14px; color: #888;">${getItemName(item)}</span>
      </div>
      <button class="close-btn" style="
        background: linear-gradient(180deg, #8b0000 0%, #4a0000 100%);
        border: 2px solid #ff4444;
        border-radius: 50%;
        color: #fff;
        font-size: 18px;
        font-weight: bold;
        width: 28px;
        height: 28px;
        cursor: pointer;
      ">×</button>
    `

    // 关闭按钮事件
    header.querySelector('.close-btn').onclick = () => panel.remove()

    panel.appendChild(header)

    // 显示怪物数量
    const countDiv = document.createElement('div')
    countDiv.style.cssText = `
      padding: 8px 12px;
      background: rgba(139, 90, 43, 0.2);
      border-radius: 6px;
      margin-bottom: 12px;
      color: #ffd700;
      font-size: 14px;
    `
    countDiv.textContent = `找到 ${monsters.length} 个掉落该物品的怪物`
    panel.appendChild(countDiv)

    // 怪物列表容器
    const listContainer = document.createElement('div')
    listContainer.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 8px;
    `

    if (monsters.length === 0) {
      const noData = document.createElement('div')
      noData.style.cssText = `
        grid-column: 1 / -1;
        text-align: center;
        padding: 40px;
        color: #888;
      `
      noData.textContent = '没有怪物掉落该物品'
      listContainer.appendChild(noData)
    } else {
      monsters.forEach(monster => {
        const monsterDiv = document.createElement('div')
        monsterDiv.style.cssText = `
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px;
          background: rgba(30, 25, 40, 0.8);
          border: 1px solid #ff6600;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        `

        const iconImg = document.createElement('img')
        iconImg.src = getMonsterIcon(monster)
        iconImg.style.cssText = 'width: 48px; height: 48px; border-radius: 6px;'
        iconImg.onerror = () => { iconImg.src = '/pt/item_icon/default_item.png' }

        const infoDiv = document.createElement('div')
        infoDiv.style.cssText = 'flex: 1; min-width: 0;'
        infoDiv.innerHTML = `
          <div style="font-size: 14px; font-weight: bold; color: #ff6600; margin-bottom: 4px;">${getMonsterName(monster)}</div>
          <div style="font-size: 11px; color: #888;">
            <span>ID: ${monster.id}</span>
            <span style="margin-left: 8px;">Lv.${monster.level || 0}</span>
            ${monster.rank ? `<span style="margin-left: 8px;">${getRankText(monster.rank)}</span>` : ''}
          </div>
        `

        monsterDiv.appendChild(iconImg)
        monsterDiv.appendChild(infoDiv)

        // 点击怪物显示其掉落物品
        monsterDiv.onclick = () => {
          showMonsterDropItems(monster)
        }

        listContainer.appendChild(monsterDiv)
      })
    }

    panel.appendChild(listContainer)
    document.body.appendChild(panel)
  }

  /**
   * 显示掉落物品的面板
   * @param {Object} monster - 怪物数据
   * @param {Array} items - 掉落物品列表
   */
  function showDropItemsPanel (monster, items) {
    // 移除已存在的面板
    const existingPanel = document.getElementById('drop-items-panel')
    if (existingPanel) {
      existingPanel.remove()
    }

    // 创建面板
    const panel = document.createElement('div')
    panel.id = 'drop-items-panel'
    panel.className = 'drop-items-panel'
    panel.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(180deg, rgba(20, 15, 30, 0.98) 0%, rgba(10, 8, 20, 0.99) 100%);
      border: 2px solid #8b5a2b;
      border-radius: 12px;
      padding: 16px;
      min-width: 400px;
      max-width: 600px;
      max-height: 500px;
      overflow-y: auto;
      box-shadow: 0 5px 30px rgba(0, 0, 0, 0.8);
      z-index: 1200;
    `

    // 创建标题
    const header = document.createElement('div')
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid #8b5a2b;
    `
    header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 18px; font-weight: bold; color: #ffd700;">掉落物品列表</span>
        <span style="font-size: 14px; color: #ff6600;">${getMonsterName(monster)}</span>
      </div>
      <button class="close-btn" style="
        background: linear-gradient(180deg, #8b0000 0%, #4a0000 100%);
        border: 2px solid #ff4444;
        border-radius: 50%;
        color: #fff;
        font-size: 18px;
        font-weight: bold;
        width: 28px;
        height: 28px;
        cursor: pointer;
      ">×</button>
    `

    // 关闭按钮事件
    header.querySelector('.close-btn').onclick = () => panel.remove()

    panel.appendChild(header)

    // 显示物品数量
    const countDiv = document.createElement('div')
    countDiv.style.cssText = `
      padding: 8px 12px;
      background: rgba(139, 90, 43, 0.2);
      border-radius: 6px;
      margin-bottom: 12px;
      color: #ffd700;
      font-size: 14px;
    `
    countDiv.textContent = `该怪物掉落 ${items.length} 种物品`
    panel.appendChild(countDiv)

    // 物品列表容器
    const listContainer = document.createElement('div')
    listContainer.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 8px;
    `

    items.forEach(item => {
      const itemDiv = document.createElement('div')
      const borderColor = itemsStore.getRarityTextColor(item.rarity || 'common')
      itemDiv.style.cssText = `
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px;
        background: rgba(30, 25, 40, 0.8);
        border: 1px solid ${borderColor};
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
      `

      const iconImg = document.createElement('img')
      iconImg.src = getItemIcon(item)
      iconImg.style.cssText = 'width: 48px; height: 48px; border-radius: 6px;'
      iconImg.onerror = () => { iconImg.src = '/pt/item_icon/default_item.png' }

      const infoDiv = document.createElement('div')
      infoDiv.style.cssText = 'flex: 1; min-width: 0;'
      const textColor = itemsStore.getRarityTextColor(item.rarity || 'common')
      infoDiv.innerHTML = `
        <div style="font-size: 14px; font-weight: bold; color: ${textColor}; margin-bottom: 4px;">${getItemName(item)}</div>
        <div style="font-size: 11px; color: #888;">
          <span>ID: ${item.id}</span>
          ${item.level ? `<span style="margin-left: 8px;">Lv.${item.level}</span>` : ''}
          ${item.dropProbability ? `<span style="margin-left: 8px; color: #4a9a4a;">${item.dropProbability}</span>` : ''}
        </div>
      `

      itemDiv.appendChild(iconImg)
      itemDiv.appendChild(infoDiv)

      // 点击物品显示掉落该物品的怪物
      itemDiv.onclick = () => {
        showItemDropMonsters(item)
      }

      listContainer.appendChild(itemDiv)
    })

    panel.appendChild(listContainer)
    document.body.appendChild(panel)
  }

  /**
   * 显示无掉落物品提示面板
   * @param {Object} monster - 怪物数据
   */
  function showNoDropItemsPanel (monster) {
    // 移除已存在的面板
    const existingPanel = document.getElementById('no-drop-items-panel')
    if (existingPanel) {
      existingPanel.remove()
    }

    // 创建提示面板
    const panel = document.createElement('div')
    panel.id = 'no-drop-items-panel'
    panel.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(180deg, rgba(20, 15, 30, 0.98) 0%, rgba(10, 8, 20, 0.99) 100%);
      border: 2px solid #8b5a2b;
      border-radius: 12px;
      padding: 24px;
      min-width: 300px;
      box-shadow: 0 5px 30px rgba(0, 0, 0, 0.8);
      z-index: 1200;
      text-align: center;
    `

    panel.innerHTML = `
      <div style="font-size: 16px; color: #ffd700; margin-bottom: 12px;">${getMonsterName(monster)}</div>
      <div style="font-size: 14px; color: #888;">该怪物没有掉落物品</div>
      <button class="close-btn" style="
        margin-top: 16px;
        padding: 8px 24px;
        background: linear-gradient(180deg, #8b5a2b 0%, #5a3a1b 100%);
        border: 2px solid #8b5a2b;
        border-radius: 6px;
        color: #fff;
        font-size: 14px;
        cursor: pointer;
      ">关闭</button>
    `

    // 关闭按钮事件
    panel.querySelector('.close-btn').onclick = () => panel.remove()

    document.body.appendChild(panel)

    // 3秒后自动关闭
    setTimeout(() => {
      if (panel.parentNode) {
        panel.remove()
      }
    }, 3000)
  }'''

# 替换内容
if old_function in content:
    content = content.replace(old_function, new_function)
    print('Successfully replaced the function')
else:
    print('Old function not found in the file')
    # 尝试查找函数
    import re
    pattern = r'function showItemDetail'
    if re.search(pattern, content):
        print('Found showItemDetail function in file')
    else:
        print('showItemDetail function not found')

# 写回文件
with open(r'd:\FF\FLYFF\src\components\modals\DatabaseQueryModal.vue', 'w', encoding='utf-8') as f:
    f.write(content)

print('File updated successfully')
