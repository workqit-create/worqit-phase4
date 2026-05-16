import { db } from "../firebase";
import { collection, addDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";

// Function to request AI to generate interview questions
export async function generateInterviewQuestions(jobTitle, experienceLevel, skills) {
    try {
        const response = await fetch("/api/generate-interview-questions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ jobTitle, experienceLevel, skills }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to generate interview questions");
        }

        const data = await response.json();
        return data.questions;
    } catch (error) {
        console.error("Error generating interview questions:", error);
        throw error;
    }
}

// Function to save generated interview questions to Firestore
export async function saveInterviewQuestions(candidateId, jobTitle, questions) {
    try {
        await addDoc(collection(db, "interviewQuestions"), {
            candidateId,
            jobTitle,
            questions,
            createdAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error saving interview questions:", error);
        throw error;
    }
}

// Function to get a candidate's saved interview questions
export async function getCandidateInterviewQuestions(candidateId) {
    try {
        const q = query(
            collection(db, "interviewQuestions"),
            where("candidateId", "==", candidateId)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching candidate interview questions:", error);
        throw error;
    }
}
