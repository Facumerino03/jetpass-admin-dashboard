"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "./status-badge";
import { ApproveButton } from "./approve-button";
import { RejectDialog } from "./reject-dialog";
import { ApprovalTimeline } from "./approval-timeline";
import { ValidationPanel } from "@/components/blocks/validation-panel";
import { useAuth } from "@/lib/auth/auth-context";
import type { FlightPlanDetail } from "@/types/api";
import { getFlightRulesLabel, getFlightTypeLabel } from "@/lib/utils/labels";
import {
  formatDateTime,
  formatDuration,
  formatRoute,
} from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

interface FlightPlanDetailViewProps {
  plan: FlightPlanDetail;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

export function FlightPlanDetailView({ plan }: FlightPlanDetailViewProps) {
  const { user } = useAuth();
  const canApprove = plan.status === "pending_approval";
  const isAuthority = user?.role === "atc_authority";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Link
            href="/dashboard"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Volver
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">
            Plan de Vuelo {plan.aircraft_identification_snapshot || plan.id.slice(0, 8)}
          </h1>
          <p className="text-muted-foreground">
            {formatRoute(plan.departure_aerodrome_icao, plan.destination_aerodrome_icao)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={plan.status} />
          {canApprove && (
            <>
              <ApproveButton planId={plan.id} />
              <RejectDialog planId={plan.id} />
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* General */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Datos Generales</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Field label="Reglas de vuelo" value={getFlightRulesLabel(plan.flight_rules)} />
              <Field label="Tipo de vuelo" value={getFlightTypeLabel(plan.flight_type)} />
              <Field label="EOBT" value={formatDateTime(plan.departure_eobt_utc)} />
              <Field label="EET" value={formatDuration(plan.total_eet)} />
              <Field label="Salida" value={plan.departure_aerodrome_icao} />
              <Field label="Destino" value={plan.destination_aerodrome_icao} />
              <Field label="Alternativo 1" value={plan.alternate1_aerodrome_icao} />
              <Field label="Alternativo 2" value={plan.alternate2_aerodrome_icao} />
            </CardContent>
          </Card>

          {/* Aircraft */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Aeronave</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Field label="Matrícula" value={plan.aircraft_identification_snapshot || "—"} />
              <Field label="Tipo" value={plan.aircraft_type_designator_snapshot || "—"} />
              <Field label="Estela turbulenta" value={plan.wake_turbulence_category_snapshot || "—"} />
              <Field label="Equipo COM/NAV" value={plan.equipment_com_nav_snapshot || "—"} />
              <Field label="Vigilancia" value={plan.equipment_surveillance_snapshot || "—"} />
              <Field label="Radio emergencia" value={plan.emergency_radio_snapshot || "—"} />
            </CardContent>
          </Card>

          {/* Route */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ruta</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Field label="Velocidad crucero" value={plan.cruising_speed || "—"} />
              <Field label="Nivel crucero" value={plan.cruising_level || "—"} />
              <Field label="Punto cambio reglas" value={plan.rule_change_point || "—"} />
            </CardContent>
            {plan.route && (
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground">Ruta</p>
                <p className="text-sm font-mono">{plan.route}</p>
              </CardContent>
            )}
          </Card>

          {/* Additional info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Información Adicional</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Field label="Autonomía" value={formatDuration(plan.endurance)} />
              <Field label="Personas a bordo" value={plan.persons_on_board?.toString() || "—"} />
              <Field label="Equipo supervivencia" value={plan.survival_equipment_snapshot || "—"} />
              <Field label="Chalecos" value={plan.life_jackets_snapshot || "—"} />
              <Field label="Botes (cantidad)" value={plan.dinghies_number_snapshot?.toString() || "—"} />
              <Field label="Botes (capacidad)" value={plan.dinghies_capacity_snapshot?.toString() || "—"} />
              <Field label="Botes (cubierta)" value={plan.dinghies_cover_snapshot === true ? "Sí" : plan.dinghies_cover_snapshot === false ? "No" : "—"} />
              <Field label="Botes (color)" value={plan.dinghies_color_snapshot || "—"} />
              <Field label="Color y marcas" value={plan.color_and_markings_snapshot || "—"} />
            </CardContent>
            {plan.other_information && (
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground">Casilla 18</p>
                <p className="text-sm">{plan.other_information}</p>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Sidebar derecha */}
        <div className="lg:col-span-1 space-y-6">
          {isAuthority && <ValidationPanel flightPlanId={plan.id} />}
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle className="text-base">Línea de Tiempo</CardTitle>
            </CardHeader>
            <CardContent>
              <ApprovalTimeline
                approvals={plan.approvals}
                statusHistory={plan.status_history}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
