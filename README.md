# FlyFF - Vue 3 + Vite + Go 后端版

单机版飞飞游戏模拟器，前后端分离架构。前端 Vue 3 + Vite，后端 Go + SQLite，JWT 鉴权，数据安全持久化。含完整三转职业体系、转职任务链、成就徽章系统。

## 技术栈

**前端**: Vue 3 (Composition API) · Vite · Pinia · Vue Router · Axios · Web Workers · SCSS

**后端**: Go 1.25+ · SQLite3 (WAL) · JWT · bcrypt · HTTPS/HTTP2 (8443) + HTTP (8080) 双端口 · 自签名 ECDSA 证书自动生成

## 核心功能

| 系统 | 说明 |
|------|------|
| **用户系统** | 注册/登录、bcrypt 加密、JWT 72h 有效期、最多 8 角色槽位、数据隔离 |
| **职业系统** | 4 转职阶（初心者→1转→2转→3转），8 个三转职业，差异化属性成长，专属技能树，满级上限 190 级 |
| **战斗系统** | 自动战斗、10 技能槽配置、物理/魔法/DOT/AOE 伤害、暴击/格挡/生命偷取、流血/攻击力降低 DEBUFF、69 种 GPU 加速技能特效 |
| **技能系统** | 7 种类型、6 元素属性、10 级熟练度、EX 被动技能树（含充能积累/法术连锁/多段攻击等机制）、拖拽配置、按存档独立存储 |
| **物品装备** | 武器/防具/饰品/消耗品/材料、6 级稀有度、套装系统、双刀流（刀锋战士 60 级解锁） |
| **强化系统** | 精炼 +1~+10、属性精炼、打孔镶嵌、卡片系统、元素强化、武器盾牌唤醒、分解兑换 |
| **珠宝大师** | 骰子合成、宝石提取/镶嵌、史诗武器制作、终极武器转换 |
| **宠物系统** | 捕捉/孵化、进化/训练/献祭、巅峰属性、自动攻击与 BUFF |
| **副本系统** | 13 个副本、7 级难度、阶段管理、BOSS 战、掉落分配、队友系统（最多 8 人）、死亡复活 |
| **NPC 系统** | 13 种 NPC（职业导师、铁匠、珠宝大师、商店等） |
| **任务系统** | 主线/支线/每日/深渊之塔、转职任务链（多阶段+奖励）、任务进度追踪与明细展示 |
| **成就系统** | 6 大分类、多等级、怪物击杀/消耗品关联匹配、称号与徽章双列展示、佩戴后名称旁显示徽章图标 |
| **大师进阶** | 6 阶段（Lv70~120）、降级机制、经验/掉率惩罚、大师徽章奖励、任务期间等级上限锁定 |
| **每日签到** | 日历签到、连续/里程碑奖励、前置击杀条件 |
| **数据持久化** | SQLite 后端存储、10s 防抖 + 即时保存、IndexedDB 缓存 |

## 项目结构

```
FLYFF/
├── public/                  # 静态资源（图片/音效/音乐/资源二进制）
├── server/                  # Go 后端（10 个 .go 源文件）
│   ├── main.go             # 入口，HTTP+HTTPS 双端口
│   ├── database.go         # SQLite 初始化
│   ├── middleware.go       # CORS/JWT/日志
│   ├── models.go           # 数据模型
│   ├── player_service.go   # 玩家数据服务
│   ├── user_service.go     # 用户认证
│   ├── flyff_proxy.go      # API 代理 + 图标检查
│   ├── flyff_data_updater.go # 数据增量更新
│   ├── static.go           # 前端静态文件托管（SPA + SharedArrayBuffer）
│   ├── routes/             # 路由扩展（预留）
│   ├── services/           # 服务扩展（预留）
│   ├── winres/             # Windows 资源文件（图标）
│   └── cmd/generate_cert/  # TLS 证书生成工具
├── src/
│   ├── components/          # Vue 组件 (70 个)
│   │   ├── modals/         # 模态框 (47)，含 jewelry-master/ 子目录 (7)
│   │   ├── dungeon/        # 副本组件 (20)
│   │   ├── mage-effects/   # 技能特效 (69)
│   │   └── common/         # 通用组件 (3)
│   ├── composables/         # 组合式函数 (78 个)
│   ├── data/               # 静态游戏数据 (21 个，只读冻结)
│   ├── services/           # 业务服务层 (32 个，含 autoBattle/ 子目录 10 个)
│   ├── store/              # Pinia 状态管理 (15 个 Store)
│   ├── utils/              # 工具函数 (27 个，含 cache/ 子目录 1 个)
│   ├── views/              # 页面视图 (13 个)
│   ├── workers/            # Web Workers (10 个)
│   ├── router/             # 路由配置
│   ├── models/             # 数据模型
│   ├── directives/         # Vue 指令
│   ├── errorHandler/       # 错误处理
│   ├── types/              # TypeScript 类型定义
│   ├── styles/             # 全局样式（重置/主题变量/工具类）
│   └── assets/             # 前端资源
├── CHANGELOG.md
├── CLAUDE.md               # 项目规则
├── FLYFF-Launcher.exe      # 启动器
└── package.json
```

