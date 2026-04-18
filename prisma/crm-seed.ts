import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

export async function seedCrm(prisma: PrismaClient) {
  const admin = await prisma.user.findUnique({ where: { email: "admin@converis.ai" } });
  if (!admin) throw new Error("Admin user must exist before CRM seed");

  const pwd = await bcrypt.hash("Team2024!", 12);
  const sarah = await prisma.user.upsert({
    where: { email: "sarah.m@converis.ai" },
    create: {
      email: "sarah.m@converis.ai",
      password: pwd,
      name: "Sarah Mitchell",
      role: "USER",
      active: true,
    },
    update: { name: "Sarah Mitchell", active: true },
  });
  const alex = await prisma.user.upsert({
    where: { email: "alex.k@converis.ai" },
    create: {
      email: "alex.k@converis.ai",
      password: pwd,
      name: "Alex Kim",
      role: "USER",
      active: true,
    },
    update: { name: "Alex Kim", active: true },
  });

  await prisma.crmSettings.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      companyName: "Converis AI",
      companyAddress: "100 Integration Way, San Francisco, CA",
      billingInfo: "billing@converis.ai · ACH preferred",
      emailTemplatesJson: JSON.stringify({
        demoConfirm: "Hi {{name}}, thanks for your interest in Converis AI…",
        followUp: "Following up on your demo request…",
        proposal: "Attached is our proposal for {{company}}…",
        contract: "Please review and sign the agreement…",
      }),
      integrationsJson: JSON.stringify({ salesforce: { enabled: false }, hubspot: { enabled: false } }),
      notificationPrefsJson: JSON.stringify({ inApp: true, emailDigest: true }),
      emailNotificationsJson: JSON.stringify({ newDemos: true, renewals: true, healthDrops: true }),
    },
    update: {},
  });

  const demoCount = await prisma.demoRequest.count();
  if (demoCount === 0) {
    const demos = [
      { name: "Jordan Lee", company: "Northwind Capital", role: "VP Corp Dev", email: "j.lee@northwind.io", industry: "Banking", message: "Need PMI intelligence for mid-market roll-ups.", status: "NEW" as const },
      { name: "Priya Shah", company: "Helix Bio", role: "Chief Strategy Officer", email: "pshah@helixbio.com", industry: "Healthcare", message: "Evaluating post-close integration risk scoring.", status: "CONTACTED" as const },
      { name: "Marcus Cole", company: "Vertex Systems", role: "Director M&A", email: "mcole@vertexsys.ai", industry: "Technology", message: "Local LLM requirement — must stay on-prem.", status: "SCHEDULED" as const },
      { name: "Elena Rossi", company: "Lumen Retail", role: "Head of Integration", email: "erossi@lumenretail.co", industry: "Retail", message: "Synergy tracking across 40 stores.", status: "COMPLETED" as const },
      { name: "David Park", company: "Atlas Energy", role: "GM Strategy", email: "dpark@atlasenergy.com", industry: "Energy", message: "Regulatory overlays for asset carve-outs.", status: "NEW" as const },
      { name: "Amira Hassan", company: "Crescent Finance", role: "COO", email: "ahassan@crescent.finance", industry: "Banking", message: "Board-ready reporting for PMI.", status: "SCHEDULED" as const },
      { name: "Tom Brennan", company: "Ironforge Manufacturing", role: "VP Ops", email: "tbrennan@ironforge.mfg", industry: "Manufacturing", message: "Workforce retention risk dashboards.", status: "LOST" as const },
      { name: "Nina Volkov", company: "Polaris Media", role: "CFO", email: "nvolkov@polaris.media", industry: "Media", message: "Content/IP separation in divestitures.", status: "CONTACTED" as const },
    ];
    for (const d of demos) {
      await prisma.demoRequest.create({
        data: {
          ...d,
          assignedToId: d.status === "NEW" ? null : sarah.id,
          notes: d.status === "LOST" ? "Chose competitor." : "",
        },
      });
    }
  }

  if ((await prisma.client.count()) === 0) {
    const pmiSample = JSON.stringify([
      { name: "Project Aurora", industry: "Technology", analyzedAt: "2025-11-02", model: "qwen2.5:32b" },
      { name: "Meridian / Helix carve-out", industry: "Healthcare", analyzedAt: "2025-10-18", model: "qwen2.5:32b" },
    ]);

    const c1 = await prisma.client.create({
      data: {
        companyName: "Helix Bio",
        industry: "Healthcare",
        contractValue: 420000,
        startDate: new Date("2024-06-01"),
        status: "ACTIVE",
        assignedToId: sarah.id,
        healthScore: 92,
        address: "1200 Genome Blvd, Boston, MA",
        billingEmail: "ap@helixbio.com",
        pmiDealsJson: pmiSample,
      },
    });
    await prisma.contact.createMany({
      data: [
        { clientId: c1.id, name: "Priya Shah", role: "CSO", email: "pshah@helixbio.com", phone: "+1 617-555-0101" },
        { clientId: c1.id, name: "James O'Neil", role: "General Counsel", email: "joneil@helixbio.com", phone: "+1 617-555-0102" },
      ],
    });
    const end1 = new Date();
    end1.setMonth(end1.getMonth() + 8);
    await prisma.contract.create({
      data: {
        clientId: c1.id,
        type: "ANNUAL",
        value: 420000,
        startDate: new Date("2024-06-01"),
        endDate: end1,
        status: "ACTIVE",
        autoRenew: true,
      },
    });
    await prisma.invoice.createMany({
      data: [
        { clientId: c1.id, amount: 35000, issuedAt: new Date("2025-12-01"), status: "PAID", memo: "Monthly platform" },
        { clientId: c1.id, amount: 35000, issuedAt: new Date("2026-01-01"), status: "PAID", memo: "Monthly platform" },
      ],
    });

    const c2 = await prisma.client.create({
      data: {
        companyName: "Northwind Capital",
        industry: "Banking",
        contractValue: 180000,
        startDate: new Date("2025-01-15"),
        status: "ACTIVE",
        assignedToId: alex.id,
        healthScore: 78,
        address: "55 Wall St, New York, NY",
        billingEmail: "ops@northwind.io",
        pmiDealsJson: JSON.stringify([{ name: "Retail rollup diligence", industry: "Banking", analyzedAt: "2025-12-10", model: "qwen2.5:32b" }]),
      },
    });
    await prisma.contact.createMany({
      data: [
        { clientId: c2.id, name: "Jordan Lee", role: "VP Corp Dev", email: "j.lee@northwind.io", phone: "+1 212-555-0140" },
      ],
    });
    const end2 = new Date();
    end2.setDate(end2.getDate() + 45);
    await prisma.contract.create({
      data: {
        clientId: c2.id,
        type: "MONTHLY",
        value: 15000,
        startDate: new Date("2025-01-15"),
        endDate: end2,
        status: "ACTIVE",
        autoRenew: false,
      },
    });

    const c3 = await prisma.client.create({
      data: {
        companyName: "Vertex Systems",
        industry: "Technology",
        contractValue: 960000,
        startDate: new Date("2023-03-01"),
        status: "ACTIVE",
        assignedToId: admin.id,
        healthScore: 88,
        address: "1 Infinite Loop, Cupertino, CA",
        billingEmail: "procurement@vertexsys.ai",
        pmiDealsJson: JSON.stringify([
          { name: "CloudCo acquisition", industry: "Technology", analyzedAt: "2025-09-22", model: "qwen2.5:32b" },
          { name: "EU subsidiary PMI", industry: "Technology", analyzedAt: "2025-08-01", model: "qwen2.5:32b" },
        ]),
      },
    });
    await prisma.contact.createMany({
      data: [
        { clientId: c3.id, name: "Marcus Cole", role: "Director M&A", email: "mcole@vertexsys.ai", phone: "+1 408-555-0199" },
        { clientId: c3.id, name: "Rina Patel", role: "CIO", email: "rpatel@vertexsys.ai", phone: "+1 408-555-0200" },
      ],
    });
    const end3 = new Date();
    end3.setFullYear(end3.getFullYear() + 1);
    await prisma.contract.create({
      data: {
        clientId: c3.id,
        type: "ENTERPRISE",
        value: 960000,
        startDate: new Date("2025-01-01"),
        endDate: end3,
        status: "ACTIVE",
        autoRenew: true,
      },
    });

    await prisma.client.create({
      data: {
        companyName: "Lumen Retail",
        industry: "Retail",
        contractValue: 0,
        startDate: new Date("2022-04-01"),
        status: "CHURNED",
        assignedToId: sarah.id,
        healthScore: 32,
        address: "900 Commerce Dr, Chicago, IL",
        billingEmail: "finance@lumenretail.co",
        pmiDealsJson: "[]",
      },
    });
  }

  if ((await prisma.deal.count()) === 0) {
    const stages = [
      "LEAD",
      "DEMO_REQUESTED",
      "DEMO_SCHEDULED",
      "DEMO_DONE",
      "PROPOSAL_SENT",
      "NEGOTIATING",
      "CLOSED_WON",
      "CLOSED_LOST",
    ] as const;
    const companies = ["Axiom Labs", "BlueRiver Health", "Copperfield Energy", "Driftwave AI", "Evergreen Foods", "Falcon Defense", "Granite Legal", "Harbor Logistics"];
    let i = 0;
    for (const stage of stages) {
      await prisma.deal.create({
        data: {
          companyName: companies[i % companies.length]!,
          stage,
          estimatedValue: 50000 + i * 25000,
          probability: Math.min(95, 15 + i * 10),
          assignedToId: i % 2 === 0 ? sarah.id : alex.id,
          nextAction: i < 5 ? "Send follow-up deck" : "Await signature",
          stageEnteredAt: new Date(Date.now() - i * 86400000),
        },
      });
      i++;
    }
    for (let j = 0; j < 4; j++) {
      await prisma.deal.create({
        data: {
          companyName: `Prospect ${j + 1}`,
          stage: "LEAD",
          estimatedValue: 120000 + j * 30000,
          probability: 20,
          assignedToId: admin.id,
          nextAction: "Qualify budget",
          stageEnteredAt: new Date(),
        },
      });
    }
  }

  if ((await prisma.activity.count()) === 0) {
    const firstDemo = await prisma.demoRequest.findFirst({ orderBy: { createdAt: "asc" } });
    const firstClient = await prisma.client.findFirst({ orderBy: { createdAt: "asc" } });
    if (firstDemo) {
      await prisma.activity.create({
        data: {
          type: "demo",
          title: "New demo request",
          description: "Inbound demo request logged.",
          demoRequestId: firstDemo.id,
          actorId: admin.id,
        },
      });
    }
    if (firstClient) {
      await prisma.activity.create({
        data: {
          type: "client",
          title: "Client onboarded",
          description: "Enterprise client marked active.",
          clientId: firstClient.id,
          actorId: sarah.id,
        },
      });
      await prisma.activity.create({
        data: {
          type: "contract",
          title: "Contract signed",
          description: "Annual agreement executed.",
          clientId: firstClient.id,
          actorId: admin.id,
        },
      });
    }
  }
}
