import { useState } from "react";
import { Button } from "@mui/material";
import { ManagePrioritiesModal } from "../ManagePrioritiesModal";

const PrioritiesTab = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="contained" onClick={() => setOpen(true)}>
        Manage Priorities
      </Button>
      <ManagePrioritiesModal open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default PrioritiesTab;
