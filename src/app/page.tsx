"use client";

import {
  Bell,
  Boxes,
  Camera,
  ChevronDown,
  CircleHelp,
  ClipboardCheck,
  FileSpreadsheet,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PackagePlus,
  Search,
  Settings,
  Sparkles,
  Sun,
  Warehouse,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AccountInfo,
  DashboardSummary,
  Location,
  Product,
  PurchaseRecord,
  formatLongDate,
  initials,
  mapProduct,
} from "@/lib/ui";
import { Toast } from "@/components/ui";
import { DashboardView } from "@/components/dashboard-view";
import { ProductsView } from "@/components/products-view";
import { PurchasesView } from "@/components/purchases-view";
import { LocationsView } from "@/components/locations-view";
import { ImportView } from "@/components/import-view";
import { StockCountView } from "@/components/stock-count-view";
import { ScanReceiptView } from "@/components/scan-receipt-view";
import { SettingsView } from "@/components/settings-view";
import { HelpView } from "@/components/help-view";
import { AiPanel } from "@/components/ai-panel";
import { AddProductModal, ProductFormValues, StockActionModal } from "@/components/inventory-modals";

type PageKey =
  | "ringkasan"
  | "barang"
  | "pembelian"
  | "lokasi"
  | "import"
  | "stock-count"
  | "scan-nota"
  | "pengaturan"
  | "bantuan";

const mainNav: { key: PageKey; label: string; short: string; icon: typeof LayoutDashboard }[] = [
  { key: "ringkasan", label: "Ringkasan", short: "Ringkasan", icon: LayoutDashboard },
  { key: "barang", label: "Barang", short: "Barang", icon: Boxes },
  { key: "pembelian", label: "Pembelian", short: "Beli", icon: PackagePlus },
  { key: "lokasi", label: "Lokasi", short: "Lokasi", icon: Warehouse },
  { key: "import", label: "Import data", short: "Import", icon: FileSpreadsheet },
  { key: "stock-count", label: "Stock Count", short: "Hitung", icon: ClipboardCheck },
  { key: "scan-nota", label: "Scan Nota", short: "Scan", icon: Camera },
];

const otherNav: { key: PageKey; label: string; short: string; icon: typeof Settings }[] = [
  { key: "pengaturan", label: "Pengaturan", short: "Akun", icon: Settings },
  { key: "bantuan", label: "Bantuan", short: "Bantuan", icon: CircleHelp },
];

const mobileDock: PageKey[] = ["ringkasan", "barang", "pembelian", "lokasi"];

const titles: Record<PageKey, string> = {
  ringkasan: "Ringkasan",
  barang: "Barang",
  pembelian: "Pembelian",
  lokasi: "Lokasi",
  import: "Import data",
  "stock-count": "Stock Count",
  "scan-nota": "Scan Nota",
  pengaturan: "Pengaturan",
  bantuan: "Bantuan",
};

type Notice = { kind: "success" | "error"; message: string };

