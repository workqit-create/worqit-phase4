import React, { useState } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const JobPostForm = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [skills, setSkills] = useState([]);
    const [currentSkill, setCurrentSkill] = useState('');
    const [experience, setExperience] = useState('');
    const [location, setLocation] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    const handleAddSkill = (e) => {
        if (e.key === 'Enter' && currentSkill.trim()) {
            e.preventDefault();
            if (!skills.includes(currentSkill.trim())) {
                setSkills([...skills, currentSkill.trim()]);
            }
            setCurrentSkill('');
        }
    };

    const removeSkill = (skillToRemove) => {
        setSkills(skills.filter(s => s !== skillToRemove));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!title || !description || skills.length === 0) {
            setError('Please fill in Job Title, Description, and at least one Required Skill.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // 1. Send data to backend for matching candidates
            const matchPayload = {
                jobTitle: title,
                jobDescription: description,
                requiredSkills: skills,
                minExperience: parseInt(experience, 10) || 0,
                location: location
            };

            const response = await fetch(`${API_URL}/api/match-candidates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(matchPayload),
            });

            if (!response.ok) {
                throw new Error('Failed to match candidates');
            }

            const matchedCandidates = await response.json();

            // 2. Save job posting to Firestore
            await addDoc(collection(db, 'jobs'), {
                jobTitle: title,
                description: description,
                requiredSkills: skills,
                minExperience: parseInt(experience, 10) || 0,
                location: location,
                hirerUID: auth.currentUser?.uid || 'anonymous',
                createdAt: serverTimestamp()
            });

            // 3. Navigate to results page
            navigate('/results', { state: { candidates: matchedCandidates } });

        } catch (err) {
            console.error('Error posting job:', err);
            setError('An error occurred while posting job and matching candidates.');
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Post a Job & Find AI Matches</h2>

            {error && (
                <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
                        placeholder="e.g. Senior Frontend Engineer"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Job Description *</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows="4"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
                        placeholder="Describe the role and responsibilities..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Required Skills * (Press Enter to add)</label>
                    <input
                        type="text"
                        value={currentSkill}
                        onChange={(e) => setCurrentSkill(e.target.value)}
                        onKeyDown={handleAddSkill}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors mb-2"
                        placeholder="e.g. React, Node.js"
                    />
                    {skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {skills.map(skill => (
                                <span key={skill} className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm flex items-center gap-1 group">
                                    {skill}
                                    <button
                                        type="button"
                                        onClick={() => removeSkill(skill)}
                                        className="text-orange-500 hover:text-orange-800 focus:outline-none"
                                    >
                                        &times;
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Min Experience (Years)</label>
                        <input
                            type="number"
                            min="0"
                            value={experience}
                            onChange={(e) => setExperience(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
                            placeholder="e.g. 5"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
                            placeholder="e.g. Remote, or New York, NY"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-lg flex items-center justify-center transition-colors disabled:opacity-75"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            <span className="animate-pulse">🔍 AI is scanning candidates...</span>
                        </>
                    ) : (
                        'Post Job & Match Candidates'
                    )}
                </button>
            </form>
        </div>
    );
};

export default JobPostForm;
