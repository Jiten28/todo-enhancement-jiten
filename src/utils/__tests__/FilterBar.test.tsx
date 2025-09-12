import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import { screen, fireEvent } from "@testing-library/dom"; // ✅ FIXED
import { describe, it, expect } from "vitest";
import { TaskProvider } from "../../contexts/TaskProvider";
import FilterBar from "../../components/tasks/FilterBar";

describe("FilterBar Component", () => {
  it("renders filter options", () => {
    render(
      <TaskProvider>
        <FilterBar />
      </TaskProvider>,
    );

    expect(screen.getByText("All")).toBeInTheDocument();
    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("This Week")).toBeInTheDocument();
  });

  it("selects 'Today' filter", () => {
    render(
      <TaskProvider>
        <FilterBar />
      </TaskProvider>,
    );

    const todayBtn = screen.getByText("Today");
    fireEvent.click(todayBtn);

    expect(todayBtn).toHaveClass("Mui-selected");
  });
});
