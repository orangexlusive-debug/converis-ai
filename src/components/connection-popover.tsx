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
import { useAppAuth } from "@/providers/app-auth-provider";
import { useDeals } from "@/providers/deals-provider";
import { Settings2Icon } from "lucide-react";
import { useEffect, useState } from "react";

export function ConnectionSettings() {
  const { user } = useAppAuth();
  const isAdmin = user?.role === "ADMIN";
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
            <DialogTitle>Inference connection</DialogTitle>
            <DialogDescription>
              Point Converis AI at your private inference endpoint (for example on your network or
              tunnel). Values are stored in this browser only.
              {isAdmin ?
                " Admins can also set the model identifier used for analyze and chat."
              : " The inference model is configured by an administrator."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-2">
              <Label htmlFor="inference-host">Base URL</Label>
              <Input
                id="inference-host"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="http://localhost:11434"
                autoComplete="off"
              />
            </div>
            {isAdmin ?
              <div className="grid gap-2">
                <Label htmlFor="inference-model">Model</Label>
                <Input
                  id="inference-model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="qwen2.5:32b"
                  autoComplete="off"
                />
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Must match exactly what your server has installed (for example{" "}
                  <code className="rounded bg-white/10 px-1 py-0.5 text-[11px]">llama3.1:70b</code>).
                </p>
              </div>
            : null}
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
                if (isAdmin) {
                  setSettings({ ollamaHost: host.trim(), ollamaModel: model.trim() });
                } else {
                  setSettings({ ollamaHost: host.trim() });
                }
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
