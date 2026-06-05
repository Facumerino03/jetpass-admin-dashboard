import { Clock, Check, X, Circle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import type {
  FlightPlanApproval,
  FlightPlanStatusHistory,
} from "@/types/api";
import {
  getApprovalStatusLabel,
  getApprovalActorLabel,
  getFlightPlanStatusLabel,
} from "@/lib/utils/labels";
import { formatDateTime } from "@/lib/utils/format";

interface ApprovalTimelineProps {
  approvals: FlightPlanApproval[];
  statusHistory: FlightPlanStatusHistory[];
}

export function ApprovalTimeline({
  approvals,
  statusHistory,
}: ApprovalTimelineProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Ciclo de Aprobaciones
        </h3>
        <div className="space-y-3">
          {approvals.map((approval) => {
            const Icon =
              approval.status === "approved"
                ? Check
                : approval.status === "rejected"
                  ? X
                  : Circle;

            const iconColor =
              approval.status === "approved"
                ? "text-green-500"
                : approval.status === "rejected"
                  ? "text-red-500"
                  : "text-amber-500";

            return (
              <div key={approval.id} className="flex gap-3">
                <Icon className={`h-5 w-5 mt-0.5 ${iconColor}`} />
                <div>
                  <p className="text-sm font-medium">
                    {getApprovalActorLabel(approval.actor)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getApprovalStatusLabel(approval.status)}
                    {approval.decided_at &&
                      ` — ${formatDateTime(approval.decided_at)}`}
                  </p>
                  {approval.reason && (
                    <p className="text-xs text-gray-500 mt-1">
                      {approval.reason}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Historial de Estados
        </h3>
        <div className="space-y-3">
          {statusHistory.map((entry) => (
            <div key={entry.id} className="flex gap-3">
              <Clock className="h-4 w-4 mt-0.5 text-gray-400" />
              <div>
                <p className="text-sm">
                  {entry.from_status
                    ? `${getFlightPlanStatusLabel(entry.from_status)} → ${getFlightPlanStatusLabel(entry.to_status)}`
                    : getFlightPlanStatusLabel(entry.to_status)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(entry.created_at)}
                </p>
                {entry.reason && (
                  <p className="text-xs text-gray-500 mt-1">{entry.reason}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
