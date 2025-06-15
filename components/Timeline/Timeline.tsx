import React, { useState } from "react";
import { ChevronDown, ChevronUp, Clock } from "react-feather";
import { Modal } from "./Modal";
import "./Timeline.css";

export interface TimelineItem {
  id: string;
  title: string;
  content: string;
  completed: boolean;
  date?: string;
}

interface TimelineProps {
  items: TimelineItem[];
  title?: string;
  buttonText?: string;
}

export const Timeline: React.FC<TimelineProps> = ({
  items,
  title = "Timeline",
  buttonText = "View Timeline",
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedCards, setExpandedCards] = useState<{
    [key: string]: boolean;
  }>({});

  const toggleCard = (id: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const TimelineContent = () => (
    <div className="timeline">
      {items.map((item, index) => (
        <div key={item.id} className="timeline-item">
          <div className="timeline-marker">
            <div className={`circle ${item.completed ? "completed" : ""}`} />
            {index < items.length - 1 && <div className="line" />}
          </div>

          <div className="timeline-content">
            <div
              className="timeline-card-header"
              onClick={() => toggleCard(item.id)}
            >
              <div className="timeline-card-title">
                <h3>{item.title}</h3>
                {item.date && (
                  <span className="timeline-date">{item.date}</span>
                )}
              </div>
              {expandedCards[item.id] ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </div>

            {expandedCards[item.id] && (
              <div className="timeline-card-content">{item.content}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <button className="timeline-button" onClick={() => setIsModalOpen(true)}>
        <Clock size={18} />
        <span>{buttonText}</span>
      </button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={title}
      >
        <TimelineContent />
      </Modal>
    </>
  );
};
