import { useState } from "react";
import { ArrowLeft, ChevronDown, ChevronUp, Phone, Mail } from "lucide-react";
import { useNavigate } from "react-router";
import { Card } from "../ui/card";
import { Button } from "../ui/button";

export function Support() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "How do I view my installment schedule?",
      answer:
        "Go to Loan Details from the home screen to view your installment breakdown, remaining balance, and upcoming due dates.",
    },
    {
      question: "What happens if I miss a payment?",
      answer:
        "If you miss a payment, a late fee will be applied to your account. We recommend contacting support immediately to discuss payment extension options.",
    },
    {
      question: "Can I request changes to my loan terms?",
      answer:
        "Please contact admin support to request updates to your loan terms. Loan profiles are managed by admin in this system.",
    },
    {
      question: "How do I request a payment extension?",
      answer:
        "Go to the Reminders section and click on 'Request Payment Extension' if you have an overdue payment. You can also contact our support team directly.",
    },
    {
      question: "Where can I view my loan details?",
      answer:
        "Your complete loan details, including payment history and remaining balance, are available in the 'Loan Details' section accessible from the home screen.",
    },
    {
      question: "How do I update my contact information?",
      answer:
        "Contact our support team via phone or email to update your contact information. We'll verify your identity before making any changes.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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

      <div className="px-6 py-6 space-y-4">
        {/* Contact Options */}
        <div className="grid grid-cols-2 gap-3">
          <button className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
              <Phone className="text-blue-600" size={20} />
            </div>
            <span className="text-xs font-semibold text-gray-900">Call Us</span>
          </button>

          <button className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-2">
              <Mail className="text-purple-600" size={20} />
            </div>
            <span className="text-xs font-semibold text-gray-900">Email</span>
          </button>
        </div>

        {/* Contact Info Card */}
        <Card className="rounded-2xl p-5">
          <h3 className="font-bold text-gray-900 mb-4">Contact Information</h3>
          <div className="space-y-3">
            <div className="flex items-center">
              <Phone className="text-blue-600 mr-3" size={20} />
              <div>
                <p className="text-xs text-gray-600">Hotline</p>
                <p className="font-semibold text-gray-900">1-800-MOTOPAY</p>
              </div>
            </div>
            <div className="flex items-center">
              <Mail className="text-purple-600 mr-3" size={20} />
              <div>
                <p className="text-xs text-gray-600">Email</p>
                <p className="font-semibold text-gray-900">
                  support@motopay.ph
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* FAQ Section */}
        <div>
          <h3 className="font-bold text-gray-900 mb-3">
            Frequently Asked Questions
          </h3>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <Card key={index} className="rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900 pr-4">
                    {faq.question}
                  </span>
                  {openFaq === index ? (
                    <ChevronUp className="text-blue-600 flex-shrink-0" size={20} />
                  ) : (
                    <ChevronDown className="text-gray-400 flex-shrink-0" size={20} />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-4 pb-4 text-sm text-gray-600 border-t border-gray-100 pt-3">
                    {faq.answer}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Help Center Link */}
        <Card className="rounded-2xl p-5 bg-blue-50 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-gray-900 mb-1">Help Center</h4>
              <p className="text-sm text-gray-600">
                Browse more articles and guides
              </p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
              Visit
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
