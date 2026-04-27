import { useEffect, useState } from "react";
import { Bike, Plus, Save, Settings, Trash2 } from "lucide-react";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  getDefaultOverdueSettings,
  getOverdueSettings,
  getTenantCatalog,
  removeTenantCatalogItem,
  saveOverdueSettings,
  saveTenantCatalog,
  upsertTenantCatalogItem,
  type OverdueFeeType,
  type OverdueSettings,
  type TenantCatalogItem,
} from "../../lib/tenant-config";
import { formatPhpCurrency } from "../../lib/financing";

const emptyCatalogForm: Partial<TenantCatalogItem> = {
  brand: "",
  model: "",
  year: new Date().getFullYear(),
  engineCc: 125,
  price: 0,
  image: "",
  description: "",
  status: "available",
  downPaymentOptions: [0],
  availableTerms: [12, 24, 36],
  promoTag: "",
  visible: true,
};

function parseNumberList(value: string) {
  return value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => !Number.isNaN(item) && item >= 0);
}

export function AdminSettings() {
  const [settings, setSettings] = useState<OverdueSettings>(getDefaultOverdueSettings());
  const [catalog, setCatalog] = useState<TenantCatalogItem[]>([]);
  const [form, setForm] = useState<Partial<TenantCatalogItem>>(emptyCatalogForm);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setSettings(getOverdueSettings());
    setCatalog(getTenantCatalog());
  }, []);

  const saveSettings = () => {
    saveOverdueSettings(settings);
    setMessage("Overdue settings saved.");
  };

  const editItem = (item: TenantCatalogItem) => {
    setForm(item);
    setMessage("");
  };

  const resetForm = () => {
    setForm({ ...emptyCatalogForm, id: undefined });
  };

  const saveCatalogItem = () => {
    try {
      const saved = upsertTenantCatalogItem(form);
      setCatalog(getTenantCatalog());
      setForm(saved);
      setMessage("Catalog item saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save catalog item.");
    }
  };

  const deleteItem = (id: string) => {
    removeTenantCatalogItem(id);
    setCatalog(getTenantCatalog());
    resetForm();
    setMessage("Catalog item removed.");
  };

  const toggleVisibility = (item: TenantCatalogItem) => {
    const next = catalog.map((entry) =>
      entry.id === item.id ? { ...entry, visible: !entry.visible } : entry,
    );
    saveTenantCatalog(next);
    setCatalog(next);
  };

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Admin Settings</h1>
        <p className="text-gray-600">
          Configure overdue penalties and manage the motorcycles shown in the user catalog.
        </p>
      </div>

      {message ? (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {message}
        </div>
      ) : null}

      <Card className="rounded-xl p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-full bg-blue-50 p-3 text-blue-700">
            <Settings size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Overdue Payment Rules</h2>
            <p className="text-sm text-gray-600">
              Fees are automatically calculated per unpaid installment after the grace period.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-3 text-sm">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(event) =>
                setSettings((current) => ({ ...current, enabled: event.target.checked }))
              }
            />
            Enable overdue fees
          </label>
          <label className="text-sm font-medium text-gray-700">
            Grace Period Days
            <Input
              type="number"
              min={0}
              value={settings.gracePeriodDays}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  gracePeriodDays: Number(event.target.value),
                }))
              }
              className="mt-2"
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Fee Type
            <select
              value={settings.feeType}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  feeType: event.target.value as OverdueFeeType,
                }))
              }
              className="mt-2 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
            >
              <option value="fixed">Fixed per installment</option>
              <option value="percentage">Percentage of installment</option>
              <option value="daily">Daily fee</option>
            </select>
          </label>
          <label className="text-sm font-medium text-gray-700">
            Fee Amount
            <Input
              type="number"
              min={0}
              value={settings.feeAmount}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  feeAmount: Number(event.target.value),
                }))
              }
              className="mt-2"
            />
          </label>
        </div>
        <button
          onClick={saveSettings}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Save size={16} />
          Save Overdue Rules
        </button>
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="rounded-xl p-6 xl:col-span-1">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-full bg-green-50 p-3 text-green-700">
              <Plus size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {form.id ? "Edit Motorcycle" : "Add Motorcycle"}
              </h2>
              <p className="text-sm text-gray-600">Changes appear in the user catalog.</p>
            </div>
          </div>

          <div className="space-y-3">
            <Input
              placeholder="Brand"
              value={form.brand ?? ""}
              onChange={(event) => setForm((current) => ({ ...current, brand: event.target.value }))}
            />
            <Input
              placeholder="Model"
              value={form.model ?? ""}
              onChange={(event) => setForm((current) => ({ ...current, model: event.target.value }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                placeholder="Year"
                value={form.year ?? ""}
                onChange={(event) =>
                  setForm((current) => ({ ...current, year: Number(event.target.value) }))
                }
              />
              <Input
                type="number"
                placeholder="Engine CC"
                value={form.engineCc ?? ""}
                onChange={(event) =>
                  setForm((current) => ({ ...current, engineCc: Number(event.target.value) }))
                }
              />
            </div>
            <Input
              type="number"
              placeholder="Price"
              value={form.price ?? ""}
              onChange={(event) => setForm((current) => ({ ...current, price: Number(event.target.value) }))}
            />
            <Input
              placeholder="Image URL"
              value={form.image ?? ""}
              onChange={(event) => setForm((current) => ({ ...current, image: event.target.value }))}
            />
            <Textarea
              placeholder="Description"
              value={form.description ?? ""}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              className="min-h-24"
            />
            <Input
              placeholder="Downpayments, comma-separated"
              value={(form.downPaymentOptions ?? []).join(", ")}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  downPaymentOptions: parseNumberList(event.target.value),
                }))
              }
            />
            <Input
              placeholder="Terms, comma-separated: 12, 24, 36, 48"
              value={(form.availableTerms ?? []).join(", ")}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  availableTerms: parseNumberList(event.target.value) as TenantCatalogItem["availableTerms"],
                }))
              }
            />
            <Input
              placeholder="Promo tag"
              value={form.promoTag ?? ""}
              onChange={(event) =>
                setForm((current) => ({ ...current, promoTag: event.target.value }))
              }
            />
            <select
              value={form.status ?? "available"}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value as TenantCatalogItem["status"],
                }))
              }
              className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
            >
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="out_of_stock">Out of stock</option>
            </select>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.visible ?? true}
                onChange={(event) =>
                  setForm((current) => ({ ...current, visible: event.target.checked }))
                }
              />
              Visible in user catalog
            </label>
            <div className="flex gap-2">
              <button
                onClick={saveCatalogItem}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Save size={16} />
                Save
              </button>
              <button
                onClick={resetForm}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                New
              </button>
            </div>
          </div>
        </Card>

        <Card className="rounded-xl p-6 xl:col-span-2">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-full bg-blue-50 p-3 text-blue-700">
              <Bike size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Tenant Catalog</h2>
              <p className="text-sm text-gray-600">{catalog.length} motorcycle units configured.</p>
            </div>
          </div>

          <div className="space-y-3">
            {catalog.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-semibold text-gray-900">
                    {item.brand} {item.model}
                  </p>
                  <p className="text-sm text-gray-600">
                    {item.year} | {item.engineCc}cc | {formatPhpCurrency(item.price)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {item.visible ? "Visible" : "Hidden"} | {item.status.replaceAll("_", " ")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => editItem(item)}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleVisibility(item)}
                    className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                  >
                    {item.visible ? "Hide" : "Show"}
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
