import { useContext } from "react";
import styled from "@emotion/styled";
import { TaskContext, Priority } from "../../contexts/TaskContext";

type Props = {
  priority: string;
};

const PriorityBadge = ({ priority }: Props) => {
  const { priorityList } = useContext(TaskContext);

  const pr = priorityList.find((p: Priority) => p.id === priority);

  if (!pr) return null;

  return <Badge style={{ backgroundColor: pr.color }}>{pr.label}</Badge>;
};

export default PriorityBadge;

const Badge = styled.span`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
`;
