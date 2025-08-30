import { syncTicketsAction } from "./actions";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <form action={syncTicketsAction}>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg text-lg transition-colors duration-200"
        >
          Sync from Zendesk
        </button>
      </form>
    </div>
  );
}
