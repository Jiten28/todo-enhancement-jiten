import { ReactNode, useState, useMemo, useCallback, useContext } from "react";
import type { Category, SortOption, UUID, Task } from "../types/user";
import { useStorageState } from "../hooks/useStorageState";
import { HighlightedText } from "../components/tasks/tasks.styled";
import { TaskContext, TaskContextType } from "./TaskContext";
import { UserContext } from "./UserContext";

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, setUser } = useContext(UserContext);

  const [selectedTaskId, setSelectedTaskId] = useState<UUID | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [anchorPosition, setAnchorPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

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
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [moveMode, setMoveMode] = useStorageState<boolean>(false, "moveMode", "sessionStorage");
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [dateFilter, setDateFilter] = useState<"all" | "today" | "thisWeek" | "custom">("all");
  const [customDateFrom, setCustomDateFrom] = useState<string | null>(null);
  const [customDateTo, setCustomDateTo] = useState<string | null>(null);

  const [selectMode, setSelectMode] = useState(false);

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
      setExpandedTasks((prevExpandedTasks) =>
        prevExpandedTasks.includes(taskId)
          ? prevExpandedTasks.filter((id) => id !== taskId)
          : [...prevExpandedTasks, taskId],
      );
    },
    [setExpandedTasks],
  );

  const handleSelectTask = useCallback(
    (taskId: UUID) => {
      setAnchorEl(null);
      setMultipleSelectedTasks((prev) =>
        prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId],
      );
      setSelectMode(true);
    },
    [setMultipleSelectedTasks],
  );

  const clearSelectedTasks = useCallback(() => {
    setMultipleSelectedTasks([]);
    setSelectMode(false);
  }, [setMultipleSelectedTasks]);

  const highlightMatchingText = useCallback(
    (text?: string) => {
      if (!text) return null;
      if (!search) return text;

      const safeSearch = search.toLowerCase();
      const parts = text.split(new RegExp(`(${search})`, "gi"));

      return parts.map((part, index) =>
        part.toLowerCase() === safeSearch ? (
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

  const value: TaskContextType = useMemo(
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
      clearSelectedTasks,
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
      selectMode,
      setSelectMode,
    }),
    [
      selectedTaskId,
      anchorEl,
      anchorPosition,
      expandedTasks,
      search,
      multipleSelectedTasks,
      editModalOpen,
      editingTask,
      deleteDialogOpen,
      sortOption,
      sortAnchorEl,
      moveMode,
      dateFilter,
      customDateFrom,
      customDateTo,
      selectMode,
    ],
  );

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};
