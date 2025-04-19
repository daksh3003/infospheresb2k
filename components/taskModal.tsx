import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Save, Upload } from 'lucide-react';

const TaskModal = ({ isOpen, onClose }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    // Form1 Fields
    serialNumber: '',
    taskId: '',
    clientInstruction: '',
    mailInstruction: '',
    projectName: '',
    numberOfFiles: '',
    numberOfPages: '',
    language: '',
    processType: '',
    deliveryDate: '',
    estimatePOHours: '',
    listOfFiles: '',
    uploadedFiles: null,
    
    // Form2 Fields
    fileName: '',
    estimatedHoursOCR: '',
    estimatedHoursQC: '',
    estimatedHoursQA: ''
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'file' ? files : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    // Here you would typically send the data to your backend
    onClose();
  };

  const nextPage = (e) => {
    e.preventDefault(); // Prevent any default form submission
    setCurrentPage(2);
  };

  const prevPage = (e) => {
    e.preventDefault(); // Prevent any default form submission
    setCurrentPage(1);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-screen overflow-auto pointer-events-auto">
        <div className="sticky top-0 bg-white z-10 flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Loading Engineer Task</h2>
          <button 
            onClick={onClose}
            type="button"
            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {currentPage === 1 ? (
          <div className="p-4">
            <h3 className="text-lg font-semibold text-blue-600 mb-4">Form 1</h3>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Serial Number</label>
                  <input
                    type="text"
                    name="serialNumber"
                    value={formData.serialNumber}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Task ID</label>
                  <input
                    type="text"
                    name="taskId"
                    value={formData.taskId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Client Instruction</label>
                <textarea
                  name="clientInstruction"
                  value={formData.clientInstruction}
                  onChange={handleChange}
                  rows = {2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Mail Instruction</label>
                <textarea
                  name="mailInstruction"
                  value={formData.mailInstruction}
                  onChange={handleChange}
                  rows = {2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Project Name</label>
                  <input
                    type="text"
                    name="projectName"
                    value={formData.projectName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Number of Files</label>
                  <input
                    type="number"
                    name="numberOfFiles"
                    value={formData.numberOfFiles}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Number of Pages</label>
                  <input
                    type="number"
                    name="numberOfPages"
                    value={formData.numberOfPages}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Language</label>
                  <input
                    type="text"
                    name="language"
                    value={formData.language}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Process Type</label>
                <select
                  name="processType"
                  value={formData.processType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Process Type</option>
                  <option value="OCR">OCR</option>
                  <option value="Prep">Prep</option>
                  <option value="Dtp">DTP</option>
                  <option value="Source Creation">Source Creation</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Delivery Date</label>
                <input
                  type="date"
                  name="deliveryDate"
                  value={formData.deliveryDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Estimate PO Hours</label>
                <input
                  type="number"
                  name="estimatePOHours"
                  value={formData.estimatePOHours}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  step="0.5"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">List of Files</label>
                <textarea
                  name="listOfFiles"
                  value={formData.listOfFiles}
                  onChange={handleChange}
                  rows = {2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter file names separated by commas"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Upload Input Files</label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-3 pb-3">
                      <Upload className="w-6 h-6 mb-1 text-gray-500" />
                      <p className="text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                    </div>
                    <input
                      type="file"
                      name="uploadedFiles"
                      onChange={handleChange}
                      className="hidden"
                      multiple
                    />
                  </label>
                </div>
                {formData.uploadedFiles && (
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.uploadedFiles.length} file(s) selected
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-between sticky bottom-0 bg-white pt-3 pb-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={nextPage}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
              >
                Next <ChevronRight size={16} className="ml-2" />
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4">
            <h3 className="text-lg font-semibold text-blue-600 mb-4">Form 2</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Select File Name</label>
                <input
                  type="text"
                  name="fileName"
                  value={formData.fileName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Estimated Working Hours for OCR</label>
                <input
                  type="number"
                  name="estimatedHoursOCR"
                  value={formData.estimatedHoursOCR}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  step="0.5"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Estimated Working Hours for QC</label>
                <input
                  type="number"
                  name="estimatedHoursQC"
                  value={formData.estimatedHoursQC}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  step="0.5"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Estimated Working Hours for QA</label>
                <input
                  type="number"
                  name="estimatedHoursQA"
                  value={formData.estimatedHoursQA}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  step="0.5"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-between sticky bottom-0 bg-white pt-3 pb-3">
              <button
                type="button"
                onClick={prevPage}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
              >
                <ChevronLeft size={16} className="mr-2" /> Back
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none"
              >
                <Save size={16} className="mr-2" /> Submit
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default TaskModal;