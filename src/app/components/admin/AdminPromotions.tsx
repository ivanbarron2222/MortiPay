import { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Plus, Edit, Trash2, Users, Calendar } from "lucide-react";

export function AdminPromotions() {
  const [showCreateForm, setShowCreateForm] = useState(false);

  const promotions = [
    {
      id: "PROMO-001",
      title: "50% Off Late Fees",
      description:
        "Pay your overdue balance this week and get 50% discount on late fees!",
      code: "LATEFEE50",
      discount: "50%",
      validFrom: "Feb 20, 2026",
      validUntil: "Mar 31, 2026",
      status: "active",
      usedCount: 23,
      maxUses: 100,
    },
    {
      id: "PROMO-002",
      title: "Summer Promo Deal",
      description:
        "Upgrade your motorcycle with 10% off on accessories and parts.",
      code: "SUMMER2026",
      discount: "10%",
      validFrom: "Mar 1, 2026",
      validUntil: "Jun 30, 2026",
      status: "active",
      usedCount: 45,
      maxUses: 200,
    },
    {
      id: "PROMO-003",
      title: "Early Payment Bonus",
      description:
        "Pay 3 months in advance and get 1 month of interest waived!",
      code: "EARLYPAY",
      discount: "1 month interest",
      validFrom: "Jan 1, 2026",
      validUntil: "Dec 31, 2026",
      status: "active",
      usedCount: 12,
      maxUses: 50,
    },
    {
      id: "PROMO-004",
      title: "Referral Reward",
      description: "Refer a friend and both of you get ₱500 cash credit!",
      code: "REFER500",
      discount: "₱500",
      validFrom: "Jan 1, 2026",
      validUntil: "Ongoing",
      status: "active",
      usedCount: 67,
      maxUses: null,
    },
    {
      id: "PROMO-005",
      title: "New Year Special",
      description: "First payment of the year is fee-free!",
      code: "NEWYEAR2026",
      discount: "100% fee waiver",
      validFrom: "Jan 1, 2026",
      validUntil: "Jan 31, 2026",
      status: "expired",
      usedCount: 156,
      maxUses: 200,
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Promotions</h1>
          <p className="text-gray-600">Create and manage promotional offers</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
        >
          <Plus size={20} />
          Create Promotion
        </Button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card className="p-6 rounded-xl mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Create New Promotion
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Promotion Title
                </label>
                <Input placeholder="e.g., Summer Sale 2026" className="rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Promo Code
                </label>
                <Input placeholder="e.g., SUMMER2026" className="rounded-lg" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <Textarea
                placeholder="Enter promotion description..."
                className="rounded-lg min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Value
                </label>
                <Input placeholder="e.g., 20% or ₱500" className="rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valid From
                </label>
                <Input type="date" className="rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valid Until
                </label>
                <Input type="date" className="rounded-lg" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Uses (leave empty for unlimited)
              </label>
              <Input
                type="number"
                placeholder="e.g., 100"
                className="rounded-lg"
              />
            </div>

            <div className="flex gap-3">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                Create Promotion
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
                className="rounded-lg"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 rounded-xl">
          <p className="text-sm text-gray-600 mb-1">Active Promotions</p>
          <p className="text-2xl font-bold text-green-600">
            {promotions.filter((p) => p.status === "active").length}
          </p>
        </Card>
        <Card className="p-4 rounded-xl">
          <p className="text-sm text-gray-600 mb-1">Total Redemptions</p>
          <p className="text-2xl font-bold text-blue-600">
            {promotions.reduce((sum, p) => sum + p.usedCount, 0)}
          </p>
        </Card>
        <Card className="p-4 rounded-xl">
          <p className="text-sm text-gray-600 mb-1">Expired Promotions</p>
          <p className="text-2xl font-bold text-gray-600">
            {promotions.filter((p) => p.status === "expired").length}
          </p>
        </Card>
        <Card className="p-4 rounded-xl">
          <p className="text-sm text-gray-600 mb-1">Avg. Redemption Rate</p>
          <p className="text-2xl font-bold text-purple-600">34%</p>
        </Card>
      </div>

      {/* Promotions List */}
      <div className="space-y-4">
        {promotions.map((promo) => (
          <Card key={promo.id} className="p-6 rounded-xl">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-gray-900">
                    {promo.title}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                      promo.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {promo.status}
                  </span>
                </div>
                <p className="text-gray-600 mb-3">{promo.description}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-600">Promo Code</p>
                    <p className="font-mono font-semibold text-blue-600">
                      {promo.code}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Discount</p>
                    <p className="font-semibold text-gray-900">
                      {promo.discount}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 flex items-center">
                      <Calendar size={12} className="mr-1" />
                      Valid Period
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {promo.validFrom} - {promo.validUntil}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 flex items-center">
                      <Users size={12} className="mr-1" />
                      Usage
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {promo.usedCount}
                      {promo.maxUses && ` / ${promo.maxUses}`}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                {promo.maxUses && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${(promo.usedCount / promo.maxUses) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {((promo.usedCount / promo.maxUses) * 100).toFixed(1)}%
                      redeemed
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                >
                  <Edit size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg text-red-600 border-red-600 hover:bg-red-50"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
