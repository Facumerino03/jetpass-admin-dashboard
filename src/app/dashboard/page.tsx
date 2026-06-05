"use client";

import { useQuery } from "@tanstack/react-query";
import { listFlightPlans } from "@/lib/api/flight-plans";
import { FlightPlanTable } from "@/components/dashboard/flight-plan-table";

export default function DashboardPage() {
  const {
    data: plans,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["flight-plans"],
    queryFn: listFlightPlans,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Planes de Vuelo Pendientes
        </h1>
        <p className="text-muted-foreground mt-1">
          Revisá y aprobá los planes que esperan tu autorización.
        </p>
      </div>
      <FlightPlanTable
        plans={plans}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
      />
    </div>
  );
}
