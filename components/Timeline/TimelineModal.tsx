"use client";

import React, { useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import { Clock, DownloadCloud, Paperclip, CheckCircle } from "react-feather";
import { ChevronDown, ChevronUp } from "react-feather";
import "./Timeline.css";
import { supabase } from "@/utils/supabase";
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

interface TimelineItem {
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
  const [timelineItems, setTimelineItems] = React.useState<any[]>([]);

  const fetchTimelineItems = async () => {
    const { data: stages, error: timelineError } = await supabase
      .from("task_iterations")
      .select("stages")
      .eq("task_id", taskId)
      .single();
    if (timelineError) {
      console.log("Error fetching timeline items:", timelineError);
      return;
    }
    console.log("stages : ", stages);
    const stagesArray = stages.stages;
    const len = stagesArray.length;

    let timelineItems: any[] = [];

    let cnt_of_processor = 1;

    for (let i = 0; i < len; i++) {
      console.log("i : ", i);

      let folder_path = "";
      let storage_name = "";
      let current_stage = "";

      if (stagesArray[i] === "PM") {
        folder_path = taskId;
        storage_name = "task-files";
        current_stage = "PM";
      } else if (stagesArray[i] === "Processor") {
        if (stagesArray[i - 1] === "PM") {
          folder_path = `PM_${taskId}`;
          storage_name = "processor-files";
          current_stage = "Processor (" + cnt_of_processor + ")";
        } else if (stagesArray[i - 1] === "QC") {
          folder_path = `QC_${taskId}`;
          storage_name = "processor-files";
          current_stage = "Processor (" + cnt_of_processor + ")";
        } else if (stagesArray[i - 1] === "QA") {
          folder_path = `QA_${taskId}`;
          storage_name = "processor-files";
          current_stage = "Processor (" + cnt_of_processor + ")";
        }
        cnt_of_processor++;
      } else if (stagesArray[i] === "QC") {
        folder_path = taskId;
        storage_name = "qc-files";
        current_stage = "QC";
      } else if (stagesArray[i] === "QA") {
        folder_path = taskId;
        storage_name = "qa-files";
        current_stage = "QA";
      } else if (stagesArray[i] === "Delivery") {
        // console.log("cnt_of_processor : ", cnt_of_processor);
        if (cnt_of_processor == 2) {
          folder_path = `PM_${taskId}`;
        } else if (cnt_of_processor == 3) {
          folder_path = `QC_${taskId}`;
        } else if (cnt_of_processor == 4) {
          folder_path = `QA_${taskId}`;
        }
        storage_name = "processor-files";
        current_stage = "Delivery";
      }

      const { data: uploadedFiles, error: uploadedFilesError } =
        await supabase.storage.from(storage_name).list(folder_path);
      if (uploadedFilesError) {
        console.log("Error fetching uploaded files:" + i, uploadedFilesError);
        return;
      }

      const timelineItem = {
        id: taskId,
        title: current_stage,
        content: uploadedFiles.map((file, index) => ({
          name: file.name,
          onClick: () => {
            handleDownload(file.name, storage_name, folder_path, index);
          },
        })),
        completed: true,
        date: new Date().toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        }),
      };

      timelineItems.push(timelineItem);
    }
    console.log("timelineItems : ", timelineItems);
    setTimelineItems(timelineItems);
  };

  const toggleCard = (id: number) => {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const ProcessForDownload = (
    itemIdx: any,
    fileIdx: number,
    fileName: string
  ) => {
    let storage_name = "";
    let folder_path = "";
    if (timelineItems[itemIdx].title === "PM") {
      storage_name = "task-files";
      folder_path = timelineItems[itemIdx].id;
    } else if (
      timelineItems[itemIdx].title === "Processor (1)"
      // items[itemIdx - 1].title === "PM"
    ) {
      storage_name = "processor-files";
      folder_path = `PM_${timelineItems[itemIdx].id}`;
    } else if (
      timelineItems[itemIdx].title === "Processor (2)"
      // items[itemIdx - 1].title === "QC"
    ) {
      storage_name = "processor-files";
      folder_path = `QC_${timelineItems[itemIdx].id}`;
    } else if (
      timelineItems[itemIdx].title === "Processor (3)"
      // items[itemIdx - 1].title === "QA"
    ) {
      storage_name = "processor-files";
      folder_path = `QA_${timelineItems[itemIdx].id}`;
    } else if (timelineItems[itemIdx].title === "QA") {
    }

    handleDownload(fileName, storage_name, folder_path, fileIdx);
  };

  useEffect(() => {
    fetchTimelineItems();
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
                            {item.content.map((file: any, fileIdx: number) => (
                              <div
                                key={fileIdx}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                              >
                                <div className="flex items-center gap-3">
                                  <Paperclip className="h-4 w-4 text-gray-500" />
                                  <div>
                                    <p className="font-medium">{file.name}</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() =>
                                    ProcessForDownload(
                                      index,
                                      fileIdx,
                                      file.name
                                    )
                                  }
                                  className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
                                >
                                  <DownloadCloud className="h-4 w-4" /> Download
                                </button>
                              </div>
                            ))}
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
