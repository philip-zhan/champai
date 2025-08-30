"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronDown, ChevronUp, Filter } from "lucide-react";

interface FilterConfig {
  priority: string[];
  status: string[];
  channel: string[];
  search: string;
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
  const [isExpanded, setIsExpanded] = useState(true);

  // Calculate if any filters are active
  const hasActiveFilters = filters.priority.length > 0 || filters.status.length > 0 || filters.channel.length > 0;

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
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-gray-700 transition-colors duration-150"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {filters.priority.length + filters.status.length + filters.channel.length}
              </span>
            )}
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>
          
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-sm text-gray-500 hover:text-red-600 font-medium transition-colors duration-150"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Collapsible Content */}
      <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
        <div className="p-4">
          {isLoadingFilterValues ? (
            <div className="text-center py-8 text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              Loading filter options...
            </div>
          ) : filterValuesError ? (
            <div className="text-center py-8 text-red-500">
              <div className="mb-2">⚠️</div>
              Error loading filters: {filterValuesError.message}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Priority Filter */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
                  Priority
                </h4>
                <div className="space-y-2">
                  {filterValues?.priorities.map((priority) => (
                    <label key={priority} className="flex items-center group cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.priority.includes(priority)}
                        onChange={(e) =>
                          onFilterChange("priority", priority, e.target.checked)
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors duration-150"
                      />
                      <span className="ml-3 text-sm text-gray-700 capitalize group-hover:text-gray-900 transition-colors duration-150">
                        {priority}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
                  Status
                </h4>
                <div className="space-y-2">
                  {filterValues?.statuses.map((status) => (
                    <label key={status} className="flex items-center group cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.status.includes(status)}
                        onChange={(e) =>
                          onFilterChange("status", status, e.target.checked)
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors duration-150"
                      />
                      <span className="ml-3 text-sm text-gray-700 capitalize group-hover:text-gray-900 transition-colors duration-150">
                        {status}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Channel Filter */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
                  Channel
                </h4>
                <div className="space-y-2">
                  {filterValues?.channels.map((channel) => (
                    <label key={channel} className="flex items-center group cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.channel.includes(channel)}
                        onChange={(e) =>
                          onFilterChange("channel", channel, e.target.checked)
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors duration-150"
                      />
                      <span className="ml-3 text-sm text-gray-700 capitalize group-hover:text-gray-900 transition-colors duration-150">
                        {channel}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Export the interfaces for use in other components
export type { FilterConfig, FilterValues };
