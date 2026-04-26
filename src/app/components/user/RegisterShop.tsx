import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { Eye, EyeOff, Mail, Store, ChevronLeft } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { completePendingShopRegistration, registerShop } from "../../lib/demo-users";

function toSlugPreview(name: string): string {
    return name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

export function RegisterShop() {
    const navigate = useNavigate();

    const [shopName, setShopName] = useState("");
    const [ownerFullName, setOwnerFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState("");
    const [info, setInfo] = useState("");
    const [loading, setLoading] = useState(false);

    const slugPreview = toSlugPreview(shopName);

    useEffect(() => {
        if (!window.location.search.includes("mode=complete")) return;

        let active = true;
        const finalize = async () => {
            setLoading(true);
            setError("");
            setInfo("Finishing your shop registration...");

            const result = await completePendingShopRegistration();
            if (!active) return;

            setLoading(false);
            if (result.error || !result.user) {
                setInfo("");
                setError(result.error ?? "Unable to finish shop registration.");
                return;
            }

            navigate("/admin", { replace: true });
        };

        void finalize();
        return () => {
            active = false;
        };
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setInfo("");

        if (!slugPreview) {
            setError("Shop name is invalid. Use letters, numbers, or hyphens.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        setLoading(true);
        try {
            const result = await registerShop({
                shopName,
                ownerFullName,
                email,
                phone,
                password,
            });

            if (result.error) {
                setError(result.error);
                return;
            }

            if (result.pendingEmailConfirmation) {
                setInfo(
                    "Check your email and open the confirmation link to finish creating your shop.",
                );
                return;
            }

            navigate("/admin");
        } catch (err) {
            const message = err instanceof Error ? err.message : "Unknown error";
            setError(`Registration failed: ${message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-800 flex items-center justify-center p-4">
            <div className="w-full max-w-[420px] bg-white rounded-3xl p-8 shadow-2xl">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Store className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Register Your Shop</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Set up your motorcycle shop on Morti Pay
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Shop Name
                        </label>
                        <Input
                            type="text"
                            value={shopName}
                            onChange={(e) => setShopName(e.target.value)}
                            placeholder="e.g. Wheeltek Bulacan"
                            className="w-full rounded-xl"
                            required
                        />
                        {slugPreview && (
                            <p className="mt-1 text-xs text-gray-500">
                                Your shop code will be:{" "}
                                <span className="font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                    {slugPreview}
                                </span>
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Owner Full Name
                        </label>
                        <Input
                            type="text"
                            value={ownerFullName}
                            onChange={(e) => setOwnerFullName(e.target.value)}
                            placeholder="e.g. Juan Dela Cruz"
                            className="w-full rounded-xl"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone Number
                        </label>
                        <Input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+63 9XX XXX XXXX"
                            className="w-full rounded-xl"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                        </label>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="owner@yourshop.com"
                            className="w-full rounded-xl"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                        </label>
                        <div className="relative">
                            <Input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="At least 6 characters"
                                className="w-full rounded-xl pr-10"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <Input
                                type={showConfirm ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Re-enter password"
                                className="w-full rounded-xl pr-10"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <p className="text-sm text-red-600 text-center bg-red-50 rounded-xl px-3 py-2">
                            {error}
                        </p>
                    )}

                    {info && (
                        <p className="text-sm text-blue-700 text-center bg-blue-50 rounded-xl px-3 py-2 flex items-center justify-center gap-2">
                            <Mail size={16} />
                            {info}
                        </p>
                    )}

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-xl text-lg"
                    >
                        {loading ? "Creating your shop..." : "Create Shop"}
                    </Button>
                </form>

                <div className="mt-5 text-center">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                    >
                        <ChevronLeft size={16} />
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
