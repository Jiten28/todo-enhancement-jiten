import React, { useContext, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Popover,
  Box,
} from "@mui/material";
import { DragIndicator, Delete } from "@mui/icons-material";
import { SketchPicker, ColorResult } from "react-color";
import { UserContext } from "../../contexts/UserContext";
import { PriorityConfig } from "../../types/user";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";

interface Props {
  open: boolean;
  onClose: () => void;
}

export const ManagePrioritiesModal: React.FC<Props> = ({ open, onClose }) => {
  const { user, setUser } = useContext(UserContext);
  const [localPriorities, setLocalPriorities] = useState<PriorityConfig[]>(user.priorityList);
  const [editingColor, setEditingColor] = useState<PriorityConfig | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  const handleSave = () => {
    setUser((prev) => ({ ...prev, priorityList: localPriorities }));
    onClose();
  };

  const handleLabelChange = (id: string, label: string) => {
    setLocalPriorities((prev) => prev.map((p) => (p.id === id ? { ...p, label } : p)));
  };

  const handleColorChange = (id: string, color: string) => {
    setLocalPriorities((prev) => prev.map((p) => (p.id === id ? { ...p, color } : p)));
    // also update editingColor so SketchPicker marker follows
    setEditingColor((prev) => (prev && prev.id === id ? { ...prev, color } : prev));
  };

  const handleReorder = (oldIndex: number, newIndex: number) => {
    setLocalPriorities((prev) => arrayMove(prev, oldIndex, newIndex));
  };

  const handleColorClick = (
    event: React.MouseEvent<HTMLButtonElement>,
    priority: PriorityConfig,
  ) => {
    setEditingColor(priority);
    setAnchorEl(event.currentTarget);
  };

  const handleClosePopover = () => {
    setEditingColor(null);
    setAnchorEl(null);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Manage Priorities</DialogTitle>
      <DialogContent>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={({ active, over }) => {
            if (!over || active.id === over.id) return;
            const oldIndex = localPriorities.findIndex((p) => p.id === active.id);
            const newIndex = localPriorities.findIndex((p) => p.id === over.id);
            handleReorder(oldIndex, newIndex);
          }}
        >
          <SortableContext
            items={localPriorities.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            <List>
              {localPriorities.map((priority) => (
                <ListItem
                  key={priority.id}
                  sx={{
                    mb: 1,
                    borderRadius: 2,
                    bgcolor: "rgba(255,255,255,0.08)", // semi-glass background
                    backdropFilter: "blur(6px)",
                    border: `1px solid ${priority.color}55`, // subtle border tinted with priority color
                    color: "#fff", // white text for contrast
                  }}
                >
                  <DragIndicator sx={{ mr: 1, cursor: "grab", color: "#bbb" }} />
                  <ListItemText
                    primary={
                      <TextField
                        value={priority.label}
                        onChange={(e) => handleLabelChange(priority.id, e.target.value)}
                        variant="standard"
                        InputProps={{
                          disableUnderline: true,
                          style: { color: "white", fontWeight: 500 },
                        }}
                      />
                    }
                  />
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IconButton onClick={(e) => handleColorClick(e, priority)}>
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          bgcolor: priority.color,
                          border: "2px solid white",
                        }}
                      />
                    </IconButton>
                  </Box>
                  <ListItemSecondaryAction>
                    <IconButton edge="end" disabled>
                      <Delete sx={{ color: "#888" }} />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </SortableContext>
        </DndContext>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave}>
          Save
        </Button>
      </DialogActions>

      {/* One global Popover for color editing */}
      <Popover
        open={!!editingColor}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
      >
        {editingColor && (
          <SketchPicker
            color={editingColor.color}
            onChange={(c: ColorResult) => handleColorChange(editingColor.id, c.hex)}
          />
        )}
      </Popover>
    </Dialog>
  );
};
