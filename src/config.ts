import type { ThemeObjectOrShikiThemeName } from 'astro-expressive-code'

type Config = {
  author: string
  title: string
  description: string
  lang: string
  themes: {
    dark: ThemeObjectOrShikiThemeName
    light: ThemeObjectOrShikiThemeName
  }
}

export default {
  author: 'John Doe',
  title: 'Neobrutalism blog template',
  description: 'Lorem ipsum dolor sit amet',
  lang: 'en',
  themes: {
    dark: 'github-dark',
    light: 'github-light',
  },
} satisfies Config
