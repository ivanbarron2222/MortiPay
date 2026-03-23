import type { DemoLoanProfile, DemoUserAccount } from "./demo-users";

export type ReportScheduleEntry = {
  installmentNumber: number;
  dueDate: Date;
  paid: boolean;
  amount: number;
};

export type ReportWatchlistEntry = {
  user: DemoUserAccount;
  overdueInstallmentCount: number;
  overdueBalance: number;
  outstandingBalance: number;
  nextDue: ReportScheduleEntry | null;
};

export type ReportBucketEntry = {
  label: string;
  value: number;
};

export type TrendEntry = {
  key: string;
  label: string;
  value: number;
};

export type AdminReportAnalytics = {
  totalReceivable: number;
  totalCollectedThisMonth: number;
  overdueAmount: number;
  dueThisWeekAmount: number;
  totalOutstanding: number;
  activeLoans: number;
  fullyPaidLoans: number;
  overdueLoans: number;
  newLoansThisMonth: number;
  watchlist: ReportWatchlistEntry[];
  averagePrincipal: number;
  termMix: { term: number; count: number }[];
  collectionTrend: TrendEntry[];
  duePipeline: TrendEntry[];
  collectionCoverageRate: number;
  delinquencyRate: number;
  averageDaysLate: number;
  installmentsDueToDate: number;
  installmentsPaidToDate: number;
  overdueInstallmentCount: number;
  upcomingInstallmentCount: number;
  thirtyDayForecast: number;
  sixtyDayForecast: number;
  agingBuckets: ReportBucketEntry[];
  riskSegments: ReportBucketEntry[];
};

export function formatDueDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function formatMonthLabel(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
  });
}

export function buildInstallmentSchedule(
  loanProfile: DemoLoanProfile,
): ReportScheduleEntry[] {
  const start = new Date(loanProfile.startDate);
  const paidInstallmentNumbers = loanProfile.paidInstallmentNumbers ?? [];

  return Array.from({ length: loanProfile.termMonths }).map((_, index) => {
    const installmentNumber = index + 1;
    const dueDate = new Date(start);
    dueDate.setMonth(start.getMonth() + index);
    return {
      installmentNumber,
      dueDate,
      paid: paidInstallmentNumbers.includes(installmentNumber),
      amount: loanProfile.monthlyInstallment,
    };
  });
}

