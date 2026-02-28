import type { LoanTermMonths, MotorcycleCatalogItem } from "../data/motorcycles";

const STORAGE_KEY = "mf_demo_loan_applications";

export type LoanApplicationStatus = "pending" | "approved" | "rejected";

export type DemoLoanApplication = {
  id: string;
  applicantName: string;
  email: string;
  phone: string;
  motorcycle: string;
  loanAmount: number;
  downpayment: number;
  term: LoanTermMonths;
  appliedDate: string;
  createdAt: string;
  status: LoanApplicationStatus;
  creditScore: number;
};

const seedApplications: DemoLoanApplication[] = [
  {
    id: "LA-2026-001",
    applicantName: "Juan Dela Cruz",
    email: "juan@example.com",
    phone: "+63 912 345 6789",
    motorcycle: "Yamaha Mio 125",
    loanAmount: 65000,
    downpayment: 15000,
    term: 24,
    appliedDate: "Feb 24, 2026",
    createdAt: "2026-02-24T09:00:00.000Z",
    status: "pending",
    creditScore: 720,
  },
  {
    id: "LA-2026-002",
    applicantName: "Maria Santos",
    email: "maria@example.com",
    phone: "+63 923 456 7890",
    motorcycle: "Honda Click 150",
    loanAmount: 75000,
    downpayment: 20000,
    term: 24,
    appliedDate: "Feb 24, 2026",
    createdAt: "2026-02-24T10:15:00.000Z",
    status: "pending",
    creditScore: 680,
  },
  {
    id: "LA-2026-003",
    applicantName: "Pedro Reyes",
    email: "pedro@example.com",
    phone: "+63 934 567 8901",
    motorcycle: "Suzuki Raider 150",
    loanAmount: 80000,
    downpayment: 18000,
    term: 36,
    appliedDate: "Feb 23, 2026",
    createdAt: "2026-02-23T08:30:00.000Z",
    status: "pending",
    creditScore: 750,
  },
  {
    id: "LA-2026-004",
    applicantName: "Anna Garcia",
    email: "anna@example.com",
    phone: "+63 945 678 9012",
    motorcycle: "Kawasaki Ninja 400",
    loanAmount: 150000,
    downpayment: 40000,
    term: 36,
    appliedDate: "Feb 22, 2026",
    createdAt: "2026-02-22T12:00:00.000Z",
    status: "approved",
    creditScore: 800,
  },
  {
    id: "LA-2026-005",
    applicantName: "Carlos Mendoza",
    email: "carlos@example.com",
    phone: "+63 956 789 0123",
    motorcycle: "Honda Beat",
    loanAmount: 55000,
    downpayment: 12000,
    term: 24,
    appliedDate: "Feb 21, 2026",
    createdAt: "2026-02-21T13:45:00.000Z",
    status: "rejected",
    creditScore: 580,
  },
];

function readApplications(): DemoLoanApplication[] {
  if (typeof window === "undefined") return seedApplications;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedApplications));
    return seedApplications;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return seedApplications;
    return parsed as DemoLoanApplication[];
  } catch {
    return seedApplications;
  }
}

function writeApplications(applications: DemoLoanApplication[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
}

export function getDemoLoanApplications(): DemoLoanApplication[] {
  return readApplications().sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0,
  );
}

export function createDemoLoanApplication(params: {
  applicantName: string;
  email: string;
  phone: string;
  motorcycle: MotorcycleCatalogItem;
  downpayment: number;
  term: LoanTermMonths;
}) {
  const now = new Date();
  const applications = getDemoLoanApplications();
  const year = now.getFullYear();
  const suffix = String(applications.length + 1).padStart(3, "0");

  const next: DemoLoanApplication = {
    id: `LA-${year}-${suffix}`,
    applicantName: params.applicantName,
    email: params.email,
    phone: params.phone,
    motorcycle: `${params.motorcycle.brand} ${params.motorcycle.model}`,
    loanAmount: Math.max(params.motorcycle.price - params.downpayment, 0),
    downpayment: params.downpayment,
    term: params.term,
    appliedDate: now.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }),
    createdAt: now.toISOString(),
    status: "pending",
    creditScore: 690,
  };

  const updated = [next, ...applications];
  writeApplications(updated);
  return next;
}

export function updateDemoLoanApplicationStatus(
  id: string,
  status: LoanApplicationStatus,
) {
  const applications = getDemoLoanApplications();
  const updated = applications.map((application) =>
    application.id === id ? { ...application, status } : application,
  );
  writeApplications(updated);
  return updated;
}
