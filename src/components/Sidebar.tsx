import { useAppStore } from "../store/useAppStore";
import { STATUS_LABELS, STATUS_ORDER, type WatchStatus } from "../types";
import {
  BookmarkIcon,
  EyeIcon,
  CheckIcon,
  CloseIcon,
  FilmIcon,
  SettingsIcon,
  ChartIcon,
  HeartIcon,
  CompassIcon,
  SparkIcon,
} from "./Icons";
import { QuoteBar } from "./QuoteBar";

const TAB_ICONS: Record<WatchStatus, typeof BookmarkIcon> = {
  to_watch: BookmarkIcon,
  watching: EyeIcon,
  watched: CheckIcon,
  dropped: CloseIcon,
};

export function Sidebar() {
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);
  const openSettings = useAppStore((s) => s.openSettings);
  const movies = useAppStore((s) => s.movies);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);

  const counts = movies.reduce<Record<WatchStatus, number>>(
    (acc, m) => {
      acc[m.status] += 1;
      return acc;
    },
    { to_watch: 0, watching: 0, watched: 0, dropped: 0 },
  );
  const favoriteCount = movies.reduce((n, m) => n + (m.favorite === 1 ? 1 : 0), 0);

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-white/[0.06] bg-ink-900/60 backdrop-blur-xl">
      <button
        onClick={toggleSidebar}
        title="Collapse sidebar"
        className="group flex items-center gap-2.5 px-4 pb-3 pt-5 text-left"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-gradient-to-b from-brand to-brand-strong text-white shadow-sm transition group-hover:brightness-110">
          <FilmIcon width={16} height={16} />
        </span>
        <div className="text-[13px] font-semibold tracking-[-0.01em] text-white/90">
          Movie Tracker
        </div>
      </button>

      <div className="px-4 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-wider text-ink-600">
        Library
      </div>

      <nav className="flex flex-col gap-0.5 px-2.5">
        {STATUS_ORDER.map((status) => {
          const Icon = TAB_ICONS[status];
          const active = view === "library" && status === activeTab;
          return (
            <button
              key={status}
              onClick={() => setActiveTab(status)}
              className={`flex items-center justify-between rounded-md px-2.5 py-1.5 text-[13px] transition ${
                active
                  ? "bg-brand text-white shadow-sm"
                  : "text-white/75 hover:bg-white/[0.06]"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Icon
                  width={16}
                  height={16}
                  className={active ? "text-white" : "text-ink-600"}
                />
                {STATUS_LABELS[status]}
              </span>
              <span
                className={`min-w-5 text-right text-[11px] tabular-nums ${
                  active ? "text-white/80" : "text-ink-600"
                }`}
              >
                {counts[status]}
              </span>
            </button>
          );
        })}

        {(() => {
          const active = view === "library" && activeTab === "favorites";
          return (
            <button
              onClick={() => setActiveTab("favorites")}
              className={`flex items-center justify-between rounded-md px-2.5 py-1.5 text-[13px] transition ${
                active ? "bg-brand text-white shadow-sm" : "text-white/75 hover:bg-white/[0.06]"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <HeartIcon
                  width={16}
                  height={16}
                  className={active ? "text-white" : "text-rose-500"}
                  fill={active ? "currentColor" : "none"}
                />
                Favorites
              </span>
              <span
                className={`min-w-5 text-right text-[11px] tabular-nums ${
                  active ? "text-white/80" : "text-ink-600"
                }`}
              >
                {favoriteCount}
              </span>
            </button>
          );
        })()}
      </nav>

      <div className="px-4 pb-1.5 pt-4 text-[11px] font-semibold uppercase tracking-wider text-ink-600">
        Browse
      </div>
      <nav className="flex flex-col gap-0.5 px-2.5">
        <button
          onClick={() => setView("discover")}
          className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition ${
            view === "discover"
              ? "bg-brand text-white shadow-sm"
              : "text-white/75 hover:bg-white/[0.06]"
          }`}
        >
          <CompassIcon
            width={16}
            height={16}
            className={view === "discover" ? "text-white" : "text-ink-600"}
          />
          Discover
        </button>
        <button
          onClick={() => setView("recommend")}
          className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition ${
            view === "recommend"
              ? "bg-brand text-white shadow-sm"
              : "text-white/75 hover:bg-white/[0.06]"
          }`}
        >
          <SparkIcon
            width={16}
            height={16}
            className={view === "recommend" ? "text-white" : "text-ink-600"}
          />
          For You
        </button>
        <button
          onClick={() => setView("insights")}
          className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition ${
            view === "insights"
              ? "bg-brand text-white shadow-sm"
              : "text-white/75 hover:bg-white/[0.06]"
          }`}
        >
          <ChartIcon
            width={16}
            height={16}
            className={view === "insights" ? "text-white" : "text-ink-600"}
          />
          Statistics
        </button>
      </nav>

      <div className="mt-auto">
        <QuoteBar />
        <div className="p-2.5">
          <button
            onClick={openSettings}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] text-white/70 transition hover:bg-white/[0.06] hover:text-white/90"
          >
            <SettingsIcon width={16} height={16} className="text-ink-600" />
            Settings
          </button>
        </div>
      </div>
    </aside>
  );
}
