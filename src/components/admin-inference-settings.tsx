"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDeals } from "@/providers/deals-provider";
import { useEffect, useState } from "react";

export function AdminInferenceSettings() {
  const { settings, setSettings } = useDeals();
  const [model, setModel] = useState(settings.ollamaModel);

  useEffect(() => {
    setModel(settings.ollamaModel);
  }, [settings.ollamaModel]);

  return (
    <Card className="mt-14 border-violet-500/15 bg-black/40">
      <CardHeader>
        <CardTitle className="text-base">Inference model</CardTitle>
        <CardDescription>
          Applies to analyze and chat in this browser. Non-admin users do not see the model name in
          the app UI.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:max-w-lg">
        <div className="grid gap-2">
          <Label htmlFor="admin-inference-model">Model identifier</Label>
          <Input
            id="admin-inference-model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="qwen2.5:32b"
            autoComplete="off"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setModel(settings.ollamaModel)}
          >
            Reset
          </Button>
          <Button
            type="button"
            onClick={() => setSettings({ ollamaModel: model.trim() })}
          >
            Save model
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
