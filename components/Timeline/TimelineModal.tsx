"use client";

import React, { useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import { Clock, DownloadCloud, Paperclip, CheckCircle } from "react-feather";
import { ChevronDown, ChevronUp } from "react-feather";
import "./Timeline.css";
import { api } from "@/utils/api";
import { useParams } from "next/navigation";

const style = {
  position: "absolute" as const,
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

interface _TimelineItem {
  id: string;
  title: string;
  content: [];
  completed: boolean;
  date?: string;
}

interface TimelineModalProps {
  title?: string;
  buttonText?: string;
  handleDownload: (
    fileName: string,
    storage_name: string,
    folder_path: string,
    fileIdx: number
  ) => void;
}

export default function TimelineModal({
  title = "Timeline",
  buttonText = "View Timeline",
  handleDownload,
}: TimelineModalProps) {
  const [open, setOpen] = React.useState(false);
  const [expandedCards, setExpandedCards] = React.useState<{
    [key: string]: boolean;
  }>({});

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const { taskId } = useParams() as { taskId: string };
  const [timelineItems, setTimelineItems] = React.useState<
    {
      id: string;
      title: string;
      date: string;
      content: {
        name: string;
        storage_name: string;
        folder_path: string;
        index: number;
      }[];
      completed: boolean;
    }[]
  >([]);

  const fetchTimelineItems = async () => {
    try {
      const result = await api.getTaskTimeline(taskId);
      console.log("Fetched timeline items:", result);
      setTimelineItems(result.timelineItems || []);
    } catch (error) {
      console.log("Error fetching timeline items:", error);
    }
  };

  const toggleCard = (id: number) => {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  useEffect(() => {
    fetchTimelineItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <Button
        onClick={handleOpen}
        variant="contained"
        color="primary"
        startIcon={<Clock className="h-4 w-4" />}
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
              {timelineItems.map((item, index) => (
                <div key={index} className="timeline-item">
                  <div className="timeline-marker">
                    <div
                      className={`circle ${item.completed ? "completed" : ""}`}
                    />
                    {index < timelineItems.length - 1 && (
                      <div className="line" />
                    )}
                  </div>

                  <div className="timeline-content">
                    <div
                      className="timeline-card-header"
                      onClick={() => toggleCard(index)}
                    >
                      <div className="timeline-card-title">
                        <h3>{item.title}</h3>
                        {item.title === "Delivery" ? (
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-green-600"></p>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Final Approved Files
                            </span>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500"></p>
                        )}
                        {item.date && (
                          <span className="timeline-date">{item.date}</span>
                        )}
                      </div>
                      {expandedCards[index] ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>

                    {expandedCards[index] && (
                      <div className="timeline-card-content">
                        {item.content.length === 0 ? (
                          <h3 className="text-md font-medium mb-2 text-center">
                            {" "}
                            No files uploaded
                          </h3>
                        ) : (
                          <>
                            {item.content.map(
                              (
                                file: {
                                  name: string;
                                  storage_name: string;
                                  folder_path: string;
                                  index: number;
                                  uploaded_by_name?: string;
                                  uploaded_by_role?: string;
                                },
                                fileIdx: number
                              ) => (
                                <div
                                  key={fileIdx}
                                  className="flex flex-col gap-1 p-3 bg-gray-50 rounded-md mb-2"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <Paperclip className="h-4 w-4 text-gray-500" />
                                      <div>
                                        <p className="font-medium mb-0">
                                          {file.name}
                                        </p>
                                        {file.uploaded_by_name && (
                                          <div className="mt-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md shadow-sm">
                                            <div className="flex flex-wrap items-center gap-3">
                                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                                                <span className="text-xs font-bold text-white">
                                                  {file.uploaded_by_name
                                                    .charAt(0)
                                                    .toUpperCase()}
                                                </span>
                                              </div>

                                              <div className="flex items-center">
                                                <span className="text-sm text-gray-500">
                                                  Name:
                                                </span>
                                                <span className="text-sm text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full font-medium ml-1.5">
                                                  {file.uploaded_by_name}
                                                </span>
                                              </div>

                                              {file.uploaded_by_role && (
                                                <div className="flex items-center">
                                                  <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-3 w-3 text-gray-500 mr-1"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                  >
                                                    <path
                                                      strokeLinecap="round"
                                                      strokeLinejoin="round"
                                                      strokeWidth={2}
                                                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                                                    />
                                                  </svg>
                                                  <span className="text-sm text-gray-500">
                                                    Role:
                                                  </span>
                                                  <span className="text-sm text-green-800 bg-green-100 px-2 py-0.5 rounded-full font-medium ml-1.5">
                                                    {file.uploaded_by_role}
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <button
                                      onClick={() =>
                                        handleDownload(
                                          file.name,
                                          file.storage_name,
                                          file.folder_path,
                                          file.index
                                        )
                                      }
                                      className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
                                    >
                                      <DownloadCloud className="h-4 w-4" />{" "}
                                      Download
                                    </button>
                                  </div>
                                </div>
                              )
                            )}
                          </>
                        )}
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
