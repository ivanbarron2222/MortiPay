import {
  getLoanInstallmentSchedule,
  type DemoLoanProfile,
} from "./demo-users";

export type UserLoanInstallmentSummary = {
  installmentNumber: number;
  dueDate: Date;
  dueDateLabel: string;
  amount: number;
  paid: boolean;
};

export type UserReminderTrigger =
  | {
      kind: "due_7_days";
      title: string;
      message: string;
      tone: "info";
    }
  | {
      kind: "due_3_days" | "due_today" | "overdue";
      title: string;
      message: string;
      tone: "warning";
    }
  | null;

export function getUserLoanSchedule(loan: DemoLoanProfile): UserLoanInstallmentSummary[] {
  const start = new Date(loan.startDate);
  start.setHours(0, 0, 0, 0);

  return getLoanInstallmentSchedule(loan).map((item) => {
    const dueDate = new Date(start);
    dueDate.setMonth(start.getMonth() + (item.installmentNumber - 1));
    dueDate.setHours(0, 0, 0, 0);

    return {
      installmentNumber: item.installmentNumber,
      dueDate,
      dueDateLabel: item.dueDate,
      amount: item.amount,
      paid: item.paid,
    };
  });
}

export function getNextUserInstallment(loan: DemoLoanProfile | null) {
  if (!loan) return null;

  const schedule = getUserLoanSchedule(loan);
  const nextInstallment = schedule.find((item) => !item.paid);
  if (!nextInstallment) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dayMs = 24 * 60 * 60 * 1000;
  const daysUntilDue = Math.round(
    (nextInstallment.dueDate.getTime() - today.getTime()) / dayMs,
  );
  const overdueDays = Math.max(-daysUntilDue, 0);

  return {
    ...nextInstallment,
    daysUntilDue,
    overdueDays,
  };
}

export function getUserLoanProgress(loan: DemoLoanProfile | null) {
  if (!loan) {
    return {
      paidMonths: 0,
      totalMonths: 0,
      remainingMonths: 0,
      progressPercent: 0,
      remainingBalance: 0,
      totalPaid: 0,
      maturityDateLabel: "-",
      startDateLabel: "-",
    };
  }

  const paidMonths = loan.paidInstallmentNumbers.length;
  const totalMonths = loan.termMonths;
  const remainingMonths = Math.max(totalMonths - paidMonths, 0);
  const totalPaid = paidMonths * loan.monthlyInstallment;
  const remainingBalance = Math.max(loan.totalPayable - totalPaid, 0);
  const progressPercent = totalMonths > 0 ? (paidMonths / totalMonths) * 100 : 0;

  const startDate = new Date(loan.startDate);
  const maturityDate = new Date(loan.startDate);
  maturityDate.setMonth(maturityDate.getMonth() + Math.max(totalMonths - 1, 0));

  return {
    paidMonths,
    totalMonths,
    remainingMonths,
    progressPercent,
    remainingBalance,
    totalPaid,
    startDateLabel: startDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    maturityDateLabel: maturityDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
  };
}

export function getRecentUserPayments(loan: DemoLoanProfile | null, limit = 4) {
  if (!loan) return [];
  return getUserLoanSchedule(loan)
    .filter((item) => item.paid)
    .slice(-limit)
    .reverse();
}

export function getUpcomingUserPayments(loan: DemoLoanProfile | null, limit = 3) {
  if (!loan) return [];
  return getUserLoanSchedule(loan)
    .filter((item) => !item.paid)
    .slice(0, limit);
}

export function getUserLoanStatus(loan: DemoLoanProfile | null) {
  if (!loan) {
    return {
      label: "Awaiting loan",
      tone: "neutral" as const,
      message: "Admin will assign your loan details.",
    };
  }

  const nextInstallment = getNextUserInstallment(loan);
  if (!nextInstallment) {
    return {
      label: "Fully paid",
      tone: "success" as const,
      message: "All installments have been completed.",
    };
  }

  if (nextInstallment.overdueDays > 0) {
    return {
      label: "Overdue",
      tone: "danger" as const,
      message: `Installment ${nextInstallment.installmentNumber} is overdue by ${nextInstallment.overdueDays} day(s).`,
    };
  }

  if (nextInstallment.daysUntilDue <= 3) {
    return {
      label: "Due soon",
      tone: "warning" as const,
      message: `Installment ${nextInstallment.installmentNumber} is due ${nextInstallment.daysUntilDue === 0 ? "today" : `in ${nextInstallment.daysUntilDue} day(s)`}.`,
    };
  }

  return {
    label: "Current",
    tone: "info" as const,
    message: `Installment ${nextInstallment.installmentNumber} is on schedule.`,
  };
}

export function getUserReminderTrigger(loan: DemoLoanProfile | null): UserReminderTrigger {
  const nextInstallment = getNextUserInstallment(loan);
  if (!nextInstallment) return null;

  if (nextInstallment.overdueDays > 0) {
    return {
      kind: "overdue",
      title: "Installment Overdue",
      message: `Installment ${nextInstallment.installmentNumber} is overdue by ${nextInstallment.overdueDays} day(s).`,
      tone: "warning",
    };
  }

  if (nextInstallment.daysUntilDue === 0) {
    return {
      kind: "due_today",
      title: "Payment Due Today",
      message: `Installment ${nextInstallment.installmentNumber} is due today.`,
      tone: "warning",
    };
  }

  if (nextInstallment.daysUntilDue > 0 && nextInstallment.daysUntilDue <= 3) {
    return {
      kind: "due_3_days",
      title: "Payment Due Soon",
      message: `Installment ${nextInstallment.installmentNumber} is due in ${nextInstallment.daysUntilDue} day(s).`,
      tone: "warning",
    };
  }

  if (nextInstallment.daysUntilDue > 3 && nextInstallment.daysUntilDue <= 7) {
    return {
      kind: "due_7_days",
      title: "Payment Coming Up",
      message: `Installment ${nextInstallment.installmentNumber} is due in ${nextInstallment.daysUntilDue} day(s).`,
      tone: "info",
    };
  }

  return null;
}
