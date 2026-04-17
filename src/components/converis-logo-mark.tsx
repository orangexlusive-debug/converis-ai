import { cn } from "@/lib/utils";
import Image from "next/image";

type ConverisLogoMarkProps = {
  className?: string;
  /** Pixel size (square). */
  size?: number;
  priority?: boolean;
};

export function ConverisLogoMark({
  className,
  size = 40,
  priority = false,
}: ConverisLogoMarkProps) {
  return (
    <Image
      src="/converis-logo.png"
      alt="Converis"
      width={size}
      height={size}
      priority={priority}
      className={cn("object-contain drop-shadow-[0_0_20px_rgba(56,189,248,0.35)]", className)}
    />
  );
}
