import React from "react";
import { Star, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReviewCardProps {
  author: string;
  rating: number;
  title: string;
  comment: string;
  verified?: boolean;
  helpful?: number;
  date: string;
  images?: string[];
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  author,
  rating,
  title,
  comment,
  verified = true,
  helpful = 0,
  date,
  images = [],
}) => {
  const renderStars = () => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        size={16}
        className={`${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-400"}`}
      />
    ));
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-slate-900 hover:shadow-md transition-shadow">
      {/* Header: Author + Rating */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{author}</p>
            {verified && (
              <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100 px-2 py-0.5 rounded-full">
                Achat vérifié
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(date)}</p>
        </div>
        <div className="flex gap-1">{renderStars()}</div>
      </div>

      {/* Review Title */}
      <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">{title}</h4>

      {/* Review Comment */}
      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-3">{comment}</p>

      {/* Review Images */}
      {images.length > 0 && (
        <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
          {images.map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt={`Review image ${idx + 1}`}
              className="h-16 w-16 object-cover rounded border border-gray-200 dark:border-gray-700 flex-shrink-0"
            />
          ))}
        </div>
      )}

      {/* Helpful Footer */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
        >
          <ThumbsUp size={14} className="mr-1" />
          Utile ({helpful})
        </Button>
      </div>
    </div>
  );
};

export default ReviewCard;
