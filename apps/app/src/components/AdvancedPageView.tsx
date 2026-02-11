/**
 * AdvancedPageView — container for advanced configuration sub-tabs.
 *
 * Sub-tabs:
 *   - Plugins: Feature/connector/skills plugin management
 *   - Trajectories: LLM call viewer and analysis
 *   - Runtime: Runtime object inspection
 *   - Databases: Tables/media/vector browser
 *   - Logs: Runtime log viewer
 */

import { useState } from "react";
import { useApp } from "../AppContext";
import { PluginsPageView } from "./PluginsPageView";
import { TrajectoriesView } from "./TrajectoriesView";
import { TrajectoryDetailView } from "./TrajectoryDetailView";
import { RuntimeView } from "./RuntimeView";
import { DatabasePageView } from "./DatabasePageView";
import { LogsPageView } from "./LogsPageView";
import type { Tab } from "../navigation";

type SubTab = "plugins" | "trajectories" | "runtime" | "database" | "logs";

const SUB_TABS: Array<{ id: SubTab; label: string; description: string }> = [
  { id: "plugins", label: "Plugins", description: "Features, connectors, and skills" },
  { id: "trajectories", label: "Trajectories", description: "LLM call history and analysis" },
  { id: "runtime", label: "Runtime", description: "Deep runtime object introspection and load order" },
  { id: "database", label: "Databases", description: "Tables, media, and vector browser" },
  { id: "logs", label: "Logs", description: "Runtime and service logs" },
];

function mapTabToSubTab(tab: Tab): SubTab {
  switch (tab) {
    case "plugins": return "plugins";
    case "trajectories": return "trajectories";
    case "runtime": return "runtime";
    case "database": return "database";
    case "logs": return "logs";
    default: return "plugins";
  }
}

export function AdvancedPageView() {
  const { tab, setTab } = useApp();
  const [selectedTrajectoryId, setSelectedTrajectoryId] = useState<string | null>(null);

  const currentSubTab = mapTabToSubTab(tab);

  const handleSubTabChange = (subTab: SubTab) => {
    setSelectedTrajectoryId(null);
    switch (subTab) {
      case "plugins":
        setTab("plugins");
        break;
      case "trajectories":
        setTab("trajectories");
        break;
      case "runtime":
        setTab("runtime");
        break;
      case "database":
        setTab("database");
        break;
      case "logs":
        setTab("logs");
        break;
      default:
        setTab("plugins");
    }
  };

  const renderContent = () => {
    switch (currentSubTab) {
      case "plugins":
        return <PluginsPageView />;
      case "trajectories":
        if (selectedTrajectoryId) {
          return (
            <TrajectoryDetailView
              trajectoryId={selectedTrajectoryId}
              onBack={() => setSelectedTrajectoryId(null)}
            />
          );
        }
        return (
          <TrajectoriesView onSelectTrajectory={setSelectedTrajectoryId} />
        );
      case "runtime":
        return <RuntimeView />;
      case "database":
        return <DatabasePageView />;
      case "logs":
        return <LogsPageView />;
      default:
        return <PluginsPageView />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with sub-tabs */}
      <div className="mb-4">
        <h2 className="text-lg font-bold mb-2">Advanced</h2>

        {/* Sub-tab navigation */}
        <div className="flex gap-1 border-b border-border">
          {SUB_TABS.map((subTab) => {
            const isActive = currentSubTab === subTab.id;
            return (
              <button
                key={subTab.id}
                className={`px-4 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${
                  isActive
                    ? "border-accent text-accent"
                    : "border-transparent text-muted hover:text-txt hover:border-border"
                }`}
                onClick={() => handleSubTabChange(subTab.id)}
                title={subTab.description}
              >
                {subTab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 min-h-0">
        {renderContent()}
      </div>
    </div>
  );
}
