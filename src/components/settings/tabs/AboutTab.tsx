import { Box, Divider, FormGroup, FormLabel, Link, Typography } from "@mui/material";
import { TabHeading } from "../settings.styled";
import { useEffect, useState } from "react";
import baner from "../../../assets/baner.webp";
import { Inventory2Rounded } from "@mui/icons-material";
import { systemInfo } from "../../../utils";

export default function AboutTab() {
  const [storageUsage, setStorageUsage] = useState<number | undefined>(undefined);

  useEffect(() => {
    const getStorageUsage = async () => {
      const storageUsage = await navigator.storage.estimate();
      setStorageUsage(storageUsage.usage);
    };
    getStorageUsage();
  }, []);

  return (
    <>
      <TabHeading>About Todo App</TabHeading>
      <Typography variant="body1" sx={{ mb: 2 }}>
        📝 A simple todo app project made using React.js and MUI with many features, including
        sharing tasks via link, P2P synchronization using WebRTC, theme customization and offline
        usage as a Progressive Web App (PWA).
      </Typography>

      <Typography variant="body2" sx={{ mb: 2 }}>
        👋 Hi, I’m <strong>Jiten Kumar</strong> — a passionate developer focused on building modern,
        user-friendly web applications.
      </Typography>

      <img src={baner} style={{ width: "100%", height: "auto" }} alt="Todo App Screenshot" />

      <Typography variant="caption" sx={{ display: "block", mt: 2 }}>
        Developed by <Link href="https://github.com/Jiten28">Jiten Kumar</Link> <br />
        Explore the project on GitHub:{" "}
        <Link
          href="https://github.com/Jiten28/todo-enhancement-jiten"
          target="_blank"
          rel="noopener noreferrer"
        >
          Todo Enhancement Repository
        </Link>
        <br />
        Connect with me:
        <br />
        <Link
          href="https://www.linkedin.com/in/jiten-kumar-85a03217a"
          target="_blank"
          rel="noopener noreferrer"
        >
          LinkedIn
        </Link>{" "}
        |{" "}
        <Link
          href="https://jitenkumarportfolio.netlify.app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Portfolio
        </Link>{" "}
        |{" "}
        <Link href="https://buymeacoffee.com/jiten282005" target="_blank" rel="noopener noreferrer">
          Buy Me a Coffee
        </Link>
      </Typography>

      {storageUsage !== undefined && storageUsage !== 0 && (
        <>
          <Divider sx={{ my: 1 }} />
          <FormGroup>
            <FormLabel sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Inventory2Rounded sx={{ fontSize: "18px" }} />
              Storage Usage
            </FormLabel>
            <Box sx={{ mt: "2px" }}>
              {storageUsage ? `${(storageUsage / 1024 / 1024).toFixed(2)} MB` : "0 MB"}
              {systemInfo.os === "iOS" && " / 50 MB"}
            </Box>
          </FormGroup>
        </>
      )}
    </>
  );
}
