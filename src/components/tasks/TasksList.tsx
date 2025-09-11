import { Close, Delete, DeleteRounded, Search, MoreVert } from "@mui/icons-material";
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { useCallback, useContext, useEffect, useMemo, useState, memo, useRef } from "react";
import { CustomDialogTitle, TaskItem } from "..";
import { TaskContext } from "../../contexts/TaskContext";
import { UserContext } from "../../contexts/UserContext";
import { useStorageState } from "../../hooks/useStorageState";
import { DialogBtn } from "../../styles";
import type { Task, UUID } from "../../types/user";
import { getFontColor } from "../../utils";
import { NoTasks, SearchClear, SearchInput, TasksContainer } from "./tasks.styled";
import { TaskMenu } from "./TaskMenu";
import { TaskSort } from "./TaskSort";
import { DateFilter } from "./DateFilter";
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
    editModalOpen,
    setEditModalOpen,
    editingTask,
    dateFilter,
    customDateFrom,
    customDateTo,
  } = useContext(TaskContext);

  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [selectedCatId] = useStorageState<UUID | undefined>(
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

  // Reorder + filter tasks
  const reorderTasks = useCallback(
    (tasks: Task[]): Task[] => {
      let pinnedTasks = tasks.filter((t) => t.pinned);
      let unpinnedTasks = tasks.filter((t) => !t.pinned);

      // ✅ Category filter
      if (selectedCatId !== undefined) {
        const categoryFilter = (t: Task) =>
          t.category?.some((c) => c.id === selectedCatId) ?? false;
        pinnedTasks = pinnedTasks.filter(categoryFilter);
        unpinnedTasks = unpinnedTasks.filter(categoryFilter);
      }

      // ✅ Search filter
      const searchLower = search.toLowerCase();
      const searchFilter = (t: Task) =>
        t.name.toLowerCase().includes(searchLower) ||
        (t.description && t.description.toLowerCase().includes(searchLower));
      pinnedTasks = pinnedTasks.filter(searchFilter);
      unpinnedTasks = unpinnedTasks.filter(searchFilter);

      // ✅ Date filter
      if (dateFilter === "today") {
        const today = new Date().toDateString();
        const dateFilterFn = (t: Task) =>
          t.deadline ? new Date(t.deadline).toDateString() === today : false;
        pinnedTasks = pinnedTasks.filter(dateFilterFn);
        unpinnedTasks = unpinnedTasks.filter(dateFilterFn);
      } else if (dateFilter === "thisWeek") {
        const now = new Date();
        const start = new Date(now);
        start.setDate(now.getDate() - now.getDay()); // Sunday
        const end = new Date(start);
        end.setDate(start.getDate() + 7); // Next Sunday
        const dateFilterFn = (t: Task) =>
          t.deadline ? new Date(t.deadline) >= start && new Date(t.deadline) < end : false;
        pinnedTasks = pinnedTasks.filter(dateFilterFn);
        unpinnedTasks = unpinnedTasks.filter(dateFilterFn);
      } else if (dateFilter === "custom" && customDateFrom && customDateTo) {
        const start = new Date(customDateFrom);
        const end = new Date(customDateTo);
        const dateFilterFn = (t: Task) =>
          t.deadline ? new Date(t.deadline) >= start && new Date(t.deadline) <= end : false;
        pinnedTasks = pinnedTasks.filter(dateFilterFn);
        unpinnedTasks = unpinnedTasks.filter(dateFilterFn);
      }

      // ✅ Sorting
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

      // ✅ Move done tasks to bottom if enabled
      if (user.settings?.doneToBottom) {
        const done = unpinnedTasks.filter((t) => t.done);
        const notDone = unpinnedTasks.filter((t) => !t.done);
        return [...pinnedTasks, ...notDone, ...done];
      }
      return [...pinnedTasks, ...unpinnedTasks];
    },
    [search, selectedCatId, sortOption, user.settings, dateFilter, customDateFrom, customDateTo],
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
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = orderedTasks.findIndex((t) => t.id === active.id);
    const newIndex = orderedTasks.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const newOrdered = arrayMove(orderedTasks, oldIndex, newIndex);
    const updated = user.tasks.map((task) => {
      const idx = newOrdered.findIndex((t) => t.id === task.id);
      return idx !== -1 ? { ...task, position: idx, lastSave: new Date() } : task;
    });
    setUser((prev) => ({ ...prev, tasks: updated }));
    requestAnimationFrame(() => setActiveDragId(null));
  };

  const handleDragStart = (event: DragStartEvent) => setActiveDragId(event.active.id as string);

  return (
    <>
      <TaskMenu />

      {/* ✅ Edit Modal */}
      <EditTask
        open={editModalOpen}
        task={editingTask || undefined}
        onClose={() => setEditModalOpen(false)}
      />

      <TasksContainer style={{ marginTop: user.settings.showProgressBar ? "0" : "24px" }}>
        {user.tasks.length > 0 && (
          <Box sx={{ display: "flex", alignItems: "center", gap: "10px", mb: "8px" }}>
            <DisabledThemeProvider>
              {/* 🔍 Search Input */}
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
                        <Search sx={{ color: "white", opacity: moveMode ? 0.5 : undefined }} />
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
              />

              {/* 📅 Date Filter */}
              <DateFilter />

              <TaskSort />
            </DisabledThemeProvider>
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
              items={orderedTasks.map((task) => task.id)}
              strategy={verticalListSortingStrategy}
            >
              {orderedTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  features={{ enableLinks: true, enableGlow: user.settings.enableGlow }}
                  onContextMenu={(e) =>
                    handleClick(e as unknown as React.MouseEvent<HTMLElement>, task.id)
                  }
                  actions={<TaskMenuButton task={task} onClick={(e) => handleClick(e, task.id)} />}
                />
              ))}
            </SortableContext>
            <DragOverlay>
              {activeDragId ? (
                <TaskItem
                  task={orderedTasks.find((t) => t.id === activeDragId)!}
                  features={{ enableLinks: true, enableGlow: user.settings.enableGlow }}
                  actions={
                    <TaskMenuButton
                      task={orderedTasks.find((t) => t.id === activeDragId)!}
                      onClick={(e) =>
                        handleClick(e, orderedTasks.find((t) => t.id === activeDragId)!.id)
                      }
                    />
                  }
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          orderedTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              textHighlighter={highlightMatchingText}
              onContextMenu={(e: React.MouseEvent<Element>) =>
                handleClick(e as unknown as React.MouseEvent<HTMLElement>, task.id)
              }
              actions={<TaskMenuButton task={task} onClick={(e) => handleClick(e, task.id)} />}
            />
          ))
        )}
      </TasksContainer>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={cancelDeleteTask}>
        <CustomDialogTitle
          title="Delete Task"
          subTitle="Are you sure you want to delete this task?"
          onClose={cancelDeleteTask}
          icon={<Delete />}
        />
        <DialogContent>
          {taskToDelete && <TaskItem task={taskToDelete} features={{ enableGlow: false }} />}
        </DialogContent>
        <DialogActions>
          <DialogBtn onClick={cancelDeleteTask} color="primary">
            Cancel
          </DialogBtn>
          <DialogBtn onClick={confirmDeleteTask} color="error">
            <DeleteRounded /> &nbsp; Confirm Delete
          </DialogBtn>
        </DialogActions>
      </Dialog>
    </>
  );
};
