// app/metrics/page.tsx
"use client";

import DashboardLayout from "../dashboard/layout";
import { Button } from "@/components/ui/button";

const reports = [
	{
		title: "Project Summary Report",
		description: "Download a summary of all projects, including status and deadlines.",
		type: "project-summary",
	},
	{
		title: "Task Completion Report",
		description: "Get a report of all completed and pending tasks across teams.",
		type: "task-completion",
	},
	{
		title: "User Activity Report",
		description: "Download user login, logout, and activity logs.",
		type: "user-activity",
	},
	{
		title: "File Download History",
		description: "Export a log of all file downloads by users.",
		type: "file-download-history",
	},
	{
		title: "QA/QC Audit Report",
		description: "Get detailed QA and QC audit results for all projects.",
		type: "qa-qc-audit",
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
				<h1 className="text-3xl font-bold text-blue-800 mb-8">Download Reports</h1>
				<div className="space-y-6">
					{reports.map((report) => (
						<div
							key={report.type}
							className="bg-white rounded-lg shadow p-6 flex items-center justify-between border border-gray-200"
						>
							<div>
								<h2 className="text-lg font-semibold text-blue-900 mb-1">{report.title}</h2>
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
