import { createRouter, createWebHistory } from 'vue-router'

// 登录/注册页：同步加载（首屏需要，且不依赖游戏数据）
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'

// 游戏页面：懒加载（避免登录页加载游戏数据文件，如 ITEM_INFO/MONSTER_INFO 等）
const Main = () => import('../views/Main.vue')
const Select = () => import('../views/Select.vue')
const Create = () => import('../views/Create.vue')
const JobChange = () => import('../views/JobChange.vue')
const PetCatalog = () => import('../views/PetCatalog.vue')
const EffectsShowcase = () => import('../views/EffectsShowcase.vue')
const FurySpinTest = () => import('../views/FurySpinTest.vue')
const Dungeon = () => import('../views/Dungeon.vue')
const ApiUpdater = () => import('../views/ApiUpdater.vue')
const MageSkillShowcase = () => import('../views/MageSkillShowcase.vue')
const TornadoSandstormTest = () => import('../views/TornadoSandstormTest.vue')

import { apiService } from '@/services/ApiService'
import { useGameStore } from '@/store'

const routes = [
  {
    path: '/',
    name: 'Login',
    component: Login
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  },
  {
    path: '/main',
    name: 'Main',
    component: Main
  },
  {
    path: '/select',
    name: 'Select',
    component: Select
  },
  {
    path: '/create',
    name: 'Create',
    component: Create
  },
  {
    path: '/jobchange',
    name: 'JobChange',
    component: JobChange
  },
  {
    path: '/pets',
    name: 'PetCatalog',
    component: PetCatalog
  },
  {
    path: '/effects',
    name: 'EffectsShowcase',
    component: EffectsShowcase
  },
  {
    path: '/fury-spin-test',
    name: 'FurySpinTest',
    component: FurySpinTest
  },
  {
    path: '/dungeon/:id?',
    name: 'Dungeon',
    component: Dungeon,
    props: true
  },
  {
    path: '/data-updater',
    name: 'DataUpdater',
    component: ApiUpdater
  },
  {
    path: '/mage-skill-showcase',
    name: 'MageSkillShowcase',
    component: MageSkillShowcase
  },
  {
    path: '/tornado-sandstorm-test',
    name: 'TornadoSandstormTest',
    component: TornadoSandstormTest
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

/**
 * 需要登录认证才能访问的页面列表
 * Login和Register页面不需要认证
 */
const publicPages = ['Login', 'Register', 'DataUpdater', 'FurySpinTest', 'MageSkillShowcase', 'TornadoSandstormTest']

/**
 * 已登录用户仍可访问的公共页面（不会被重定向到角色选择页）
 * DataUpdater 使用 sessionStorage 隔离，新标签页打开时无 token，需允许直接访问
 */
const publicPagesAllowAuth = ['DataUpdater']

/**
 * 路由守卫：检查用户是否已登录，并控制全局 loading overlay
 * - 不在此处调用 ensureGameStores()，避免在 Select 页面等待重型数据加载完成才跳转
 * - Main.vue 的 <script setup> 顶层 await ensureGameStores() 负责加载游戏数据
 * - 导航到 /main 时设置 mainReady = false，触发 App.vue 的全局 loading overlay
 * - Main.vue onMounted 后设置 mainReady = true，隐藏 loading overlay
 */
router.beforeEach(async (to, from, next) => {
  const isPublicPage = publicPages.includes(to.name)
  const isAuthenticated = apiService.isAuthenticated()

  // 导航到 Main 页面时，标记为未就绪（触发全局 loading overlay）
  if (to.name === 'Main') {
    try {
      const gameStore = useGameStore()
      gameStore.setMainReady(false)
    } catch (e) {
      // Pinia 未初始化时忽略
    }
  }

  if (!isPublicPage && !isAuthenticated) {
    next({ name: 'Login' })
  } else if (isPublicPage && isAuthenticated && !publicPagesAllowAuth.includes(to.name)) {
    next({ name: 'Select' })
  } else {
    next()
  }
})

export default router
