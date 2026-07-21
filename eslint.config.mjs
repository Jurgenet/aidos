// Корневой ESLint flat config.
// Стратегия: typescript-eslint рекомендованный набор + отключение форматирования
// через eslint-config-prettier (чтобы не было двойных ошибок с Prettier).
// Дополнительно включаем argsIgnorePattern '^_' для no-unused-vars — это
// стандартная практика для Express/Koa middleware, где часть параметров
// обязана присутствовать в сигнатуре, но не используется.

import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**', '**/.quasar/**'],
  },
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  prettier,
)
