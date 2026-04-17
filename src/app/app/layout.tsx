import { AppAuthProvider } from "@/providers/app-auth-provider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppAuthProvider>{children}</AppAuthProvider>;
}
