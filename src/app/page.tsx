import { syncTicketsAction } from "./actions";
import ZendeskSyncForm from "./components/ZendeskSyncForm";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">
        Champ AI - Zendesk Sync
      </h1>

      <ZendeskSyncForm onSync={syncTicketsAction} />
    </div>
  );
}
