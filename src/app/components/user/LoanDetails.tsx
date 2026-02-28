import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";
import { Card } from "../ui/card";
import { Progress } from "../ui/progress";
import { formatPhpCurrency } from "../../lib/financing";
import {
  getCurrentDemoUser,
  getLoanInstallmentSchedule,
  type DemoUserAccount,
} from "../../lib/demo-users";

type DemoPaymentItem = {
  month: string;
  amount: number;
  dateLabel: string;
};

export function LoanDetails() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<DemoUserAccount | null>(null);
  const loan = currentUser?.loanProfile ?? null;

  useEffect(() => {
    let active = true;
    const load = async () => {
      const user = await getCurrentDemoUser();
      if (active) setCurrentUser(user);
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  if (!loan) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white px-6 py-4 shadow-sm">
          <div className="flex items-center">
            <button
              onClick={() => navigate("/user")}
              className="mr-4 text-gray-700 hover:text-gray-900"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Loan Details</h1>
          </div>
        </div>
        <div className="px-6 py-6">
          <Card className="rounded-2xl p-6 text-center">
            <p className="text-gray-700 mb-4">
              No loan account assigned yet. Please contact admin.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  const totalMonths = loan.termMonths;
  const monthlyInstallment = Math.max(Math.round(loan.monthlyInstallment), 1);
  const totalAmount = loan.principalAmount;
  const downpayment = loan.downpayment;
  const paidMonths = loan.paidInstallmentNumbers.length;
  const remainingMonths = Math.max(totalMonths - paidMonths, 0);
  const paymentProgress = (paidMonths / totalMonths) * 100;
  const remainingBalance = Math.max(totalAmount - paidMonths * monthlyInstallment, 0);
  const schedule = getLoanInstallmentSchedule(loan);
  const paymentHistory: DemoPaymentItem[] = schedule
    .filter((item) => item.paid)
    .slice(-6)
    .reverse()
    .map((item) => ({
      month: `Installment ${item.installmentNumber}`,
      amount: item.amount,
      dateLabel: item.dueDate,
    }));

  const upcomingPayments: DemoPaymentItem[] = schedule
    .filter((item) => !item.paid)
    .slice(0, 3)
    .map((item) => ({
      month: `Installment ${item.installmentNumber}`,
      amount: item.amount,
      dateLabel: item.dueDate,
    }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center">
          <button
            onClick={() => navigate("/user")}
            className="mr-4 text-gray-700 hover:text-gray-900"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Loan Details</h1>
        </div>
      </div>

      <div className="px-6 py-6 space-y-4">
        <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4">Payment Progress</h2>
          <div className="mb-4">
            <Progress value={paymentProgress} className="h-3 bg-blue-400" />
          </div>
          <div className="flex justify-between text-sm">
            <span>
              {paidMonths} of {totalMonths} months paid
            </span>
            <span className="font-semibold">{paymentProgress.toFixed(0)}%</span>
          </div>
        </Card>

        <Card className="rounded-2xl p-6">
          <h3 className="font-bold text-gray-900 mb-4">Loan Summary</h3>

          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <span className="text-gray-600">Vehicle</span>
              <span className="font-semibold text-gray-900">{loan.motorcycle}</span>
            </div>

            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <span className="text-gray-600">Account Holder</span>
              <span className="font-semibold text-gray-900">{currentUser?.fullName}</span>
            </div>

            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <span className="text-gray-600">Total Loan Amount</span>
              <span className="text-lg font-bold text-gray-900">
                {formatPhpCurrency(totalAmount)}
              </span>
            </div>

            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <span className="text-gray-600">Downpayment</span>
              <span className="font-semibold text-green-600">
                {formatPhpCurrency(downpayment)}
              </span>
            </div>

            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <span className="text-gray-600">Monthly Installment</span>
              <span className="font-semibold text-blue-600">
                {formatPhpCurrency(monthlyInstallment)}
              </span>
            </div>

            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <span className="text-gray-600">Interest Rate</span>
              <span className="font-semibold text-gray-900">
                {loan.annualInterestRate}% per annum
              </span>
            </div>

            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <span className="text-gray-600">Loan Duration</span>
              <span className="font-semibold text-gray-900">{totalMonths} months</span>
            </div>

            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <span className="text-gray-600">Remaining Months</span>
              <span className="text-lg font-bold text-orange-600">
                {remainingMonths} months
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Remaining Balance</span>
              <span className="text-lg font-bold text-gray-900">
                {formatPhpCurrency(Math.min(remainingBalance, loan.totalPayable))}
              </span>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl p-6">
          <h3 className="font-bold text-gray-900 mb-4">Payment History</h3>
          <div className="space-y-3">
            {paymentHistory.map((payment) => (
              <div
                key={`${payment.month}-${payment.dateLabel}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{payment.month}</p>
                    <p className="text-xs text-gray-600">Paid on {payment.dateLabel}</p>
                  </div>
                </div>
                <span className="font-semibold text-green-600">
                  {formatPhpCurrency(payment.amount)}
                </span>
              </div>
            ))}
            {paymentHistory.length === 0 ? (
              <p className="text-sm text-gray-600">No payments recorded yet.</p>
            ) : null}
          </div>
        </Card>

        <Card className="rounded-2xl p-6">
          <h3 className="font-bold text-gray-900 mb-4">Upcoming Payments</h3>
          <div className="space-y-3">
            {upcomingPayments.map((payment) => (
              <div
                key={`${payment.month}-${payment.dateLabel}`}
                className="flex items-center justify-between p-3 rounded-lg bg-blue-50"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3 bg-blue-100">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{payment.month}</p>
                    <p className="text-xs text-gray-600">Due: {payment.dateLabel}</p>
                  </div>
                </div>
                <span className="font-semibold text-blue-600">
                  {formatPhpCurrency(payment.amount)}
                </span>
              </div>
            ))}
            {upcomingPayments.length === 0 ? (
              <p className="text-sm text-gray-600">No upcoming payments.</p>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
