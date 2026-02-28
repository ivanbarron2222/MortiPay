import { ArrowLeft, Tag, Clock } from "lucide-react";
import { useNavigate } from "react-router";
import { Card } from "../ui/card";
import { Button } from "../ui/button";

export function Offers() {
  const navigate = useNavigate();

  const offers = [
    {
      id: 1,
      title: "50% Off Late Fees",
      description: "Pay your overdue balance this week and get 50% discount on late fees!",
      badge: "Limited Time",
      color: "red",
      icon: "💰",
      validUntil: "Mar 31, 2026",
    },
    {
      id: 2,
      title: "Summer Promo Deal",
      description: "Upgrade your motorcycle with 10% off on accessories and parts.",
      badge: "Exclusive",
      color: "orange",
      icon: "☀️",
      validUntil: "Jun 30, 2026",
    },
    {
      id: 3,
      title: "Early Payment Bonus",
      description: "Pay 3 months in advance and get 1 month of interest waived!",
      badge: "Best Value",
      color: "green",
      icon: "🎯",
      validUntil: "Dec 31, 2026",
    },
    {
      id: 4,
      title: "Referral Reward",
      description: "Refer a friend and both of you get ₱500 cash credit!",
      badge: "New",
      color: "purple",
      icon: "👥",
      validUntil: "Ongoing",
    },
  ];

  const colorClasses: Record<string, { bg: string; border: string; badge: string; button: string }> = {
    red: {
      bg: "bg-red-50",
      border: "border-red-200",
      badge: "bg-red-500",
      button: "bg-red-600 hover:bg-red-700",
    },
    orange: {
      bg: "bg-orange-50",
      border: "border-orange-200",
      badge: "bg-orange-500",
      button: "bg-orange-600 hover:bg-orange-700",
    },
    green: {
      bg: "bg-green-50",
      border: "border-green-200",
      badge: "bg-green-500",
      button: "bg-green-600 hover:bg-green-700",
    },
    purple: {
      bg: "bg-purple-50",
      border: "border-purple-200",
      badge: "bg-purple-500",
      button: "bg-purple-600 hover:bg-purple-700",
    },
  };

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
          <h1 className="text-xl font-bold text-gray-900">Special Offers</h1>
        </div>
      </div>

      <div className="px-6 py-6 space-y-4">
        {/* Featured Offer Banner */}
        <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl">🎉</span>
            <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold">
              FEATURED
            </span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Welcome Bonus!</h2>
          <p className="text-blue-100 mb-4">
            Get your first payment fee waived when you complete payment this month!
          </p>
          <Button className="bg-white text-blue-600 hover:bg-blue-50 rounded-lg w-full">
            Learn More
          </Button>
        </Card>

        {/* Offers List */}
        <div className="space-y-4">
          {offers.map((offer) => {
            const colors = colorClasses[offer.color];
            return (
              <Card
                key={offer.id}
                className={`${colors.bg} border-2 ${colors.border} rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <span className="text-3xl mr-3">{offer.icon}</span>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg mb-1">
                        {offer.title}
                      </h3>
                      <span
                        className={`${colors.badge} text-white px-2 py-0.5 rounded-full text-[10px] font-semibold inline-block`}
                      >
                        {offer.badge}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-700 mb-4">{offer.description}</p>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center text-xs text-gray-600">
                    <Clock size={14} className="mr-1" />
                    <span>Valid until {offer.validUntil}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    className={`${colors.button} text-white rounded-lg flex-1`}
                  >
                    Claim Now
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-lg border-gray-300 hover:bg-white"
                  >
                    Details
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Loyalty Program Card */}
        <Card className="rounded-2xl p-6 bg-gradient-to-br from-amber-100 to-yellow-100 border-2 border-amber-200">
          <div className="flex items-center mb-4">
            <span className="text-4xl mr-3">⭐</span>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">
                Loyalty Rewards Program
              </h3>
              <p className="text-sm text-gray-700">
                Earn points with every payment
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Your Points</span>
              <span className="text-2xl font-bold text-amber-600">450</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-amber-600 h-2 rounded-full"
                style={{ width: "45%" }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-2">
              550 more points to reach Gold tier
            </p>
          </div>

          <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-lg">
            View Rewards
          </Button>
        </Card>

        {/* Info Card */}
        <Card className="rounded-xl p-4 bg-blue-50 border border-blue-200">
          <div className="flex items-start">
            <Tag className="text-blue-600 mr-3 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Pro tip:</span> Check this
                section regularly for new offers and promotions tailored just for
                you!
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
