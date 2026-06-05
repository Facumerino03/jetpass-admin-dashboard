"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "./status-badge";
import { EmptyState } from "./empty-state";
import { ApproveButton } from "./approve-button";
import { RejectDialog } from "./reject-dialog";
import type { FlightPlanPublic } from "@/types/api";
import { formatDateTime, formatRoute } from "@/lib/utils/format";
import { getAuthorityApproval } from "@/lib/utils/labels";
import { cn } from "@/lib/utils";

interface FlightPlanTableProps {
  plans: FlightPlanPublic[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function FlightPlanTable({
  plans,
  isLoading,
  isError,
  onRetry,
}: FlightPlanTableProps) {
  const pendingPlans = useMemo(
    () => plans?.filter((p) => p.status === "pending_approval") ?? [],
    [plans]
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-red-500 font-medium">Error al cargar los planes</p>
        <Button variant="outline" onClick={onRetry} className="mt-4">
          Reintentar
        </Button>
      </div>
    );
  }

  if (!pendingPlans || pendingPlans.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="rounded-lg border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ruta</TableHead>
            <TableHead>EOBT</TableHead>
            <TableHead>Matrícula</TableHead>
            <TableHead>Piloto</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Decisión Autoridad</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pendingPlans.map((plan) => {
            const authorityApproval = getAuthorityApproval(plan);
            const authorityStatus = authorityApproval?.status;
            const authorityReason = authorityApproval?.reason;

            return (
              <TableRow key={plan.id}>
                <TableCell className="font-medium">
                  {formatRoute(
                    plan.departure_aerodrome_icao,
                    plan.destination_aerodrome_icao
                  )}
                </TableCell>
                <TableCell>{formatDateTime(plan.departure_eobt_utc)}</TableCell>
                <TableCell>
                  {plan.aircraft_identification_snapshot || "—"}
                </TableCell>
                <TableCell>
                  {plan.pilot
                    ? `${plan.pilot.last_name}, ${plan.pilot.first_name}`
                    : "—"}
                </TableCell>
                <TableCell>
                  <StatusBadge status={plan.status} />
                </TableCell>
                <TableCell>
                  {authorityStatus === "approved" && (
                    <Badge
                      variant="outline"
                      className="bg-green-100 text-green-700 hover:bg-green-100 font-medium"
                    >
                      Aprobado por autoridad
                    </Badge>
                  )}
                  {authorityStatus === "rejected" && (
                    <div className="space-y-1">
                      <Badge
                        variant="outline"
                        className="bg-red-100 text-red-700 hover:bg-red-100 font-medium"
                      >
                        Rechazado
                      </Badge>
                      {authorityReason && (
                        <p className="text-xs text-muted-foreground max-w-[200px] truncate">
                          {authorityReason}
                        </p>
                      )}
                    </div>
                  )}
                  {authorityStatus === "pending" && (
                    <Badge
                      variant="outline"
                      className="bg-amber-100 text-amber-700 hover:bg-amber-100 font-medium"
                    >
                      Pendiente
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/dashboard/${plan.id}`}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      Ver detalle
                    </Link>
                    {authorityStatus === "pending" && (
                      <>
                        <ApproveButton planId={plan.id} />
                        <RejectDialog planId={plan.id} />
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
