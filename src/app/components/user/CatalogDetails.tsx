import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Heart, BadgePercent } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { motorcycleCatalog, type LoanTermMonths } from "../../data/motorcycles";
import { estimateLoan, formatPhpCurrency, getDefaultLoanSetup } from "../../lib/financing";
import {
  getFavoriteCatalogIds,
  pushRecentlyViewedCatalogId,
  toggleFavoriteCatalogId,
} from "../../lib/catalog-storage";

export function CatalogDetails() {
  const navigate = useNavigate();
  const params = useParams();
  const item = motorcycleCatalog.find((catalogItem) => catalogItem.id === params.id);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  const defaultLoan = useMemo(() => {
    if (!item) return { downPayment: 0, months: 12 as LoanTermMonths, annualInterestRate: 12 };
    return getDefaultLoanSetup(item);
  }, [item]);

  const [downPayment, setDownPayment] = useState(defaultLoan.downPayment);
  const [months, setMonths] = useState<LoanTermMonths>(defaultLoan.months);

  useEffect(() => {
    setFavoriteIds(getFavoriteCatalogIds());
  }, []);

  useEffect(() => {
    if (!item) return;
    pushRecentlyViewedCatalogId(item.id);
    setDownPayment(defaultLoan.downPayment);
    setMonths(defaultLoan.months);
  }, [item, defaultLoan.downPayment, defaultLoan.months]);

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Card className="rounded-xl p-6 text-center">
          <p className="text-gray-700 mb-4">Motorcycle not found.</p>
          <Button onClick={() => navigate("/user/catalog")} className="bg-blue-600 text-white">
            Back to Catalog
          </Button>
        </Card>
      </div>
    );
  }

  const isFavorite = favoriteIds.includes(item.id);
  const normalizedDownPayment = Math.min(Math.max(downPayment, 0), item.price);
  const estimate = estimateLoan({
    motorcyclePrice: item.price,
    downPayment: normalizedDownPayment,
    months,
    annualInterestRate: 12,
  });
  const estimatedInterest = Math.max(estimate.totalPayable - estimate.principal, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative h-56">
        <ImageWithFallback
          src={item.image}
          alt={`${item.brand} ${item.model}`}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-black/15" />

        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/user/catalog")}
            className="bg-white/95 rounded-full p-2 text-gray-800"
            aria-label="Back to catalog"
          >
            <ArrowLeft size={20} />
          </button>

          <button
            onClick={() => setFavoriteIds(toggleFavoriteCatalogId(item.id))}
            className="bg-white/95 rounded-full p-2 text-gray-800"
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart size={20} className={isFavorite ? "fill-red-500 text-red-500" : ""} />
          </button>
        </div>

        <div className="absolute bottom-4 left-4 right-4 text-white">
          <h1 className="text-2xl font-bold">
            {item.brand} {item.model}
          </h1>
          <p className="text-sm text-white/90">
            {item.year} • {item.engineCc}cc
          </p>
        </div>
      </div>

      <div className="px-6 py-5 space-y-4">
        <Card className="rounded-2xl p-4">
          <p className="text-sm text-gray-600 mb-1">SRP</p>
          <p className="text-3xl font-bold text-gray-900">{formatPhpCurrency(item.price)}</p>
          <p className="text-sm text-gray-600 mt-2">{item.description}</p>
        </Card>

        <Card className="rounded-2xl p-4">
          <div className="flex items-center mb-3">
            <BadgePercent size={18} className="text-blue-600 mr-2" />
            <p className="font-semibold text-gray-900">Financing Simulator</p>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-600 mb-2">Down payment</p>
              <Input
                type="number"
                min={0}
                max={item.price}
                value={downPayment}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  if (Number.isNaN(next)) {
                    setDownPayment(0);
                    return;
                  }
                  setDownPayment(next);
                }}
                className="rounded-lg"
                placeholder="Enter down payment amount"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Accepted range: {formatPhpCurrency(0)} to {formatPhpCurrency(item.price)}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-600 mb-2">Loan term</p>
              <div className="grid grid-cols-4 gap-2">
                {item.availableTerms.map((term) => (
                  <button
                    key={term}
                    onClick={() => setMonths(term)}
                    className={`rounded-lg py-2 text-xs font-semibold border ${
                      months === term
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-300"
                    }`}
                  >
                    {term} mo
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl p-4 bg-blue-50 border-blue-100">
          <p className="text-sm font-semibold text-blue-900 mb-3">
            Financing Quotation
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-700">SRP</span>
              <span className="font-semibold text-gray-900">
                {formatPhpCurrency(item.price)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Down payment</span>
              <span className="font-semibold text-gray-900">
                {formatPhpCurrency(normalizedDownPayment)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Principal financed</span>
              <span className="font-semibold text-gray-900">
                {formatPhpCurrency(estimate.principal)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Estimated interest ({months} months)</span>
              <span className="font-semibold text-gray-900">
                {formatPhpCurrency(estimatedInterest)}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2 mt-2">
              <span className="text-gray-800 font-semibold">Total payable</span>
              <span className="font-bold text-gray-900">
                {formatPhpCurrency(estimate.totalPayable)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-800 font-semibold">Estimated monthly</span>
              <span className="font-bold text-blue-900">
                {formatPhpCurrency(estimate.monthlyPayment)}
              </span>
            </div>
          </div>
          <p className="text-xs text-blue-800 mt-3">
            Quotation only. Final amortization will be provided by admin.
          </p>
        </Card>
      </div>
    </div>
  );
}
