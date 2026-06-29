"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listBlocks, runValidation } from "@/lib/api/validation";
import {
  OPERATOR_LABELS,
  OVERALL_LABELS,
  RESULT_LABELS,
} from "@/lib/utils/validation-labels";
import { CheckCircle2, XCircle, AlertTriangle, Play } from "lucide-react";
import { toast } from "sonner";
import type { ValidationRunResult } from "@/types/api";

interface ValidationPanelProps {
  flightPlanId: string;
}

const OVERALL_VARIANTS: Record<
  "approved" | "warned" | "rejected",
  "default" | "secondary" | "destructive" | "outline"
> = {
  approved: "default",
  warned: "secondary",
  rejected: "destructive",
};

export function ValidationPanel({ flightPlanId }: ValidationPanelProps) {
  const [selectedBlockId, setSelectedBlockId] = useState<string>("");
  const [result, setResult] = useState<ValidationRunResult | null>(null);

  const { data: blocks = [], isLoading } = useQuery({
    queryKey: ["validation-blocks"],
    queryFn: listBlocks,
  });

  const activeBlocks = blocks.filter((b) => b.is_active);

  const runMutation = useMutation({
    mutationFn: runValidation,
    onSuccess: (data) => {
      setResult(data);
      toast.success(`Resultado: ${OVERALL_LABELS[data.overall]}`);
    },
    onError: () => toast.error("No se pudo ejecutar el bloque"),
  });

  const handleRun = () => {
    if (!selectedBlockId) return;
    runMutation.mutate({
      flight_plan_id: flightPlanId,
      block_id: selectedBlockId,
    });
  };

  return (
    <Card className="sticky top-8">
      <CardHeader>
        <CardTitle className="text-base">Validación</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Bloque a ejecutar</label>
          <Select
            value={selectedBlockId}
            onValueChange={(value) => value && setSelectedBlockId(value)}
            disabled={isLoading || activeBlocks.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar bloque" />
            </SelectTrigger>
            <SelectContent>
              {activeBlocks.map((block) => (
                <SelectItem key={block.id} value={block.id}>
                  {block.name} ({block.criteria_count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          className="w-full"
          onClick={handleRun}
          disabled={!selectedBlockId || runMutation.isPending}
        >
          <Play className="mr-2 h-4 w-4" />
          Ejecutar bloque
        </Button>

        {result && (
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Resultado general</span>
              <Badge variant={OVERALL_VARIANTS[result.overall]}>
                {OVERALL_LABELS[result.overall]}
              </Badge>
            </div>

            <div className="space-y-2">
              {result.results.map((item) => (
                <div
                  key={item.criterion_id}
                  className="rounded-md border p-2 text-xs space-y-1"
                >
                  <div className="flex items-center gap-2">
                    {item.passed ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : item.result_applied === "reject" ? (
                      <XCircle className="h-4 w-4 text-red-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    )}
                    <span className="font-medium">{item.criterion_name}</span>
                  </div>
                  <p className="text-muted-foreground">
                    {item.field_path} {OPERATOR_LABELS[item.operator]}{" "}
                    {item.expected_value}
                    {" → "}valor actual: {item.actual_value ?? "—"}
                  </p>
                  {item.message && (
                    <p className="text-muted-foreground">{item.message}</p>
                  )}
                  <p className="text-muted-foreground">
                    Aplicado: {RESULT_LABELS[item.result_applied]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
