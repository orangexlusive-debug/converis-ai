import { CrmShell } from "@/components/crm/crm-shell";
import { CrmAdminGate } from "@/providers/crm-admin-gate";

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <CrmAdminGate>
      <CrmShell>{children}</CrmShell>
    </CrmAdminGate>
  );
}
