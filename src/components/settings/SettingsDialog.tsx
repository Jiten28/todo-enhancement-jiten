import {
  EmojiEmotionsRounded,
  InfoRounded,
  KeyboardCommandKeyRounded,
  PaletteRounded,
  RecordVoiceOverRounded,
  SettingsRounded,
  FlagRounded,
} from "@mui/icons-material";
import {
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  Divider,
  Tabs,
  useTheme,
} from "@mui/material";
import {
  JSX,
  lazy,
  LazyExoticComponent,
  ReactElement,
  Suspense,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { CustomDialogTitle, TabGroupProvider } from "..";
import { UserContext } from "../../contexts/UserContext";
import { useResponsiveDisplay } from "../../hooks/useResponsiveDisplay";
import { CloseButton, CloseButtonContainer, StyledTab, StyledTabPanel } from "./settings.styled";
import { showToast } from "../../utils";

// ⚡ settings tabs
const settingsTabs: {
  label: string;
  icon: ReactElement;
  Component: LazyExoticComponent<() => JSX.Element>;
}[] = [
  {
    label: "Appearance",
    icon: <PaletteRounded />,
    Component: lazy(() => import("./tabs/AppearanceTab")),
  },
  {
    label: "General",
    icon: <SettingsRounded />,
    Component: lazy(() => import("./tabs/GeneralTab")),
  },
  {
    label: "Emoji",
    icon: <EmojiEmotionsRounded />,
    Component: lazy(() => import("./tabs/EmojiTab")),
  },
  {
    label: "ReadAloud",
    icon: <RecordVoiceOverRounded />,
    Component: lazy(() => import("./tabs/ReadAloudTab")),
  },
  {
    label: "Shortcuts",
    icon: <KeyboardCommandKeyRounded />,
    Component: lazy(() => import("./tabs/ShortcutsTab")),
  },
  {
    label: "Priorities", // ✅ integrated priorities tab
    icon: <FlagRounded />,
    Component: lazy(() => import("./tabs/PrioritiesTab")),
  },
  {
    label: "About",
    icon: <InfoRounded />,
    Component: lazy(() => import("./tabs/AboutTab")),
  },
];

// utils
const createTabSlug = (label: string): string => label.replace(/\s+/g, "");
const navigateToTab = (tabIndex: number): void => {
  const tabSlug = createTabSlug(settingsTabs[tabIndex].label);
  window.location.hash = `#settings/${tabSlug}`;
};
const replaceWithTab = (tabIndex: number): void => {
  const tabSlug = createTabSlug(settingsTabs[tabIndex].label);
  history.replaceState(
    null,
    "",
    `${window.location.pathname}${window.location.search}#settings/${tabSlug}`,
  );
};
const isSettingsHash = (hash: string): boolean => /^#settings(\/.*)?$/.test(hash);

interface SettingsProps {
  open: boolean;
  onClose: () => void;
  handleOpen: () => void;
}

export const SettingsDialog = ({ open, onClose, handleOpen }: SettingsProps) => {
  const { user } = useContext(UserContext);
  const [tabValue, setTabValue] = useState<number>(0);
  const isMobile = useResponsiveDisplay();
  const muiTheme = useTheme();

  const handleDialogClose = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    onClose();
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }, [onClose]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    navigateToTab(newValue);
  };

  // validate tab from hash
  const handleHashChange = useCallback(() => {
    const hash = window.location.hash;

    if (!isSettingsHash(hash)) {
      onClose();
      return;
    }

    if (hash === "#settings" || hash === "#settings/") {
      replaceWithTab(0);
      setTabValue(0);
      return;
    }

    const match = hash.match(/^#settings\/(\w+)/);
    if (!match) return;

    const slug = match[1];
    const tabIndex = settingsTabs.findIndex((tab) => createTabSlug(tab.label) === slug);

    if (tabIndex !== -1) {
      setTabValue(tabIndex);
    } else {
      showToast(`Invalid settings tab: "${slug}". Redirecting to default tab.`, {
        type: "error",
      });
      replaceWithTab(0);
      setTabValue(0);
    }
  }, [onClose]);

  const handleHashOpen = useCallback(() => {
    if (window.location.hash.startsWith("#settings")) {
      handleOpen();
    }
  }, [handleOpen]);

  useEffect(() => {
    const onHashChange = () => {
      handleHashChange();
      handleHashOpen();
    };
    onHashChange();
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [handleHashChange, handleHashOpen]);

  useEffect(() => {
    if (open) {
      const hash = window.location.hash;
      if (!isSettingsHash(hash)) {
        navigateToTab(0);
      }
    }
  }, [open]);

  // theme color
  useEffect(() => {
    const themeColorMeta = document.querySelector("meta[name=theme-color]");
    const defaultThemeColor = muiTheme.palette.secondary.main;

    if (themeColorMeta) {
      setTimeout(() => {
        if (open) {
          themeColorMeta.setAttribute(
            "content",
            muiTheme.palette.mode === "dark" ? "#383838" : "#ffffff",
          );
        } else {
          themeColorMeta.setAttribute("content", defaultThemeColor);
        }
      }, 10);
    }
  }, [muiTheme.palette.mode, muiTheme.palette.secondary.main, open, user.theme, user.darkmode]);

  // ctrl/cmd+p print shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        handleDialogClose();
        setTimeout(() => window.print(), 500);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDialogClose]);

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      slotProps={{
        paper: {
          style: {
            padding: isMobile ? "12px 0" : "12px",
            borderRadius: isMobile ? 0 : "24px",
            minWidth: "400px",
            maxHeight: isMobile ? undefined : "500px",
            overflow: "hidden",
          },
        },
      }}
    >
      <CustomDialogTitle
        icon={<SettingsRounded />}
        title="Settings"
        subTitle="Manage your preferences"
        onClose={handleDialogClose}
        removeDivider
      />
      <Divider sx={{ mb: 2 }} />
      <DialogContent sx={{ display: "flex", minHeight: 400, m: 0, p: 0, overflow: "hidden" }}>
        <Tabs
          orientation="vertical"
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          aria-label="Settings tabs"
          sx={{ borderRight: 1, borderColor: "divider" }}
        >
          {settingsTabs.map((tab, index) => (
            <StyledTab icon={tab.icon} label={tab.label} {...a11yProps(index)} key={index} />
          ))}
        </Tabs>
        <Box
          className="customScrollbar"
          sx={{ flex: 1, p: 0, m: isMobile ? "0 12px" : "0 20px 0 20px", overflowY: "auto" }}
        >
          <TabGroupProvider value={tabValue} name="settings">
            {settingsTabs.map((tab, index) => (
              <StyledTabPanel index={index} key={index}>
                {tabValue === index && (
                  <Suspense
                    fallback={
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        minHeight={isMobile ? 150 : 400}
                      >
                        <CircularProgress size={48} />
                      </Box>
                    }
                  >
                    <tab.Component />
                  </Suspense>
                )}
              </StyledTabPanel>
            ))}
          </TabGroupProvider>
        </Box>
      </DialogContent>
      {isMobile && (
        <CloseButtonContainer>
          <CloseButton variant="contained" onClick={handleDialogClose}>
            Close
          </CloseButton>
        </CloseButtonContainer>
      )}
    </Dialog>
  );
};

function a11yProps(index: number) {
  return {
    id: `vertical-tab-${index}`,
    "aria-controls": `vertical-tabpanel-${index}`,
  };
}
