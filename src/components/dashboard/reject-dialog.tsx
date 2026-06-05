"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { rejectFlightPlan } from "@/lib/api/flight-plans";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

interface RejectDialogProps {
  planId: string;
}

export function RejectDialog({ planId }: RejectDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => rejectFlightPlan(planId, reason),
    onSuccess: () => {
      toast.success("Plan rechazado");
      queryClient.invalidateQueries({ queryKey: ["flight-plans"] });
      queryClient.invalidateQueries({ queryKey: ["flight-plan", planId] });
      setOpen(false);
      setReason("");
      setError(null);
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(`Error: ${error.message}`);
      } else {
        toast.error("Error al rechazar el plan");
      }
    },
  });

  const handleSubmit = () => {
    if (reason.trim().length < 10) {
      setError("El motivo debe tener al menos 10 caracteres");
      return;
    }
    setError(null);
    mutation.mutate();
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setReason("");
      setError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <button className={cn(buttonVariants({ size: "sm", variant: "outline" }), "text-red-600 border-red-200 hover:bg-red-50")}>
            Rechazar
          </button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rechazar plan de vuelo</DialogTitle>
          <DialogDescription>
            Escribí el motivo del rechazo. Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reason">Motivo</Label>
          <Textarea
            id="reason"
            placeholder="Ej: Ruta no autorizada, condiciones meteorológicas adversas..."
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError(null);
            }}
            className="min-h-[100px]"
            maxLength={500}
          />
          <div className="flex justify-between">
            {error && <p className="text-sm text-red-500">{error}</p>}
            <p className="text-xs text-muted-foreground ml-auto">
              {reason.length}/500
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Rechazando..." : "Confirmar rechazo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
