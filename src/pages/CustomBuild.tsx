import { lazy, Suspense, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";

type BuildPart = "cpu" | "gpu" | "motherboard" | "case" | "ram" | "storage" | "cooling";

type BuildOption = {
  label: string;
  price: number;
};

type AccessoryOption = {
  key: string;
  label: string;
  price: number;
};

const partOptions: Record<BuildPart, BuildOption[]> = {
  cpu: [
    { label: "None", price: 0 },
    { label: "Intel Core i3", price: 150 },
    { label: "Intel Core i5", price: 230 },
    { label: "Intel Core i7", price: 360 },
    { label: "Intel Core i9", price: 620 },
    { label: "AMD Ryzen 3", price: 140 },
    { label: "AMD Ryzen 5", price: 250 },
    { label: "AMD Ryzen 7", price: 390 },
    { label: "AMD Ryzen 9", price: 650 },
  ],
  gpu: [
    { label: "None", price: 0 },
    { label: "NVIDIA RTX 3050", price: 260 },
    { label: "NVIDIA RTX 4060", price: 380 },
    { label: "NVIDIA RTX 4070", price: 620 },
    { label: "NVIDIA RTX 4070 Ti", price: 840 },
    { label: "NVIDIA RTX 4080 Super", price: 1250 },
  ],
  motherboard: [
    { label: "None", price: 0 },
    { label: "MSI B650", price: 180 },
    { label: "ASUS TUF B760", price: 220 },
    { label: "Gigabyte X670", price: 320 },
    { label: "ASUS ROG Z790", price: 420 },
  ],
  case: [
    { label: "None", price: 0 },
    { label: "Mid Tower Basic", price: 65 },
    { label: "Mid Tower RGB", price: 110 },
    { label: "ATX Airflow", price: 145 },
    { label: "Premium Tempered Glass", price: 220 },
  ],
  ram: [
    { label: "None", price: 0 },
    { label: "8GB DDR5", price: 55 },
    { label: "16GB DDR5", price: 85 },
    { label: "32GB DDR5", price: 155 },
    { label: "64GB DDR5", price: 295 },
    { label: "96GB DDR5", price: 430 },
    { label: "128GB DDR5", price: 560 },
  ],
  storage: [
    { label: "None", price: 0 },
    { label: "500GB NVMe SSD", price: 55 },
    { label: "1TB NVMe SSD", price: 90 },
    { label: "2TB NVMe SSD", price: 165 },
    { label: "4TB NVMe SSD", price: 340 },
    { label: "2TB HDD + 1TB SSD", price: 135 },
    { label: "4TB HDD + 1TB SSD", price: 190 },
    { label: "8TB HDD + 2TB SSD", price: 360 },
  ],
  cooling: [
    { label: "None", price: 0 },
    { label: "Stock Cooler", price: 20 },
    { label: "Air Cooler", price: 45 },
    { label: "Dual-Tower Air Cooler", price: 75 },
    { label: "AIO 120mm", price: 85 },
    { label: "AIO 240mm", price: 115 },
    { label: "AIO 360mm", price: 170 },
    { label: "Custom Water Loop", price: 420 },
  ],
};

const accessoryOptions: AccessoryOption[] = [
  { key: "keyboard", label: "Mechanical Keyboard", price: 70 },
  { key: "mouse", label: "Gaming Mouse", price: 45 },
  { key: "headset", label: "Headset", price: 80 },
  { key: "monitor", label: "27\" Gaming Monitor", price: 260 },
  { key: "mousepad", label: "Extended Mousepad", price: 25 },
  { key: "webcam", label: "Full HD Webcam", price: 60 },
  { key: "mic", label: "Streaming Microphone", price: 120 },
  { key: "speakers", label: "Desktop Speakers", price: 75 },
  { key: "wifi", label: "Wi-Fi Adapter", price: 35 },
  { key: "capture", label: "Capture Card", price: 180 },
  { key: "controller", label: "Wireless Controller", price: 65 },
  { key: "chair", label: "Gaming Chair", price: 320 },
];

const initialSelection: Record<BuildPart, number> = {
  cpu: 0,
  gpu: 0,
  motherboard: 0,
  case: 0,
  ram: 0,
  storage: 0,
  cooling: 0,
};

const buildParts = Object.keys(partOptions) as BuildPart[];
const PcPreview3D = lazy(() => import("@/components/PcPreview3D"));

const CustomBuild = () => {
  const { addToCart } = useCart();
  const [selected, setSelected] = useState<Record<BuildPart, number>>(initialSelection);
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [cartMessage, setCartMessage] = useState("");

  const partsTotal = useMemo(() => {
    return buildParts.reduce((sum, part) => sum + partOptions[part][selected[part]].price, 0);
  }, [selected]);

  const accessoriesTotal = useMemo(() => {
    return selectedAccessories.reduce((sum, key) => {
      const item = accessoryOptions.find((acc) => acc.key === key);
      return item ? sum + item.price : sum;
    }, 0);
  }, [selectedAccessories]);

  const total = partsTotal + accessoriesTotal;
  const formatPrice = (value: number) => `${value.toLocaleString()} DT`;
  const previewConfig = useMemo(
    () => ({
      cpuTier: selected.cpu,
      gpuTier: selected.gpu,
      motherboardTier: selected.motherboard,
      caseTier: selected.case,
      ramTier: selected.ram,
      storageTier: selected.storage,
      coolingTier: selected.cooling,
      accessoriesCount: selectedAccessories.length,
      labels: {
        cpu: partOptions.cpu[selected.cpu].label,
        gpu: partOptions.gpu[selected.gpu].label,
        motherboard: partOptions.motherboard[selected.motherboard].label,
        case: partOptions.case[selected.case].label,
        ram: partOptions.ram[selected.ram].label,
        storage: partOptions.storage[selected.storage].label,
        cooling: partOptions.cooling[selected.cooling].label,
      },
    }),
    [selected, selectedAccessories.length],
  );

  const toggleAccessory = (key: string) => {
    setSelectedAccessories((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );
  };

  const addAllAccessories = () => {
    setSelectedAccessories(accessoryOptions.map((item) => item.key));
  };

  const addToShop = () => {
    if (total === 0) {
      setCartMessage("Select at least one item before adding to cart.");
      return;
    }

    const partsSummary = buildParts.map((part) => {
      const option = partOptions[part][selected[part]];
      return `${part.toUpperCase()}: ${option.label} (${formatPrice(option.price)})`;
    });

    const accessoriesSummary = selectedAccessories.map((key) => {
      const item = accessoryOptions.find((acc) => acc.key === key);
      return item ? `${item.label} (${formatPrice(item.price)})` : key;
    });

    addToCart({
      id: `custom-build-${Date.now()}`,
      name: "Custom PC Build",
      price: Number(total.toFixed(2)),
      image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=1200&q=80",
      category: "Custom Build",
      rating: 5,
      description: [
        `Parts total: ${formatPrice(partsTotal)}`,
        `Accessories total: ${formatPrice(accessoriesTotal)}`,
        `Configuration: ${partsSummary.join(" | ")}`,
        accessoriesSummary.length > 0 ? `Accessories: ${accessoriesSummary.join(" | ")}` : "Accessories: none",
      ].join(" | "),
    });

    setCartMessage("Custom build added to cart.");
  };

  return (
    <section className="min-h-screen pt-24 pb-20">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <span>&gt;</span>
          <span className="text-foreground">Custom Build</span>
        </div>

        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">Build Your Custom PC</h1>
          <p className="mt-2 text-muted-foreground">Choose components and get an instant total price.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
          <div className="rounded-2xl border border-border bg-card/50 p-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {buildParts.map((part) => (
                <label key={part} className="space-y-2">
                  <span className="text-sm font-medium text-foreground">{part.toUpperCase()}</span>
                  <select
                    value={selected[part]}
                    onChange={(e) =>
                      setSelected((prev) => ({
                        ...prev,
                        [part]: Number(e.target.value),
                      }))
                    }
                    className="w-full h-11 rounded-xl border border-border bg-secondary px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
                  >
                    {partOptions[part].map((option, idx) => (
                      <option key={option.label} value={idx}>
                        {option.label} - {formatPrice(option.price)}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>

            <div>
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">Accessories</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {accessoryOptions.map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 p-3 text-sm text-foreground"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAccessories.includes(item.key)}
                      onChange={() => toggleAccessory(item.key)}
                      className="h-4 w-4 accent-primary"
                    />
                    <span>
                      {item.label} ({formatPrice(item.price)})
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <aside className="h-fit rounded-2xl border border-primary/20 bg-card p-6 space-y-3">
            <h2 className="font-display text-2xl font-semibold text-foreground">Total Price</h2>
            <div className="text-3xl font-bold text-primary">{formatPrice(total)}</div>
            <p className="text-sm text-muted-foreground">PC Parts: {formatPrice(partsTotal)}</p>
            <p className="text-sm text-muted-foreground">Accessories: {formatPrice(accessoriesTotal)}</p>

            <div className="pt-3 space-y-2">
              <Button className="w-full" type="button" onClick={addToShop}>
                Add to Shop
              </Button>
              <Button className="w-full" variant="outline" type="button" onClick={() => setShowPreview(true)}>
                Model 3D
              </Button>
              <Button className="w-full" variant="secondary" type="button" onClick={addAllAccessories}>
                Add All Accessories
              </Button>
            </div>

            {cartMessage && <p className="pt-1 text-sm text-primary">{cartMessage}</p>}
          </aside>
        </div>
      </div>

      {showPreview && (
        <Suspense fallback={null}>
          <PcPreview3D
            open={showPreview}
            onClose={() => setShowPreview(false)}
            totalLabel={formatPrice(total)}
            config={previewConfig}
          />
        </Suspense>
      )}
    </section>
  );
};

export default CustomBuild;
