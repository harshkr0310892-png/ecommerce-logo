import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Clock, Trash2 } from "lucide-react";
import { useSearchStore } from "@/store/searchStore";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  onSearch: (term: string) => void;
  placeholder?: string;
  initialValue?: string;
  context?: 'collection' | 'wishlist'; // Made context optional with default
}

export function SearchBar({ onSearch, placeholder = "Search...", initialValue = "", context = 'collection' }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [showHistory, setShowHistory] = useState(false);
  const { collectionSearchHistory, wishlistSearchHistory, addSearchTerm, removeSearchTerm, clearSearchHistory } = useSearchStore();
  const searchBarRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get the appropriate search history based on context
  const searchHistory = context === 'collection' ? collectionSearchHistory : wishlistSearchHistory;

  // Handle clicks outside to close history dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target as Node)) {
        setShowHistory(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      addSearchTerm(searchTerm, context);
      onSearch(searchTerm);
      setShowHistory(false);
      inputRef.current?.blur();
    }
  };

  const handleHistoryClick = (term: string) => {
    setSearchTerm(term);
    addSearchTerm(term, context);
    onSearch(term);
    setShowHistory(false);
    inputRef.current?.focus();
  };

  const handleClearHistory = () => {
    clearSearchHistory(context);
  };

  const handleRemoveTerm = (e: React.MouseEvent, term: string) => {
    e.stopPropagation();
    removeSearchTerm(term, context);
  };

  return (
    <div ref={searchBarRef} className="relative w-full max-w-md">
      <form onSubmit={handleSubmit} className="relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setShowHistory(true)}
          className="pr-10"
        />
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
        >
          <Search className="w-4 h-4 text-muted-foreground" />
        </Button>
      </form>

      {/* Search History Dropdown */}
      {showHistory && searchHistory.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50">
          <div className="p-2">
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Recent Searches
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearHistory}
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Clear All
              </Button>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {searchHistory.map((term, index) => (
                <div
                  key={`${context}-${index}`}
                  className="flex items-center justify-between px-2 py-2 hover:bg-accent rounded cursor-pointer group"
                  onClick={() => handleHistoryClick(term)}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm truncate">{term}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 p-1 opacity-70 group-hover:opacity-100 text-muted-foreground hover:text-foreground hover:bg-accent"
                    onClick={(e) => handleRemoveTerm(e, term)}
                    title={`Remove "${term}" from search history`}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="px-2 py-1 text-xs text-muted-foreground text-center border-t border-border mt-1 pt-2">
              Click the ✕ button to remove individual items
            </div>
          </div>
        </div>
      )}
    </div>
  );
}