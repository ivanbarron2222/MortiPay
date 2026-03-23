import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Heart, Search, Bike } from "lucide-react";
import { useNavigate } from "react-router";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { motorcycleCatalog } from "../../data/motorcycles";
import { estimateLoan, formatPhpCurrency, getDefaultLoanSetup } from "../../lib/financing";
import { getFavoriteCatalogIds, toggleFavoriteCatalogId } from "../../lib/catalog-storage";

export function Catalog() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    setFavorites(getFavoriteCatalogIds());
  }, []);

  const filteredItems = useMemo(() => {
    return motorcycleCatalog.filter((item) => {
      const matchesSearch = `${item.brand} ${item.model} ${item.engineCc}`
        .toLowerCase()
        .includes(search.toLowerCase());
      return matchesSearch;
    });
  }, [search]);

  const getEstimate = (price: number, itemId: string) => {
    const item = motorcycleCatalog.find((catalogItem) => catalogItem.id === itemId);
    if (!item) return null;
    const defaultLoan = getDefaultLoanSetup(item);
    return estimateLoan({
      motorcyclePrice: price,
      downPayment: defaultLoan.downPayment,
      months: defaultLoan.months,
      annualInterestRate: defaultLoan.annualInterestRate,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center">
          <button
            onClick={() => navigate("/user")}
            className="mr-4 text-gray-700 hover:text-gray-900"
            aria-label="Go back to home"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Motorcycle Catalog</h1>
            <p className="text-sm text-slate-500">Browse units and preview financing options</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-4 py-5 sm:px-6">
        <Card className="rounded-3xl bg-slate-950 p-4 text-white shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Find your next ride</p>
          <h2 className="mt-2 text-2xl font-bold">Explore motorcycles with financing previews</h2>
          <div className="mt-4 rounded-2xl bg-white px-3 py-3 text-slate-900">
            <div className="flex items-center gap-2">
              <Search size={18} className="text-slate-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search brand, model, or engine size"
                className="w-full text-sm placeholder:text-slate-400 outline-none"
              />
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Available Units</h2>
            <p className="text-sm text-slate-500">
              {filteredItems.length} result{filteredItems.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {filteredItems.map((item) => {
            const defaultLoan = getDefaultLoanSetup(item);
            const estimate = getEstimate(item.price, item.id);
            const isFavorite = favorites.includes(item.id);

            return (
              <Card key={item.id} className="overflow-hidden rounded-3xl shadow-sm">
                <div className="relative h-48">
                  <ImageWithFallback
                    src={item.image}
                    alt={`${item.brand} ${item.model}`}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <div className="absolute left-3 right-3 top-3 flex items-start justify-between gap-3">
                    {item.promoTag ? (
                      <span className="rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold text-slate-950">
                        {item.promoTag}
                      </span>
                    ) : (
                      <span />
                    )}
                    <button
                      onClick={() => setFavorites(toggleFavoriteCatalogId(item.id))}
                      className="rounded-full bg-white/90 p-2 shadow-sm"
                      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Heart
                        size={18}
                        className={isFavorite ? "fill-rose-500 text-rose-500" : "text-slate-700"}
                      />
                    </button>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <div>
                      <h3 className="text-xl font-bold">
                        {item.brand} {item.model}
                      </h3>
                      <p className="mt-1 text-sm text-white/85">
                        {item.year} • {item.engineCc}cc
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 p-4">
                  <p className="text-sm text-slate-600">{item.description}</p>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-100 p-4">
                      <p className="text-sm text-slate-500">SRP</p>
                      <p className="mt-1 text-2xl font-bold text-slate-950">
                        {formatPhpCurrency(item.price)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-blue-50 p-4">
                      <p className="text-sm text-blue-700">Estimated Monthly</p>
                      <p className="mt-1 text-2xl font-bold text-slate-950">
                        {estimate ? formatPhpCurrency(estimate.monthlyPayment) : "-"}
                      </p>
                      <p className="mt-1 text-xs text-blue-700">
                        {defaultLoan.months} months • Downpayment{" "}
                        {formatPhpCurrency(defaultLoan.downPayment)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {item.availableTerms.map((term) => (
                      <span
                        key={term}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                      >
                        {term} months
                      </span>
                    ))}
                  </div>

                  <Button
                    onClick={() => navigate(`/user/catalog/${item.id}`)}
                    className="w-full rounded-2xl bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <Bike className="mr-2" size={16} />
                    View Financing
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {filteredItems.length === 0 ? (
          <Card className="rounded-3xl p-6 text-center">
            <p className="text-sm text-slate-500">
              No motorcycles matched your filter. Try another search or brand.
            </p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
