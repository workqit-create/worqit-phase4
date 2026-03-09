import React, { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronDown, Search, Filter, Briefcase, MapPin, Award, User, Clock } from 'lucide-react';

const RankingBadge = ({ rank }) => {
    let color = 'bg-gray-100 text-gray-800';
    let label = `#${rank}`;

    if (rank === 1) color = 'bg-yellow-100 text-yellow-800 border border-yellow-300';
    else if (rank === 2) color = 'bg-gray-200 text-gray-700 border border-gray-300';
    else if (rank === 3) color = 'bg-orange-100 text-orange-800 border border-orange-200';

    return (
        <div className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center justify-center ${color} absolute -top-3 -right-3 shadow-sm`}>
            {label}
        </div>
    );
};

const ScoreCircle = ({ score }) => {
    let colorClass = 'stroke-green-500 text-green-600';
    if (score < 50) colorClass = 'stroke-red-500 text-red-600';
    else if (score <= 75) colorClass = 'stroke-yellow-400 text-yellow-500';

    const radius = 24;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center w-16 h-16 shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 64 64">
                <circle
                    cx="32" cy="32" r={radius}
                    className="stroke-gray-100"
                    strokeWidth="4"
                    fill="none"
                />
                <circle
                    cx="32" cy="32" r={radius}
                    className={colorClass.split(' ')[0]}
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                />
            </svg>
            <div className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${colorClass.split(' ')[1]}`}>
                {score}
            </div>
        </div>
    );
};

