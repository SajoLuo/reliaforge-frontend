export interface PageHeaderProps {
  eyebrow?: string
  title: string
  description: string
  actions?: React.ReactNode
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow ? <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-accent">{eyebrow}</p> : null}
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-ink">{title}</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted">{description}</p>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </header>
  )
}
