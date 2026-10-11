
# 技术栈限制（精简版）

## 核心框架
- Vue 3 + Vite
- Composition API + <script setup>
- Pinia 状态管理
- Vue Router

## 开发环境
- Node >= 18
- ESLint + Prettier
- Sass

## 依赖约束
- 仅使用项目已依赖库，新增依赖需明确需求
- 数据访问必须通过 Pinia Store

## 禁止事项
- 仅以下文件不可修改：
  - src/data/DIAMOND_SHOP_ITEMS.js
  - src/data/ITEM_INFO.js
  - src/data/MAP_INFO.js
  - src/data/MONSTER_INFO.js
  - src/data/NPC_INFO.js
  - src/data/QUEST_INFO.js
  - src/data/SKILL_INFO.js
  - src/data/SQ_SET.js
- 在组件中重复定义工具函数
- 使用 window.* 管理状态

---

# 项目结构规范（精简版）

## 根目录
- src：全部前端开发与修改
- public：静态资源
- .trae/rules：项目规则

## src 结构
- components：独立组件
- composables：组合式函数
- services：业务逻辑层
- store：Pinia 状态
- utils：工具函数
- data：静态游戏数据（只读）
- assets：前端资源
- views：页面视图
- router：路由

## 静态数据
- 只读：src/data 内核心静态文件禁止直接修改
- 改动需求通过 service/store/utils 适配

## 资源路径
- 图片：/public/pt/
- 音效：/public/sound/
- 音乐：/public/music/
- 数据：/public/data/

---

# 其他项目规则
- 遇到模糊问题,可以向我提问
- 代码必须易于理解、扩展，且无安全隐患
- 文件结构、命名、格式必须统一
- 回答问题时必须站在 JavaScript,VUE3专家的角度思考问题
- 凡涉及新增功能、行为修改、问题修复、Bug修复，必须同步更新`CHANGELOG.md`
- 更新CHANGELOG.md时要从文件开始新增,不要覆盖之前的内容
- **main.vue**：保持精简，复杂逻辑抽离到composables
- **JSDoc**：导出的函数、类必须有JSDoc
- **export 导出注释**：凡使用 `export` 导出的函数/类/常量/类型等，必须提供"完整注释"（优先 JSDoc），包含用途/业务意图、关键参数与返回值/字段说明
- **注释要求**：所有文件必须包含文件头元信息注释；所有函数/方法必须有注释（优先 JSDoc），说明业务意图与输入/输出
- **内联注释**：解释业务意图，而非代码本身
- **元信息**：文件开头添加生成元信息
- 异步操作必须使用 try-catch
- 提供用户友好的错误消息
- 使用 console 记录错误
- 运行无报错：页面无红屏，控制台无关键错误
- 结构规范：文件分区清晰，命名统一
- 文档充足：JSDoc 和注释完整
- 使用命令检查错误时只运行 `npm run lint`，不运行 build
- 检查代码必须无错误,无警告
- **服务端编译**：修改 `server/` 目录下的 Go 后端文件后，必须重新编译服务端（`go build`），否则新路由/逻辑不会生效

## ❌ 禁止：
- 解冻静态数据进行比对
- 修改已冻结的静态数据
- 对静态数据使用深度监听（deep watch）
- 在组件中对静态数据进行响应式包装

## ✅ 正确：
- 使用 `Object.freeze()` 冻结所有静态数据（物品、怪物、技能等）
- 直接读取静态数据，不进行响应式包装
- 使用 computed 计算属性处理静态数据
- 在 Pinia Store 中冻结静态数据后加载到 state
- 金币数值显示以每4位添加一个逗号分隔
- 出售物品如果物品stack<=1表示不可叠加,按照物品的唯一ID进行出售,如果物品stack>1表示可以叠加,使用ID查找出售
