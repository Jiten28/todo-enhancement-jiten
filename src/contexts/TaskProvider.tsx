import { Dispatch, ReactNode, SetStateAction, useState, useMemo, useCallback } from "react";
import type { Category, SortOption, UUID, Task } from "../types/user";
import { TaskContext } from "./TaskContext";

// ----- Types -----
type DateFilterOption = "all" | "today" | "thisWeek" | "custom";

interface TaskState {
  selectedTaskId: UUID | null;
  anchorEl: null | HTMLElement;
  anchorPosition: { top: number; left: number } | null;
  expandedTasks: UUID[];
  multipleSelectedTasks: UUID[];
  search: string;
  editModalOpen: boolean;
  deleteDialogOpen: boolean;
  sortOption: SortOption;
  sortAnchorEl: null | HTMLElement;
  moveMode: boolean;
  selectMode: boolean;

  // date filter
  dateFilter: DateFilterOption;
  customDateFrom?: string | null;
  customDateTo?: string | null;

  // edit state
  editingTask: Task | null;
}

interface TaskActions {
  setSelectedTaskId: Dispatch<SetStateAction<UUID | null>>;
  setAnchorEl: Dispatch<SetStateAction<null | HTMLElement>>;
  setAnchorPosition: Dispatch<SetStateAction<{ top: number; left: number } | null>>;
  setExpandedTasks: Dispatch<SetStateAction<UUID[]>>;
  setMultipleSelectedTasks: Dispatch<SetStateAction<UUID[]>>;
  setSearch: Dispatch<SetStateAction<string>>;
  toggleShowMore: (taskId: UUID) => void;

  // selection actions
  handleSelectTask: (taskId: UUID) => void;
  clearSelectedTasks: () => void;
  setSelectMode: Dispatch<SetStateAction<boolean>>;

  highlightMatchingText: (text: string) => ReactNode;
  setEditModalOpen: Dispatch<SetStateAction<boolean>>;
  setDeleteDialogOpen: Dispatch<SetStateAction<boolean>>;
  handleDeleteTask: () => void;
  handleCloseMoreMenu: () => void;
  setSortOption: (option: SortOption) => void;
  setSortAnchorEl: Dispatch<SetStateAction<null | HTMLElement>>;
  setMoveMode: Dispatch<SetStateAction<boolean>>;
  updateCategory: (category: Partial<Category>) => void;
  setDateFilter: (filter: DateFilterOption) => void;
  setCustomDateFrom: (value: string | null) => void;
  setCustomDateTo: (value: string | null) => void;

  // edit actions
  setEditingTask: Dispatch<SetStateAction<Task | null>>;
}

export type TaskContextType = TaskState & TaskActions;

// ----- Provider -----
export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedTaskId, setSelectedTaskId] = useState<UUID | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [anchorPosition, setAnchorPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<UUID[]>([]);
  const [multipleSelectedTasks, setMultipleSelectedTasks] = useState<UUID[]>([]);
  const [search, setSearch] = useState<string>("");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>("dateCreated");
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [moveMode, setMoveMode] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilterOption>("all");
  const [customDateFrom, setCustomDateFrom] = useState<string | null>(null);
  const [customDateTo, setCustomDateTo] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Toggle selection
  const handleSelectTask = useCallback((taskId: UUID) => {
    setSelectMode(true);
    setMultipleSelectedTasks((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId],
    );
  }, []);

  // Clear selection
  const clearSelectedTasks = useCallback(() => {
    setMultipleSelectedTasks([]);
    setSelectMode(false);
  }, []);

  // Placeholder handlers
  const toggleShowMore = () => {};
  const highlightMatchingText = (text: string) => text;
  const handleDeleteTask = () => {};
  const handleCloseMoreMenu = () => {};
  const updateCategory = () => {};

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
      multipleSelectedTasks,
      setMultipleSelectedTasks,
      search,
      setSearch,
      toggleShowMore,
      handleSelectTask,
      clearSelectedTasks,
      setSelectMode,
      highlightMatchingText,
      editModalOpen,
      setEditModalOpen,
      deleteDialogOpen,
      setDeleteDialogOpen,
      handleDeleteTask,
      handleCloseMoreMenu,
      sortOption,
      setSortOption,
      sortAnchorEl,
      setSortAnchorEl,
      moveMode,
      setMoveMode,
      selectMode,
      dateFilter,
      setDateFilter,
      customDateFrom,
      setCustomDateFrom,
      customDateTo,
      setCustomDateTo,
      editingTask,
      setEditingTask,
      updateCategory,
    }),
    [
      selectedTaskId,
      anchorEl,
      anchorPosition,
      expandedTasks,
      multipleSelectedTasks,
      search,
      editModalOpen,
      deleteDialogOpen,
      sortOption,
      sortAnchorEl,
      moveMode,
      selectMode,
      dateFilter,
      customDateFrom,
      customDateTo,
      editingTask,
    ],
  );

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};
