import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Heart, Search, Bike } from "lucide-react";
import { useNavigate } from "react-router";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { catalogBrands, motorcycleCatalog } from "../../data/motorcycles";
import { estimateLoan, formatPhpCurrency, getDefaultLoanSetup } from "../../lib/financing";
import { getFavoriteCatalogIds, toggleFavoriteCatalogId } from "../../lib/catalog-storage";

export function Catalog() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    setFavorites(getFavoriteCatalogIds());
  }, []);

  const filteredItems = useMemo(() => {
    return motorcycleCatalog.filter((item) => {
      const matchesSearch = `${item.brand} ${item.model}`
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesBrand = selectedBrand === "All" || item.brand === selectedBrand;
      return matchesSearch && matchesBrand;
    });
  }, [search, selectedBrand]);

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
          <h1 className="text-xl font-bold text-gray-900">Motorcycle Catalog</h1>
        </div>
      </div>

      <div className="px-6 py-5 space-y-4">
        <div className="bg-white rounded-xl p-3 border border-gray-200 flex items-center gap-2">
          <Search size={18} className="text-gray-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search brand or model"
            className="w-full text-sm text-gray-900 placeholder:text-gray-500 outline-none"
          />
        </div>

        <div className="bg-white rounded-xl p-3 border border-gray-200">
          <label htmlFor="brand-filter" className="text-xs text-gray-600 block mb-2">
            Filter by brand
          </label>
          <select
            id="brand-filter"
            value={selectedBrand}
            onChange={(event) => setSelectedBrand(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
          >
            <option value="All">All Brands</option>
            {catalogBrands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          {filteredItems.map((item) => {
            const defaultLoan = getDefaultLoanSetup(item);
            const estimate = estimateLoan({
              motorcyclePrice: item.price,
              downPayment: defaultLoan.downPayment,
              months: defaultLoan.months,
              annualInterestRate: defaultLoan.annualInterestRate,
            });
            const isFavorite = favorites.includes(item.id);

            return (
              <Card key={item.id} className="rounded-2xl overflow-hidden">
                <div className="relative h-40">
                  <ImageWithFallback
                    src={item.image}
                    alt={`${item.brand} ${item.model}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => setFavorites(toggleFavoriteCatalogId(item.id))}
                    className="absolute top-3 right-3 bg-white/90 rounded-full p-2 shadow-sm"
                    aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                  >
                    <Heart
                      size={18}
                      className={isFavorite ? "fill-red-500 text-red-500" : "text-gray-700"}
                    />
                  </button>
                  {item.promoTag ? (
                    <span className="absolute top-3 left-3 text-[11px] font-semibold bg-blue-600 text-white px-2 py-1 rounded-full">
                      {item.promoTag}
                    </span>
                  ) : null}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-gray-900">
                        {item.brand} {item.model}
                      </h3>
                      <p className="text-xs text-gray-600 mt-1">
                        {item.year} • {item.engineCc}cc
                      </p>
                    </div>
                    <span
                      className={`text-[11px] px-2 py-1 rounded-full font-semibold ${
                        item.status === "available"
                          ? "bg-green-100 text-green-700"
                          : item.status === "reserved"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {item.status.replaceAll("_", " ")}
                    </span>
                  </div>

                  <div className="mt-3">
                    <p className="text-lg font-bold text-gray-900">{formatPhpCurrency(item.price)}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Est. {formatPhpCurrency(estimate.monthlyPayment)}/month • {defaultLoan.months} months
                    </p>
                  </div>

                  <Button
                    onClick={() => navigate(`/user/catalog/${item.id}`)}
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
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
          <Card className="rounded-xl p-6 text-center">
            <p className="text-sm text-gray-600">
              No motorcycles matched your filter. Try another search or brand.
            </p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
