import { useState } from "react";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Search, Download, Filter } from "lucide-react";
import { Button } from "../ui/button";

export function AdminPayments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const payments = [
    {
      id: "PAY-2026-501",
      userId: "USR-001",
      userName: "Juan Dela Cruz",
      motorcycle: "Yamaha Mio 125",
      amount: 2500,
      paymentMethod: "GCash",
      date: "Feb 25, 2026 10:30 AM",
      status: "completed",
      referenceNumber: "GCASH-123456789",
    },
    {
      id: "PAY-2026-502",
      userId: "USR-002",
      userName: "Maria Santos",
      motorcycle: "Honda Click 150",
      amount: 3000,
      paymentMethod: "Bank Transfer",
      date: "Feb 25, 2026 09:15 AM",
      status: "completed",
      referenceNumber: "BPI-987654321",
    },
    {
      id: "PAY-2026-503",
      userId: "USR-003",
      userName: "Pedro Reyes",
      motorcycle: "Suzuki Raider 150",
      amount: 2800,
      paymentMethod: "Credit Card",
      date: "Feb 24, 2026 03:45 PM",
      status: "completed",
      referenceNumber: "VISA-456789123",
    },
    {
      id: "PAY-2026-504",
      userId: "USR-004",
      userName: "Anna Garcia",
      motorcycle: "Kawasaki Ninja 400",
      amount: 5000,
      paymentMethod: "GCash",
      date: "Feb 24, 2026 11:20 AM",
      status: "pending",
      referenceNumber: "GCASH-789123456",
    },
    {
      id: "PAY-2026-505",
      userId: "USR-005",
      userName: "Carlos Mendoza",
      motorcycle: "Honda Beat",
      amount: 2200,
      paymentMethod: "Bank Transfer",
      date: "Feb 23, 2026 02:00 PM",
      status: "failed",
      referenceNumber: "BDO-321654987",
    },
  ];

  const statusColors: Record<string, { bg: string; text: string }> = {
    completed: { bg: "bg-green-100", text: "text-green-700" },
    pending: { bg: "bg-yellow-100", text: "text-yellow-700" },
    failed: { bg: "bg-red-100", text: "text-red-700" },
  };

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || payment.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalAmount = filteredPayments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Payment History
        </h1>
        <p className="text-gray-600">Track and manage all payment transactions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 rounded-xl">
          <p className="text-sm text-gray-600 mb-1">Total Payments</p>
          <p className="text-2xl font-bold text-gray-900">{payments.length}</p>
        </Card>
        <Card className="p-4 rounded-xl">
          <p className="text-sm text-gray-600 mb-1">Completed</p>
          <p className="text-2xl font-bold text-green-600">
            {payments.filter((p) => p.status === "completed").length}
          </p>
        </Card>
        <Card className="p-4 rounded-xl">
          <p className="text-sm text-gray-600 mb-1">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">
            {payments.filter((p) => p.status === "pending").length}
          </p>
        </Card>
        <Card className="p-4 rounded-xl">
          <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-blue-600">
            ₱{totalAmount.toLocaleString()}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6 rounded-xl mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <Input
              type="text"
              placeholder="Search by name, ID, or reference number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-lg"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus("completed")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === "completed"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setFilterStatus("pending")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === "pending"
                  ? "bg-yellow-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilterStatus("failed")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === "failed"
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Failed
            </button>
            <Button variant="outline" className="rounded-lg">
              <Download size={16} className="mr-2" />
              Export
            </Button>
          </div>
        </div>
      </Card>

      {/* Payments Table */}
      <Card className="rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Payment ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Payment Method
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Date & Time
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Reference
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPayments.map((payment) => {
                const colors = statusColors[payment.status];
                return (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">
                        {payment.id}
                      </p>
                      <p className="text-xs text-gray-600">{payment.userId}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">
                        {payment.userName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {payment.motorcycle}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-lg font-bold text-gray-900">
                        ₱{payment.amount.toLocaleString()}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">
                        {payment.paymentMethod}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{payment.date}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 ${colors.bg} ${colors.text} rounded-full text-xs font-semibold uppercase`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-mono text-gray-600">
                        {payment.referenceNumber}
                      </p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Empty State */}
      {filteredPayments.length === 0 && (
        <Card className="p-12 rounded-xl text-center mt-6">
          <Filter className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No payments found
          </h3>
          <p className="text-gray-600">
            Try adjusting your search or filter criteria
          </p>
        </Card>
      )}
    </div>
  );
}
