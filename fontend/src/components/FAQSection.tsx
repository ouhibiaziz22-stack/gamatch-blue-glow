import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

interface FAQProps {
  items: FAQItem[];
  defaultOpen?: string;
}

export const FAQSection: React.FC<FAQProps> = ({
  items,
  defaultOpen,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = items.filter(
    (item) =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Search Input */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Rechercher une question..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* FAQ List */}
      {filteredItems.length > 0 ? (
        <Accordion type="single" collapsible defaultValue={defaultOpen} className="w-full">
          {filteredItems.map((item, index) => (
            <AccordionItem key={item.id || index} value={item.id || `faq-${index}`}>
              <AccordionTrigger className="text-left font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 py-3">
                {item.category && (
                  <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-1 rounded mr-3">
                    {item.category}
                  </span>
                )}
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            Aucune question trouvée. Essayez un autre terme de recherche.
          </p>
        </div>
      )}
    </div>
  );
};

export default FAQSection;
