"use client";

import { useFormStatus } from "react-dom";
import { syncTicketsAction } from "./actions";
import { useEffect, useState } from "react";

interface SyncState {
  success?: boolean;
  rateLimited?: boolean;
  waitTime?: number;
  error?: string;
}

function SubmitButton({ syncState }: { syncState: SyncState | null }) {
  const { pending } = useFormStatus();
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (syncState?.rateLimited && syncState.waitTime) {
      setCountdown(syncState.waitTime);

      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev && prev > 1) {
            return prev - 1;
          } else {
            clearInterval(interval);
            return null;
          }
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [syncState]);

  const isDisabled = pending || countdown !== null;

  return (
    <button
      type="submit"
      disabled={isDisabled}
      className={`px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-200 ${
        isDisabled
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-blue-600 hover:bg-blue-700 hover:scale-105"
      } text-white shadow-lg`}
    >
      {pending
        ? "Syncing..."
        : countdown
        ? `Rate Limited (${countdown}s)`
        : "Sync from Zendesk"}
    </button>
  );
}

export default function Home() {
  const [syncState, setSyncState] = useState<SyncState | null>(null);

  const handleSync = async (formData: FormData) => {
    const result = await syncTicketsAction();
    setSyncState(result);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">
        Champ AI - Zendesk Sync
      </h1>

      <form action={handleSync}>
        <SubmitButton syncState={syncState} />
      </form>

      {syncState?.success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg max-w-md text-center">
          <strong>Success!</strong> Zendesk sync completed successfully.
        </div>
      )}

      {syncState?.rateLimited && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg max-w-md text-center">
          <strong>Rate Limited:</strong> Zendesk API rate limit exceeded. Please
          wait before trying again.
        </div>
      )}

      {syncState?.error && !syncState.rateLimited && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg max-w-md text-center">
          <strong>Error:</strong> {syncState.error}
        </div>
      )}

      <div className="text-sm text-gray-600 text-center max-w-md mt-4">
        This will fetch all tickets updated in the past 30 days from Zendesk.
      </div>
    </div>
  );
}
