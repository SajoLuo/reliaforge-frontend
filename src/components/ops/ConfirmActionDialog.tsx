import { AlertTriangle, ShieldAlert } from "lucide-react"
import { useEffect, useId, useState } from "react"
import type { ActionRiskLevel, ConfirmActionDialogProps, ConfirmActionRequest } from "@reliaforge/plugin-sdk"
import { Badge, type BadgeProps } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useLocale } from "@/i18n/useLocale"

const riskTones: Record<ActionRiskLevel, NonNullable<BadgeProps["tone"]>> = {
  safe: "success",
  reversible: "warning",
  sensitive: "danger",
  destructive: "danger",
}

function requiresTypedTarget(risk: ActionRiskLevel, explicit?: boolean): boolean {
  return explicit ?? (risk === "sensitive" || risk === "destructive")
}

function DialogWarning({ text }: { text?: string }) {
  if (!text) return null
  return (
    <div
      role="note"
      className="mt-4 flex items-start gap-2.5 rounded-md border border-warning-ink/20 bg-warning-soft px-3.5 py-2.5 text-xs leading-5 text-warning-ink"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{text}</span>
    </div>
  )
}

function DialogDetails({ details }: { details?: ConfirmActionRequest["details"] }) {
  if (!details || details.length === 0) return null
  return (
    <dl className="mt-4 space-y-2 rounded-md border bg-canvas p-3 text-xs">
      {details.map((item) => (
        <div key={item.label} className="flex items-center justify-between gap-4">
          <dt className="text-muted">{item.label}</dt>
          <dd className="font-mono font-medium text-ink">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function TypedTargetInput({
  visible,
  targetLabel,
  targetValue,
  value,
  disabled,
  onChange,
}: {
  visible: boolean
  targetLabel: string
  targetValue: string
  value: string
  disabled: boolean
  onChange: (value: string) => void
}) {
  const { t } = useLocale()
  const inputId = useId()
  if (!visible) return null
  return (
    <div className="mt-4 space-y-2">
      <label htmlFor={inputId} className="block text-xs font-medium text-ink">
        {t("ops.typeToConfirm", { target: targetValue })} ({targetLabel})
      </label>
      <input
        id={inputId}
        type="text"
        autoComplete="off"
        spellCheck={false}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={targetValue}
        className="w-full rounded-md border bg-canvas px-3 py-2 font-mono text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
      />
    </div>
  )
}

function DialogFooter({
  request,
  pending,
  canConfirm,
  onConfirm,
  onCancel,
}: {
  request: ConfirmActionRequest
  pending: boolean
  canConfirm: boolean
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}) {
  const { t } = useLocale()
  const dangerAction = request.risk === "sensitive" || request.risk === "destructive"
  return (
    <div className="mt-6 flex flex-wrap justify-end gap-2">
      <Button type="button" variant="secondary" disabled={pending} onClick={onCancel}>
        {request.cancelButtonLabel ?? t("ops.cancel")}
      </Button>
      <Button
        type="button"
        variant={dangerAction ? "danger" : "primary"}
        disabled={pending || !canConfirm}
        aria-busy={pending}
        onClick={() => void onConfirm()}
      >
        {pending ? t("ops.executing") : (request.confirmButtonLabel ?? t("ops.confirm"))}
      </Button>
    </div>
  )
}

function ConfirmDialogBody({
  request,
  pending,
  error,
  onConfirm,
  onCancel,
}: {
  request: ConfirmActionRequest
  pending: boolean
  error: string | null
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}) {
  const { t } = useLocale()
  const [typedTarget, setTypedTarget] = useState("")
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) onCancel()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onCancel, pending])

  const needsTyping = requiresTypedTarget(request.risk, request.requireTypedConfirmation)
  const targetMatches = !needsTyping || typedTarget === request.targetValue

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-inverse/55 p-4"
      role="presentation"
      onClick={() => {
        if (!pending) onCancel()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="w-full max-w-lg rounded-lg border bg-panel p-6 text-ink shadow-lift"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-warning-soft text-warning-ink">
              <ShieldAlert className="h-4 w-4" aria-hidden="true" />
            </span>
            <h2 id={titleId} className="text-base font-semibold tracking-tight">{request.title}</h2>
          </div>
          <Badge tone={riskTones[request.risk]}>{t(`ops.risk.${request.risk}`)}</Badge>
        </div>

        <p id={descriptionId} className="mt-3 text-sm leading-6 text-muted">{request.description}</p>
        <DialogWarning text={request.argocdManagedWarning ?? request.warningBanner} />
        <DialogDetails details={request.details} />
        <TypedTargetInput
          visible={needsTyping}
          targetLabel={request.targetLabel}
          targetValue={request.targetValue}
          value={typedTarget}
          disabled={pending}
          onChange={setTypedTarget}
        />
        {error ? (
          <p role="alert" className="mt-4 rounded-md bg-danger-soft px-3 py-2 text-xs text-danger-ink">{error}</p>
        ) : null}
        <DialogFooter
          request={request}
          pending={pending}
          canConfirm={targetMatches}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      </div>
    </div>
  )
}

export function ConfirmActionDialog({
  open,
  request,
  pending = false,
  error = null,
  onConfirm,
  onCancel,
}: ConfirmActionDialogProps) {
  if (!open || !request) return null
  return (
    <ConfirmDialogBody
      key={`${request.title}:${request.targetValue}`}
      request={request}
      pending={pending}
      error={error}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}
