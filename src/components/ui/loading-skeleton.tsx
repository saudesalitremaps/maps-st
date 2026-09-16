import { cn } from "@/lib/utils"

export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-md bg-muted", className)} />
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between">
        <div className="space-y-2">
          <LoadingSkeleton className="h-9 w-48" />
          <LoadingSkeleton className="h-4 w-72" />
        </div>
        <LoadingSkeleton className="h-10 w-36" />
      </div>
      <div className="grid gap-4 md:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <LoadingSkeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <LoadingSkeleton className="h-96 rounded-xl" />
    </div>
  )
}
