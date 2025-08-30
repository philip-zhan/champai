"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useRef, useCallback } from "react";

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
}

interface TicketsResponse {
  tickets: Ticket[];
  total: number;
  hasMore: boolean;
}

async function fetchTickets(page: number): Promise<TicketsResponse> {
  const response = await fetch(`/api/tickets?page=${page}&limit=50`);
  if (!response.ok) {
    throw new Error("Failed to fetch tickets");
  }
  return response.json();
}

export default function TicketsTableClient() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ["tickets"],
    queryFn: ({ pageParam = 1 }) => fetchTickets(pageParam),
    getNextPageParam: (lastPage, pages) => {
      if (!lastPage.hasMore) return undefined;
      return pages.length + 1;
    },
    initialPageParam: 1,
    refetchInterval: 5000,
  });

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
      <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
              Subject
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
              Description
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
              Priority
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
              Channel
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
              Created
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
              Updated
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
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {ticket.subject || ticket.raw_subject || "No subject"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                  {ticket.description || "No description"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
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
                <td className="px-6 py-4 whitespace-nowrap">
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
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {ticket.via_channel || "Unknown"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {ticket.zendesk_created_at 
                    ? new Date(ticket.zendesk_created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Unknown'
                  }
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {ticket.zendesk_updated_at 
                    ? new Date(ticket.zendesk_updated_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Unknown'
                  }
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
