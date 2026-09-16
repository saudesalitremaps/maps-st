import { AlertCircle, CheckCircle2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AlertBannerProps {
  variant?: "error" | "success" | "warning"
  message: string
  onDismiss?: () => void
  action?: { label: string; onClick: () => void }
  className?: string
}

const variants = {
  error: "bg-red-50 border-red-200 text-red-800",
  success: "bg-green-50 border-green-200 text-green-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
}

const icons = {
  error: AlertCircle,
  success: CheckCircle2,
  warning: AlertCircle,
}

export function AlertBanner({
  variant = "error",
  message,
  onDismiss,
  action,
  className,
}: AlertBannerProps) {
  const Icon = icons[variant]

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3 text-sm",
        variants[variant],
        className
      )}
    >
      <Icon className="h-5 w-5 shrink-0 mt-0.5" />
      <p className="flex-1">{message}</p>
      {action && (
        <Button
          variant="outline"
          size="sm"
          onClick={action.onClick}
          className="shrink-0 border-current/30 bg-transparent hover:bg-black/5"
        >
          {action.label}
        </Button>
      )}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded p-1 hover:bg-black/5"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
