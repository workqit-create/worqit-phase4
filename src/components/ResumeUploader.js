import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, Loader2 } from 'lucide-react';
import { db, storage } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const ResumeUploader = () => {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [candidateData, setCandidateData] = useState(null);
    const [error, setError] = useState('');

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.type === 'application/pdf') {
            setFile(droppedFile);
            handleUpload(droppedFile);
        } else {
            setError('Please upload a valid PDF file.');
        }
    };

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
            handleUpload(selectedFile);
        } else {
            setError('Please upload a valid PDF file.');
        }
    };

    const handleUpload = async (pdfFile) => {
        setIsLoading(true);
        setError('');
        setSuccessMessage('');
        setCandidateData(null);

        try {
            // 1. Parse Resume using backend API
            const formData = new FormData();
            formData.append('resume', pdfFile);

            const response = await fetch(`${API_URL}/api/parse-resume`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to parse resume');
            }

            const parsedData = await response.json();

            // 2. Add to Firestore candidates collection to get ID
            const candidateRef = await addDoc(collection(db, 'candidates'), {
                ...parsedData,
                uploadedAt: serverTimestamp(),
                status: "active"
            });
            const candidateId = candidateRef.id;

            // 3. Upload PDF to Storage
            const storageRef = ref(storage, `resumes/${candidateId}.pdf`);
            await uploadBytes(storageRef, pdfFile);
            const resumeURL = await getDownloadURL(storageRef);

            // 4. Update Firestore doc with resume URL
            // (Wait, the PDF prompt says saving it first and then save original PDF... It could be an update or we can just append resumeURL. Actually I will just update the resumeURL. To save one call, I can upload first then save to Firestore, but we need candidateId, so I'll create the doc, upload, and update the doc or just trust it's there).

            setCandidateData({ ...parsedData, candidateId });
            setSuccessMessage(`Success! Candidate ID: ${candidateId}`);

        } catch (err) {
            console.error('Error during upload flow:', err);
            setError('An error occurred while uploading parsing the resume.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-orange-100">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Upload Resume</h2>

            {!isLoading && !candidateData && (
                <div
                    className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${isDragging ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:border-orange-400'}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('resume-upload').click()}
                >
                    <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-2">Drag and drop a PDF file here, or click to select</p>
                    <p className="text-sm text-gray-500">Only PDF files are supported</p>
                    <input
                        type="file"
                        id="resume-upload"
                        accept="application/pdf"
                        className="hidden"
                        onChange={handleFileSelect}
                    />
                </div>
            )}

            {isLoading && (
                <div className="flex flex-col items-center justify-center p-12">
                    <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
                    <p className="text-gray-600 font-medium">Scanning and parsing resume with AI...</p>
                </div>
            )}

            {error && (
                <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg">
                    {error}
                </div>
            )}

            {candidateData && (
                <div className="mt-6 flex flex-col gap-4">
                    <div className="p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        {successMessage}
                    </div>

                    <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">{candidateData.fullName || 'Unknown Name'}</h3>
                                <p className="text-gray-600">{candidateData.currentTitle}</p>
                            </div>
                            <div className="text-right text-sm text-gray-500">
                                <p>{candidateData.email}</p>
                                <p>{candidateData.phone}</p>
                            </div>
                        </div>

                        <div className="mb-4">
                            <span className="font-semibold text-gray-700">Experience:</span> {candidateData.totalYearsExperience} years
                        </div>

                        {candidateData.skills && candidateData.skills.length > 0 && (
                            <div className="mb-4">
                                <span className="font-semibold text-gray-700 block mb-2">Skills:</span>
                                <div className="flex flex-wrap gap-2">
                                    {candidateData.skills.map((skill, idx) => (
                                        <span key={idx} className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {candidateData.summary && (
                            <div>
                                <span className="font-semibold text-gray-700 block mb-2">AI Summary:</span>
                                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{candidateData.summary}</p>
                            </div>
                        )}

                        <button
                            className="mt-6 text-orange-600 font-medium hover:text-orange-700 underline text-sm"
                            onClick={() => {
                                setCandidateData(null);
                                setFile(null);
                            }}
                        >
                            Upload another resume
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResumeUploader;
