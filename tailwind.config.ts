import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

export default {
  content: ['src/**/*.tsx'],
  theme: {
    screens: {
      sm: '450px',
    },
    fontFamily: {
      sans: ['Open Sans Variable', ...defaultTheme.fontFamily.sans],
    },
    extend: {
      colors: {
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
      },
    },
  },
} satisfies Config;
