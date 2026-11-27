declare const preset: {
  theme: {
    extend: {
      fontFamily: {
        sans: string[]
      }
      colors: Record<string, string>
      boxShadow: Record<string, string>
    }
  }
}

export = preset
