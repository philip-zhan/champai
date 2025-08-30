"use client";

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useCallback, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface Ticket {
  id: number;
  subject: string | null;
  raw_subject: string | null;
  description: string | null;
  priority: string | null;
  status: string | null;
  via_channel: string | null;
  zendesk_created_at: string | null;
  zendesk_updated_at: string | null;
  commentCount: number;
}

interface TicketsResponse {
  tickets: Ticket[];
  total: number;
  hasMore: boolean;
}

interface SortConfig {
  field: string;
  order: "asc" | "desc";
}

async function fetchTickets(
  page: number,
  sortBy: string,
  sortOrder: string
): Promise<TicketsResponse> {
  const response = await fetch(
    `/api/tickets?page=${page}&limit=50&sortBy=${sortBy}&sortOrder=${sortOrder}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch tickets");
  }
  return response.json();
}

export default function TicketsTableClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: searchParams.get("sortBy") || "zendesk_updated_at",
    order: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
  });

  // Update URL when sort config changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set("sortBy", sortConfig.field);
    params.set("sortOrder", sortConfig.order);
    router.replace(`?${params.toString()}`, { scroll: false });

    // Reset the query data when sorting changes to ensure fresh data
    queryClient.removeQueries({ queryKey: ["tickets"] });
  }, [sortConfig, searchParams, router, queryClient]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ["tickets", sortConfig.field, sortConfig.order],
    queryFn: ({ pageParam = 1 }) =>
      fetchTickets(pageParam, sortConfig.field, sortConfig.order),
    getNextPageParam: (lastPage, pages) => {
      if (!lastPage.hasMore) return undefined;
      return pages.length + 1;
    },
    initialPageParam: 1,
    refetchInterval: 5000,
  });

  const handleSort = (field: string) => {
    setSortConfig((prev) => ({
      field,
      order: prev.field === field && prev.order === "asc" ? "desc" : "asc",
    }));
  };

  const getSortIcon = (field: string) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.order === "asc" ? (
      <ArrowUp className="w-4 h-4 text-blue-600" />
    ) : (
      <ArrowDown className="w-4 h-4 text-blue-600" />
    );
  };

  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastTicketRef = useCallback(
    (node: HTMLTableRowElement) => {
      if (isLoading) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0]?.isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [isLoading, hasNextPage, fetchNextPage]
  );

  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-500">Loading tickets...</div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        Error loading tickets: {error.message}
      </div>
    );
  }

  const allTickets = data?.pages.flatMap((page) => page.tickets) || [];

  if (allTickets.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No tickets found. Run a sync from Zendesk to import tickets.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 w-1/3">
              Ticket Details
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
              Priority
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
              Channel
            </th>
            <th
              className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider border-b border-gray-200 cursor-pointer select-none transition-colors duration-150 ${
                sortConfig.field === "commentCount"
                  ? "text-blue-600 bg-blue-50 hover:bg-blue-100"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
              onClick={() => handleSort("commentCount")}
            >
              <div className="flex items-center gap-1">
                <span>Comments</span>
              </div>
            </th>
            <th
              className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider border-b border-gray-200 cursor-pointer select-none transition-colors duration-150 ${
                sortConfig.field === "zendesk_created_at"
                  ? "text-blue-600 bg-blue-50 hover:bg-blue-100"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
              onClick={() => handleSort("zendesk_created_at")}
            >
              <div className="flex items-center gap-2">
                <span>Created</span>
                {getSortIcon("zendesk_created_at")}
              </div>
            </th>
            <th
              className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider border-b border-gray-200 cursor-pointer select-none transition-colors duration-150 ${
                sortConfig.field === "zendesk_updated_at"
                  ? "text-blue-600 bg-blue-50 hover:bg-blue-100"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
              onClick={() => handleSort("zendesk_updated_at")}
            >
              <div className="flex items-center gap-1">
                <span>Updated</span>
                {getSortIcon("zendesk_updated_at")}
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {allTickets.map((ticket, index) => {
            const isLast = index === allTickets.length - 1;
            return (
              <tr
                key={ticket.id}
                ref={isLast ? lastTicketRef : undefined}
                className="hover:bg-gray-50"
              >
                <td className="px-4 py-3 text-sm text-gray-900">
                  <div className="space-y-1">
                    <div className="font-medium text-gray-900">
                      {ticket.subject || ticket.raw_subject || "No subject"}
                    </div>
                    <div className="text-gray-600 text-xs max-w-xs">
                      {ticket.description
                        ? ticket.description.length > 120
                          ? `${ticket.description.substring(0, 120)}...`
                          : ticket.description
                        : "No description"}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      ticket.priority === "urgent"
                        ? "bg-red-100 text-red-800"
                        : ticket.priority === "high"
                        ? "bg-orange-100 text-orange-800"
                        : ticket.priority === "normal"
                        ? "bg-blue-100 text-blue-800"
                        : ticket.priority === "low"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {ticket.priority || "Not set"}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      ticket.status === "open"
                        ? "bg-green-100 text-green-800"
                        : ticket.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : ticket.status === "solved"
                        ? "bg-blue-100 text-blue-800"
                        : ticket.status === "closed"
                        ? "bg-gray-100 text-gray-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {ticket.status || "Unknown"}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {ticket.via_channel || "Unknown"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center justify-center">
                    <span
                      className={`inline-flex items-center justify-center min-w-6 h-6 px-2 text-xs font-medium rounded-full ${
                        ticket.commentCount === 0
                          ? "bg-gray-100 text-gray-500"
                          : ticket.commentCount <= 3
                          ? "bg-blue-100 text-blue-700"
                          : ticket.commentCount <= 10
                          ? "bg-orange-100 text-orange-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {ticket.commentCount}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {ticket.zendesk_created_at
                    ? new Date(ticket.zendesk_created_at).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )
                    : "Unknown"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {ticket.zendesk_updated_at
                    ? new Date(ticket.zendesk_updated_at).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )
                    : "Unknown"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {isFetchingNextPage && (
        <div className="text-center py-4 text-gray-500">
          Loading more tickets...
        </div>
      )}

      {!hasNextPage && allTickets.length > 0 && (
        <div className="text-center py-4 text-gray-500">
          All tickets loaded ({allTickets.length} total)
        </div>
      )}
    </div>
  );
}