const Results = () => {
    const location = useLocation();
    const initialCandidates = location.state?.candidates || [];

    const [minScore, setMinScore] = useState(0);
    const [minExperience, setMinExperience] = useState(0);
    const [searchLocation, setSearchLocation] = useState('');
    const [sortBy, setSortBy] = useState('score');

    const filteredAndSorted = useMemo(() => {
        let filtered = initialCandidates.filter(c => {
            const meetsScore = (c.score || 0) >= minScore;
            const meetsExp = (c.totalYearsExperience || 0) >= minExperience;
            const meetsLocation = c.location?.toLowerCase().includes(searchLocation.toLowerCase()) || !searchLocation;
            return meetsScore && meetsExp && meetsLocation;
        });

        filtered.sort((a, b) => {
            if (sortBy === 'score') return (b.score || 0) - (a.score || 0);
            if (sortBy === 'experience') return (b.totalYearsExperience || 0) - (a.totalYearsExperience || 0);
            if (sortBy === 'name') return (a.fullName || '').localeCompare(b.fullName || '');
            return 0;
        });

        return filtered;
    }, [initialCandidates, minScore, minExperience, searchLocation, sortBy]);

    const averageScore = Math.round(
        initialCandidates.reduce((acc, c) => acc + (c.score || 0), 0) / (initialCandidates.length || 1)
    );

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 text-gray-800">
            {/* Summary Header */}
            <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-6 mb-8 mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0">
                    <span className="text-gray-500 text-sm mb-1">Total Scanned</span>
                    <span className="text-3xl font-bold text-gray-800">{initialCandidates.length}</span>
                </div>
                <div className="flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0">
                    <span className="text-gray-500 text-sm mb-1">Avg. Match Score</span>
                    <span className="text-3xl font-bold text-orange-500">{averageScore}%</span>
                </div>
                <div className="flex flex-col items-center justify-center">
                    <span className="text-gray-500 text-sm mb-1">Top Candidate</span>
                    <div className="text-lg font-bold text-gray-800 truncate px-2 w-full text-center">
                        {filteredAndSorted[0]?.fullName || 'N/A'}
                    </div>
                    {filteredAndSorted[0] && (
                        <div className="text-orange-600 font-semibold mt-1 bg-orange-50 px-3 py-1 rounded-full text-sm">
                            Score: {filteredAndSorted[0].score}%
                        </div>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-4 items-center w-full md:w-auto">
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600 whitespace-nowrap">Min Score: {minScore}</label>
                        <input type="range" min="0" max="100" value={minScore} onChange={e => setMinScore(e.target.value)} className="w-24 md:w-32 accent-orange-500" />
                    </div>

                    <div className="flex items-center gap-2 bg-gray-50 px-3 rounded-lg border border-gray-200">
                        <Briefcase className="w-4 h-4 text-gray-400" />
                        <input type="number" min="0" placeholder="Min Yrs Exp" className="w-24 py-2 bg-transparent outline-none text-sm" value={minExperience === 0 ? '' : minExperience} onChange={e => setMinExperience(parseInt(e.target.value) || 0)} />
                    </div>

                    <div className="flex items-center gap-2 bg-gray-50 px-3 rounded-lg border border-gray-200 flex-grow md:flex-grow-0">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <input type="text" placeholder="Location filter" className="w-full md:w-32 py-2 bg-transparent outline-none text-sm" value={searchLocation} onChange={e => setSearchLocation(e.target.value)} />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Sort by:</label>
                    <select className="border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-orange-500 text-sm" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                        <option value="score">Score</option>
                        <option value="experience">Experience</option>
                        <option value="name">Name</option>
                    </select>
                </div>
            </div>

            {/* Candidates List */}
            <div className="space-y-6">
                {filteredAndSorted.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-100">
                        <Search className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                        No candidates match your filters.
                    </div>
                ) : (
                    filteredAndSorted.map((candidate, idx) => (
                        <div key={candidate.candidateId || idx} className={`bg-white rounded-xl shadow-sm border p-6 relative transition-all hover:shadow-md ${idx < 3 ? 'border-orange-200' : 'border-gray-200'}`}>
                            <RankingBadge rank={idx + 1} />

                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex items-start md:items-center gap-4 border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:pr-6 shrink-0 w-full md:w-1/3">
                                    <ScoreCircle score={candidate.score || 0} />
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-gray-800 line-clamp-1">{candidate.fullName || 'Anonymous Candidate'}</h3>
                                        <p className="text-gray-600 font-medium text-sm line-clamp-1">{candidate.currentTitle}</p>
                                        <div className="flex flex-wrap gap-x-3 mt-1 text-xs text-gray-500">
                                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {candidate.location || 'Unknown'}</span>
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {candidate.totalYearsExperience} Yrs</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-grow">
                                    <div className="mb-3">
                                        <p className="text-sm italic text-gray-700 bg-slate-50 border-l-4 border-orange-400 p-2 rounded-r-md">
                                            "{candidate.reasoning || 'No reasoning provided.'}"
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wider text-green-700 mb-1 flex items-center gap-1"><CheckCircleIcon /> Match</p>
                                            <div className="flex flex-wrap gap-1">
                                                {candidate.matchedSkills?.length > 0 ? candidate.matchedSkills.map(s => (
                                                    <span key={s} className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded text-xs">{s}</span>
                                                )) : <span className="text-xs text-gray-400">None</span>}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wider text-red-700 mb-1 flex items-center gap-1"><CrossCircleIcon /> Missing</p>
                                            <div className="flex flex-wrap gap-1">
                                                {candidate.missingSkills?.length > 0 ? candidate.missingSkills.map(s => (
                                                    <span key={s} className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded text-xs">{s}</span>
                                                )) : <span className="text-xs text-gray-400">None</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                                <button className="px-4 py-2 border border-orange-500 text-orange-600 font-medium rounded-lg text-sm hover:bg-orange-50 transition-colors mr-3">
                                    View Profile
                                </button>
                                {/* Excluded Cal.com Scheduling Button Per Instruction */}
                                <button className="px-4 py-2 bg-orange-500 text-white font-medium rounded-lg text-sm hover:bg-orange-600 transition-colors">
                                    Contact Candidate
                                </button>
                            </div>

                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// simple inline icons replacing large lucide icons for these small use cases
const CheckCircleIcon = () => (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const CrossCircleIcon = () => (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export default Results;
