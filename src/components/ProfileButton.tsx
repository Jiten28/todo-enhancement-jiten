import { IconButton } from "@mui/material";
import { AccountCircle } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

export const ProfileButton = () => {
  const navigate = useNavigate();

  return (
    <IconButton onClick={() => navigate("/settings")} color="inherit">
      <AccountCircle />
    </IconButton>
  );
};
