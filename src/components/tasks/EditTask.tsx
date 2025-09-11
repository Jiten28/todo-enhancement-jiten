import React, { useContext, useEffect, useMemo, useState } from "react";
import styled from "@emotion/styled";
import { CancelRounded, EditCalendarRounded, SaveRounded } from "@mui/icons-material";
import {
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  InputAdornment,
  TextField,
  TextFieldProps,
  Tooltip,
  MenuItem,
} from "@mui/material";
import { ColorPicker, CustomDialogTitle, CustomEmojiPicker } from "..";
import { DESCRIPTION_MAX_LENGTH, TASK_NAME_MAX_LENGTH } from "../../constants";
import { UserContext } from "../../contexts/UserContext";
import { DialogBtn } from "../../styles";
import { Category, Task } from "../../types/user";
import { formatDate, showToast, timeAgo } from "../../utils";
import { useTheme } from "@emotion/react";
import { ColorPalette } from "../../theme/themeConfig";
import { CategorySelect } from "../CategorySelect";

interface EditTaskProps {
  open: boolean;
  task?: Task;
  onClose: () => void;
}

export const EditTask: React.FC<EditTaskProps> = ({ open, task, onClose }) => {
  const { user, setUser } = useContext(UserContext);
  const { settings } = user;
  const [editedTask, setEditedTask] = useState<Task | undefined>(task);
  const [emoji, setEmoji] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const theme = useTheme();

  // Validation
  const nameError = useMemo(
    () => (editedTask?.name ? editedTask.name.length > TASK_NAME_MAX_LENGTH : undefined),
    [editedTask?.name],
  );
  const descriptionError = useMemo(
    () =>
      editedTask?.description ? editedTask.description.length > DESCRIPTION_MAX_LENGTH : undefined,
    [editedTask?.description],
  );

  // Reset state when task changes
  useEffect(() => {
    if (task) {
      setEditedTask(task);
      setEmoji(task.emoji || null);
      setSelectedCategories(task.category || []);
    }
  }, [task]);

  // Sync emoji into task
  useEffect(() => {
    if (emoji !== null) {
      setEditedTask((prev) => (prev ? { ...prev, emoji } : prev));
    }
  }, [emoji]);

  // Sync categories into task
  useEffect(() => {
    setEditedTask((prev) => (prev ? { ...prev, category: selectedCategories } : prev));
  }, [selectedCategories]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setEditedTask((prev) => {
      if (!prev) return prev;
      if (name === "deadline") {
        return { ...prev, deadline: value ? new Date(value) : undefined };
      }
      if (name === "priority") {
        return { ...prev, priority: value as Task["priority"] };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleSave = () => {
    document.body.style.overflow = "auto";
    if (editedTask && !nameError && !descriptionError) {
      const updatedTasks = user.tasks.map((t) =>
        t.id === editedTask.id
          ? {
              ...t,
              ...editedTask,
              deadline: editedTask.deadline ? new Date(editedTask.deadline) : undefined,
              lastSave: new Date(),
            }
          : t,
      );

      setUser((prev) => ({ ...prev, tasks: updatedTasks }));
      onClose();
      showToast(
        <div>
          Task <b translate="no">{editedTask.name}</b> updated.
        </div>,
      );
    }
  };

  const handleCancel = () => {
    setEditedTask(task);
    setSelectedCategories(task?.category || []);
    onClose();
  };

  // Warn on unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (JSON.stringify(editedTask) !== JSON.stringify(task) && open) {
        const message = "You have unsaved changes. Are you sure you want to leave?";
        e.returnValue = message;
        return message;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [editedTask, open, task]);

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      slotProps={{
        paper: {
          style: {
            borderRadius: "24px",
            padding: "12px",
            maxWidth: "600px",
          },
        },
      }}
    >
      <CustomDialogTitle
        title="Edit Task"
        subTitle={
          editedTask?.lastSave
            ? `Last edited ${timeAgo(
                new Date(editedTask.lastSave),
              )} • ${formatDate(new Date(editedTask.lastSave))}`
            : "Edit the details of the task."
        }
        icon={<EditCalendarRounded />}
        onClose={handleCancel}
      />
      <DialogContent>
        <CustomEmojiPicker
          emoji={emoji || undefined}
          setEmoji={setEmoji}
          color={editedTask?.color}
          name={editedTask?.name || ""}
          type="task"
        />

        {/* Name */}
        <StyledInput
          label="Name"
          name="name"
          autoComplete="off"
          value={editedTask?.name || ""}
          onChange={handleInputChange}
          error={!!(nameError || editedTask?.name === "")}
          helperText={
            editedTask?.name
              ? editedTask?.name.length === 0
                ? "Name is required"
                : editedTask?.name.length > TASK_NAME_MAX_LENGTH
                  ? `Name is too long (maximum ${TASK_NAME_MAX_LENGTH} characters)`
                  : `${editedTask?.name?.length}/${TASK_NAME_MAX_LENGTH}`
              : "Name is required"
          }
        />

        {/* Description */}
        <StyledInput
          label="Description"
          name="description"
          autoComplete="off"
          value={editedTask?.description || ""}
          onChange={handleInputChange}
          multiline
          rows={4}
          margin="normal"
          error={!!descriptionError}
          helperText={
            editedTask?.description
              ? descriptionError
                ? `Description is too long (maximum ${DESCRIPTION_MAX_LENGTH} characters)`
                : `${editedTask?.description?.length}/${DESCRIPTION_MAX_LENGTH}`
              : undefined
          }
        />

        {/* Deadline */}
        <StyledInput
          label="Deadline date"
          name="deadline"
          type="datetime-local"
          value={
            editedTask?.deadline ? new Date(editedTask.deadline).toISOString().slice(0, 16) : ""
          }
          onChange={handleInputChange}
          InputLabelProps={{ shrink: true }}
          InputProps={{
            startAdornment: editedTask?.deadline ? (
              <InputAdornment position="start">
                <Tooltip title="Clear">
                  <IconButton
                    color="error"
                    onClick={() =>
                      setEditedTask((prev) => (prev ? { ...prev, deadline: undefined } : prev))
                    }
                  >
                    <CancelRounded />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ) : undefined,
          }}
          sx={{
            colorScheme: theme.darkmode ? "dark" : "light",
            "& .MuiInputBase-root": { transition: ".3s all" },
          }}
        />

        {/* Priority */}
        <StyledInput
          select
          label="Priority"
          name="priority"
          value={editedTask?.priority || "medium"}
          onChange={handleInputChange}
          helperText="Select task priority"
        >
          <MenuItem value="low">Low</MenuItem>
          <MenuItem value="medium">Medium</MenuItem>
          <MenuItem value="high">High</MenuItem>
          <MenuItem value="critical">Critical</MenuItem>
        </StyledInput>

        {/* Categories */}
        {settings.enableCategories && (
          <CategorySelect
            fontColor={theme.darkmode ? ColorPalette.fontLight : ColorPalette.fontDark}
            selectedCategories={selectedCategories}
            onCategoryChange={setSelectedCategories}
          />
        )}

        {/* Color */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "8px",
          }}
        >
          <ColorPicker
            width={"100%"}
            color={editedTask?.color || "#000000"}
            fontColor={theme.darkmode ? ColorPalette.fontLight : ColorPalette.fontDark}
            onColorChange={(color) => setEditedTask((prev) => (prev ? { ...prev, color } : prev))}
          />
        </div>
      </DialogContent>
      <DialogActions>
        <DialogBtn onClick={handleCancel}>Cancel</DialogBtn>
        <DialogBtn
          onClick={handleSave}
          color="primary"
          disabled={
            !!nameError ||
            editedTask?.name === "" ||
            !!descriptionError ||
            JSON.stringify(editedTask) === JSON.stringify(task)
          }
        >
          <SaveRounded /> &nbsp; Save
        </DialogBtn>
      </DialogActions>
    </Dialog>
  );
};

const UnstyledTextField = (props: TextFieldProps) => <TextField fullWidth {...props} />;
const StyledInput = styled(UnstyledTextField)`
  margin: 14px 0;
  & .MuiInputBase-root {
    border-radius: 16px;
  }
`;
