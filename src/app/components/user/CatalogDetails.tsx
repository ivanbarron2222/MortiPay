import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Heart, BadgePercent, Bike, Calculator, CheckCircle2 } from "lucide-react";
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
          <p className="mb-4 text-gray-700">Motorcycle not found.</p>
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
      <div className="relative h-64">
        <ImageWithFallback
          src={item.image}
          alt={`${item.brand} ${item.model}`}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />

        <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/user/catalog")}
            className="rounded-full bg-white/95 p-2 text-gray-800"
            aria-label="Back to catalog"
          >
            <ArrowLeft size={20} />
          </button>

          <button
            onClick={() => setFavoriteIds(toggleFavoriteCatalogId(item.id))}
            className="rounded-full bg-white/95 p-2 text-gray-800"
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart size={20} className={isFavorite ? "fill-rose-500 text-rose-500" : ""} />
          </button>
        </div>

        <div className="absolute bottom-4 left-4 right-4 text-white">
          {item.promoTag ? (
            <span className="mb-3 inline-flex rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold text-slate-950">
              {item.promoTag}
            </span>
          ) : null}
          <h1 className="text-3xl font-bold">
            {item.brand} {item.model}
          </h1>
          <p className="mt-1 text-sm text-white/85">
            {item.year} • {item.engineCc}cc • {item.status.replaceAll("_", " ")}
          </p>
        </div>
      </div>

      <div className="space-y-4 px-4 py-5 sm:px-6">
        <Card className="rounded-3xl p-4 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Catalog Summary</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                {formatPhpCurrency(item.price)}
              </h2>
              <p className="mt-2 text-sm text-slate-600">{item.description}</p>
            </div>
            <div className="rounded-full bg-blue-100 p-3 text-blue-700">
              <Bike size={18} />
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-100 p-4">
              <p className="text-sm text-slate-500">Estimated Monthly</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">
                {formatPhpCurrency(estimate.monthlyPayment)}
              </p>
              <p className="mt-1 text-xs text-slate-500">{months} months</p>
            </div>
            <div className="rounded-2xl bg-slate-100 p-4">
              <p className="text-sm text-slate-500">Suggested Downpayment</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">
                {formatPhpCurrency(normalizedDownPayment)}
              </p>
              <p className="mt-1 text-xs text-slate-500">Adjust below to compare</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-3xl p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Calculator size={18} className="text-blue-600" />
            <p className="font-semibold text-slate-950">Financing Simulator</p>
          </div>

          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs text-slate-500">Downpayment</p>
              <Input
                type="number"
                min={0}
                max={item.price}
                value={downPayment}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  setDownPayment(Number.isNaN(next) ? 0 : next);
                }}
                className="rounded-2xl"
                placeholder="Enter down payment amount"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Range: {formatPhpCurrency(0)} to {formatPhpCurrency(item.price)}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs text-slate-500">Loan term</p>
              <div className="grid grid-cols-4 gap-2">
                {item.availableTerms.map((term) => (
                  <button
                    key={term}
                    onClick={() => setMonths(term)}
                    className={`rounded-2xl py-2 text-xs font-semibold border ${
                      months === term
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-700 border-slate-300"
                    }`}
                  >
                    {term} mo
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card className="rounded-3xl border-blue-100 bg-blue-50 p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <BadgePercent size={18} className="text-blue-700" />
            <p className="font-semibold text-blue-950">Quotation Summary</p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">SRP</span>
              <span className="font-semibold text-slate-950">
                {formatPhpCurrency(item.price)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Downpayment</span>
              <span className="font-semibold text-slate-950">
                {formatPhpCurrency(normalizedDownPayment)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Principal Financed</span>
              <span className="font-semibold text-slate-950">
                {formatPhpCurrency(estimate.principal)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Estimated Interest</span>
              <span className="font-semibold text-slate-950">
                {formatPhpCurrency(estimatedInterest)}
              </span>
            </div>
            <div className="mt-2 flex justify-between border-t border-blue-100 pt-2">
              <span className="font-semibold text-slate-950">Total Payable</span>
              <span className="font-bold text-slate-950">
                {formatPhpCurrency(estimate.totalPayable)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-blue-800">Estimated Monthly</span>
              <span className="font-bold text-blue-900">
                {formatPhpCurrency(estimate.monthlyPayment)}
              </span>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
            Final amortization and approval still depend on the tenant admin review.
          </div>
        </Card>

        <Card className="rounded-3xl p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <p className="font-semibold text-slate-950">Why this unit may fit</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {item.availableTerms.map((term) => (
              <span
                key={term}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
              >
                {term} month option
              </span>
            ))}
            {item.promoTag ? (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                {item.promoTag}
              </span>
            ) : null}
          </div>
        </Card>

        <Button
          onClick={() => navigate("/user/support")}
          className="w-full rounded-2xl bg-blue-600 text-white hover:bg-blue-700"
        >
          Ask Admin About This Motorcycle
        </Button>
      </div>
    </div>
  );
}
