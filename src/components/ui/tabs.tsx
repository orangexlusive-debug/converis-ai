"use client";

import * as React from "react";
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";

import { cn } from "@/lib/utils";

function Tabs({ className, ...props }: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  ...props
}: TabsPrimitive.List.Props) {
  const listRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const onWheel = (event: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth) return;
      event.preventDefault();
      el.scrollLeft += event.deltaY;
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <TabsPrimitive.List
      ref={listRef}
      data-slot="tabs-list"
      className={cn(
        "flex w-full gap-2 overflow-x-auto rounded-full border border-cyan-500/15 bg-black/45 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_10px_30px_-18px_rgba(56,189,248,0.45)] backdrop-blur-md",
        "[-ms-overflow-style:none] [scrollbar-width:none] [scroll-padding-inline:0.75rem] [&::-webkit-scrollbar]:hidden",
        className
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium text-muted-foreground outline-none transition-all duration-200",
        "border border-transparent bg-white/[0.03] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
        "hover:border-white/10 hover:bg-white/[0.06] hover:text-foreground",
        "data-[active]:border-cyan-400/30 data-[active]:bg-gradient-to-r data-[active]:from-sky-500/25 data-[active]:via-blue-600/20 data-[active]:to-indigo-600/25",
        "data-[active]:text-foreground data-[active]:shadow-[0_0_22px_-8px_rgba(56,189,248,0.65),inset_0_1px_0_rgba(255,255,255,0.12)]",
        "data-[focus-visible]:ring-2 data-[focus-visible]:ring-cyan-500/35",
        className
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("min-h-0 outline-none", className)}
      keepMounted={false}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
