import { syncTicketsAction } from "./actions";
import ZendeskSyncForm from "./components/ZendeskSyncForm";
import TicketsTableClient from "./components/TicketsTableClient";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Champ AI - Zendesk Tickets
          </h1>
          <ZendeskSyncForm onSync={syncTicketsAction} />
        </div>

        {/* Tickets Table Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Tickets</h2>
            <p className="text-sm text-gray-600">
              View all tickets imported from Zendesk
            </p>
          </div>
          <TicketsTableClient />
        </div>
      </div>
    </div>
  );
}
