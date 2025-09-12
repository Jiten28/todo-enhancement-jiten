import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import PriorityBadge from "../../components/tasks/PriorityBadge";
import { TaskProvider } from "../../contexts/TaskProvider";

describe("PriorityBadge Component", () => {
  it("renders correct label", () => {
    render(
      <TaskProvider>
        <PriorityBadge priority="high" />
      </TaskProvider>,
    );
    expect(screen.getByText("High")).toBeInTheDocument();
  });

  it("applies correct color style", () => {
    render(
      <TaskProvider>
        <PriorityBadge priority="critical" />
      </TaskProvider>,
    );
    const badge = screen.getByText("Critical");
    expect(badge).toHaveStyle({ backgroundColor: "#e92222" });
  });
});
