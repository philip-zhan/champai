"use client";

interface SearchBoxProps {
  searchInput: string;
  onSearchChange: (search: string) => void;
  onSearchSubmit: () => void;
}

export default function SearchBox({
  searchInput,
  onSearchChange,
  onSearchSubmit,
}: SearchBoxProps) {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSearchSubmit();
    }
  };

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={searchInput}
        onChange={(e) => onSearchChange(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder="Search by title or description..."
        className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
      />
      <button
        onClick={onSearchSubmit}
        className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-150"
      >
        Search
      </button>
    </div>
  );
}
