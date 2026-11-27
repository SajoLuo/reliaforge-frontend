import type { PageHeaderProps } from "@reliaforge/plugin-sdk"

export type { PageHeaderProps }

export function PageHeader({ title, meta, actions, description }: PageHeaderProps) {
  return (
    <header className="flex min-h-12 flex-col justify-center gap-3 border-b border-line pb-3.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <h1 className="truncate text-xl font-semibold tracking-tight text-ink">{title}</h1>
          {meta ? <div className="flex flex-wrap items-center gap-2 text-xs text-muted">{meta}</div> : null}
        </div>
        {description ? <p className="mt-1 text-xs leading-5 text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  )
}
