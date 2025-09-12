import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/dom"; // ✅ FIXED
import { describe, it, expect } from "vitest";
import PriorityBadge from "../../components/tasks/PriorityBadge";

describe("PriorityBadge Component", () => {
  it("renders correct label", () => {
    render(<PriorityBadge priority="high" />);
    expect(screen.getByText("High")).toBeInTheDocument();
  });

  it("applies correct color style", () => {
    render(<PriorityBadge priority="critical" />);
    const badge = screen.getByText("Critical");
    expect(badge).toHaveStyle({ backgroundColor: "#e92222" });
  });
});
