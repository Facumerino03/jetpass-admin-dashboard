"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { getFlightPlan } from "@/lib/api/flight-plans";
import { FlightPlanDetailView } from "@/components/dashboard/flight-plan-detail-view";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function FlightPlanDetailPage() {
  const { id } = useParams<{ id: string }>();

  const {
    data: plan,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["flight-plan", id],
    queryFn: () => getFlightPlan(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !plan) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-red-500 font-medium">Plan no encontrado</p>
        <Button variant="outline" onClick={() => refetch()} className="mt-4">
          Reintentar
        </Button>
        <Button variant="ghost" asChild className="mt-2">
          <Link href="/dashboard">Volver al dashboard</Link>
        </Button>
      </div>
    );
  }

  return <FlightPlanDetailView plan={plan} />;
}
