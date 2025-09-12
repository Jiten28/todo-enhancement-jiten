import { Close, DeleteRounded, Search, MoreVert } from "@mui/icons-material";
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { useCallback, useContext, useEffect, useMemo, useState, memo, useRef } from "react";
import { CustomDialogTitle, TaskItem, CategoryBadge } from "..";
import { TaskContext } from "../../contexts/TaskContext";
import { UserContext } from "../../contexts/UserContext";
import { useStorageState } from "../../hooks/useStorageState";
import { DialogBtn } from "../../styles";
import type { Task, UUID, Category } from "../../types/user";
import { getFontColor } from "../../utils";
import { NoTasks, SearchClear, SearchInput, TasksContainer } from "./tasks.styled";
import { TaskMenu } from "./TaskMenu";
import { TaskSort } from "./TaskSort";
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  DragOverlay,
  MeasuringStrategy,
  DragStartEvent,
  useSensors,
  useSensor,
  TouchSensor,
  MouseSensor,
  UniqueIdentifier,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import DisabledThemeProvider from "../../contexts/DisabledThemeProvider";
import { EditTask } from "./EditTask";
import DoneRounded from "@mui/icons-material/DoneRounded";
import PushPinRounded from "@mui/icons-material/PushPinRounded";
import DeleteForeverRounded from "@mui/icons-material/DeleteForeverRounded";

const TaskMenuButton = memo(
  ({ task, onClick }: { task: Task; onClick: (event: React.MouseEvent<HTMLElement>) => void }) => (
    <IconButton
      id="task-menu-button"
      aria-label="Task Menu"
      aria-controls="task-menu"
      aria-haspopup="true"
      aria-expanded={Boolean(task)}
      onClick={onClick}
      sx={{ color: getFontColor(task.color) }}
    >
      <MoreVert />
    </IconButton>
  ),
);

