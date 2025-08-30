"use client";

import { useQuery } from "@tanstack/react-query";

interface FilterConfig {
  priority: string[];
  status: string[];
  channel: string[];
}

interface FilterValues {
  priorities: string[];
  statuses: string[];
  channels: string[];
}

interface TicketsFiltersProps {
  filters: FilterConfig;
  onFilterChange: (
    filterType: keyof FilterConfig,
    value: string,
    checked: boolean
  ) => void;
  onClearFilters: () => void;
}

async function fetchFilterValues(): Promise<FilterValues> {
  const response = await fetch("/api/tickets/filter-values");
  if (!response.ok) {
    throw new Error("Failed to fetch filter values");
  }
  return response.json();
}

export default function TicketsFilters({
  filters,
  onFilterChange,
  onClearFilters,
}: TicketsFiltersProps) {
  // Fetch filter values using React Query
  const {
    data: filterValues,
    isLoading: isLoadingFilterValues,
    error: filterValuesError,
  } = useQuery({
    queryKey: ["filter-values"],
    queryFn: fetchFilterValues,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900">Filters</h3>
        <div className="flex items-center gap-3">
          <button
            onClick={onClearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Clear all filters
          </button>
        </div>
      </div>

      {isLoadingFilterValues ? (
        <div className="text-center py-4 text-gray-500">
          Loading filter options...
        </div>
      ) : filterValuesError ? (
        <div className="text-center py-4 text-red-500">
          Error loading filters: {filterValuesError.message}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <div className="space-y-2">
              {filterValues?.priorities.map((priority) => (
                <label key={priority} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.priority.includes(priority)}
                    onChange={(e) =>
                      onFilterChange("priority", priority, e.target.checked)
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 capitalize">
                    {priority}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="space-y-2">
              {filterValues?.statuses.map((status) => (
                <label key={status} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.status.includes(status)}
                    onChange={(e) =>
                      onFilterChange("status", status, e.target.checked)
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 capitalize">
                    {status}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Channel Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Channel
            </label>
            <div className="space-y-2">
              {filterValues?.channels.map((channel) => (
                <label key={channel} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.channel.includes(channel)}
                    onChange={(e) =>
                      onFilterChange("channel", channel, e.target.checked)
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 capitalize">
                    {channel}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Export the interfaces for use in other components
export type { FilterConfig, FilterValues };