### 后端 API 概览

- **认证**: `POST /api/auth/register` · `POST /api/auth/login` · `GET /api/health`
- **玩家数据**: 存档槽管理、角色创建/删除、数据保存、副本进度、属性强化、设置、钻石
- **数据更新**: 版本对比、批量更新、进度查询、中止/恢复
- **代理服务**: FlyFF API 反向代理、物品/NPC/技能图标检查

## 快速开始

### 启动方式

**方式一（推荐）**: 双击 `FLYFF-Launcher.exe`，自动检测依赖并启动。

**方式二（手动）**:

```bash
npm install
npm run dev        # 开发服务器 http://localhost:3000
```

### 后端编译

```bash
cd server && go build -o flyff-server.exe .
```

修改 `server/` 下任何文件后必须重新编译，否则新逻辑不生效。

### 代码检查

```bash
npm run lint
```

### 构建

```bash
npm run build      # 产物输出到 dist/，Go 后端内置静态托管
```

## 性能优化

- **重型数据延迟加载**: Vite 插件将 28MB+19MB 的物品/怪物数据从登录页剥离，秒级跳转
- **子 Store 懒加载代理**: `createLazyStoreProxy` 按需动态 import
- **全局 Loading Overlay**: 替代加载期间白屏
- **静态数据冻结**: `Object.freeze()` 避免响应式开销
- **Web Worker 多线程**: 战斗/掉落/恢复等计算卸载到子线程
- **content-visibility**: 大列表跳过不可见区域渲染
- **分批渲染 + 防抖节流**: 背包/掉落面板增量加载

## 故障排除

| 问题 | 解决方案 |
|------|----------|
| 开发服务器无法启动 | 检查端口 3000 占用、Node ≥ 18 |
| 数据加载失败 | 检查 `src/data/` 文件、后端 Go 服务、IndexedDB 缓存 |
| 存档异常 | 数据在后端 SQLite，清浏览器缓存不影响；非无痕模式 |
| 服务器连接断开 | 检查 Go 后端运行状态、心跳日志；长时间运行偶发断连已通过主线程冻结检测缓解 |

## 项目规模

| 类型 | 数量 |
|------|------|
| Vue 组件(主目录) | 70 |
| 模态框组件 | 47 |
| 珠宝大师子组件 | 7 |
| 副本组件 | 20 |
| 技能特效组件 | 69 |
| 通用组件 | 3 |
| 组合式函数 | 78 |
| 服务层 | 32 |
| 自动战斗子服务 | 10 |
| Pinia Store | 15 |
| Web Worker | 10 |
| 工具函数 | 27 |
| 数据文件 | 21 |
| 页面视图 | 13 |
| Go 后端源文件 | 10 |
| 音效文件 | 1684+ |
| 音乐文件 | 26 |

## 项目定位

单机版飞飞游戏模拟器，专注核心单机体验：完整战斗循环、装备强化体系、物品管理、宠物养成。不含 MMO 社交/交易功能。

## 开发规范

详见 [CLAUDE.md](./CLAUDE.md)

## 许可证

MIT