export const TasksList: React.FC = () => {
  const { user, setUser } = useContext(UserContext);
  const {
    selectedTaskId,
    setSelectedTaskId,
    setAnchorEl,
    setAnchorPosition,
    search,
    setSearch,
    highlightMatchingText,
    deleteDialogOpen,
    setDeleteDialogOpen,
    sortOption,
    moveMode,
    // edit modal & editing
    editModalOpen,
    setEditModalOpen,
    editingTask,
    // date filter
    dateFilter,
    customDateFrom,
    customDateTo,
    // selection (multiple)
    multipleSelectedTasks,
    setMultipleSelectedTasks,
  } = useContext(TaskContext);

  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [selectedCatId, setSelectedCatId] = useStorageState<UUID | undefined>(
    undefined,
    "selectedCategory",
    "sessionStorage",
  );
  const [activeDragId, setActiveDragId] = useState<UniqueIdentifier | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Handle menu button click
  const handleClick = (event: React.MouseEvent<HTMLElement>, taskId: UUID) => {
    const target = event.target as HTMLElement;
    if (target.closest("#task-description-link")) return;

    event.preventDefault();
    setAnchorEl(event.currentTarget);
    setSelectedTaskId(taskId);
    setAnchorPosition({ top: event.clientY, left: event.clientX });
  };

  // focus search input on ctrl+/
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // compute category counts (only categories in use)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    user.categories.forEach((c) => (counts[c.id] = 0));
    user.tasks.forEach((t) => {
      t.category?.forEach((c) => {
        counts[c.id] = (counts[c.id] || 0) + 1;
      });
    });
    return counts;
  }, [user.categories, user.tasks]);

  // Reorder + filter tasks
  const reorderTasks = useCallback(
    (tasks: Task[]): Task[] => {
      let pinnedTasks = tasks.filter((t) => t.pinned);
      let unpinnedTasks = tasks.filter((t) => !t.pinned);

      // Category filter
      if (selectedCatId !== undefined) {
        const categoryFilter = (t: Task) =>
          t.category?.some((c) => c.id === selectedCatId) ?? false;
        pinnedTasks = pinnedTasks.filter(categoryFilter);
        unpinnedTasks = unpinnedTasks.filter(categoryFilter);
      }

      // Search filter
      const searchLower = search.toLowerCase();
      const searchFilter = (t: Task) =>
        t.name.toLowerCase().includes(searchLower) ||
        (t.description && t.description.toLowerCase().includes(searchLower));
      pinnedTasks = pinnedTasks.filter(searchFilter);
      unpinnedTasks = unpinnedTasks.filter(searchFilter);

      // Date filter
      if (dateFilter === "today") {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        const dateFilterFn = (t: Task) =>
          t.deadline
            ? new Date(t.deadline) >= todayStart && new Date(t.deadline) <= todayEnd
            : false;
        pinnedTasks = pinnedTasks.filter(dateFilterFn);
        unpinnedTasks = unpinnedTasks.filter(dateFilterFn);
      } else if (dateFilter === "thisWeek") {
        const now = new Date();
        const start = new Date(now);
        start.setDate(now.getDate() - now.getDay()); // Sunday
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(start.getDate() + 6); // Saturday
        end.setHours(23, 59, 59, 999);
        const dateFilterFn = (t: Task) =>
          t.deadline ? new Date(t.deadline) >= start && new Date(t.deadline) <= end : false;
        pinnedTasks = pinnedTasks.filter(dateFilterFn);
        unpinnedTasks = unpinnedTasks.filter(dateFilterFn);
      } else if (dateFilter === "custom" && customDateFrom && customDateTo) {
        const start = new Date(customDateFrom);
        start.setHours(0, 0, 0, 0);
        const end = new Date(customDateTo);
        end.setHours(23, 59, 59, 999);
        const dateFilterFn = (t: Task) =>
          t.deadline ? new Date(t.deadline) >= start && new Date(t.deadline) <= end : false;
        pinnedTasks = pinnedTasks.filter(dateFilterFn);
        unpinnedTasks = unpinnedTasks.filter(dateFilterFn);
      }

      // Sorting
      const sortTasks = (arr: Task[]) => {
        switch (sortOption) {
          case "dateCreated":
            return [...arr].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          case "dueDate":
            return [...arr].sort((a, b) => {
              if (!a.deadline) return 1;
              if (!b.deadline) return -1;
              return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
            });
          case "alphabetical":
            return [...arr].sort((a, b) => a.name.localeCompare(b.name));
          case "priority": {
            const order: Record<string, number> = {};
            user.priorityList.forEach((p, idx) => {
              order[p.id] = idx;
            });
            return [...arr].sort((a, b) => {
              const pa = a.priority ? order[a.priority] : 99;
              const pb = b.priority ? order[b.priority] : 99;
              return pa - pb;
            });
          }
          case "custom":
            return [...arr].sort((a, b) => {
              if (a.position != null && b.position != null) return a.position - b.position;
              if (a.position == null && b.position != null) return 1;
              if (a.position != null && b.position == null) return -1;
              return new Date(a.date).getTime() - new Date(b.date).getTime();
            });
          default:
            return arr;
        }
      };

      pinnedTasks = sortTasks(pinnedTasks);
      unpinnedTasks = sortTasks(unpinnedTasks);

      // done to bottom
      if (user.settings?.doneToBottom) {
        const done = unpinnedTasks.filter((t) => t.done);
        const notDone = unpinnedTasks.filter((t) => !t.done);
        return [...pinnedTasks, ...notDone, ...done];
      }
      return [...pinnedTasks, ...unpinnedTasks];
    },
    [
      search,
      selectedCatId,
      sortOption,
      user.settings,
      user.priorityList, // already included
      dateFilter,
      customDateFrom,
      customDateTo,
    ],
  );

  const orderedTasks = useMemo(() => reorderTasks(user.tasks), [user.tasks, reorderTasks]);

  // Delete confirmation
  const confirmDeleteTask = () => {
    if (!selectedTaskId) return;
    setUser((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== selectedTaskId),
    }));
    user.deletedTasks.push(selectedTaskId);
    setDeleteDialogOpen(false);
    setTaskToDelete(null);
  };

  const cancelDeleteTask = () => setDeleteDialogOpen(false);

  // DnD sensors
  const dndKitSensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = orderedTasks.findIndex((t: Task) => t.id === active.id);
    const newIndex = orderedTasks.findIndex((t: Task) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const newOrdered = arrayMove(orderedTasks, oldIndex, newIndex);
    const updated = user.tasks.map((task: Task) => {
      const idx = newOrdered.findIndex((t: Task) => t.id === task.id);
      return idx !== -1 ? { ...task, position: idx, lastSave: new Date() } : task;
    });
    setUser((prev) => ({ ...prev, tasks: updated }));
    requestAnimationFrame(() => setActiveDragId(null));
  };

  const handleDragStart = (event: DragStartEvent) => setActiveDragId(event.active.id as string);

  // selection handlers (match TaskItem.selection signature)
  const selectionHandlers = {
    selectedIds: multipleSelectedTasks as UUID[],
    onSelect: (id: UUID) => {
      setMultipleSelectedTasks((prev) => (prev.includes(id) ? prev : [...prev, id]));
    },
    onDeselect: (id: UUID) => {
      setMultipleSelectedTasks((prev) => prev.filter((tid) => tid !== id));
    },
  };

  return (
    <>
      <TaskMenu />

      {/* Edit modal */}
      <EditTask
        open={editModalOpen}
        task={editingTask || undefined}
        onClose={() => setEditModalOpen(false)}
      />

      <TasksContainer style={{ marginTop: user.settings.showProgressBar ? "0" : "24px" }}>
        {/* Selection toolbar (sticky) */}
        {multipleSelectedTasks.length > 0 && (
          <Box
            sx={{
              position: "sticky",
              top: 0,
              zIndex: 5,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              bgcolor: "rgba(20,22,40,0.9)",
              color: "white",
              borderRadius: "12px",
              p: "8px 16px",
              mb: 2,
              mt: 1,
              boxShadow: "0 6px 22px rgba(0,0,0,0.25)",
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", maxWidth: "65%" }}>
              <strong>Selected {multipleSelectedTasks.length} tasks</strong>
              <span
                style={{
                  fontSize: "0.85rem",
                  opacity: 0.85,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {(() => {
                  const names = user.tasks
                    .filter((t: Task) => multipleSelectedTasks.includes(t.id))
                    .map((t: Task) => t.name);
                  if (names.length === 0) return "...";
                  if (names.length === 1) return names[0];
                  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
                })()}
              </span>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IconButton
                sx={{ color: "white" }}
                onClick={() => {
                  setUser((prev) => ({
                    ...prev,
                    tasks: prev.tasks.map((t: Task) =>
                      multipleSelectedTasks.includes(t.id)
                        ? { ...t, done: true, lastSave: new Date() }
                        : t,
                    ),
                  }));
                  setMultipleSelectedTasks([]);
                }}
                title="Mark selected as done"
              >
                <DoneRounded />
              </IconButton>

              <IconButton
                sx={{ color: "white" }}
                onClick={() => {
                  setUser((prev) => ({
                    ...prev,
                    tasks: prev.tasks.map((t: Task) =>
                      multipleSelectedTasks.includes(t.id)
                        ? {
                            ...t,
                            pinned: !t.pinned,
                            lastSave: new Date(),
                          }
                        : t,
                    ),
                  }));
                  setMultipleSelectedTasks([]);
                }}
                title="Toggle pin for selected"
              >
                <PushPinRounded />
              </IconButton>

              <IconButton
                sx={{ color: "error.main" }}
                onClick={() => {
                  setUser((prev) => ({
                    ...prev,
                    tasks: prev.tasks.filter((t: Task) => !multipleSelectedTasks.includes(t.id)),
                  }));
                  setMultipleSelectedTasks([]);
                }}
                title="Delete selected"
              >
                <DeleteForeverRounded />
              </IconButton>

              <IconButton
                sx={{ color: "white" }}
                onClick={() => setMultipleSelectedTasks([])}
                title="Clear selection"
              >
                <Close />
              </IconButton>
            </Box>
          </Box>
        )}

        {/* Top bar: search + sort + categories */}
        {user.tasks.length > 0 && multipleSelectedTasks.length === 0 && (
          <Box sx={{ mb: 2 }}>
            {/* Row 1: Search + Sort */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
                mb: 1,
              }}
            >
              <DisabledThemeProvider>
                <SearchInput
                  inputRef={searchRef}
                  color="primary"
                  placeholder="Search for task..."
                  autoComplete="off"
                  value={search}
                  disabled={moveMode}
                  onChange={(e) => setSearch(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search
                            sx={{
                              color: "white",
                              opacity: moveMode ? 0.5 : undefined,
                            }}
                          />
                        </InputAdornment>
                      ),
                      endAdornment: search ? (
                        <InputAdornment position="end">
                          <SearchClear onClick={() => setSearch("")}>
                            <Close sx={{ color: "white" }} />
                          </SearchClear>
                        </InputAdornment>
                      ) : undefined,
                    },
                  }}
                  sx={{ minWidth: 280, flex: 1 }}
                />
              </DisabledThemeProvider>

              <TaskSort />
            </Box>

            {/* Row 2: Categories */}
            <Box
              sx={{
                display: "flex",
                overflowX: "auto",
                gap: 1,
                pb: 1,
                "&::-webkit-scrollbar": { height: 6 },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "rgba(255,255,255,0.3)",
                  borderRadius: "4px",
                },
              }}
            >
              {user.categories
                .filter((c) => (categoryCounts[c.id] || 0) > 0)
                .map((category: Category) => {
                  const count = categoryCounts[category.id] || 0;
                  const selected = selectedCatId === category.id;
                  return (
                    <CategoryBadge
                      key={category.id}
                      category={{
                        ...category,
                        name: `${category.name} (${count})`,
                      }}
                      borderclr={getFontColor(category.color || "#fff")}
                      onClick={() => setSelectedCatId(selected ? undefined : (category.id as UUID))}
                      sx={{
                        flexShrink: 0,
                        cursor: "pointer",
                        border: selected ? `2px solid ${user.theme || "#000"}` : undefined,
                      }}
                    />
                  );
                })}
            </Box>
          </Box>
        )}

        {/* Task rendering */}
        {user.tasks.length === 0 ? (
          <NoTasks>
            <span>You don't have any tasks yet</span>
            <br />
            Click on the <span>+</span> button to add one
          </NoTasks>
        ) : moveMode ? (
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            onDragStart={handleDragStart}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
            sensors={dndKitSensors}
          >
            <SortableContext
              items={orderedTasks.map((task: Task) => task.id)}
              strategy={verticalListSortingStrategy}
            >
              {orderedTasks.map((task: Task) => {
                const isOverdue =
                  task.deadline && !task.done && new Date(task.deadline).getTime() < Date.now();
                const noDeadline = !task.deadline;

                return (
                  <TaskItem
                    key={task.id}
                    task={task}
                    features={{
                      enableLinks: true,
                      enableGlow: user.settings.enableGlow,
                      enableSelection: multipleSelectedTasks.length > 0,
                      enableMoveMode: true,
                    }}
                    selection={selectionHandlers}
                    onContextMenu={(e: React.MouseEvent<HTMLElement>) => handleClick(e, task.id)}
                    actions={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {isOverdue && (
                          <CategoryBadge
                            category={{
                              id: "00000000-0000-0000-0000-OVERDUE" as UUID,
                              name: "Overdue 🔴",
                              color: "#f44336",
                            }}
                          />
                        )}

                        {noDeadline && dateFilter === "all" && (
                          <CategoryBadge
                            category={{
                              id: "00000000-0000-0000-0000-NODEADLINE" as UUID,
                              name: "No Deadline",
                              color: "#9e9e9e",
                            }}
                          />
                        )}
                        <TaskMenuButton
                          task={task}
                          onClick={(e: React.MouseEvent<HTMLElement>) => handleClick(e, task.id)}
                        />
                      </Box>
                    }
                  />
                );
              })}
            </SortableContext>
            // Drag overlay
            <DragOverlay>
              {activeDragId
                ? (() => {
                    const draggedTask: Task | undefined = orderedTasks.find(
                      (t: Task) => t.id === activeDragId,
                    );
                    return draggedTask ? (
                      <TaskItem
                        task={draggedTask}
                        features={{
                          enableLinks: true,
                          enableGlow: user.settings.enableGlow,
                        }}
                        actions={
                          <TaskMenuButton
                            task={draggedTask}
                            onClick={(e: React.MouseEvent<HTMLElement>) =>
                              handleClick(e, draggedTask.id)
                            }
                          />
                        }
                      />
                    ) : null;
                  })()
                : null}
            </DragOverlay>
          </DndContext>
        ) : (
          // Normal list
          orderedTasks.map((task: Task) => {
            const isOverdue =
              task.deadline && !task.done && new Date(task.deadline).getTime() < Date.now();
            const noDeadline = !task.deadline;

            return (
              <TaskItem
                key={task.id}
                task={task}
                textHighlighter={highlightMatchingText}
                selection={selectionHandlers}
                features={{
                  enableLinks: true,
                  enableGlow: user.settings.enableGlow,
                  enableSelection: multipleSelectedTasks.length > 0,
                }}
                onContextMenu={(e: React.MouseEvent<HTMLElement>) => handleClick(e, task.id)}
                actions={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {isOverdue && (
                      <CategoryBadge
                        category={{
                          id: "00000000-0000-0000-0000-OVERDUE" as UUID,
                          name: "Overdue 🔴",
                          color: "#f44336",
                        }}
                      />
                    )}
                    {noDeadline && dateFilter === "all" && (
                      <CategoryBadge
                        category={{
                          id: "00000000-0000-0000-0000-NODEADLINE" as UUID,
                          name: "No Deadline",
                          color: "#9e9e9e",
                        }}
                      />
                    )}
                    <TaskMenuButton
                      task={task}
                      onClick={(e: React.MouseEvent<HTMLElement>) => handleClick(e, task.id)}
                    />
                  </Box>
                }
              />
            );
          })
        )}
      </TasksContainer>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={cancelDeleteTask}>
        <CustomDialogTitle
          title="Delete Task"
          subTitle="Are you sure you want to delete this task?"
          onClose={cancelDeleteTask}
          icon={<DeleteRounded />}
        />
        <DialogContent>
          {taskToDelete && <TaskItem task={taskToDelete} features={{ enableGlow: false }} />}
        </DialogContent>
        <DialogActions>
          <DialogBtn onClick={cancelDeleteTask} color="primary">
            Cancel
          </DialogBtn>
          <DialogBtn
            onClick={() => {
              confirmDeleteTask();
            }}
            color="error"
          >
            <DeleteRounded /> &nbsp; Confirm Delete
          </DialogBtn>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TasksList;
