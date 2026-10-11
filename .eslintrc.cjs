module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es2021: true
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
    '@vue/eslint-config-prettier/skip-formatting'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  overrides: [
    {
      files: ['src/views/Main.vue'],
      rules: {
        'no-undef': 'off',
        'no-unused-vars': 'off',
        'vue/no-unused-vars': 'off',
        'no-case-declarations': 'off',
        'no-empty': 'off',
        'no-useless-call': 'off',
        'no-prototype-builtins': 'off',
        'no-useless-escape': 'off'
      }
    },
    {
      files: ['src/tests/**/*.js'],
      env: {
        jest: true,
        node: true
      }
    }
  ],
  rules: {
    // Vue相关规则
    'vue/multi-word-component-names': 'off',
    'vue/no-unused-vars': 'warn',
    'vue/require-default-prop': 'off',
    'vue/require-explicit-emits': 'off',
    'vue/no-mutating-props': 'warn',

    // JavaScript相关规则
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-unused-vars': 'warn',
    'no-undef': 'error',
    eqeqeq: ['error', 'always'],

    // ========== 风格规则 (已关闭) ==========
    // 以下规则仅影响代码格式，不影响功能，已关闭
    'prefer-const': 'off',
    curly: 'off',
    indent: 'off',
    quotes: 'off',
    semi: 'off',
    'comma-dangle': 'off',
    'space-before-function-paren': 'off',
    'keyword-spacing': 'off',
    'space-infix-ops': 'off',
    'arrow-spacing': 'off',
    'object-shorthand': 'off',
    'prefer-arrow-callback': 'off',

    // ========== 最佳实践 (保留) ==========
    'no-var': 'error',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-invalid-this': 'error',
    'no-loop-func': 'error',
    'no-new': 'error',
    'no-new-func': 'error',
    'no-new-wrappers': 'error',
    'no-return-assign': 'error',
    'no-self-compare': 'error',
    'no-sequences': 'error',
    'no-throw-literal': 'error',
    'no-unused-expressions': 'error',
    'no-useless-return': 'error',
    'no-void': 'error',
    'no-with': 'error',
    radix: 'warn',
    'no-implicit-coercion': 'warn',
    'no-constant-condition': 'warn',
    'no-duplicate-case': 'error'
  },
  globals: {
    defineProps: 'readonly',
    defineEmits: 'readonly',
    defineExpose: 'readonly',
    withDefaults: 'readonly'
  }
}
