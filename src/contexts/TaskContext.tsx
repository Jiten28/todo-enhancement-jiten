import { createContext } from "react";
import type { TaskContextType } from "./TaskProvider";

// Context only (no state/hooks here)
export const TaskContext = createContext<TaskContextType>({} as TaskContextType);
