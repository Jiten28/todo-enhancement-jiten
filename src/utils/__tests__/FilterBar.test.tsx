import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TaskProvider } from "../../contexts/TaskProvider";
import FilterBar from "../../components/tasks/FilterBar";

describe("FilterBar Component", () => {
  it("renders filter options after opening menu", () => {
    render(
      <TaskProvider>
        <FilterBar />
      </TaskProvider>,
    );

    // Open the filter menu
    const filterBtn = screen.getByRole("button", { name: /filter/i });
    fireEvent.click(filterBtn);

    // Now menu items should appear
    expect(screen.getByRole("menuitem", { name: "All" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Today" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "This Week" })).toBeInTheDocument();
  });

  it("selects 'Today' filter", () => {
    render(
      <TaskProvider>
        <FilterBar />
      </TaskProvider>,
    );

    // Open the filter menu
    const filterBtn = screen.getByRole("button", { name: /filter/i });
    fireEvent.click(filterBtn);

    // Click on "Today"
    const todayItem = screen.getByRole("menuitem", { name: "Today" });
    fireEvent.click(todayItem);

    // Assert that the menu item is selected
    expect(todayItem).toHaveClass("Mui-selected");
  });
});
