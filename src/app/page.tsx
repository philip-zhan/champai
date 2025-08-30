"use client";

import { useFormStatus } from "react-dom";
import { syncTicketsAction } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <button
      type="submit"
      disabled={pending}
      className={`px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-200 ${
        pending 
          ? "bg-gray-400 cursor-not-allowed" 
          : "bg-blue-600 hover:bg-blue-700 hover:scale-105"
      } text-white shadow-lg`}
    >
      {pending ? "Syncing..." : "Sync from Zendesk"}
    </button>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <form action={syncTicketsAction}>
        <SubmitButton />
      </form>
    </div>
  );
}
