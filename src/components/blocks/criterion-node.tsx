"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OPERATOR_LABELS } from "@/lib/utils/validation-labels";
import type { ValidationCriterion } from "@/types/api";

export interface CriterionNodeData extends Record<string, unknown> {
  criterion: ValidationCriterion;
  onRemove: (id: string) => void;
}

function CriterionNodeComponent({ data }: { data: CriterionNodeData }) {
  const { criterion, onRemove } = data;

  return (
    <div className="w-64 rounded-lg border bg-white p-3 shadow-sm">
      <Handle type="target" position={Position.Top} className="!bg-blue-500" />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{criterion.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {criterion.field_path}
          </p>
          <p className="text-xs text-muted-foreground">
            {OPERATOR_LABELS[criterion.operator]}{" "}
            {criterion.expected_value ? criterion.expected_value : ""}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={() => onRemove(criterion.id)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-blue-500"
      />
    </div>
  );
}

export const CriterionNode = memo(CriterionNodeComponent);