export function getAdminReportAnalytics(
  users: DemoUserAccount[],
): AdminReportAnalytics {
  const withLoans = users.filter((user) => user.loanProfile);
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfToday);
  endOfWeek.setDate(endOfWeek.getDate() + 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const collectionTrendMonths = Array.from({ length: 6 }).map((_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: formatMonthLabel(date),
      value: 0,
    };
  });
  const duePipelineMonths = Array.from({ length: 4 }).map((_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() + index, 1);
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: formatMonthLabel(date),
      value: 0,
    };
  });

  let totalCollectedThisMonth = 0;
  let overdueAmount = 0;
  let dueThisWeekAmount = 0;
  let totalOutstanding = 0;
  let activeLoans = 0;
  let fullyPaidLoans = 0;
  let overdueLoans = 0;
  let newLoansThisMonth = 0;
  let installmentsDueToDate = 0;
  let installmentsPaidToDate = 0;
  let overdueInstallmentCount = 0;
  let totalDaysLate = 0;
  let upcomingInstallmentCount = 0;
  let thirtyDayForecast = 0;
  let sixtyDayForecast = 0;
  let currentBucketAmount = 0;
  let bucket1To30Amount = 0;
  let bucket31To60Amount = 0;
  let bucket61PlusAmount = 0;
  let lowRiskCount = 0;
  let mediumRiskCount = 0;
  let highRiskCount = 0;

  const watchlist = withLoans
    .map((user) => {
      if (!user.loanProfile) return null;

      const schedule = buildInstallmentSchedule(user.loanProfile);
      const paidInstallments = schedule.filter((item) => item.paid);
      const unpaidInstallments = schedule.filter((item) => !item.paid);
      const overdueInstallments = unpaidInstallments.filter(
        (item) => item.dueDate < startOfToday,
      );
      const dueThisWeekInstallments = unpaidInstallments.filter(
        (item) => item.dueDate >= startOfToday && item.dueDate <= endOfWeek,
      );
      const dueToDateInstallments = schedule.filter((item) => item.dueDate < nextMonthStart);

      totalCollectedThisMonth += paidInstallments
        .filter((item) => item.dueDate >= monthStart && item.dueDate < nextMonthStart)
        .reduce((sum, item) => sum + item.amount, 0);

      overdueAmount += overdueInstallments.reduce((sum, item) => sum + item.amount, 0);
      dueThisWeekAmount += dueThisWeekInstallments.reduce((sum, item) => sum + item.amount, 0);
      totalOutstanding += unpaidInstallments.reduce((sum, item) => sum + item.amount, 0);
      installmentsDueToDate += dueToDateInstallments.length;
      installmentsPaidToDate += dueToDateInstallments.filter((item) => item.paid).length;
      overdueInstallmentCount += overdueInstallments.length;
      totalDaysLate += overdueInstallments.reduce((sum, item) => {
        const diffMs = startOfToday.getTime() - item.dueDate.getTime();
        return sum + Math.max(Math.floor(diffMs / (1000 * 60 * 60 * 24)), 0);
      }, 0);
      upcomingInstallmentCount += dueThisWeekInstallments.length;

      unpaidInstallments.forEach((item) => {
        const daysUntilDue = Math.floor(
          (item.dueDate.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24),
        );
        const daysPastDue = Math.floor(
          (startOfToday.getTime() - item.dueDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (daysUntilDue >= 0 && daysUntilDue <= 30) {
          thirtyDayForecast += item.amount;
        }
        if (daysUntilDue >= 0 && daysUntilDue <= 60) {
          sixtyDayForecast += item.amount;
        }

        if (daysPastDue < 0) {
          currentBucketAmount += item.amount;
        } else if (daysPastDue <= 30) {
          bucket1To30Amount += item.amount;
        } else if (daysPastDue <= 60) {
          bucket31To60Amount += item.amount;
        } else {
          bucket61PlusAmount += item.amount;
        }
      });

      if (paidInstallments.length >= user.loanProfile.termMonths) {
        fullyPaidLoans += 1;
      } else {
        activeLoans += 1;
      }

      if (overdueInstallments.length > 0) {
        overdueLoans += 1;
      }

      const createdAt = new Date(user.createdAt);
      if (createdAt >= monthStart && createdAt < nextMonthStart) {
        newLoansThisMonth += 1;
      }

      if (overdueInstallments.length >= 2) {
        highRiskCount += 1;
      } else if (overdueInstallments.length === 1 || dueThisWeekInstallments.length > 0) {
        mediumRiskCount += 1;
      } else {
        lowRiskCount += 1;
      }

      paidInstallments.forEach((item) => {
        const key = `${item.dueDate.getFullYear()}-${item.dueDate.getMonth()}`;
        const target = collectionTrendMonths.find((entry) => entry.key === key);
        if (target) target.value += item.amount;
      });

      unpaidInstallments.forEach((item) => {
        const key = `${item.dueDate.getFullYear()}-${item.dueDate.getMonth()}`;
        const target = duePipelineMonths.find((entry) => entry.key === key);
        if (target) target.value += item.amount;
      });

      return {
        user,
        overdueInstallmentCount: overdueInstallments.length,
        overdueBalance: overdueInstallments.reduce((sum, item) => sum + item.amount, 0),
        outstandingBalance: unpaidInstallments.reduce((sum, item) => sum + item.amount, 0),
        nextDue: unpaidInstallments[0] ?? null,
      };
    })
    .filter((entry): entry is ReportWatchlistEntry => Boolean(entry))
    .sort((left, right) => {
      if (right.overdueInstallmentCount !== left.overdueInstallmentCount) {
        return right.overdueInstallmentCount - left.overdueInstallmentCount;
      }
      return right.outstandingBalance - left.outstandingBalance;
    })
    .slice(0, 5);

  const averagePrincipal =
    withLoans.length > 0
      ? withLoans.reduce(
          (sum, user) => sum + (user.loanProfile?.principalAmount ?? 0),
          0,
        ) / withLoans.length
      : 0;

  const termMix = [12, 24, 36, 48].map((term) => ({
    term,
    count: withLoans.filter((user) => user.loanProfile?.termMonths === term).length,
  }));
  const collectionCoverageRate =
    installmentsDueToDate > 0 ? (installmentsPaidToDate / installmentsDueToDate) * 100 : 0;
  const delinquencyRate =
    installmentsDueToDate > 0 ? (overdueInstallmentCount / installmentsDueToDate) * 100 : 0;
  const averageDaysLate =
    overdueInstallmentCount > 0 ? totalDaysLate / overdueInstallmentCount : 0;

  return {
    totalReceivable: withLoans.reduce(
      (sum, user) => sum + (user.loanProfile?.totalPayable ?? 0),
      0,
    ),
    totalCollectedThisMonth,
    overdueAmount,
    dueThisWeekAmount,
    totalOutstanding,
    activeLoans,
    fullyPaidLoans,
    overdueLoans,
    newLoansThisMonth,
    watchlist,
    averagePrincipal,
    termMix,
    collectionTrend: collectionTrendMonths,
    duePipeline: duePipelineMonths,
    collectionCoverageRate,
    delinquencyRate,
    averageDaysLate,
    installmentsDueToDate,
    installmentsPaidToDate,
    overdueInstallmentCount,
    upcomingInstallmentCount,
    thirtyDayForecast,
    sixtyDayForecast,
    agingBuckets: [
      { label: "Current", value: currentBucketAmount },
      { label: "1-30 Days", value: bucket1To30Amount },
      { label: "31-60 Days", value: bucket31To60Amount },
      { label: "61+ Days", value: bucket61PlusAmount },
    ],
    riskSegments: [
      { label: "Low Risk", value: lowRiskCount },
      { label: "Medium Risk", value: mediumRiskCount },
      { label: "High Risk", value: highRiskCount },
    ],
  };
}
