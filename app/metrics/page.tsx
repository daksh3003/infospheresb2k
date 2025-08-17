// app/metrics/page.tsx
"use client";

import DashboardLayout from "../dashboard/layout";
import { Button } from "@/components/ui/button";

const reports = [
  {
    title: "Attendance Report",
    description: "Download employee attendance and time tracking data.",
    type: "attendance",
  },
  {
    title: "Daily User Report",
    description:
      "Get detailed daily activity and performance metrics for all users.",
    type: "daily-user",
  },
  {
    title: "Monthly User Report",
    description:
      "Download comprehensive monthly user statistics and analytics.",
    type: "monthly-user",
  },
  {
    title: "PO Report",
    description: "Access Purchase Order details and tracking information.",
    type: "po-report",
  },
  {
    title: "QA Sample Report",
    description: "Download sample QA evaluation reports and metrics.",
    type: "qa-sample",
  },
  {
    title: "DTP Monthly Report",
    description:
      "Get monthly Desktop Publishing performance and status report.",
    type: "dtp-monthly",
  },
  {
    title: "DTP Tracking",
    description: "Track ongoing DTP projects and their current status.",
    type: "dtp-tracking",
  },
  {
    title: "Feedback Report",
    description: "Access consolidated feedback from clients and team members.",
    type: "feedback",
  },
];

export default function MetricsDashboard() {
  const handleDownload = (type: string) => {
    // Placeholder for download logic
    alert(`Download for ${type} report coming soon!`);
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto py-10">
        <h1 className="text-3xl font-bold text-blue-800 mb-8">
          Download Reports
        </h1>
        <div className="space-y-6">
          {reports.map((report) => (
            <div
              key={report.type}
              className="bg-white rounded-lg shadow p-6 flex items-center justify-between border border-gray-200"
            >
              <div>
                <h2 className="text-lg font-semibold text-blue-900 mb-1">
                  {report.title}
                </h2>
                <p className="text-gray-500 text-sm">{report.description}</p>
              </div>
              <Button
                variant="outline"
                className="ml-6"
                onClick={() => handleDownload(report.type)}
              >
                Download
              </Button>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
