import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { generateInterviewQuestions, saveInterviewQuestions, getCandidateInterviewQuestions } from '../../services/aiInterviewService';
import { getJobById } from '../../services/jobService';
import { getCandidateProfile } from '../../services/profileService'; // Updated to match worqit-phase4
import { C } from '../shared/theme';
import { Sparkles, Save, BookOpen, AlertCircle, Loader2, Search } from 'lucide-react';

const AIInterviewPrep = () => {
    const { currentUser } = useAuth();
    const [jobId, setJobId] = useState('');
    const [jobDetails, setJobDetails] = useState(null);
    const [candidateProfile, setCandidateProfile] = useState(null);
    const [generatedQuestions, setGeneratedQuestions] = useState([]);
    const [savedQuestions, setSavedQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (currentUser) {
            fetchSavedQuestions();
            fetchCandidateProfile();
        }
    }, [currentUser]);

    const fetchSavedQuestions = async () => {
        try {
            const questions = await getCandidateInterviewQuestions(currentUser.uid);
            setSavedQuestions(questions);
        } catch (err) {
            console.error("Error fetching saved questions:", err);
            setError("Failed to load saved questions.");
        }
    };

    const fetchCandidateProfile = async () => {
        try {
            // In worqit-phase4, profile might be in userProfile from hook or fetched
            const profile = await getCandidateProfile(currentUser.uid);
            setCandidateProfile(profile);
        } catch (err) {
            console.error("Error fetching candidate profile:", err);
            setError("Failed to load candidate profile.");
        }
    };

    const handleJobLookup = async () => {
        if (!jobId) return;
        setSearching(true);
        setError(null);
        try {
            const job = await getJobById(jobId);
            setJobDetails(job);
        } catch (err) {
            console.error("Error fetching job details:", err);
            setJobDetails(null);
            setError("Could not find a job with that ID.");
        } finally {
            setSearching(false);
        }
    };

    const handleGenerateQuestions = async () => {
        if (!jobDetails || !candidateProfile) {
            setError("Please lookup a valid Job ID and ensure your profile is complete.");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const jobTitle = jobDetails.title;
            const experienceLevel = userProfile?.experienceLevel || candidateProfile?.totalYearsExperience > 5 ? 'senior' : 'mid';
            const skills = [...new Set([...(jobDetails.requiredSkills || []), ...(candidateProfile.skills || [])])];

            const questions = await generateInterviewQuestions(jobTitle, experienceLevel, skills);
            setGeneratedQuestions(questions);
            await saveInterviewQuestions(currentUser.uid, jobTitle, questions);
            fetchSavedQuestions();
        } catch (err) {
            console.error("Error generating interview questions:", err);
            setError(err.message || "Failed to generate interview questions.");
        } finally {
            setLoading(false);
        }
    };

    const S = {
        container: { maxWidth: '900px', margin: '0 auto', fontFamily: "'Plus Jakarta Sans', sans-serif" },
        header: { marginBottom: '40px' },
        title: { fontSize: '32px', fontWeight: 800, color: '#1D1D1F', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' },
        subtitle: { color: '#6E6E73', fontSize: '16px', fontWeight: 500 },
        card: {
            background: '#fff', borderRadius: '24px', padding: '32px',
            border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 10px 30px rgba(0,0,0,0.02)',
            marginBottom: '32px'
        },
        inputGroup: { display: 'flex', gap: '12px', marginBottom: '24px' },
        input: {
            flex: 1, padding: '14px 20px', borderRadius: '12px', border: '1px solid #E2E8F0',
            fontSize: '14px', fontWeight: 600, outline: 'none'
        },
        btn: (primary) => ({
            padding: '14px 24px', borderRadius: '12px', fontWeight: 700, fontSize: '14px',
            cursor: 'pointer', transition: 'all 0.2s', border: 'none',
            background: primary ? '#0055FF' : '#F1F5F9',
            color: primary ? '#fff' : '#475569',
            display: 'flex', alignItems: 'center', gap: '8px'
        }),
        jobSummary: {
            background: 'rgba(0, 85, 255, 0.03)', padding: '20px', borderRadius: '16px',
            border: '1px solid rgba(0, 85, 255, 0.1)', marginBottom: '24px'
        },
        questionList: { display: 'flex', flexDirection: 'column', gap: '12px' },
        questionItem: {
            padding: '16px 20px', background: '#F8FAFC', borderRadius: '14px',
            border: '1px solid #EEF2F6', fontSize: '15px', color: '#334155', fontWeight: 500,
            display: 'flex', gap: '12px'
        },
        savedItem: {
            background: '#fff', border: '1px solid #E2E8F0', borderRadius: '20px',
            padding: '24px', marginBottom: '20px'
        }
    };

    return (
        <div style={S.container}>
            <div style={S.header}>
                <h1 style={S.title}><Sparkles color="#0055FF" /> AI Interview Prep</h1>
                <p style={S.subtitle}>Generate personalized interview questions for your next big role.</p>
            </div>

            <div style={S.card}>
                <div style={S.inputGroup}>
                    <input
                        style={S.input}
                        placeholder="Paste Job ID (e.g. job_123...)"
                        value={jobId}
                        onChange={(e) => setJobId(e.target.value)}
                    />
                    <button style={S.btn(false)} onClick={handleJobLookup} disabled={searching}>
                        {searching ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                        Lookup Job
                    </button>
                </div>

                {jobDetails && (
                    <div style={S.jobSummary}>
                        <div style={{ fontWeight: 800, color: '#0055FF', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Target Role</div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#1D1D1F' }}>{jobDetails.title}</div>
                        <div style={{ fontSize: '14px', color: '#6E6E73', fontWeight: 600 }}>{jobDetails.company} • {jobDetails.location}</div>
                        <button 
                            style={{ ...S.btn(true), marginTop: '20px' }} 
                            onClick={handleGenerateQuestions} 
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                            Generate Questions
                        </button>
                    </div>
                )}

                {error && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#E53E3E', fontSize: '14px', fontWeight: 600, marginTop: '12px' }}>
                        <AlertCircle size={16} /> {error}
                    </div>
                )}
            </div>

            {generatedQuestions.length > 0 && (
                <div style={{ ...S.card, background: 'linear-gradient(180deg, #fff, #F8FAFC)' }}>
                    <h2 style={{ ...S.title, fontSize: '20px', marginBottom: '20px' }}>Generated for You</h2>
                    <div style={S.questionList}>
                        {generatedQuestions.map((q, i) => (
                            <div key={i} style={S.questionItem}>
                                <span style={{ color: '#0055FF', fontWeight: 800 }}>{i + 1}.</span>
                                {q}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {savedQuestions.length > 0 && (
                <div style={{ marginTop: '64px' }}>
                    <h2 style={{ ...S.title, fontSize: '20px', marginBottom: '24px' }}><BookOpen size={20} /> History</h2>
                    {savedQuestions.map((prep, i) => (
                        <div key={i} style={S.savedItem}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <div style={{ fontWeight: 800, fontSize: '16px' }}>{prep.jobTitle}</div>
                                <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 600 }}>{new Date(prep.createdAt?.seconds * 1000).toLocaleDateString()}</div>
                            </div>
                            <div style={S.questionList}>
                                {prep.questions.slice(0, 3).map((q, qi) => (
                                    <div key={qi} style={{ fontSize: '14px', color: '#475569', display: 'flex', gap: '8px' }}>
                                        <div style={{ minWidth: '18px', color: '#94A3B8' }}>•</div>
                                        {q}
                                    </div>
                                ))}
                                {prep.questions.length > 3 && <div style={{ fontSize: '12px', color: '#0055FF', fontWeight: 700, marginTop: '8px' }}>+ {prep.questions.length - 3} more questions</div>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AIInterviewPrep;
