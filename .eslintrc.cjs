/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
    '@vue/eslint-config-typescript/recommended',
    '@electron-toolkit/eslint-config-ts/eslint-recommended',
    '@vue/eslint-config-prettier'
  ],
  rules: {
    'vue/multi-word-component-names': 'off',
    // Zu strikt für idiomatische Vue-Router Lazy-Imports (() => import(...)) und
    // Callback-Arrow-Functions; Typen sind an den meisten Stellen ohnehin durch
    // Rückgabewerte/Kontext eindeutig.
    '@typescript-eslint/explicit-function-return-type': 'off'
  }
}
