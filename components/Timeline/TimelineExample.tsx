import React from "react";
import TimelineModal from "./TimelineModal";

const timelineItems = [
  {
    id: "1",
    title: "Project Kickoff",
    content:
      "Initial meeting with stakeholders to define project scope and objectives. Key decisions were made regarding timeline and resource allocation.",
    completed: true,
    date: "2024-01-15",
  },
  {
    id: "2",
    title: "Design Phase",
    content:
      "Created wireframes and high-fidelity designs. Conducted user research and gathered feedback from the team.",
    completed: true,
    date: "2024-02-01",
  },
  {
    id: "3",
    title: "Development",
    content:
      "Started implementation of core features. Frontend and backend teams working in parallel to meet deadlines.",
    completed: false,
    date: "2024-02-15",
  },
  {
    id: "4",
    title: "Testing",
    content:
      "Quality assurance phase including unit testing, integration testing, and user acceptance testing.",
    completed: false,
    date: "2024-03-01",
  },
];

export const TimelineExample: React.FC = () => {
  return (
    <div style={{ padding: "20px" }}>
      <TimelineModal
        title="Project Progress"
        items={timelineItems}
        buttonText="View Project Timeline"
      />
    </div>
  );
};
