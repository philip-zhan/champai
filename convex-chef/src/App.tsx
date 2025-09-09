import { Authenticated, Unauthenticated, useQuery, useMutation, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster, toast } from "sonner";
import { useState } from "react";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
        <h2 className="text-xl font-semibold text-primary">Zendesk Sync</h2>
        <SignOutButton />
      </header>
      <main className="flex-1 p-8">
        <Content />
      </main>
      <Toaster />
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Authenticated>
        <ZendeskDashboard />
      </Authenticated>
      <Unauthenticated>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary mb-4">Zendesk Sync Dashboard</h1>
          <p className="text-xl text-secondary mb-8">Sign in to sync and view Zendesk tickets</p>
          <SignInForm />
        </div>
      </Unauthenticated>
    </div>
  );
}

function ZendeskDashboard() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tickets' | 'ticket-detail'>('dashboard');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  
  const syncStatus = useQuery(api.tickets.getSyncStatus);
  const stats = useQuery(api.tickets.getStats);
  const tickets = useQuery(api.tickets.list, { limit: 20 });
  const selectedTicket = useQuery(
    api.tickets.getById,
    selectedTicketId ? { ticketId: selectedTicketId as any } : "skip"
  );
  
  const startSync = useAction(api.zendesk.startSync);

  const handleSync = async () => {
    try {
      toast.loading("Starting Zendesk sync...");
      await startSync({});
      toast.success("Sync started successfully!");
    } catch (error) {
      toast.error(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleTicketClick = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setActiveTab('ticket-detail');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">Zendesk Sync Dashboard</h1>
        <button
          onClick={handleSync}
          disabled={syncStatus?.isRunning}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {syncStatus?.isRunning ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Syncing...
            </>
          ) : (
            'Sync from Zendesk'
          )}
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'dashboard'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'tickets'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Tickets
          </button>
          {selectedTicketId && (
            <button
              onClick={() => setActiveTab('ticket-detail')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'ticket-detail'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Ticket Details
            </button>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'dashboard' && (
        <DashboardTab syncStatus={syncStatus} stats={stats} />
      )}
      
      {activeTab === 'tickets' && (
        <TicketsTab tickets={tickets} onTicketClick={handleTicketClick} />
      )}
      
      {activeTab === 'ticket-detail' && selectedTicket && (
        <TicketDetailTab 
          ticket={selectedTicket} 
          onBack={() => setActiveTab('tickets')} 
        />
      )}
    </div>
  );
}

function DashboardTab({ syncStatus, stats }: { syncStatus: any; stats: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Sync Status Card */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Sync Status</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Status:</span>
            <span className={`font-medium ${syncStatus?.isRunning ? 'text-yellow-600' : 'text-green-600'}`}>
              {syncStatus?.isRunning ? 'Running' : 'Idle'}
            </span>
          </div>
          {syncStatus?.lastFullSync && (
            <div className="flex justify-between">
              <span>Last Full Sync:</span>
              <span className="text-sm text-gray-600">
                {new Date(syncStatus.lastFullSync).toLocaleString()}
              </span>
            </div>
          )}
          {syncStatus?.lastIncrementalSync && (
            <div className="flex justify-between">
              <span>Last Update:</span>
              <span className="text-sm text-gray-600">
                {new Date(syncStatus.lastIncrementalSync).toLocaleString()}
              </span>
            </div>
          )}
          {syncStatus?.lastError && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
              <span className="text-red-600 text-sm">{syncStatus.lastError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Card */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Statistics</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Total Tickets:</span>
            <span className="font-medium">{stats?.totalTickets || 0}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Comments:</span>
            <span className="font-medium">{stats?.totalComments || 0}</span>
          </div>
        </div>
      </div>

      {/* Status Breakdown Card */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Ticket Status</h3>
        <div className="space-y-2">
          {stats?.statusBreakdown && Object.entries(stats.statusBreakdown).map(([status, count]) => (
            <div key={status} className="flex justify-between">
              <span className="capitalize">{status}:</span>
              <span className="font-medium">{count as number}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TicketsTab({ tickets, onTicketClick }: { tickets: any; onTicketClick: (id: string) => void }) {
  if (!tickets || tickets.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow text-center">
        <p className="text-gray-500">No tickets found. Run a sync to import tickets from Zendesk.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subject
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Updated
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Zendesk ID
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tickets.map((ticket: any) => (
              <tr 
                key={ticket._id} 
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => onTicketClick(ticket._id)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                    {ticket.subject}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    ticket.status === 'open' ? 'bg-red-100 text-red-800' :
                    ticket.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    ticket.status === 'solved' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {ticket.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                  {ticket.priority}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(ticket.updatedAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  #{ticket.zendeskId}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TicketDetailTab({ ticket, onBack }: { ticket: any; onBack: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="px-4 py-2 text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          ← Back to Tickets
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="border-b pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{ticket.subject}</h2>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <span>Status: <span className="font-medium capitalize">{ticket.status}</span></span>
            <span>Priority: <span className="font-medium capitalize">{ticket.priority}</span></span>
            <span>Zendesk ID: <span className="font-medium">#{ticket.zendeskId}</span></span>
            <span>Created: <span className="font-medium">{new Date(ticket.createdAt).toLocaleString()}</span></span>
            <span>Updated: <span className="font-medium">{new Date(ticket.updatedAt).toLocaleString()}</span></span>
          </div>
          {ticket.tags && ticket.tags.length > 0 && (
            <div className="mt-2">
              <span className="text-sm text-gray-600">Tags: </span>
              {ticket.tags.map((tag: string) => (
                <span key={tag} className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded mr-2">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Description</h3>
          <div className="bg-gray-50 p-4 rounded border">
            <p className="whitespace-pre-wrap text-gray-700">{ticket.description}</p>
          </div>
        </div>

        {ticket.comments && ticket.comments.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Comments ({ticket.comments.length})</h3>
            <div className="space-y-4">
              {ticket.comments.map((comment: any) => (
                <div key={comment._id} className="border rounded p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-gray-900">Author ID: {comment.authorId}</span>
                    <div className="text-sm text-gray-500">
                      <span className={`inline-block px-2 py-1 rounded text-xs mr-2 ${
                        comment.public ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {comment.public ? 'Public' : 'Internal'}
                      </span>
                      {new Date(comment.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-gray-700 whitespace-pre-wrap">
                    {comment.plainBody || comment.body}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
