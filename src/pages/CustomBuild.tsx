import { lazy, Suspense, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { formatTnd } from "@/lib/currency";

type BuildPart =
  | "case"
  | "motherboard"
  | "cpu"
  | "gpu"
  | "ram"
  | "storage"
  | "cooling"
  | "psu"
  | "fans"
  | "os";

type BuildGoal = "gaming" | "streaming" | "workstation";
type SocketType = "AM5" | "LGA1700";
type FormFactor = "ATX" | "Micro-ATX" | "Mini-ITX";
type RamType = "DDR4" | "DDR5";

type BuildOption = {
  label: string;
  price: number;
};

type CompatibilityCheck = {
  rule: string;
  status: "pass" | "fail" | "pending";
  message: string;
  suggestion?: string;
};

const partOptions: Record<BuildPart, BuildOption[]> = {
  case: [
    { label: "None", price: 0 },
    { label: "Lian Li O11 Dynamic", price: 460 },
    { label: "NZXT H5 Flow RGB", price: 300 },
    { label: "Corsair 4000D Airflow", price: 330 },
    { label: "Mini-ITX Compact Glass", price: 280 },
  ],
  motherboard: [
    { label: "None", price: 0 },
    { label: "MSI B650", price: 540 },
    { label: "ASUS TUF B760", price: 580 },
    { label: "Gigabyte X670", price: 720 },
    { label: "ASUS Prime B660M DDR4", price: 390 },
    { label: "ASUS ROG Z790", price: 920 },
  ],
  cpu: [
    { label: "None", price: 0 },
    { label: "AMD Ryzen 7 7800X3D", price: 1250 },
    { label: "AMD Ryzen 9 7950X", price: 1850 },
    { label: "Intel Core i5-14600K", price: 980 },
    { label: "Intel Core i7-14700K", price: 1380 },
    { label: "Intel Core i9-14900K", price: 2100 },
  ],
  gpu: [
    { label: "None", price: 0 },
    { label: "NVIDIA RTX 4060", price: 1200 },
    { label: "NVIDIA RTX 4070 SUPER", price: 1980 },
    { label: "NVIDIA RTX 4080 SUPER", price: 3900 },
    { label: "AMD Radeon RX 7900 XTX", price: 3200 },
  ],
  ram: [
    { label: "None", price: 0 },
    { label: "16GB DDR5 RGB", price: 280 },
    { label: "32GB DDR5 RGB", price: 520 },
    { label: "64GB DDR5 RGB", price: 980 },
    { label: "32GB DDR4", price: 360 },
    { label: "64GB DDR4", price: 710 },
  ],
  storage: [
    { label: "None", price: 0 },
    { label: "1TB NVMe SSD", price: 290 },
    { label: "2TB NVMe SSD", price: 520 },
    { label: "4TB NVMe SSD", price: 980 },
    { label: "2TB SATA SSD", price: 430 },
    { label: "4TB HDD", price: 320 },
  ],
  cooling: [
    { label: "None", price: 0 },
    { label: "Air Cooler 180W", price: 180 },
    { label: "Dual-Tower Air Cooler", price: 75 },
    { label: "AIO 240mm", price: 420 },
    { label: "AIO 360mm", price: 580 },
    { label: "Custom Water Loop", price: 1200 },
  ],
  psu: [
    { label: "None", price: 0 },
    { label: "650W Bronze", price: 260 },
    { label: "750W Gold", price: 360 },
    { label: "850W Gold", price: 470 },
    { label: "1000W Gold", price: 620 },
    { label: "1200W Platinum", price: 900 },
  ],
  fans: [
    { label: "None", price: 0 },
    { label: "2x 120mm RGB Fans", price: 110 },
    { label: "3x 120mm RGB Fans", price: 170 },
    { label: "6x 120mm ARGB Fans", price: 340 },
    { label: "9x 120mm ARGB Fans", price: 510 },
  ],
  os: [
    { label: "None", price: 0 },
    { label: "Windows 11 Home", price: 460 },
    { label: "Windows 11 Pro", price: 730 },
    { label: "Ubuntu Linux", price: 0 },
  ],
};

const componentOrder: BuildPart[] = [
  "case",
  "motherboard",
  "cpu",
  "gpu",
  "ram",
  "storage",
  "cooling",
  "psu",
  "fans",
  "os",
];

const partLabel: Record<BuildPart, string> = {
  case: "Case",
  motherboard: "Motherboard",
  cpu: "CPU",
  gpu: "GPU",
  ram: "RAM",
  storage: "Storage (SSD/HDD)",
  cooling: "CPU Cooler",
  psu: "Power Supply",
  fans: "Case Fans / RGB",
  os: "Operating System (Optional)",
};

const cpuMeta: Record<string, { socket: SocketType; tdp: number }> = {
  "AMD Ryzen 7 7800X3D": { socket: "AM5", tdp: 120 },
  "AMD Ryzen 9 7950X": { socket: "AM5", tdp: 170 },
  "Intel Core i5-14600K": { socket: "LGA1700", tdp: 181 },
  "Intel Core i7-14700K": { socket: "LGA1700", tdp: 253 },
  "Intel Core i9-14900K": { socket: "LGA1700", tdp: 253 },
};

const motherboardMeta: Record<string, { socket: SocketType; formFactor: FormFactor; ramType: RamType }> = {
  "MSI B650": { socket: "AM5", formFactor: "ATX", ramType: "DDR5" },
  "ASUS TUF B760": { socket: "LGA1700", formFactor: "ATX", ramType: "DDR5" },
  "Gigabyte X670": { socket: "AM5", formFactor: "ATX", ramType: "DDR5" },
  "ASUS Prime B660M DDR4": { socket: "LGA1700", formFactor: "Micro-ATX", ramType: "DDR4" },
  "ASUS ROG Z790": { socket: "LGA1700", formFactor: "ATX", ramType: "DDR5" },
};

const caseMeta: Record<string, { supports: FormFactor[]; gpuClearanceMm: number; fanSlots: number }> = {
  "Lian Li O11 Dynamic": { supports: ["ATX", "Micro-ATX", "Mini-ITX"], gpuClearanceMm: 420, fanSlots: 9 },
  "NZXT H5 Flow RGB": { supports: ["ATX", "Micro-ATX", "Mini-ITX"], gpuClearanceMm: 365, fanSlots: 7 },
  "Corsair 4000D Airflow": { supports: ["ATX", "Micro-ATX", "Mini-ITX"], gpuClearanceMm: 360, fanSlots: 6 },
  "Mini-ITX Compact Glass": { supports: ["Mini-ITX"], gpuClearanceMm: 322, fanSlots: 4 },
};

const gpuMeta: Record<string, { lengthMm: number; power: number }> = {
  "NVIDIA RTX 4060": { lengthMm: 245, power: 115 },
  "NVIDIA RTX 4070 SUPER": { lengthMm: 300, power: 220 },
  "NVIDIA RTX 4080 SUPER": { lengthMm: 340, power: 320 },
  "AMD Radeon RX 7900 XTX": { lengthMm: 287, power: 355 },
};

const ramMeta: Record<string, { type: RamType; power: number }> = {
  "16GB DDR5 RGB": { type: "DDR5", power: 5 },
  "32GB DDR5 RGB": { type: "DDR5", power: 8 },
  "64GB DDR5 RGB": { type: "DDR5", power: 12 },
  "32GB DDR4": { type: "DDR4", power: 7 },
  "64GB DDR4": { type: "DDR4", power: 11 },
};

const storagePower: Record<string, number> = {
  "1TB NVMe SSD": 5,
  "2TB NVMe SSD": 6,
  "4TB NVMe SSD": 8,
  "2TB SATA SSD": 4,
  "4TB HDD": 9,
};

const coolerSocket: Record<string, SocketType[]> = {
  "Air Cooler 180W": ["AM5", "LGA1700"],
  "Dual-Tower Air Cooler": ["AM5", "LGA1700"],
  "AIO 240mm": ["AM5", "LGA1700"],
  "AIO 360mm": ["AM5", "LGA1700"],
  "Custom Water Loop": ["AM5", "LGA1700"],
};

const coolerPower: Record<string, number> = {
  "Air Cooler 180W": 5,
  "Dual-Tower Air Cooler": 6,
  "AIO 240mm": 9,
  "AIO 360mm": 12,
  "Custom Water Loop": 18,
};

const psuWattage: Record<string, number> = {
  "650W Bronze": 650,
  "750W Gold": 750,
  "850W Gold": 850,
  "1000W Gold": 1000,
  "1200W Platinum": 1200,
};

const fanMeta: Record<string, { count: number; power: number }> = {
  "2x 120mm RGB Fans": { count: 2, power: 6 },
  "3x 120mm RGB Fans": { count: 3, power: 9 },
  "6x 120mm ARGB Fans": { count: 6, power: 18 },
  "9x 120mm ARGB Fans": { count: 9, power: 27 },
};

const initialSelection: Record<BuildPart, number> = {
  case: 0,
  motherboard: 0,
  cpu: 0,
  gpu: 0,
  ram: 0,
  storage: 0,
  cooling: 0,
  psu: 0,
  fans: 0,
  os: 0,
};

const PcPreview3D = lazy(() => import("@/components/PcPreview3D"));

const CustomBuild = () => {
  const { addToCart } = useCart();
  const [goal, setGoal] = useState<BuildGoal>("gaming");
  const [budget, setBudget] = useState(0);
  const [selected, setSelected] = useState<Record<BuildPart, number>>(initialSelection);
  const [showPreview, setShowPreview] = useState(false);
  const [cartMessage, setCartMessage] = useState("");

  const total = useMemo(
    () => componentOrder.reduce((sum, part) => sum + partOptions[part][selected[part]].price, 0),
    [selected],
  );

  const labels = useMemo(
    () =>
      componentOrder.reduce<Record<BuildPart, string>>((acc, part) => {
        acc[part] = partOptions[part][selected[part]].label;
        return acc;
      }, {} as Record<BuildPart, string>),
    [selected],
  );

  const estimatedPower = useMemo(() => {
    const cpu = cpuMeta[labels.cpu]?.tdp ?? 0;
    const gpu = gpuMeta[labels.gpu]?.power ?? 0;
    const ram = ramMeta[labels.ram]?.power ?? 0;
    const storage = storagePower[labels.storage] ?? 0;
    const cooling = coolerPower[labels.cooling] ?? 0;
    const fans = fanMeta[labels.fans]?.power ?? 0;
    const motherboardBase = labels.motherboard !== "None" ? 45 : 0;
    const caseController = labels.case !== "None" ? 6 : 0;
    return cpu + gpu + ram + storage + cooling + fans + motherboardBase + caseController;
  }, [labels]);

  const recommendedPsu = useMemo(() => {
    if (estimatedPower <= 0) return 0;
    return Math.ceil((estimatedPower * 1.35) / 50) * 50;
  }, [estimatedPower]);

  const compatibilityChecks = useMemo<CompatibilityCheck[]>(() => {
    const checks: CompatibilityCheck[] = [];
    const cpu = cpuMeta[labels.cpu];
    const motherboard = motherboardMeta[labels.motherboard];
    const gpu = gpuMeta[labels.gpu];
    const pcCase = caseMeta[labels.case];
    const ram = ramMeta[labels.ram];
    const psu = psuWattage[labels.psu];
    const fans = fanMeta[labels.fans];

    if (!cpu || !motherboard) {
      checks.push({ rule: "CPU ↔ Motherboard Socket", status: "pending", message: "Select CPU and motherboard." });
    } else if (cpu.socket === motherboard.socket) {
      checks.push({ rule: "CPU ↔ Motherboard Socket", status: "pass", message: `${cpu.socket} socket matches.` });
    } else {
      const suggestion = partOptions.cpu.find((item) => cpuMeta[item.label]?.socket === motherboard.socket)?.label;
      checks.push({
        rule: "CPU ↔ Motherboard Socket",
        status: "fail",
        message: `${labels.cpu} is not compatible with ${labels.motherboard}.`,
        suggestion: suggestion ? `Try ${suggestion}.` : "Choose a matching socket CPU.",
      });
    }

    if (!motherboard || !pcCase) {
      checks.push({ rule: "Motherboard ↔ Case Form Factor", status: "pending", message: "Select motherboard and case." });
    } else if (pcCase.supports.includes(motherboard.formFactor)) {
      checks.push({ rule: "Motherboard ↔ Case Form Factor", status: "pass", message: "Form factor fit confirmed." });
    } else {
      checks.push({
        rule: "Motherboard ↔ Case Form Factor",
        status: "fail",
        message: `${labels.case} does not support ${motherboard.formFactor}.`,
      });
    }

    if (!gpu || !pcCase) {
      checks.push({ rule: "GPU ↔ Case Clearance", status: "pending", message: "Select GPU and case." });
    } else if (gpu.lengthMm <= pcCase.gpuClearanceMm) {
      checks.push({ rule: "GPU ↔ Case Clearance", status: "pass", message: "GPU clearance is valid." });
    } else {
      const suggestion = partOptions.gpu.find((item) => (gpuMeta[item.label]?.lengthMm ?? 999) <= pcCase.gpuClearanceMm)?.label;
      checks.push({
        rule: "GPU ↔ Case Clearance",
        status: "fail",
        message: `${labels.gpu} is too long for ${labels.case}.`,
        suggestion: suggestion ? `Try ${suggestion}.` : "Use a shorter GPU or larger case.",
      });
    }

    if (!ram || !motherboard) {
      checks.push({ rule: "RAM ↔ Motherboard Type", status: "pending", message: "Select RAM and motherboard." });
    } else if (ram.type === motherboard.ramType) {
      checks.push({ rule: "RAM ↔ Motherboard Type", status: "pass", message: `${ram.type} type matches.` });
    } else {
      checks.push({
        rule: "RAM ↔ Motherboard Type",
        status: "fail",
        message: `${labels.ram} is incompatible with ${labels.motherboard}.`,
      });
    }

    if (!cpu || !coolerSocket[labels.cooling]) {
      checks.push({ rule: "CPU Cooler ↔ Socket", status: "pending", message: "Select CPU and cooler." });
    } else if (coolerSocket[labels.cooling].includes(cpu.socket)) {
      checks.push({ rule: "CPU Cooler ↔ Socket", status: "pass", message: "Cooler mounting support confirmed." });
    } else {
      checks.push({ rule: "CPU Cooler ↔ Socket", status: "fail", message: `${labels.cooling} does not support ${cpu.socket}.` });
    }

    if (!fans || !pcCase) {
      checks.push({ rule: "Case Fans ↔ Case Capacity", status: "pending", message: "Select fan kit and case." });
    } else if (fans.count <= pcCase.fanSlots) {
      checks.push({ rule: "Case Fans ↔ Case Capacity", status: "pass", message: "Fan count fits case capacity." });
    } else {
      checks.push({ rule: "Case Fans ↔ Case Capacity", status: "fail", message: "Fan kit exceeds case fan slots." });
    }

    if (!psu || (!cpu && !gpu)) {
      checks.push({ rule: "PSU ↔ CPU + GPU Power", status: "pending", message: "Select PSU, CPU, and GPU." });
    } else if (psu >= recommendedPsu) {
      checks.push({ rule: "PSU ↔ CPU + GPU Power", status: "pass", message: `PSU is sufficient for ${estimatedPower}W load.` });
    } else {
      const suggestion = partOptions.psu.find((item) => (psuWattage[item.label] ?? 0) >= recommendedPsu)?.label;
      checks.push({
        rule: "PSU ↔ CPU + GPU Power",
        status: "fail",
        message: `${labels.psu} is below ${recommendedPsu}W recommendation.`,
        suggestion: suggestion ? `Try ${suggestion}.` : "Choose a higher wattage PSU.",
      });
    }

    return checks;
  }, [estimatedPower, labels, recommendedPsu]);

  const failedChecks = compatibilityChecks.filter((check) => check.status === "fail");
  const compatibilityStatus = failedChecks.length === 0 ? "Compatible" : "Incompatible";

  const aiAdvice = useMemo(() => {
    const advice: string[] = [];
    if (goal === "gaming" && selected.gpu <= 1) {
      advice.push("For gaming, prioritize GPU to RTX 4070 SUPER or above.");
    }
    if (goal === "streaming" && selected.cpu <= 3) {
      advice.push("For streaming, use at least Core i7-14700K or Ryzen 9.");
    }
    if (goal === "workstation" && selected.ram < 3) {
      advice.push("For workstation use, 64GB RAM is recommended.");
    }
    if (budget > 0 && total > budget) {
      advice.push(`This build is over budget by ${formatTnd(total - budget)}.`);
    }
    if (failedChecks[0]?.suggestion) {
      advice.push(failedChecks[0].suggestion);
    }
    if (advice.length === 0) advice.push("This build looks balanced for your selected goal.");
    return advice;
  }, [budget, failedChecks, goal, selected, total]);

  const previewConfig = useMemo(
    () => ({
      cpuTier: selected.cpu,
      gpuTier: selected.gpu,
      motherboardTier: selected.motherboard,
      caseTier: selected.case,
      ramTier: selected.ram,
      storageTier: selected.storage,
      coolingTier: selected.cooling,
      psuTier: selected.psu,
      fanTier: selected.fans,
      caseFanCount: fanMeta[labels.fans]?.count ?? 0,
      accessoriesCount: 0,
      labels: {
        cpu: labels.cpu,
        gpu: labels.gpu,
        motherboard: labels.motherboard,
        case: labels.case,
        ram: labels.ram,
        storage: labels.storage,
        cooling: labels.cooling,
        psu: labels.psu,
        fans: labels.fans,
        os: labels.os,
      },
    }),
    [labels, selected],
  );

  const applyRecommendedBuild = () => {
    if (goal === "gaming") {
      setSelected({
        case: 1,
        motherboard: 1,
        cpu: 1,
        gpu: budget > 0 && budget < 7000 ? 1 : 2,
        ram: 2,
        storage: 2,
        cooling: 3,
        psu: 3,
        fans: 2,
        os: 1,
      });
    } else if (goal === "streaming") {
      setSelected({
        case: 1,
        motherboard: 2,
        cpu: 4,
        gpu: 2,
        ram: 2,
        storage: 2,
        cooling: 4,
        psu: 4,
        fans: 3,
        os: 1,
      });
    } else {
      setSelected({
        case: 3,
        motherboard: 5,
        cpu: 5,
        gpu: 4,
        ram: 3,
        storage: 3,
        cooling: 4,
        psu: 5,
        fans: 3,
        os: 2,
      });
    }
    setCartMessage("Recommended build applied.");
  };

  const addToShop = () => {
    if (total === 0) {
      setCartMessage("Select components before adding to cart.");
      return;
    }
    if (failedChecks.length > 0) {
      setCartMessage("Fix compatibility issues before adding this build.");
      return;
    }

    const partsSummary = componentOrder.map((part) => {
      const option = partOptions[part][selected[part]];
      return `${partLabel[part]}: ${option.label} (${formatTnd(option.price)})`;
    });

    addToCart({
      id: `custom-build-${Date.now()}`,
      name: `Custom PC Build (${goal})`,
      price: Number(total.toFixed(2)),
      image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=1200&q=80",
      category: "Custom Build",
      rating: 5,
      description: [
        `Estimated Power: ${estimatedPower}W`,
        `Recommended PSU: ${recommendedPsu}W`,
        `Compatibility: ${compatibilityStatus}`,
        `Configuration: ${partsSummary.join(" | ")}`,
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

        <div className="mb-8 space-y-2">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">AI PC Builder Configurator</h1>
          <p className="mt-2 text-muted-foreground">
            Build a compatible PC in guided order and open a real-time photorealistic 3D preview.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 rounded-2xl border border-border bg-card/60 p-4 md:grid-cols-3">
          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">Build Goal</span>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value as BuildGoal)}
              className="w-full h-11 rounded-xl border border-border bg-secondary px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="gaming">Gaming</option>
              <option value="streaming">Streaming</option>
              <option value="workstation">Workstation</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">Budget (TND)</span>
            <input
              type="number"
              min={0}
              value={budget || ""}
              onChange={(e) => setBudget(Math.max(0, Number(e.target.value) || 0))}
              className="w-full h-11 rounded-xl border border-border bg-secondary px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              placeholder="Optional"
            />
          </label>
          <div className="flex items-end">
            <Button className="w-full" type="button" variant="secondary" onClick={applyRecommendedBuild}>
              Apply Recommended Build
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-8">
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card/50 p-6">
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">1. Component Selection Panel</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {componentOrder.map((part, idx) => (
                  <label key={part} className="space-y-2">
                    <span className="text-sm font-medium text-foreground">
                      {idx + 1}. {partLabel[part]}
                    </span>
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
                      {partOptions[part].map((option, optionIdx) => (
                        <option key={`${part}-${option.label}`} value={optionIdx}>
                          {option.label} - {formatTnd(option.price)}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card/50 p-6">
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">4. Compatibility Checker</h2>
              <div className="space-y-3">
                {compatibilityChecks.map((check) => (
                  <div
                    key={check.rule}
                    className={`rounded-xl border p-3 text-sm ${
                      check.status === "pass"
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : check.status === "fail"
                          ? "border-red-500/30 bg-red-500/5"
                          : "border-border bg-secondary/30"
                    }`}
                  >
                    <p className="font-medium text-foreground">{check.rule}</p>
                    <p className="text-muted-foreground">{check.message}</p>
                    {check.suggestion && <p className="text-primary">Suggestion: {check.suggestion}</p>}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card/50 p-6">
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">5. Price Estimator</h2>
              <div className="space-y-2 text-sm">
                {componentOrder.map((part) => (
                  <p key={`price-${part}`} className="flex items-center justify-between text-muted-foreground">
                    <span>{partLabel[part]}</span>
                    <span className="text-foreground">{formatTnd(partOptions[part][selected[part]].price)}</span>
                  </p>
                ))}
                <div className="mt-3 border-t border-border pt-3 space-y-1">
                  <p className="flex items-center justify-between font-semibold text-foreground">
                    <span>Total Price</span>
                    <span className="text-primary">{formatTnd(total)}</span>
                  </p>
                  <p className="text-muted-foreground">Estimated Power Usage: {estimatedPower}W</p>
                  <p className="text-muted-foreground">Recommended PSU: {recommendedPsu || 0}W</p>
                  {budget > 0 && (
                    <p className={total <= budget ? "text-emerald-500" : "text-red-500"}>
                      Budget Status: {total <= budget ? "Within budget" : `Over by ${formatTnd(total - budget)}`}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-primary/20 bg-card p-6">
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">2. Build Summary Panel</h2>
              <div className="space-y-1 text-sm">
                {componentOrder.map((part) => (
                  <p key={`summary-${part}`} className="text-muted-foreground">
                    <span className="font-semibold text-foreground">{partLabel[part]}:</span> {labels[part]}
                  </p>
                ))}
              </div>
              <div className="mt-4 border-t border-border pt-4 space-y-1 text-sm">
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">Estimated Price:</span> {formatTnd(total)}
                </p>
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">Estimated Power:</span> {estimatedPower}W
                </p>
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">Compatibility Status:</span>{" "}
                  <span className={failedChecks.length === 0 ? "text-emerald-500" : "text-red-500"}>{compatibilityStatus}</span>
                </p>
              </div>
              <div className="pt-3 space-y-2">
                <Button className="w-full" type="button" onClick={addToShop}>
                  Add to Shop
                </Button>
                <Button className="w-full" variant="outline" type="button" onClick={() => setShowPreview(true)}>
                  3D Model
                </Button>
              </div>
              {cartMessage && <p className="pt-1 text-sm text-primary">{cartMessage}</p>}
            </section>

            <section className="rounded-2xl border border-border bg-card/50 p-6">
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">3. 3D PC Preview</h2>
              <div className="rounded-xl border border-primary/20 bg-gradient-to-b from-zinc-900/60 via-zinc-950/80 to-black/95 p-4">
                <p className="text-sm text-muted-foreground">
                  Press <span className="font-semibold text-foreground">3D Model</span> to generate a photorealistic render with tempered glass, mounted
                  GPU, RGB fans, RAM lighting, cooler, storage, and cable management.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card/50 p-6">
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">AI Assistant Behavior</h2>
              <div className="space-y-2 text-sm text-muted-foreground">
                {aiAdvice.map((tip, idx) => (
                  <p key={`tip-${idx}`}>- {tip}</p>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>

      {showPreview && (
        <Suspense fallback={null}>
          <PcPreview3D
            open={showPreview}
            onClose={() => setShowPreview(false)}
            totalLabel={formatTnd(total)}
            config={previewConfig}
          />
        </Suspense>
      )}
    </section>
  );
};

export default CustomBuild;
