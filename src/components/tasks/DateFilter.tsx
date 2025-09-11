import { useContext, useState } from "react";
import { Button, Menu, MenuItem, ListItemIcon, ListItemText, Typography, css } from "@mui/material";
import {
  TodayRounded,
  DateRangeRounded,
  EventNoteRounded,
  CalendarMonthRounded,
} from "@mui/icons-material";
import styled from "@emotion/styled";
import { TaskContext } from "../../contexts/TaskContext";
import { getFontColor, isDark } from "../../utils";

export const DateFilter = () => {
  const {
    dateFilter,
    setDateFilter,
    customDateFrom,
    setCustomDateFrom,
    customDateTo,
    setCustomDateTo,
    moveMode,
  } = useContext(TaskContext);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleClose = (option?: "all" | "today" | "thisWeek" | "custom") => {
    setAnchorEl(null);
    if (option) setDateFilter(option);
  };

  return (
    <>
      <FilterButton onClick={handleOpen} isMenuOpen={open} disabled={moveMode} aria-haspopup="true">
        <CalendarMonthRounded fontSize="small" />
        <ButtonContent>
          <FilterLabel>Filter</FilterLabel>
          <FilterValue>
            {dateFilter === "all"
              ? "All"
              : dateFilter === "today"
                ? "Today"
                : dateFilter === "thisWeek"
                  ? "This Week"
                  : "Custom"}
          </FilterValue>
        </ButtonContent>
      </FilterButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => handleClose()}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        sx={{ "& .MuiPaper-root": { borderRadius: "18px", minWidth: "220px", padding: "4px" } }}
      >
        <StyledMenuItem onClick={() => handleClose("all")} selected={dateFilter === "all"}>
          <ListItemIcon>
            <EventNoteRounded fontSize="small" />
          </ListItemIcon>
          <ListItemText>All</ListItemText>
        </StyledMenuItem>
        <StyledMenuItem onClick={() => handleClose("today")} selected={dateFilter === "today"}>
          <ListItemIcon>
            <TodayRounded fontSize="small" />
          </ListItemIcon>
          <ListItemText>Today</ListItemText>
        </StyledMenuItem>
        <StyledMenuItem
          onClick={() => handleClose("thisWeek")}
          selected={dateFilter === "thisWeek"}
        >
          <ListItemIcon>
            <DateRangeRounded fontSize="small" />
          </ListItemIcon>
          <ListItemText>This Week</ListItemText>
        </StyledMenuItem>
        <StyledMenuItem onClick={() => handleClose("custom")} selected={dateFilter === "custom"}>
          <ListItemIcon>
            <CalendarMonthRounded fontSize="small" />
          </ListItemIcon>
          <ListItemText>Custom Range</ListItemText>
        </StyledMenuItem>
      </Menu>

      {dateFilter === "custom" && (
        <CustomDateContainer>
          <StyledDateInput
            type="date"
            value={customDateFrom || ""}
            onChange={(e) => setCustomDateFrom(e.target.value || null)}
          />
          <StyledDateInput
            type="date"
            value={customDateTo || ""}
            onChange={(e) => setCustomDateTo(e.target.value || null)}
          />
        </CustomDateContainer>
      )}
    </>
  );
};

const StyledMenuItem = styled(MenuItem)`
  margin: 0 6px;
  padding: 12px;
  border-radius: 12px;
`;

const FilterButton = styled(Button)<{ isMenuOpen: boolean }>`
  gap: 8px;
  text-transform: none;
  border-radius: 16px;
  height: 60px;
  padding: 16px 28px;
  background: ${({ theme }) => (isDark(theme.secondary) ? "#090b2258" : "#ffffff3e")};
  color: ${({ theme }) => getFontColor(theme.secondary)};
  border: 1px solid ${({ theme }) => (isDark(theme.secondary) ? "#44479cb7" : theme.primary)} !important;
  ${({ isMenuOpen, theme }) =>
    isMenuOpen &&
    css`
      background: ${isDark(theme.secondary)} ? "#090b228e" : "#ffffff8e";
    `}
`;

const ButtonContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const FilterLabel = styled(Typography)`
  font-size: 0.7rem;
  opacity: 0.7;
`;

const FilterValue = styled(Typography)`
  font-size: 0.8rem;
  font-weight: 500;
`;

const CustomDateContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 10px;
`;

const StyledDateInput = styled.input`
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => (isDark(theme.secondary) ? "#44479cb7" : theme.primary)};
  background: ${({ theme }) => (isDark(theme.secondary) ? "#090b2258" : "#ffffff3e")};
  color: ${({ theme }) => getFontColor(theme.secondary)};
  font-size: 0.85rem;
  outline: none;
  flex: 1;

  &:focus {
    border-color: ${({ theme }) => theme.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.primary}40;
  }
`;
