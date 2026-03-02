// src/utils/matching.js
// ═══════════════════════════════════════════════════════
//  AI / Heuristic Match Scoring — Phase 9
// ═══════════════════════════════════════════════════════

/**
 * Calculates a match score (0-100) between a candidate profile and a job posting.
 * 
 * @param {Object} candidate - The candidate profile data from Firestore
 * @param {Object} job - The job posting data from Firestore
 * @returns {number} Score from 0 to 100 representing the match percentage
 */
export const calculateMatchScore = (candidate, job) => {
    if (!candidate || !job) return 0;

    let score = 0;
    const weights = {
        skills: 0.60,      // Skills overlap is 60% of the score
        location: 0.20,    // Location match is 20%
        experience: 0.20   // Headline / Job Title match is 20%
    };

    // 1. Skill Matching (60%)
    const jobSkills = (job.skills || []).map(s => s.toLowerCase().trim());
    const candidateSkills = (candidate.skills || []).map(s => s.toLowerCase().trim());

    if (jobSkills.length > 0 && candidateSkills.length > 0) {
        const matchedSkills = jobSkills.filter(js => candidateSkills.some(cs => cs.includes(js) || js.includes(cs)));
        const skillRatio = matchedSkills.length / jobSkills.length;
        score += skillRatio * weights.skills * 100;
    } else if (jobSkills.length === 0) {
        // If job requires no specific skills, give some default points
        score += 0.5 * weights.skills * 100;
    }

    // 2. Location Matching (20%)
    const jobLoc = (job.location || "").toLowerCase().trim();
    const candLoc = (candidate.location || "").toLowerCase().trim();

    if (jobLoc && candLoc) {
        // Exact match or partial string match (e.g. "Dubai" in "Dubai, UAE")
        if (candLoc.includes(jobLoc) || jobLoc.includes(candLoc)) {
            score += weights.location * 100;
        } else if (jobLoc.includes("remote") || candLoc.includes("anywhere")) {
            // Remote jobs or candidates willing to relocate get partial match
            score += (weights.location * 0.8) * 100;
        }
    } else {
        // Give half points if location info is missing from either side
        score += (weights.location * 0.5) * 100;
    }

    // 3. Experience / Title Matching (20%)
    const jobTitle = (job.title || "").toLowerCase().trim();
    const candHeadline = (candidate.headline || "").toLowerCase().trim();

    if (jobTitle && candHeadline) {
        // Break into words and check for overlap (e.g., "Senior React Developer" vs "React Developer")
        const titleWords = jobTitle.split(/[\s,-]+/).filter(w => w.length > 3); // Ignore short words like "and", "the", "for"

        let matchCount = 0;
        for (const tw of titleWords) {
            if (candHeadline.includes(tw)) {
                matchCount++;
            }
        }

        if (titleWords.length > 0) {
            const titleRatio = Math.min(1, matchCount / titleWords.length);
            // Boost the score slightly for partial words to ensure it adds up
            score += (titleRatio > 0 ? Math.max(0.5, titleRatio) : 0) * weights.experience * 100;
        }
    } else {
        score += (weights.experience * 0.5) * 100;
    }

    // Cap at 98% because nobody is perfect
    const finalScore = Math.min(98, Math.round(score));

    // Floor at 15% to not be discouraging
    return Math.max(15, finalScore);
};
