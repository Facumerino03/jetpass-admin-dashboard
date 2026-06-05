"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { approveFlightPlan } from "@/lib/api/flight-plans";
import { ApiError } from "@/lib/api/client";
import { Check } from "lucide-react";

interface ApproveButtonProps {
  planId: string;
}

export function ApproveButton({ planId }: ApproveButtonProps) {
  const [confirmed, setConfirmed] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => approveFlightPlan(planId),
    onSuccess: () => {
      toast.success("Plan aprobado correctamente");
      queryClient.invalidateQueries({ queryKey: ["flight-plans"] });
      queryClient.invalidateQueries({ queryKey: ["flight-plan", planId] });
      setConfirmed(false);
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(`Error: ${error.message}`);
      } else {
        toast.error("Error al aprobar el plan");
      }
      setConfirmed(false);
    },
  });

  if (!confirmed) {
    return (
      <Button size="sm" variant="outline" onClick={() => setConfirmed(true)}>
        Aprobar
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      className="bg-green-600 hover:bg-green-700"
    >
      <Check className="mr-1 h-4 w-4" />
      {mutation.isPending ? "Aprobando..." : "Confirmar"}
    </Button>
  );
}
