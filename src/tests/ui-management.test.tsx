// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Sparkles } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { TooltipProvider } from "../components/ui/tooltip";
import { UserMenu } from "../components/shared/UserMenu";

const mockWeb3 = {
  userAddress: "GABCDEF1234567890",
  userRole: "ADVERTISER",
  xlmBalance: "12.50",
  updateUserRole: vi.fn().mockResolvedValue(undefined),
  disconnectWallet: vi.fn(),
};

vi.mock("../hooks/useWeb3", () => ({
  useWeb3: () => mockWeb3,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

beforeEach(() => {
  window.history.replaceState({}, "", "/");
  window.localStorage.clear();
});

function renderTabs(props: { queryParam?: string; storageKey?: string } = {}) {
  return render(
    <Tabs defaultValue="overview" queryParam={props.queryParam} storageKey={props.storageKey}>
      <TabsList aria-label="Campaign views">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Overview panel</TabsContent>
      <TabsContent value="activity">Activity panel</TabsContent>
    </Tabs>,
  );
}

describe("UI management components", () => {
  it("uses the default tab for invalid URLs and synchronizes keyboard and history navigation", () => {
    window.history.replaceState({}, "", "/?view=unknown");
    renderTabs({ queryParam: "view", storageKey: "campaign-view" });

    expect(screen.getByText("Overview panel")).toBeTruthy();
    const overviewTab = screen.getByRole("tab", { name: "Overview" });
    fireEvent.keyDown(overviewTab, { key: "ArrowRight" });

    expect(screen.getByText("Activity panel")).toBeTruthy();
    expect(new URLSearchParams(window.location.search).get("view")).toBe("activity");

    window.history.replaceState({}, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
    expect(screen.getByText("Overview panel")).toBeTruthy();
  });

  it("persists an uncontrolled selection across remounts", () => {
    const firstRender = renderTabs({ storageKey: "persisted-view" });
    fireEvent.click(screen.getByRole("tab", { name: "Activity" }));
    expect(screen.getByText("Activity panel")).toBeTruthy();
    firstRender.unmount();

    renderTabs({ storageKey: "persisted-view" });
    expect(screen.getByText("Activity panel")).toBeTruthy();
  });

  it("renders semantic badge colors, an icon, and a focusable tooltip trigger", () => {
    const { container } = render(
      <TooltipProvider>
        <Badge variant="emerald" icon={Sparkles} tooltip="Campaign is active">
          Active
        </Badge>
        <Badge variant="amber">Review</Badge>
        <Badge variant="rose">Blocked</Badge>
        <Badge variant="indigo">Campaign</Badge>
      </TooltipProvider>,
    );

    const badges = container.querySelectorAll("span");
    expect(badges[0].className).toContain("text-emerald-700");
    expect(badges[0].getAttribute("tabindex")).toBe("0");
    expect(badges[0].querySelector("svg")).toBeTruthy();
    expect(badges[1].className).toContain("text-amber-800");
    expect(badges[2].className).toContain("text-rose-700");
    expect(badges[3].className).toContain("text-indigo-700");
  });

  it("shows only the active role dashboard link and switches roles through Web3 state", async () => {
    const onNavigate = vi.fn();
    render(<UserMenu onNavigate={onNavigate} />);

    fireEvent.click(screen.getByRole("button", { name: /Account menu/ }));
    expect(screen.getByRole("button", { name: "Advertiser dashboard" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Affiliate dashboard" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Affiliate$/ }));
    expect(mockWeb3.updateUserRole).toHaveBeenCalledWith("AFFILIATE");
    await waitFor(() => expect(onNavigate).toHaveBeenCalledWith("affiliate"));
  });
});
