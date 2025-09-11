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
} from "@mui/material";
import { DragIndicator, Delete } from "@mui/icons-material";
import { SketchPicker, ColorResult } from "react-color"; // ✅ with type support
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
  };

  const handleReorder = (oldIndex: number, newIndex: number) => {
    setLocalPriorities((prev) => arrayMove(prev, oldIndex, newIndex));
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
                <ListItem key={priority.id} sx={{ bgcolor: "#f5f5f5", mb: 1, borderRadius: 2 }}>
                  <DragIndicator sx={{ mr: 1, cursor: "grab" }} />
                  <ListItemText
                    primary={
                      <TextField
                        value={priority.label}
                        onChange={(e) => handleLabelChange(priority.id, e.target.value)}
                        variant="standard"
                      />
                    }
                    secondary={
                      <SketchPicker
                        color={priority.color}
                        onChangeComplete={(c: ColorResult) => handleColorChange(priority.id, c.hex)}
                        width="200px"
                      />
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" disabled>
                      <Delete /> {/* keep disabled to avoid removing all 4 */}
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
    </Dialog>
  );
};