export default function Home() {
  const router = useRouter();
  const [active, setActive] = useState<PageKey>("ringkasan");
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [showAdd, setShowAdd] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAi, setShowAi] = useState(false);
  const [stockAction, setStockAction] = useState<{ product: Product; type: "KELUAR" | "PINDAH" } | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [todayLabel, setTodayLabel] = useState("");
  const [todayShort, setTodayShort] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const notify = useCallback((kind: Notice["kind"], message: string) => {
    setNotice({ kind, message });
  }, []);

  const loadData = useCallback(async () => {
    try {
      const responses = await Promise.all([
        fetch("/api/products"),
        fetch("/api/locations"),
        fetch("/api/purchases"),
        fetch("/api/dashboard"),
        fetch("/api/account"),
      ]);
      if (responses.some((response) => response.status === 401)) {
        router.replace("/login");
        return;
      }
      if (!responses.every((response) => response.ok)) {
        setLoadError("Sebagian data gagal dimuat. Coba muat ulang.");
        return;
      }
      const [productData, locationData, purchaseData, dashboardData, accountData] = await Promise.all(
        responses.map((response) => response.json()),
      );

      setProducts((productData as Parameters<typeof mapProduct>[0][]).map(mapProduct));
      setLocations(locationData as Location[]);
      setPurchases(
        (purchaseData as {
          id: string;
          purchaseDate: string;
          supplier?: { name: string } | null;
          invoiceNo?: string | null;
          items: { product?: { name: string } | null }[];
          totalCost: number;
          cancelledAt?: string | null;
        }[]).map((item) => {
          const names = item.items.map((entry) => entry.product?.name).filter(Boolean) as string[];
          const label = names.slice(0, 2).join(", ") + (names.length > 2 ? ` +${names.length - 2}` : "");
          return {
            id: item.id,
            date: new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(
              new Date(item.purchaseDate),
            ),
            supplier: item.supplier?.name ?? "Tanpa pemasok",
            invoiceNo: item.invoiceNo ?? null,
            items: item.items.length,
            itemLabel: label || `${item.items.length} barang`,
            total: item.totalCost,
            status: item.cancelledAt ? "Dibatalkan" : "Tersimpan",
          };
        }),
      );
      setSummary(dashboardData as DashboardSummary);
      setAccount(accountData as AccountInfo);
      setLoadError("");
    } catch {
      setLoadError("Koneksi bermasalah saat memuat data.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // Initial data fetch: state is filled once from the API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, [loadData]);

  useEffect(() => {
    // Client-only clock to avoid evaluating the current time during prerender.
    const now = new Date();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTodayLabel(formatLongDate(now));
    setTodayShort(new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(now));
  }, []);

  useEffect(() => {
    // Theme is applied before paint by the inline script in layout.tsx.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (document.documentElement.dataset.theme === "dark") setTheme("dark");
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape") {
        setNotifOpen(false);
        setUserOpen(false);
        setMobileMenu(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const filteredProducts = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return products;
    return products.filter((product) =>
      [product.name, product.category, product.sku, product.locations.map((location) => location.name).join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [products, query]);

  const lowStockProducts = useMemo(() => products.filter((product) => product.status !== "Aman"), [products]);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("wd-theme", next);
    } catch {
      /* theme stays for this session */
    }
  }

  function navigate(page: PageKey) {
    setActive(page);
    setMobileMenu(false);
    setNotifOpen(false);
    setUserOpen(false);
    if (page !== "barang") setQuery("");
  }

  function openProductsForLocation(location: Location) {
    setQuery(location.name);
    setActive("barang");
  }

  async function logout() {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) {
        notify("error", "Logout gagal. Silakan coba lagi.");
        return;
      }
      router.push("/login");
      router.refresh();
    } catch {
      notify("error", "Logout gagal karena koneksi bermasalah.");
    }
  }

  async function saveProduct(values: ProductFormValues, id?: string) {
    const response = await fetch("/api/products", {
      method: id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(id ? { id, ...values } : values),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) return { ok: false as const, error: body?.error ?? "Barang gagal disimpan." };
    await loadData();
    notify("success", id ? `${values.name} berhasil diperbarui.` : `${values.name} berhasil ditambahkan.`);
    return { ok: true as const };
  }

  async function deleteProduct(product: Product) {
    if (!window.confirm(`Hapus ${product.name}? Barang akan diarsipkan dan tidak tampil di daftar.`)) return;
    const response = await fetch("/api/products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: product.id }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      notify("error", body?.error ?? "Barang gagal dihapus.");
      return;
    }
    await loadData();
    notify("success", `${product.name} berhasil dihapus.`);
  }

  function renderView() {
    if (loading) return <DashboardSkeleton />;

    if (active === "ringkasan") {
      return summary ? (
        <DashboardView
          summary={summary}
          products={products}
          onAdd={() => setShowAdd(true)}
          onAi={() => setShowAi(true)}
          onNavigate={navigate}
          onEdit={setEditingProduct}
          onDelete={deleteProduct}
        />
      ) : (
        <div className="rounded-2xl border border-[#f0d6d1] bg-[#fff8f6] p-5 text-sm text-[#a45b4f]">
          Ringkasan gagal dimuat.{" "}
          <button type="button" onClick={() => void loadData()} className="font-semibold underline">
            Coba lagi
          </button>
        </div>
      );
    }

    if (active === "barang") {
      return (
        <ProductsView
          products={filteredProducts}
          query={query}
          onAdd={() => setShowAdd(true)}
          onEdit={setEditingProduct}
          onDelete={deleteProduct}
          onStock={(product, type) => setStockAction({ product, type })}
        />
      );
    }

    if (active === "pembelian") {
      return (
        <PurchasesView
          purchases={purchases}
          products={products}
          locations={locations}
          onSaved={loadData}
          notify={notify}
        />
      );
    }

    if (active === "lokasi") {
      return (
        <LocationsView locations={locations} onSaved={loadData} onOpenProducts={openProductsForLocation} notify={notify} />
      );
    }

    if (active === "import") return <ImportView onImported={loadData} notify={notify} />;

    if (active === "stock-count") {
      return <StockCountView products={products} locations={locations} onSaved={loadData} notify={notify} />;
    }

    if (active === "scan-nota") {
      return (
        <ScanReceiptView
          products={products}
          locations={locations}
          onSaved={loadData}
          onManual={() => setActive("pembelian")}
          notify={notify}
        />
      );
    }

    if (active === "pengaturan" && account) {
      return (
        <SettingsView
          account={account}
          onAccountUpdated={(updated) => {
            setAccount(updated);
            setSummary((current) => (current ? { ...current, user: { ...current.user, name: updated.name } } : current));
          }}
          onLogout={logout}
          notify={notify}
        />
      );
    }

    if (active === "bantuan") return <HelpView onNavigate={(page) => navigate(page)} />;

    return <DashboardSkeleton />;
  }

  const displayName = account?.name ?? summary?.user.name ?? "Pengguna";
  const roleLabel = account?.role === "OWNER" ? "Pemilik" : "Akun terverifikasi";

  function DockButton({
    page,
    label,
    icon: Icon,
  }: {
    page: PageKey;
    label: string;
    icon: typeof LayoutDashboard;
  }) {
    return (
      <button
        type="button"
        onClick={() => navigate(page)}
        aria-label={label}
        aria-current={active === page ? "page" : undefined}
      >
        <Icon />
        <span className="wd-dock-label">{label.length > 9 ? label.split(" ")[0] : label}</span>
        <span className="wd-dock-tip" aria-hidden="true">{label}</span>
      </button>
    );
  }

  return (
    <div className="wd-shell">
      <div className="wd-surround">
        <header className="wd-top">
          <div className="wd-brand">
            <span className="wd-logo" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3.4 6.2 7 17.8l5-7.6 5 7.6 3.6-11.6" />
              </svg>
            </span>
            <div>
              <strong>Wareflow</strong>
              <small>{todayLabel || todayShort || "Manajemen inventaris"}</small>
            </div>
          </div>

          <div className="wd-ask">
            <Search aria-hidden="true" />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                if (event.target.value && active !== "barang") setActive("barang");
              }}
              placeholder="Cari barang, SKU, lokasi..."
              aria-label="Cari barang"
            />
            <kbd aria-hidden="true">⌘K</kbd>
            <button
              type="button"
              className="wd-ask-ai"
              onClick={() => setShowAi(true)}
              aria-label="Buka Tanya Stok"
              title="Tanya Stok"
            >
              <span className="wd-orb" aria-hidden="true" />
            </button>
          </div>

          <div className="wd-actions">
            <button
              type="button"
              className="wd-icon-btn"
              onClick={toggleTheme}
              aria-label={theme === "light" ? "Aktifkan tema gelap" : "Aktifkan tema terang"}
              title={theme === "light" ? "Tema gelap" : "Tema terang"}
            >
              {theme === "light" ? <Moon /> : <Sun />}
            </button>

            <div className="relative">
              <button
                type="button"
                className="wd-icon-btn"
                aria-label="Notifikasi"
                aria-expanded={notifOpen}
                onClick={() => {
                  setNotifOpen((current) => !current);
                  setUserOpen(false);
                }}
              >
                <Bell />
                {lowStockProducts.length > 0 && <span className="wd-notice-dot" />}
              </button>
              {notifOpen && (
                <>
                  <button type="button" aria-label="Tutup notifikasi" onClick={() => setNotifOpen(false)} className="fixed inset-0 z-30 cursor-default" />
                  <div className="wd-pop right-0 top-[52px] w-[290px]">
                    <div className="flex items-center justify-between px-2 py-1">
                      <p className="text-xs font-bold">Perlu perhatian</p>
                      <span className="text-[10px] text-[#8b959d]">{lowStockProducts.length} barang</span>
                    </div>
                    {lowStockProducts.length === 0 ? (
                      <p className="mt-2 rounded-lg bg-[#f4fbf9] p-3 text-[11px] text-[#2b806f]">Semua stok aman.</p>
                    ) : (
                      <div className="mt-2 space-y-1">
                        {lowStockProducts.slice(0, 5).map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => {
                              setQuery(product.name);
                              setActive("barang");
                              setNotifOpen(false);
                            }}
                            className="wd-menu-item justify-between"
                          >
                            <span className="min-w-0 truncate">{product.name}</span>
                            <span className={`shrink-0 text-[9px] font-bold ${product.status === "Habis" ? "text-[#d97163]" : "text-[#c5892b]"}`}>
                              {product.status}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setActive("barang");
                        setNotifOpen(false);
                      }}
                      className="mt-2 w-full rounded-lg border border-[#eef0f2] py-2 text-[10px] font-semibold text-[#69757e] hover:bg-[#f8fafb]"
                    >
                      Lihat semua barang
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                className="wd-avatar"
                aria-label="Menu akun"
                aria-expanded={userOpen}
                onClick={() => {
                  setUserOpen((current) => !current);
                  setNotifOpen(false);
                }}
              >
                <i aria-hidden="true">{initials(displayName)}</i>
                <div className="hidden text-left sm:block">
                  <span>{displayName}</span>
                  <small>{roleLabel}</small>
                </div>
                <ChevronDown size={14} className="hidden text-[#9ba4ac] sm:block" />
              </button>
              {userOpen && (
                <>
                  <button type="button" aria-label="Tutup menu akun" onClick={() => setUserOpen(false)} className="fixed inset-0 z-30 cursor-default" />
                  <div className="wd-pop right-0 top-[52px] w-[250px]">
                    <div className="px-3 py-2">
                      <p className="truncate text-xs font-bold">{displayName}</p>
                      <p className="mt-0.5 truncate text-[10px] text-[#8b959d]">{account?.email}</p>
                    </div>
                    <div className="my-1 h-px bg-[#eef0f2]" />
                    <button type="button" className="wd-menu-item" onClick={() => navigate("pengaturan")}>
                      <Settings /> Pengaturan akun
                    </button>
                    <button type="button" className="wd-menu-item" onClick={() => navigate("bantuan")}>
                      <CircleHelp /> Bantuan
                    </button>
                    <button type="button" className="wd-menu-item" data-danger="true" onClick={logout}>
                      <LogOut /> Keluar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="wd-stage-wrap">
          <nav className="wd-dock hidden lg:flex" aria-label="Navigasi utama">
            {mainNav.map((item) => (
              <DockButton key={item.key} page={item.key} label={item.label} icon={item.icon} />
            ))}
            <span className="wd-dock-sep" aria-hidden="true" />
            {otherNav.map((item) => (
              <DockButton key={item.key} page={item.key} label={item.label} icon={item.icon} />
            ))}
          </nav>

          <main className="wd-stage">
            <div className="wd-stage-inner">
              {loadError && (
                <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-[#f0d6d1] bg-[#fff8f6] px-4 py-3 text-xs text-[#a45b4f]">
                  <span>{loadError}</span>
                  <button type="button" onClick={() => void loadData()} className="shrink-0 font-semibold underline">
                    Muat ulang
                  </button>
                </div>
              )}
              <div key={active} className="wd-rise">
                {renderView()}
              </div>
            </div>
          </main>
        </div>

        <footer className="wd-footer">
          <span>{todayShort || "Wareflow"} · {titles[active]}</span>
          <a
            href="https://commons.wikimedia.org/wiki/File:Warehouse_interior_showcasing_organized_shelving_and_packages.jpg"
            target="_blank"
            rel="noreferrer"
          >
            Foto: Shixart1985 / Wikimedia · CC BY 2.0
          </a>
        </footer>
      </div>

      <nav className="wd-dock flex lg:hidden" aria-label="Navigasi utama">
        {mobileDock.map((key) => {
          const item = [...mainNav, ...otherNav].find((entry) => entry.key === key)!;
          return <DockButton key={key} page={key} label={item.short} icon={item.icon} />;
        })}
        <button type="button" onClick={() => setMobileMenu(true)} aria-label="Semua menu" aria-expanded={mobileMenu}>
          <Menu />
          <span className="wd-dock-label">Menu</span>
        </button>
      </nav>

      {mobileMenu && (
        <div className="fixed inset-0 z-50 flex items-end bg-[#16252b]/35 backdrop-blur-sm lg:hidden">
          <button type="button" aria-label="Tutup menu" onClick={() => setMobileMenu(false)} className="absolute inset-0 cursor-default" />
          <div className="relative w-full wd-sheet rounded-t-[26px] border border-[#e6e9ed] p-5 pb-8">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">Menu</p>
                <p className="mt-0.5 text-[11px] text-[#8b959d]">{displayName} · {roleLabel}</p>
              </div>
              <button type="button" aria-label="Tutup" onClick={() => setMobileMenu(false)} className="rounded-full border border-[#e1e6e8] p-2">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[...mainNav, ...otherNav].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => navigate(item.key)}
                    className={`flex flex-col items-start gap-2 rounded-xl border p-3 text-left text-[11px] font-semibold ${
                      active === item.key ? "border-[#cfe0db] bg-[#f8fafb]" : "border-[#e6e9ed] bg-[#f8fafb]"
                    }`}
                  >
                    <Icon size={17} />
                    {item.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowAi(true);
                  setMobileMenu(false);
                }}
                className="flex items-center justify-center gap-2 rounded-xl border border-[#e1e6e8] bg-[#f8fafb] py-3 text-[11px] font-semibold"
              >
                <Sparkles size={15} /> Tanya Stok
              </button>
              <button
                type="button"
                onClick={logout}
                className="flex items-center justify-center gap-2 rounded-xl border border-[#f0d6d1] bg-[#f8fafb] py-3 text-[11px] font-semibold text-[#c96c5e]"
              >
                <LogOut size={15} /> Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <AddProductModal
          locations={locations}
          onClose={() => setShowAdd(false)}
          onSubmit={(values) => saveProduct(values)}
        />
      )}
      {editingProduct && (
        <AddProductModal
          product={editingProduct}
          locations={locations}
          onClose={() => setEditingProduct(null)}
          onSubmit={(values) => saveProduct(values, editingProduct.id)}
        />
      )}
      {stockAction && (
        <StockActionModal
          product={stockAction.product}
          type={stockAction.type}
          locations={locations}
          onClose={() => setStockAction(null)}
          onSaved={async () => {
            await loadData();
            notify("success", "Perubahan stok berhasil disimpan.");
          }}
        />
      )}
      {showAi && <AiPanel onClose={() => setShowAi(false)} />}
      {notice && <Toast kind={notice.kind} message={notice.message} onClose={() => setNotice(null)} />}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="h-8 w-64 rounded-xl bg-[#e9edf0]" />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="h-28 rounded-2xl border border-[#e6e9ed] bg-white p-4">
            <div className="h-9 w-9 rounded-xl bg-[#eef1f3]" />
            <div className="mt-3 h-3 w-24 rounded bg-[#eef1f3]" />
            <div className="mt-2 h-6 w-28 rounded bg-[#e9edf0]" />
          </div>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <div className="h-64 rounded-2xl border border-[#e6e9ed] bg-white" />
        <div className="h-64 rounded-2xl border border-[#e6e9ed] bg-white" />
      </div>
    </div>
  );
}
