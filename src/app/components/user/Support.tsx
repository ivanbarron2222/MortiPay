import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Mail,
  MapPinned,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import {
  evaluateDemoUserLocationAlert,
  getCurrentDemoUser,
  type DemoUserAccount,
} from "../../lib/demo-users";
import { getNextUserInstallment, getUserLoanStatus } from "../../lib/user-loan";

export function Support() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<DemoUserAccount | null>(null);
  const loan = currentUser?.loanProfile ?? null;

  useEffect(() => {
    let active = true;
    const load = async () => {
      const user = await getCurrentDemoUser();
      if (active) setCurrentUser(user);
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  const nextInstallment = useMemo(() => getNextUserInstallment(loan), [loan]);
  const loanStatus = useMemo(() => getUserLoanStatus(loan), [loan]);
  const locationAlert = useMemo(
    () => (currentUser ? evaluateDemoUserLocationAlert(currentUser) : null),
    [currentUser],
  );

  const faqs = [
    {
      question: "How do I view my installment schedule?",
      answer:
        "Open Loan Details from the home screen to review your progress, remaining balance, payment history, and upcoming due dates.",
    },
    {
      question: "What happens if I miss a payment?",
      answer:
        "Your account can become overdue and may start accumulating daily penalties. Use the reminders page and contact support immediately if you expect a delay.",
    },
    {
      question: "Can I request changes to my loan terms?",
      answer:
        "Loan terms are managed by your tenant admin. Support can guide you on the process, but schedule changes still need admin approval.",
    },
    {
      question: "How do I request a payment extension?",
      answer:
        "If your installment is due soon or already overdue, contact support from this page so the team can review your account status and advise the next step.",
    },
    {
      question: "Why does the app track location?",
      answer:
        "Location monitoring helps the tenant verify device activity and account status. You can review your current tracking state below and in your account experience.",
    },
    {
      question: "How do I update my contact information?",
      answer:
        "Open Account Settings to update your profile, or contact support if you need help validating changes to your email or phone number.",
    },
  ];

  const handleCall = () => {
    window.location.href = "tel:18006686729";
  };

  const handleEmail = () => {
    window.location.href = "mailto:support@motopay.ph";
  };

  const locationCardClassName =
    locationAlert?.status === "tracking"
      ? "border-emerald-200 bg-emerald-50"
      : locationAlert?.status === "stale"
        ? "border-amber-200 bg-amber-50"
        : "border-red-200 bg-red-50";

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
          <h1 className="text-xl font-bold text-gray-900">Support</h1>
        </div>
      </div>

      <div className="space-y-4 px-6 py-6">
        <Card className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white">
          <p className="text-sm text-slate-300">Support overview</p>
          <h2 className="mt-1 text-2xl font-bold">Need help with your account?</h2>
          <p className="mt-2 text-sm text-slate-300">
            Support is best for overdue concerns, schedule clarifications, contact updates, and account guidance.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Account status</p>
              <p className="mt-2 text-lg font-bold">{loanStatus.label}</p>
              <p className="mt-1 text-sm text-slate-300">{loanStatus.message}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Next due date</p>
              <p className="mt-2 text-lg font-bold">
                {nextInstallment ? nextInstallment.dueDateLabel : "-"}
              </p>
              <p className="mt-1 text-sm text-slate-300">
                {nextInstallment
                  ? `Installment ${nextInstallment.installmentNumber}`
                  : "No active installment"}
              </p>
            </div>
          </div>
          {loan?.loanAccountNumber ? (
            <p className="mt-4 text-sm text-slate-300">
              Loan account number: <span className="font-semibold text-white">{loan.loanAccountNumber}</span>
            </p>
          ) : null}
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleCall}
            className="flex flex-col items-center rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Phone className="text-blue-600" size={20} />
            </div>
            <span className="text-xs font-semibold text-gray-900">Call Support</span>
            <span className="mt-1 text-[11px] text-gray-500">Urgent concerns</span>
          </button>

          <button
            onClick={handleEmail}
            className="flex flex-col items-center rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
              <Mail className="text-purple-600" size={20} />
            </div>
            <span className="text-xs font-semibold text-gray-900">Email Support</span>
            <span className="mt-1 text-[11px] text-gray-500">Non-urgent help</span>
          </button>
        </div>

        <Card className="rounded-2xl p-5">
          <h3 className="mb-4 font-bold text-gray-900">Contact Information</h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <Phone className="mr-3 text-blue-600" size={20} />
              <div>
                <p className="text-xs text-gray-600">Hotline</p>
                <p className="font-semibold text-gray-900">1-800-MOTOPAY</p>
                <p className="text-xs text-gray-500">Best for overdue and urgent payment concerns</p>
              </div>
            </div>
            <div className="flex items-center">
              <Mail className="mr-3 text-purple-600" size={20} />
              <div>
                <p className="text-xs text-gray-600">Email</p>
                <p className="font-semibold text-gray-900">support@motopay.ph</p>
                <p className="text-xs text-gray-500">Best for profile or documentation follow-up</p>
              </div>
            </div>
            <div className="flex items-center">
              <ShieldCheck className="mr-3 text-emerald-600" size={20} />
              <div>
                <p className="text-xs text-gray-600">Support Hours</p>
                <p className="font-semibold text-gray-900">Mon-Sat, 8:00 AM - 6:00 PM</p>
              </div>
            </div>
          </div>
        </Card>

        {locationAlert ? (
          <Card className={`rounded-2xl border p-5 ${locationCardClassName}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Location monitoring</p>
                <h3 className="text-lg font-bold text-slate-900">Current tracking state</h3>
                <p className="mt-2 text-sm text-slate-700">{locationAlert.message}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {locationAlert.minutesSinceHeartbeat !== null
                    ? `Last heartbeat ${locationAlert.minutesSinceHeartbeat} minute(s) ago`
                    : "No heartbeat timestamp available yet"}
                </p>
              </div>
              <MapPinned
                className={
                  locationAlert.status === "tracking"
                    ? "text-emerald-600"
                    : locationAlert.status === "stale"
                      ? "text-amber-600"
                      : "text-red-600"
                }
              />
            </div>
          </Card>
        ) : null}

        <Card className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900">Quick self-service actions</h3>
              <p className="mt-1 text-sm text-slate-600">
                Review your account first before contacting support for faster resolution.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              onClick={() => navigate("/user/loan-details")}
              className="rounded-xl bg-blue-600 text-white hover:bg-blue-700"
            >
              Review Loan Details
            </Button>
            <Button
              onClick={() => navigate("/user/reminders")}
              variant="outline"
              className="rounded-xl border-blue-300 bg-white text-blue-700 hover:bg-blue-100"
            >
              Open Reminders
            </Button>
            <Button
              onClick={() => navigate("/user/account")}
              variant="outline"
              className="rounded-xl border-blue-300 bg-white text-blue-700 hover:bg-blue-100"
            >
              Update Account
            </Button>
          </div>
        </Card>

        <div>
          <h3 className="mb-3 font-bold text-gray-900">Frequently Asked Questions</h3>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <Card key={faq.question} className="overflow-hidden rounded-xl">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-gray-50"
                >
                  <span className="pr-4 font-semibold text-gray-900">{faq.question}</span>
                  {openFaq === index ? (
                    <ChevronUp className="flex-shrink-0 text-blue-600" size={20} />
                  ) : (
                    <ChevronDown className="flex-shrink-0 text-gray-400" size={20} />
                  )}
                </button>
                {openFaq === index ? (
                  <div className="border-t border-gray-100 px-4 pb-4 pt-3 text-sm text-gray-600">
                    {faq.answer}
                  </div>
                ) : null}
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
