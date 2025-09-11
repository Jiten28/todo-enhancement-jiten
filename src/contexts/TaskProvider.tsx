import { ReactNode, useState, useCallback, useMemo, useContext } from "react";
import type { Category, SortOption, UUID, Task } from "../types/user";
import { useStorageState } from "../hooks/useStorageState";
import { HighlightedText } from "../components/tasks/tasks.styled";
import { TaskContext, TaskContextType } from "./TaskContext";
import { UserContext } from "../contexts/UserContext";

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const { user, setUser } = useContext(UserContext);

  const [selectedTaskId, setSelectedTaskId] = useState<UUID | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [anchorPosition, setAnchorPosition] = useState<{ top: number; left: number } | null>(null);
  const [expandedTasks, setExpandedTasks] = useStorageState<UUID[]>(
    [],
    "expandedTasks",
    "sessionStorage",
  );
  const [multipleSelectedTasks, setMultipleSelectedTasks] = useStorageState<UUID[]>(
    [],
    "selectedTasks",
    "sessionStorage",
  );
  const [search, setSearch] = useStorageState<string>("", "search", "sessionStorage");
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [moveMode, setMoveMode] = useStorageState<boolean>(false, "moveMode", "sessionStorage");

  // ✅ editing state
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // ✅ date filter state
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "thisWeek" | "custom">("all");
  const [customDateFrom, setCustomDateFrom] = useState<string | null>(null);
  const [customDateTo, setCustomDateTo] = useState<string | null>(null);

  const sortOption = user.settings.sortOption;
  const setSortOption = useCallback(
    (option: SortOption) => {
      setUser((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          sortOption: option,
        },
      }));
    },
    [setUser],
  );

  const toggleShowMore = useCallback(
    (taskId: UUID) => {
      setExpandedTasks((prevExpandedTasks) => {
        if (prevExpandedTasks.includes(taskId)) {
          return prevExpandedTasks.filter((id) => id !== taskId);
        } else {
          return [...prevExpandedTasks, taskId];
        }
      });
    },
    [setExpandedTasks],
  );

  const handleSelectTask = useCallback(
    (taskId: UUID) => {
      setAnchorEl(null);
      setMultipleSelectedTasks((prevSelectedTaskIds) => {
        if (prevSelectedTaskIds.includes(taskId)) {
          return prevSelectedTaskIds.filter((id) => id !== taskId);
        } else {
          return [...prevSelectedTaskIds, taskId];
        }
      });
    },
    [setMultipleSelectedTasks],
  );

  const highlightMatchingText = useCallback(
    (text: string) => {
      if (!search) {
        return text;
      }
      const parts = text.split(new RegExp(`(${search})`, "gi"));
      return parts.map((part, index) =>
        part.toLowerCase() === search.toLowerCase() ? (
          <HighlightedText key={index}>{part}</HighlightedText>
        ) : (
          part
        ),
      );
    },
    [search],
  );

  const handleDeleteTask = useCallback(() => {
    if (selectedTaskId) {
      setDeleteDialogOpen(true);
    }
  }, [selectedTaskId]);

  const handleCloseMoreMenu = useCallback(() => {
    setAnchorEl(null);
    document.body.style.overflow = "visible";
  }, []);

  const updateCategory = useCallback(
    (patch: Partial<Category>) => {
      setUser((prev) => {
        const updatedCategories = prev.categories.map((c) =>
          c.id === patch.id ? { ...c, ...patch } : c,
        );
        const updatedTasks = prev.tasks.map((task) => {
          const updatedCategoryList = task.category?.map((c) =>
            c.id === patch.id ? { ...c, ...patch } : c,
          );
          return { ...task, category: updatedCategoryList };
        });
        return {
          ...prev,
          categories: updatedCategories,
          tasks: updatedTasks,
        };
      });
    },
    [setUser],
  );

  const contextValue = useMemo<TaskContextType>(
    () => ({
      selectedTaskId,
      setSelectedTaskId,
      anchorEl,
      setAnchorEl,
      anchorPosition,
      setAnchorPosition,
      expandedTasks,
      setExpandedTasks,
      toggleShowMore,
      search,
      setSearch,
      highlightMatchingText,
      multipleSelectedTasks,
      setMultipleSelectedTasks,
      handleSelectTask,
      editModalOpen,
      setEditModalOpen,
      editingTask,
      setEditingTask,
      handleDeleteTask,
      deleteDialogOpen,
      setDeleteDialogOpen,
      handleCloseMoreMenu,
      sortOption,
      setSortOption,
      sortAnchorEl,
      setSortAnchorEl,
      moveMode,
      setMoveMode,
      updateCategory,
      dateFilter,
      setDateFilter,
      customDateFrom,
      setCustomDateFrom,
      customDateTo,
      setCustomDateTo,
    }),
    [
      selectedTaskId,
      anchorEl,
      anchorPosition,
      expandedTasks,
      toggleShowMore,
      search,
      highlightMatchingText,
      multipleSelectedTasks,
      handleSelectTask,
      editModalOpen,
      editingTask,
      handleDeleteTask,
      deleteDialogOpen,
      handleCloseMoreMenu,
      sortOption,
      setSortOption,
      sortAnchorEl,
      moveMode,
      updateCategory,
      dateFilter,
      customDateFrom,
      customDateTo,
    ],
  );

  return <TaskContext.Provider value={contextValue}>{children}</TaskContext.Provider>;
};
