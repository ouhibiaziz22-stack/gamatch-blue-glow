import React, { useState, useEffect, useRef } from "react";
import { Search, X, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { ApiProduct } from "@/lib/api";

interface SearchSuggestion {
  id: string;
  text: string;
  category: "product" | "category" | "trending";
  productId?: string;
}

interface PredictiveSearchProps {
  onSearch?: (query: string) => void;
  products?: ApiProduct[];
}

const TRENDING_SEARCHES = [
  "RTX 4090",
  "Gaming PC",
  "SSD NVMe",
  "Processeur Intel i9",
  "RAM 32GB",
  "Refroidissement AIO",
];

export const PredictiveSearch: React.FC<PredictiveSearchProps> = ({ onSearch, products = [] }) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Generate suggestions based on query
  useEffect(() => {
    if (query.length === 0) {
      // Show trending searches if empty
      setSuggestions(
        TRENDING_SEARCHES.map((search, idx) => ({
          id: `trending-${idx}`,
          text: search,
          category: "trending",
        }))
      );
      return;
    }

    const lowerQuery = query.toLowerCase();
    const newSuggestions: SearchSuggestion[] = [];

    // Filter products
    if (products && products.length > 0) {
      products
        .filter((p) => p.name.toLowerCase().includes(lowerQuery))
        .slice(0, 3)
        .forEach((p) => {
          newSuggestions.push({
            id: `product-${p._id}`,
            text: p.name,
            category: "product",
            productId: p._id,
          });
        });
    }

    // Filter trending searches
    TRENDING_SEARCHES
      .filter((s) => s.toLowerCase().includes(lowerQuery))
      .slice(0, 3)
      .forEach((s, idx) => {
        newSuggestions.push({
          id: `trending-${idx}`,
          text: s,
          category: "trending",
        });
      });

    setSuggestions(newSuggestions);
    setSelectedIndex(-1);
  }, [query, products]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        } else if (query) {
          handleSearch();
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: SearchSuggestion) => {
    if (suggestion.category === "product" && suggestion.productId) {
      navigate(`/product/${suggestion.productId}`);
    } else {
      setQuery(suggestion.text);
      handleSearch(suggestion.text);
    }
    setIsOpen(false);
  };

  // Handle search submission
  const handleSearch = (searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    if (finalQuery.trim()) {
      if (onSearch) {
        onSearch(finalQuery);
      } else {
        navigate(`/products?search=${encodeURIComponent(finalQuery)}`);
      }
      setQuery("");
      setIsOpen(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
        <input
          type="text"
          placeholder="Rechercher des produits..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setSuggestions([]);
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden">
          <ul className="max-h-96 overflow-y-auto">
            {suggestions.map((suggestion, idx) => {
              const isSelected = idx === selectedIndex;
              const bgClass = isSelected
                ? "bg-blue-50 dark:bg-slate-700"
                : "hover:bg-gray-50 dark:hover:bg-slate-700/50";

              return (
                <li key={suggestion.id}>
                  <button
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className={`w-full px-4 py-2.5 text-left flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors ${bgClass}`}
                  >
                    {suggestion.category === "trending" && (
                      <TrendingUp size={16} className="text-orange-500 flex-shrink-0" />
                    )}
                    {suggestion.category === "product" && (
                      <Search size={16} className="text-blue-500 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-white font-medium">
                        {suggestion.text}
                      </p>
                      {suggestion.category === "product" && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">Produit</p>
                      )}
                      {suggestion.category === "trending" && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">Tendance</p>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PredictiveSearch;
