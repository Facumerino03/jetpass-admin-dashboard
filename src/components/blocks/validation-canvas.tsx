"use client";

import { useCallback, useEffect } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type Edge,
  type Node,
  type NodeTypes,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { CriterionNode, type CriterionNodeData } from "./criterion-node";
import type { ValidationCriterion } from "@/types/api";

const nodeTypes = {
  criterion: CriterionNode,
} satisfies NodeTypes;

interface ValidationCanvasProps {
  criteria: ValidationCriterion[];
  selectedCriterionIds: string[];
  onSelectedChange: (ids: string[]) => void;
}

function buildNodes(
  criteria: ValidationCriterion[],
  selectedIds: string[],
  onRemove: (id: string) => void
): Node<CriterionNodeData>[] {
  return selectedIds
    .map((id) => criteria.find((c) => c.id === id))
    .filter((c): c is ValidationCriterion => Boolean(c))
    .map((criterion, index) => ({
      id: criterion.id,
      type: "criterion",
      position: { x: 0, y: index * 120 },
      data: { criterion, onRemove },
      draggable: true,
    }));
}

function buildEdges(selectedIds: string[]): Edge[] {
  const edges: Edge[] = [];
  for (let i = 0; i < selectedIds.length - 1; i++) {
    edges.push({
      id: `e-${selectedIds[i]}-${selectedIds[i + 1]}`,
      source: selectedIds[i],
      target: selectedIds[i + 1],
      markerEnd: { type: MarkerType.ArrowClosed },
      animated: true,
    });
  }
  return edges;
}

export function ValidationCanvas({
  criteria,
  selectedCriterionIds,
  onSelectedChange,
}: ValidationCanvasProps) {
  const handleRemove = useCallback(
    (id: string) => {
      onSelectedChange(selectedCriterionIds.filter((cid) => cid !== id));
    },
    [selectedCriterionIds, onSelectedChange]
  );

  const [nodes, setNodes, onNodesChange] =
    useNodesState<Node<CriterionNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    setNodes(buildNodes(criteria, selectedCriterionIds, handleRemove));
    setEdges(buildEdges(selectedCriterionIds));
  }, [criteria, selectedCriterionIds, handleRemove, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Parameters<typeof addEdge>[0]) =>
      setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className="h-[500px] w-full rounded-md border">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable
        nodesConnectable={false}
        edgesFocusable={false}
      >
        <Controls />
        <Background gap={16} size={1} />
      </ReactFlow>
    </div>
  );
}
