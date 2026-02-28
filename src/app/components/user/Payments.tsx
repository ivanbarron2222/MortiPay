import { useState } from "react";
import { ArrowLeft, CreditCard, Building2, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";

export function Payments() {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handlePayment = () => {
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h2>
          <p className="text-gray-600 mb-6">
            Your payment of ₱2,500 has been processed
          </p>
          <Button
            onClick={() => navigate("/user")}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8"
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

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
          <h1 className="text-xl font-bold text-gray-900">Make Payment</h1>
        </div>
      </div>

      <div className="px-6 py-6 space-y-4">
        {/* Payment Summary */}
        <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl p-6">
          <p className="text-blue-100 mb-2">Amount Due</p>
          <h2 className="text-4xl font-bold mb-4">₱2,500.00</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-100">Due Date</span>
              <span className="font-semibold">May 28, 2026</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-100">Loan Account</span>
              <span className="font-semibold">Yamaha Mio 125</span>
            </div>
          </div>
        </Card>

        {/* Payment Methods */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">
            Select Payment Method
          </h3>

          <div className="space-y-3">
            <button
              onClick={() => setPaymentMethod("card")}
              className={`w-full p-4 rounded-xl border-2 flex items-center transition-all ${
                paymentMethod === "card"
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                  paymentMethod === "card" ? "bg-blue-600" : "bg-gray-100"
                }`}
              >
                <CreditCard
                  className={paymentMethod === "card" ? "text-white" : "text-gray-600"}
                  size={24}
                />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-gray-900">
                  Credit / Debit Card
                </p>
                <p className="text-xs text-gray-600">Visa, Mastercard, etc.</p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 ${
                  paymentMethod === "card"
                    ? "border-blue-600 bg-blue-600"
                    : "border-gray-300"
                }`}
              >
                {paymentMethod === "card" && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
              </div>
            </button>

            <button
              onClick={() => setPaymentMethod("bank")}
              className={`w-full p-4 rounded-xl border-2 flex items-center transition-all ${
                paymentMethod === "bank"
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                  paymentMethod === "bank" ? "bg-blue-600" : "bg-gray-100"
                }`}
              >
                <Building2
                  className={paymentMethod === "bank" ? "text-white" : "text-gray-600"}
                  size={24}
                />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-gray-900">Bank Transfer</p>
                <p className="text-xs text-gray-600">
                  BDO, BPI, Metrobank, etc.
                </p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 ${
                  paymentMethod === "bank"
                    ? "border-blue-600 bg-blue-600"
                    : "border-gray-300"
                }`}
              >
                {paymentMethod === "bank" && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
              </div>
            </button>

            <button
              onClick={() => setPaymentMethod("gcash")}
              className={`w-full p-4 rounded-xl border-2 flex items-center transition-all ${
                paymentMethod === "gcash"
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                  paymentMethod === "gcash" ? "bg-blue-600" : "bg-gray-100"
                }`}
              >
                <span
                  className={`font-bold text-lg ${
                    paymentMethod === "gcash" ? "text-white" : "text-gray-600"
                  }`}
                >
                  G
                </span>
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-gray-900">GCash</p>
                <p className="text-xs text-gray-600">Pay via GCash wallet</p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 ${
                  paymentMethod === "gcash"
                    ? "border-blue-600 bg-blue-600"
                    : "border-gray-300"
                }`}
              >
                {paymentMethod === "gcash" && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Payment Details Form (shown when method selected) */}
        {paymentMethod && (
          <Card className="p-4 rounded-xl">
            <h4 className="font-semibold text-gray-900 mb-3">
              Payment Details
            </h4>
            <div className="space-y-3">
              {paymentMethod === "card" && (
                <>
                  <Input placeholder="Card Number" className="rounded-lg" />
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="MM/YY" className="rounded-lg" />
                    <Input placeholder="CVV" className="rounded-lg" />
                  </div>
                  <Input placeholder="Cardholder Name" className="rounded-lg" />
                </>
              )}
              {paymentMethod === "bank" && (
                <>
                  <Input placeholder="Bank Name" className="rounded-lg" />
                  <Input placeholder="Account Number" className="rounded-lg" />
                  <Input placeholder="Account Name" className="rounded-lg" />
                </>
              )}
              {paymentMethod === "gcash" && (
                <>
                  <Input
                    placeholder="GCash Number"
                    className="rounded-lg"
                  />
                  <p className="text-xs text-gray-600">
                    You will receive a payment prompt on your GCash app
                  </p>
                </>
              )}
            </div>
          </Card>
        )}

        {/* Confirm Payment Button */}
        <Button
          onClick={handlePayment}
          disabled={!paymentMethod}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-6 rounded-xl text-lg"
        >
          Confirm Payment
        </Button>
      </div>
    </div>
  );
}
