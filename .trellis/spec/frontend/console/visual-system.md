# Visual System

The console uses a restrained, information-first visual language: neutral surfaces, hairline
separators, compact typography, and one accessible green accent. Presentation changes must keep the
operational workflow obvious before adding decoration.

## Tokens and Themes

- Define shared color and surface tokens in `src/styles.css`; expose reusable Tailwind aliases in
  `tailwind.config.ts` instead of repeating literal colors in components.
- Support light mode and `prefers-color-scheme: dark` through the same tokens. Do not add persistent
  theme state unless the product explicitly requires a manual theme control.
- Pair `accent` with `accent-ink`. Text and interactive controls must meet WCAG AA contrast in both
  themes (4.5:1 for normal text; 3:1 for large text and UI boundaries).
- Use the system sans stack. Do not claim or depend on an unavailable brand font.

## Layout and Components

- Build hierarchy with spacing, alignment, type weight, and hairline borders before adding elevation.
  Avoid gradients, glow effects, heavy shadows, nested cards, and decorative radius inflation.
- Use the shared `PluginList` for plugin collections. Keep one responsive row contract across the
  overview and catalog instead of duplicating list markup or reverting to disconnected card grids.
- Keep summary metrics visually grouped and scan-friendly. Dense operational data should remain
  legible on narrow screens without horizontal page overflow.
- Preserve accessible names, focus visibility, keyboard order, and stable test selectors when
  restyling interactive elements.

## Verification

For visual changes, verify the affected routes in light and system-dark modes at desktop and mobile
widths. Check loading, empty, error, and populated states when relevant. Compare screenshots at the
same viewport as the approved reference, then run the complete quality gate from `index.md`.

Good:

```tsx
<PluginList plugins={plugins} />
```

Avoid:

```tsx
<div className="grid">{/* A second, page-specific plugin collection */}</div>
```
