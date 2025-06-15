import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import { Clock } from "react-feather";
import { ChevronDown, ChevronUp } from "react-feather";
import "./Timeline.css";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "90%",
  maxWidth: "800px",
  maxHeight: "85vh",
  bgcolor: "background.paper",
  borderRadius: "16px",
  boxShadow: "0 20px 50px rgba(0, 0, 0, 0.3)",
  p: 0,
  outline: "none",
  overflow: "auto",
};

interface TimelineItem {
  id: string;
  title: string;
  content: string;
  completed: boolean;
  date?: string;
}

interface TimelineModalProps {
  items: TimelineItem[];
  title?: string;
  buttonText?: string;
}

export default function TimelineModal({
  items,
  title = "Timeline",
  buttonText = "View Timeline",
}: TimelineModalProps) {
  const [open, setOpen] = React.useState(false);
  const [expandedCards, setExpandedCards] = React.useState<{
    [key: string]: boolean;
  }>({});

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const toggleCard = (id: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div>
      <Button
        onClick={handleOpen}
        variant="contained"
        color="primary"
        startIcon={<Clock size={18} />}
        sx={{
          textTransform: "none",
          borderRadius: "8px",
          padding: "10px 20px",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          "&:hover": {
            transform: "translateY(-1px)",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.15)",
          },
        }}
      >
        {buttonText}
      </Button>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="timeline-modal-title"
        sx={{
          backdropFilter: "blur(10px)",
        }}
      >
        <Box sx={style}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid #eee",
              padding: "20px 24px",
              position: "sticky",
              top: 0,
              bgcolor: "background.paper",
              borderRadius: "16px 16px 0 0",
              zIndex: 1,
            }}
          >
            <h2 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 600 }}>
              {title}
            </h2>
            <Button
              onClick={handleClose}
              sx={{
                minWidth: "40px",
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                padding: 0,
              }}
            >
              ×
            </Button>
          </Box>

          <Box sx={{ padding: "24px" }}>
            <div className="timeline">
              {items.map((item, index) => (
                <div key={item.id} className="timeline-item">
                  <div className="timeline-marker">
                    <div
                      className={`circle ${item.completed ? "completed" : ""}`}
                    />
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
                      <div className="timeline-card-content">
                        {item.content}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Box>
        </Box>
      </Modal>
    </div>
  );
}
