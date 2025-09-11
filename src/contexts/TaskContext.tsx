import { Dispatch, ReactNode, SetStateAction, createContext } from "react";
import type { Category, SortOption, UUID, Task } from "../types/user";

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

  // date filter
  dateFilter: DateFilterOption;
  customDateFrom?: string | null;
  customDateTo?: string | null;

  // ✅ edit state
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
  handleSelectTask: (taskId: UUID) => void;
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

  // ✅ edit actions
  setEditingTask: Dispatch<SetStateAction<Task | null>>;
}

export type TaskContextType = TaskState & TaskActions;

export const TaskContext = createContext<TaskContextType>({} as TaskContextType);
