import { useState } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useAppStore } from "../store/useAppStore";
import { validateApiKey } from "../lib/tmdb";
import { exportLibrary, importLibrary, type ImportProgress } from "../lib/porting";
import type { GridSize, LibraryLayout } from "../types";
import { CloseIcon, LayoutGridIcon, ListIcon } from "./Icons";

type Status = "idle" | "checking" | "ok" | "error";

export function SettingsModal() {
  const open = useAppStore((s) => s.settingsOpen);
  const close = useAppStore((s) => s.closeSettings);
  const apiKey = useAppStore((s) => s.apiKey);
  const saveApiKey = useAppStore((s) => s.saveApiKey);
  const movies = useAppStore((s) => s.movies);
  const refresh = useAppStore((s) => s.refresh);
  const layout = useAppStore((s) => s.layout);
  const gridSize = useAppStore((s) => s.gridSize);
  const setLayout = useAppStore((s) => s.setLayout);
  const setGridSize = useAppStore((s) => s.setGridSize);
  const cloud = useAppStore((s) => s.cloud);
  const guest = useAppStore((s) => s.guest);
  const userEmail = useAppStore((s) => s.userEmail);
  const signOut = useAppStore((s) => s.signOut);
  const openSignIn = useAppStore((s) => s.openSignIn);

  const [value, setValue] = useState(apiKey ?? "");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const [dataMsg, setDataMsg] = useState("");
  const [dataErr, setDataErr] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);

  if (!open) return null;

  async function handleSave() {
    const key = value.trim();
    if (!key) {
      setStatus("error");
      setMessage("Please enter your TMDB API key.");
      return;
    }
    setStatus("checking");
    setMessage("");
    try {
      const valid = await validateApiKey(key);
      if (!valid) {
        setStatus("error");
        setMessage("That key was rejected by TMDB. Double-check and try again.");
        return;
      }
      await saveApiKey(key);
      setStatus("ok");
      setMessage("Saved! Your key is stored locally on this device.");
    } catch (e) {
      setStatus("error");
      setMessage(
        e instanceof Error
          ? `Could not save key: ${e.message}`
          : "Could not save your key. Please run the desktop app (not a browser tab).",
      );
    }
  }

  async function handleExport() {
    setDataErr(false);
    setDataMsg("");
    try {
      const count = await exportLibrary(movies);
      if (count == null) return; // cancelled
      setDataMsg(`Exported ${count} ${count === 1 ? "movie" : "movies"} to CSV.`);
    } catch (e) {
      setDataErr(true);
      setDataMsg(e instanceof Error ? e.message : "Export failed.");
    }
  }

  async function handleImport() {
    setDataErr(false);
    setDataMsg("");
    if (!apiKey) {
      setDataErr(true);
      setDataMsg("Add your TMDB API key first — import looks up each film on TMDB.");
      return;
    }
    setProgress({ done: 0, total: 0, current: "" });
    try {
      const summary = await importLibrary(apiKey, setProgress);
      await refresh();
      if (summary.cancelled) {
        setDataMsg("");
      } else {
        const parts = [`Imported ${summary.imported}`];
        if (summary.skipped) parts.push(`skipped ${summary.skipped}`);
        if (summary.failed) parts.push(`couldn't match ${summary.failed}`);
        setDataMsg(parts.join(" · ") + ".");
      }
    } catch (e) {
      setDataErr(true);
      setDataMsg(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setProgress(null);
    }
  }

  const importing = progress !== null;
  const pct = progress && progress.total > 0 ? (progress.done / progress.total) * 100 : 0;

  return (
    <div className="overlay items-center justify-center" onMouseDown={close}>
      <div
        className="modal max-h-[90vh] max-w-lg overflow-y-auto p-5 sm:p-6"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-white">Settings</h2>
          <button onClick={close} className="icon-btn p-1.5">
            <CloseIcon width={18} height={18} />
          </button>
        </div>

        {cloud && (
          <>
            <label className="mb-2 block text-[13px] font-medium text-white/90">Account</label>
            {guest ? (
              <>
                <p className="mb-3 text-[12px] leading-relaxed text-ink-600">
                  You're browsing as a guest — your library is saved on this device only. Sign in
                  to sync it to an account across devices.
                </p>
                <button
                  onClick={() => {
                    close();
                    openSignIn();
                  }}
                  className="btn btn-primary btn-md"
                >
                  Sign in / Create account
                </button>
              </>
            ) : (
              <>
                <p className="mb-3 text-[12px] leading-relaxed text-ink-600">
                  Signed in as <span className="text-white/80">{userEmail ?? "—"}</span>. Your
                  library is stored in your account and syncs across devices.
                </p>
                <button onClick={() => void signOut()} className="btn btn-secondary btn-md">
                  Sign out
                </button>
              </>
            )}
            <div className="my-5 h-px bg-white/[0.06]" />
          </>
        )}

        {!cloud && (
          <>
            <label className="mb-2 block text-[13px] font-medium text-white/90">TMDB API Key</label>
            <p className="mb-3 text-[12px] leading-relaxed text-ink-600">
              Movie search and metadata are powered by TMDB. Create a free account, then copy your
              API key (v3 auth) from your account settings.{" "}
              <button
                className="text-brand underline underline-offset-2 hover:text-brand/80"
                onClick={() => void openUrl("https://www.themoviedb.org/settings/api")}
              >
                Get an API key
              </button>
            </p>

            <div className="flex gap-2">
              <input
                type="password"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setStatus("idle");
                }}
                placeholder="Paste your TMDB API key"
                className="field min-w-0 flex-1"
              />
              <button
                onClick={handleSave}
                disabled={status === "checking"}
                className="btn btn-primary btn-md shrink-0"
              >
                {status === "checking" ? "Checking…" : "Save"}
              </button>
            </div>

            {message && (
              <p className={`mt-2 text-[12px] ${status === "error" ? "text-red-400" : "text-emerald-400"}`}>
                {message}
              </p>
            )}

            <div className="my-5 h-px bg-white/[0.06]" />
          </>
        )}

        <label className="mb-1 block text-[13px] font-medium text-white/90">Display</label>
        <p className="mb-3 text-[12px] leading-relaxed text-ink-600">
          Choose how your library is laid out. This applies to the To Watch, Watching, Watched,
          Dropped and Favorites views.
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[12px] text-white/80">Card layout</span>
            <div className="inline-flex rounded-lg bg-ink-950 p-0.5 ring-1 ring-white/10">
              {(
                [
                  { id: "grid", label: "Grid", Icon: LayoutGridIcon },
                  { id: "list", label: "List", Icon: ListIcon },
                ] as { id: LibraryLayout; label: string; Icon: typeof LayoutGridIcon }[]
              ).map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setLayout(id)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition ${
                    layout === id ? "bg-brand text-white" : "text-ink-600 hover:text-white"
                  }`}
                >
                  <Icon width={14} height={14} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-[12px] text-white/80">Grid size</span>
            <div
              className={`inline-flex rounded-lg bg-ink-950 p-0.5 ring-1 ring-white/10 ${
                layout === "list" ? "opacity-40" : ""
              }`}
            >
              {(["small", "medium", "large"] as GridSize[]).map((size) => (
                <button
                  key={size}
                  disabled={layout === "list"}
                  onClick={() => setGridSize(size)}
                  className={`rounded-md px-3 py-1.5 text-[12px] font-medium capitalize transition ${
                    gridSize === size ? "bg-brand text-white" : "text-ink-600 hover:text-white"
                  } ${layout === "list" ? "cursor-not-allowed" : ""}`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>

        {!cloud && (
          <>
            <div className="my-5 h-px bg-white/[0.06]" />

            <label className="mb-1 block text-[13px] font-medium text-white/90">Data</label>
            <p className="mb-3 text-[12px] leading-relaxed text-ink-600">
              Back up your library to a CSV file, or import from a CSV — including a Letterboxd
              export. Imported titles are matched and enriched via TMDB.
            </p>

            {importing ? (
          <div className="rounded-lg bg-ink-950 p-3 ring-1 ring-white/10">
            <div className="mb-2 flex justify-between text-[12px] text-white/80">
              <span className="truncate pr-2">Importing {progress?.current}</span>
              <span className="shrink-0 tabular-nums text-ink-600">
                {progress?.done}/{progress?.total || "…"}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className="h-full rounded-full bg-brand transition-[width]"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button onClick={handleExport} className="btn btn-secondary btn-md flex-1">
              Export CSV
            </button>
            <button onClick={handleImport} className="btn btn-secondary btn-md flex-1">
              Import CSV
            </button>
          </div>
        )}

        {dataMsg && (
          <p className={`mt-2 text-[12px] ${dataErr ? "text-red-400" : "text-emerald-400"}`}>
            {dataMsg}
          </p>
        )}
          </>
        )}

        <div className="mt-6 flex justify-end">
          <button onClick={close} className="btn btn-ghost btn-md">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
