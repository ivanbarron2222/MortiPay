export type LoanTermMonths = 12 | 24 | 36 | 48;

export type MotorcycleCatalogItem = {
  id: string;
  brand: string;
  model: string;
  year: number;
  engineCc: number;
  price: number;
  image: string;
  description: string;
  status: "available" | "reserved" | "out_of_stock";
  downPaymentOptions: number[];
  availableTerms: LoanTermMonths[];
  promoTag?: string;
};

export const motorcycleCatalog: MotorcycleCatalogItem[] = [
  {
    id: "honda-click-125i-2026",
    brand: "Honda",
    model: "Click 125i",
    year: 2026,
    engineCc: 125,
    price: 83500,
    image:
      "https://images.unsplash.com/photo-1558981285-6f0c94958bb6?auto=format&fit=crop&w=1200&q=80",
    description: "Fuel-efficient automatic scooter for city commutes.",
    status: "available",
    downPaymentOptions: [8000, 12000, 16000],
    availableTerms: [12, 24, 36],
    promoTag: "Low Down Payment",
  },
  {
    id: "yamaha-nmax-155-2026",
    brand: "Yamaha",
    model: "NMAX 155",
    year: 2026,
    engineCc: 155,
    price: 151900,
    image:
      "https://images.unsplash.com/photo-1623075421731-cd6b29f5a2f1?auto=format&fit=crop&w=1200&q=80",
    description: "Premium scooter with comfort and solid highway performance.",
    status: "available",
    downPaymentOptions: [15000, 25000, 35000],
    availableTerms: [12, 24, 36, 48],
    promoTag: "Best Seller",
  },
  {
    id: "kawasaki-dominar-400-2026",
    brand: "Kawasaki",
    model: "Dominar 400",
    year: 2026,
    engineCc: 373,
    price: 211000,
    image:
      "https://images.unsplash.com/photo-1619771914272-85a9f62a8f40?auto=format&fit=crop&w=1200&q=80",
    description: "Sport-touring motorcycle for long rides and daily use.",
    status: "reserved",
    downPaymentOptions: [30000, 45000, 60000],
    availableTerms: [24, 36, 48],
  },
  {
    id: "suzuki-burgman-street-2026",
    brand: "Suzuki",
    model: "Burgman Street",
    year: 2026,
    engineCc: 125,
    price: 92900,
    image:
      "https://images.unsplash.com/photo-1571773121825-0422f73f8f89?auto=format&fit=crop&w=1200&q=80",
    description: "Comfort-focused scooter with wide seat and practical storage.",
    status: "available",
    downPaymentOptions: [10000, 14000, 18000],
    availableTerms: [12, 24, 36],
    promoTag: "Free Helmet Promo",
  },
  {
    id: "ktm-duke-200-2026",
    brand: "KTM",
    model: "Duke 200",
    year: 2026,
    engineCc: 200,
    price: 127000,
    image:
      "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1200&q=80",
    description: "Lightweight street bike with aggressive styling.",
    status: "out_of_stock",
    downPaymentOptions: [14000, 20000, 26000],
    availableTerms: [12, 24, 36],
  },
  {
    id: "honda-pcx-160-2026",
    brand: "Honda",
    model: "PCX 160",
    year: 2026,
    engineCc: 157,
    price: 133900,
    image:
      "https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?auto=format&fit=crop&w=1200&q=80",
    description: "Smart urban scooter with larger body and premium features.",
    status: "available",
    downPaymentOptions: [15000, 22000, 30000],
    availableTerms: [12, 24, 36, 48],
    promoTag: "0% Processing Fee",
  },
];

export const catalogBrands = Array.from(
  new Set(motorcycleCatalog.map((item) => item.brand)),
);
