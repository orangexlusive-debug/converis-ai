"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCallback, useEffect, useState } from "react";

type Templates = {
  demoConfirm: string;
  followUp: string;
  proposal: string;
  contract: string;
};

type Integrations = {
  salesforce: { enabled: boolean };
  hubspot: { enabled: boolean };
};

type NotifPrefs = { inApp: boolean; emailDigest: boolean };
type EmailNotifs = { newDemos: boolean; renewals: boolean; healthDrops: boolean };

export function CrmSettingsPage() {
  const [companyName, setCompanyName] = useState("");
  const [companyLogoUrl, setCompanyLogoUrl] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [billingInfo, setBillingInfo] = useState("");
  const [templates, setTemplates] = useState<Templates>({
    demoConfirm: "",
    followUp: "",
    proposal: "",
    contract: "",
  });
  const [integrations, setIntegrations] = useState<Integrations>({
    salesforce: { enabled: false },
    hubspot: { enabled: false },
  });
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>({ inApp: true, emailDigest: true });
  const [emailNotifs, setEmailNotifs] = useState<EmailNotifs>({
    newDemos: true,
    renewals: true,
    healthDrops: true,
  });
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/crm/settings", { credentials: "include" });
    if (!res.ok) return;
    const data = (await res.json()) as {
      settings: {
        companyName: string;
        companyLogoUrl: string;
        companyAddress: string;
        billingInfo: string;
        emailTemplatesJson: string;
        integrationsJson: string;
        notificationPrefsJson: string;
        emailNotificationsJson: string;
      };
    };
    const s = data.settings;
    setCompanyName(s.companyName);
    setCompanyLogoUrl(s.companyLogoUrl);
    setCompanyAddress(s.companyAddress);
    setBillingInfo(s.billingInfo);
    try {
      const t = JSON.parse(s.emailTemplatesJson || "{}") as Partial<Templates>;
      setTemplates({
        demoConfirm: t.demoConfirm ?? "",
        followUp: t.followUp ?? "",
        proposal: t.proposal ?? "",
        contract: t.contract ?? "",
      });
    } catch {
      /* ignore */
    }
    try {
      const i = JSON.parse(s.integrationsJson || "{}") as Partial<Integrations>;
      setIntegrations({
        salesforce: { enabled: Boolean(i.salesforce?.enabled) },
        hubspot: { enabled: Boolean(i.hubspot?.enabled) },
      });
    } catch {
      /* ignore */
    }
    try {
      const n = JSON.parse(s.notificationPrefsJson || "{}") as Partial<NotifPrefs>;
      setNotifPrefs({
        inApp: n.inApp !== false,
        emailDigest: n.emailDigest !== false,
      });
    } catch {
      /* ignore */
    }
    try {
      const e = JSON.parse(s.emailNotificationsJson || "{}") as Partial<EmailNotifs>;
      setEmailNotifs({
        newDemos: e.newDemos !== false,
        renewals: e.renewals !== false,
        healthDrops: e.healthDrops !== false,
      });
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    const res = await fetch("/api/crm/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        companyName,
        companyLogoUrl,
        companyAddress,
        billingInfo,
        emailTemplatesJson: JSON.stringify(templates),
        integrationsJson: JSON.stringify(integrations),
        notificationPrefsJson: JSON.stringify(notifPrefs),
        emailNotificationsJson: JSON.stringify(emailNotifs),
      }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">CRM settings</h1>
          <p className="text-sm text-muted-foreground">Company profile, templates, integrations, and alerts.</p>
        </div>
        <Button
          className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white"
          onClick={() => void save()}
        >
          {saved ? "Saved" : "Save changes"}
        </Button>
      </div>

      <div className="space-y-8">
        <section className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
          <h2 className="mb-4 text-sm font-semibold tracking-wide text-[#93C5FD] uppercase">Company</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Legal name</Label>
              <Input
                className="mt-1 border-white/10 bg-black/50"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            <div>
              <Label>Logo URL</Label>
              <Input
                className="mt-1 border-white/10 bg-black/50"
                value={companyLogoUrl}
                onChange={(e) => setCompanyLogoUrl(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Address</Label>
              <textarea
                className="mt-1 min-h-[72px] w-full rounded-lg border border-white/10 bg-black/50 p-2 text-sm"
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Billing info</Label>
              <textarea
                className="mt-1 min-h-[72px] w-full rounded-lg border border-white/10 bg-black/50 p-2 text-sm"
                value={billingInfo}
                onChange={(e) => setBillingInfo(e.target.value)}
              />
            </div>
          </div>
        </section>

        <section id="email" className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
          <h2 className="mb-4 text-sm font-semibold tracking-wide text-[#93C5FD] uppercase">Email templates</h2>
          <div className="grid gap-4">
            {(
              [
                ["demoConfirm", "Demo confirmation"],
                ["followUp", "Follow-up"],
                ["proposal", "Proposal"],
                ["contract", "Contract"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <Label>{label}</Label>
                <textarea
                  className="mt-1 min-h-[80px] w-full rounded-lg border border-white/10 bg-black/50 p-2 text-sm"
                  value={templates[key]}
                  onChange={(e) => setTemplates({ ...templates, [key]: e.target.value })}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
          <h2 className="mb-4 text-sm font-semibold tracking-wide text-[#93C5FD] uppercase">Integrations</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Placeholder toggles for future CRM sync. No data leaves Converis until you enable a connector.
          </p>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={integrations.salesforce.enabled}
                onChange={(e) =>
                  setIntegrations({
                    ...integrations,
                    salesforce: { enabled: e.target.checked },
                  })
                }
                className="accent-[#7C3AED]"
              />
              Salesforce (planned)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={integrations.hubspot.enabled}
                onChange={(e) =>
                  setIntegrations({
                    ...integrations,
                    hubspot: { enabled: e.target.checked },
                  })
                }
                className="accent-[#7C3AED]"
              />
              HubSpot (planned)
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
          <h2 className="mb-4 text-sm font-semibold tracking-wide text-[#93C5FD] uppercase">Notifications</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={notifPrefs.inApp}
                onChange={(e) => setNotifPrefs({ ...notifPrefs, inApp: e.target.checked })}
                className="accent-[#7C3AED]"
              />
              In-app notifications
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={notifPrefs.emailDigest}
                onChange={(e) => setNotifPrefs({ ...notifPrefs, emailDigest: e.target.checked })}
                className="accent-[#7C3AED]"
              />
              Email digest
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={emailNotifs.newDemos}
                onChange={(e) => setEmailNotifs({ ...emailNotifs, newDemos: e.target.checked })}
                className="accent-[#7C3AED]"
              />
              Email: new demo requests
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={emailNotifs.renewals}
                onChange={(e) => setEmailNotifs({ ...emailNotifs, renewals: e.target.checked })}
                className="accent-[#7C3AED]"
              />
              Email: contract renewals
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={emailNotifs.healthDrops}
                onChange={(e) => setEmailNotifs({ ...emailNotifs, healthDrops: e.target.checked })}
                className="accent-[#7C3AED]"
              />
              Email: client health drops
            </label>
          </div>
        </section>
      </div>
    </div>
  );
}
