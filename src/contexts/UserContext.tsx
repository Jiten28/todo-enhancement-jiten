import { createContext } from "react";
import type { User } from "../types/user";
import { defaultUser } from "../constants/defaultUser";

interface UserProps {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
}

export const UserContext = createContext<UserProps>({
  user: {
    ...defaultUser,
    // ✅ make sure priorityList is top-level, not inside settings
    priorityList: defaultUser.priorityList ?? [
      { id: "critical", label: "Critical", color: "#d32f2f" },
      { id: "high", label: "High", color: "#f57c00" },
      { id: "medium", label: "Medium", color: "#1976d2" },
      { id: "low", label: "Low", color: "#388e3c" },
    ],
  },
  setUser: () => {},
});
