"use client";

import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { CriteriaTab } from "@/components/blocks/criteria-tab";
import { BlocksTab } from "@/components/blocks/blocks-tab";

export default function BlocksPage() {
  const [activeTab, setActiveTab] = useState<"criteria" | "blocks">("criteria");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Bloques de validación
        </h1>
        <p className="text-muted-foreground mt-1">
          Creá criterios y armá bloques para evaluar planes de vuelo.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "criteria" | "blocks")}
        className="flex flex-col"
      >
        <TabsList className="w-fit">
          <TabsTrigger value="criteria">Mis criterios</TabsTrigger>
          <TabsTrigger value="blocks">Mis bloques</TabsTrigger>
        </TabsList>
        <TabsContent value="criteria" className="mt-6">
          <CriteriaTab />
        </TabsContent>
        <TabsContent value="blocks" className="mt-6">
          <BlocksTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
