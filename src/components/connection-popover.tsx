"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDeals } from "@/providers/deals-provider";
import { Settings2Icon } from "lucide-react";
import { useEffect, useState } from "react";

export function ConnectionSettings() {
  const { settings, setSettings } = useDeals();
  const [open, setOpen] = useState(false);
  const [host, setHost] = useState(settings.ollamaHost);
  const [model, setModel] = useState(settings.ollamaModel);

  useEffect(() => {
    if (!open) return;
    setHost(settings.ollamaHost);
    setModel(settings.ollamaModel);
  }, [open, settings.ollamaHost, settings.ollamaModel]);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="gap-2"
        onClick={() => setOpen(true)}
      >
        <Settings2Icon className="size-4 opacity-80" />
        Connection
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
          <DialogTitle>Ollama connection</DialogTitle>
          <DialogDescription>
            Point Converis AI at your local or rack Ollama instance. Values are stored in this
            browser only. The model name must match exactly what{" "}
            <code className="rounded bg-white/10 px-1 py-0.5 text-[11px]">ollama list</code> shows
            (pull first: <code className="rounded bg-white/10 px-1 py-0.5 text-[11px]">ollama pull …</code>
            ). For a smarter model, try{" "}
            <code className="rounded bg-white/10 px-1 py-0.5 text-[11px]">llama3.1:70b</code>,{" "}
            <code className="rounded bg-white/10 px-1 py-0.5 text-[11px]">qwen2.5:32b</code>, or{" "}
            <code className="rounded bg-white/10 px-1 py-0.5 text-[11px]">mistral-large</code> if
            your hardware supports them.
          </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
          <div className="grid gap-2">
            <Label htmlFor="ollama-host">Base URL</Label>
            <Input
              id="ollama-host"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="http://localhost:11434"
              autoComplete="off"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ollama-model">Model</Label>
            <Input
              id="ollama-model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="llama3.1:8b"
              autoComplete="off"
            />
          </div>
          </div>
          <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setHost(settings.ollamaHost);
              setModel(settings.ollamaModel);
            }}
          >
            Reset
          </Button>
          <Button
            onClick={() => {
              setSettings({ ollamaHost: host.trim(), ollamaModel: model.trim() });
              setOpen(false);
            }}
          >
            Save
          </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
