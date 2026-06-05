import { Badge } from "@/components/ui/badge";
import type { FlightPlanStatus } from "@/types/api";
import { getFlightPlanStatusLabel } from "@/lib/utils/labels";
import { cn } from "@/lib/utils";

const STATUS_CLASSES: Record<FlightPlanStatus, string> = {
  draft: "bg-gray-100 text-gray-700 hover:bg-gray-100",
  filed: "bg-gray-100 text-gray-700 hover:bg-gray-100",
  pending_approval: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  accepted: "bg-green-100 text-green-700 hover:bg-green-100",
  rejected: "bg-red-100 text-red-700 hover:bg-red-100",
  active: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  closed: "bg-gray-100 text-gray-700 hover:bg-gray-100",
  cancelled: "border border-gray-300 text-gray-500 bg-transparent hover:bg-transparent",
};

interface StatusBadgeProps {
  status: FlightPlanStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge className={cn(STATUS_CLASSES[status], "font-medium")} variant="outline">
      {getFlightPlanStatusLabel(status)}
    </Badge>
  );
}
