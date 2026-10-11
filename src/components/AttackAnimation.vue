<template>
  <div
    class="attack-animation"
    :class="[type, { 'is-hit': isHit, 'is-auto-battling': isAutoBattling }]"
  >
    <div class="avatar-container" :class="type">
      <slot></slot>
    </div>
    <slot name="damage"></slot>
  </div>
</template>

<script>
export default {
  name: 'AttackAnimation',
  props: {
    type: {
      type: String,
      default: 'player',
      validator: value => ['player', 'monster'].includes(value)
    },
    isAutoBattling: {
      type: Boolean,
      default: false
    },
    isHit: {
      type: Boolean,
      default: false
    },
    isAttacking: {
      type: Boolean,
      default: false
    },
    isUsingSkill: {
      type: Boolean,
      default: false
    }
  },
  watch: {
    isHit (newVal) {
      if (newVal) {
        this.triggerHitAnimation()
      }
    },
    isAutoBattling () {
      this.updateAutoBattleAnimation()
    },
    isAttacking (newVal) {
      if (newVal) {
        this.triggerAttackAnimation()
      }
    },
    isUsingSkill (newVal) {
      if (newVal) {
        this.triggerSkillAnimation()
      }
    }
  },
  mounted () {
    this.updateAutoBattleAnimation()
  },
  methods: {
    triggerHitAnimation () {
      this.$nextTick(() => {
        const container = this.$el.querySelector('.avatar-container')
        if (container) {
          // 先移除可能存在的旧事件监听器和类，避免堆积
          container.classList.remove('hit', 'attacking', 'using-skill')
          
          // 强制重绘，确保动画能够重新触发
          // eslint-disable-next-line no-void
          void container.offsetWidth
          
          // 使用animationend事件替代setTimeout
          const handleAnimationEnd = () => {
            container.classList.remove('hit')
            container.removeEventListener('animationend', handleAnimationEnd)
          }

          container.addEventListener('animationend', handleAnimationEnd)
          container.classList.add('hit')
        }
      })
    },
    triggerAttackAnimation () {
      this.$nextTick(() => {
        const container = this.$el.querySelector('.avatar-container')
        if (container) {
          // 先移除可能存在的旧事件监听器和类，避免堆积
          container.classList.remove('hit', 'attacking', 'using-skill')
          
          // 强制重绘，确保动画能够重新触发
          // eslint-disable-next-line no-void
          void container.offsetWidth
          
          // 使用animationend事件替代setTimeout
          const handleAnimationEnd = () => {
            container.classList.remove('attacking')
            container.removeEventListener('animationend', handleAnimationEnd)
          }

          container.addEventListener('animationend', handleAnimationEnd)
          container.classList.add('attacking')
        }
      })
    },
    triggerSkillAnimation () {
      this.$nextTick(() => {
        const container = this.$el.querySelector('.avatar-container')
        if (container) {
          // 先移除可能存在的旧事件监听器和类，避免堆积
          container.classList.remove('hit', 'attacking', 'using-skill')
          
          // 强制重绘，确保动画能够重新触发
          // eslint-disable-next-line no-void
          void container.offsetWidth
          
          // 使用animationend事件替代setTimeout
          const handleAnimationEnd = () => {
            container.classList.remove('using-skill')
            container.removeEventListener('animationend', handleAnimationEnd)
          }

          container.addEventListener('animationend', handleAnimationEnd)
          container.classList.add('using-skill')
        }
      })
    },
    updateAutoBattleAnimation () {
      // console.log('[AttackAnimation] updateAutoBattleAnimation 被调用', {
      //   type: this.type,
      //   isAutoBattling: this.isAutoBattling
      // })
      // 动画由 CSS 类控制，无需 JavaScript 干预
      // CSS 规则: .attack-animation.player.is-auto-battling .avatar-container.player :deep(img)
      // 当 isAutoBattling 为 true 时，CSS 会自动应用动画
    }
  }
}
</script>

<style scoped>
  .attack-animation {
    position: relative;
    display: inline-block;
  }

  .attack-animation.player {
    overflow: hidden;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .avatar-container {
    display: inline-block;
    transition: all 0.3s ease;
  }

  .avatar-container.player {
    border-radius: 10px;
    border: 1px solid var(--theme-border-strong);
    background: var(--theme-panel-bg);
  }

  .avatar-container.monster {
    position: relative;
    border-radius: 8px;
  }

  /* 狂暴动画在怪物图片背后显示 */
  .avatar-container.monster :deep(.enemy-icon) {
    position: relative;
    z-index: 1;
  }

  .avatar-container.player.hit :deep(#playerAvatar) {
    animation: player-hit 0.3s ease-in-out !important;
  }

  .avatar-container.monster.hit :deep(.enemy-icon) {
    animation: monster-hit 0.3s ease-in-out !important;
  }

  .avatar-container.player.attacking :deep(#playerAvatar) {
    animation: player-attack 0.3s ease-in-out !important;
  }

  .avatar-container.monster.attacking :deep(.enemy-icon) {
    animation: monster-attack 0.3s ease-in-out !important;
  }

  .avatar-container.player.using-skill :deep(#playerAvatar) {
    animation: player-skill-attack 0.3s ease-in-out !important;
  }

  .avatar-container.monster.using-skill :deep(.enemy-icon) {
    animation: monster-skill-hit 0.3s ease-in-out !important;
  }

  @keyframes player-hit {
    0% {
      transform: translateX(0);
    }
    50% {
      transform: translateX(-20px);
    }
    100% {
      transform: translateX(0);
    }
  }

  @keyframes monster-hit {
    0% {
      transform: translateX(0);
    }
    50% {
      transform: translateX(20px);
    }
    100% {
      transform: translateX(0);
    }
  }

  @keyframes player-attack {
    0% {
      transform: translateX(0);
    }
    50% {
      transform: translateX(20px);
    }
    100% {
      transform: translateX(0);
    }
  }

  @keyframes monster-attack {
    0% {
      transform: translateX(0);
    }
    50% {
      transform: translateX(-20px);
    }
    100% {
      transform: translateX(0);
    }
  }

  @keyframes player-skill-attack {
    0% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-30px);
    }
    100% {
      transform: translateY(0);
    }
  }

  @keyframes monster-skill-hit {
    0% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(20px);
    }
    100% {
      transform: translateY(0);
    }
  }

  .attack-animation.player.is-auto-battling .avatar-container.player:not(.hit):not(.attacking):not(.using-skill) :deep(#playerAvatar) {
    animation: player-pulse 0.6s infinite !important;
  }

  .attack-animation.monster.is-auto-battling .avatar-container.monster:not(.hit):not(.attacking):not(.using-skill) :deep(.enemy-icon) {
    animation: monster-pulse 0.5s infinite !important;
  }

  @keyframes player-pulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes monster-pulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
    }
  }
</style>
