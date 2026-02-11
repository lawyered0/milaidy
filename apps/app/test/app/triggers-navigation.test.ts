import { describe, expect, test } from "vitest";
import { TAB_GROUPS, pathForTab, tabFromPath, titleForTab } from "../../src/navigation";

describe("navigation", () => {
  test("resolves path and title for advanced tabs", () => {
    expect(pathForTab("advanced")).toBe("/advanced");
    expect(tabFromPath("/advanced")).toBe("advanced");
    expect(titleForTab("advanced")).toBe("Advanced");

    expect(pathForTab("trajectories")).toBe("/trajectories");
    expect(tabFromPath("/trajectories")).toBe("trajectories");
    expect(titleForTab("trajectories")).toBe("Trajectories");

    expect(pathForTab("voice")).toBe("/voice");
    expect(tabFromPath("/voice")).toBe("settings");
    expect(titleForTab("voice")).toBe("Voice");

    expect(pathForTab("runtime")).toBe("/runtime");
    expect(tabFromPath("/runtime")).toBe("runtime");
    expect(titleForTab("runtime")).toBe("Runtime");
  });

  test("includes advanced tabs in Advanced group", () => {
    const advanced = TAB_GROUPS.find((group) => group.label === "Advanced");
    expect(advanced).toBeDefined();
    expect(advanced?.tabs.includes("advanced")).toBe(true);
    expect(advanced?.tabs.includes("plugins")).toBe(true);
    expect(advanced?.tabs.includes("trajectories")).toBe(true);
    expect(advanced?.tabs.includes("runtime")).toBe(true);
    expect(advanced?.tabs.includes("database")).toBe(true);
    expect(advanced?.tabs.includes("logs")).toBe(true);
  });

  test("hides Voice from top-level header groups", () => {
    const voice = TAB_GROUPS.find((group) => group.label === "Voice");
    expect(voice).toBeUndefined();
  });

  test("keeps /game as a legacy redirect to apps", () => {
    expect(tabFromPath("/game")).toBe("apps");
  });

  test("does not expose game as a top-level apps tab", () => {
    const apps = TAB_GROUPS.find((group) => group.label === "Apps");
    expect(apps).toBeDefined();
    expect(apps?.tabs).toEqual(["apps"]);
  });
});
