const express = require('express');
const session = require('express-session');
const passport = require('passport');
const { google } = require('googleapis');
const crypto = require('crypto');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_fallback_key');
require('dotenv').config();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const Groq = require('groq-sdk');
const admin = require('firebase-admin');

try {
    if (process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT) {
        admin.initializeApp({
            credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT))
        });
    } else {
        console.warn("FIREBASE_ADMIN_SERVICE_ACCOUNT is not set. Admin SDK not fully initialized for some features.");
        // We won't crash here, but firestore access via admin might fail later
    }
} catch (e) {
    console.error("Firebase Admin Init Error:", e.message);
}

const getGroqClient = () => {
    const key = process.env.GROQ_API_KEY;
    if (!key || key === 'placeholder_key') {
        throw new Error("GROQ_API_KEY is not configured on the server.");
    }
    return new Groq({ apiKey: key });
};

const upload = multer({ storage: multer.memoryStorage() });
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
    }
});

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
}));
// Use JSON parser for all non-webhook routes
app.use((req, res, next) => {
    if (req.originalUrl === '/api/webhook') {
        next();
    } else {
        express.json()(req, res, next);
    }
});
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));
app.use(passport.initialize());
app.use(passport.session());

// Google OAuth Setup
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
},
    function (accessToken, refreshToken, profile, done) {
        profile.accessToken = accessToken;
        profile.refreshToken = refreshToken; // Keep if provided
        return done(null, profile);
    }
));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));


// Routes
app.get('/auth/google',
    passport.authenticate('google', {
        scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar.events'],
        accessType: 'offline', // Request a refresh token
        prompt: 'consent' // Force to get refresh token
    })
);

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        // Successful authentication, redirect to frontend.
        // In a real app we might pass a token to the frontend, but here we just rely on the session if frontend and backend are on same domain,
        // Or just let the user know it succeeded. We will redirect to a success page on the frontend.
        res.redirect(`${process.env.FRONTEND_URL}?auth=success`);
    }
);

// Check auth status route for frontend
app.get('/api/auth/status', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({ authenticated: true, user: req.user });
    } else {
        res.json({ authenticated: false });
    }
});

// Create Video Call Link Endpoint (Using Jitsi for immediate, verification-free calls)
app.post('/api/create-call', async (req, res) => {
    try {
        // Fix: Use open Jitsi instance to prevent members-only errors that meet.jit.si enforces
        const roomName = 'worqit-' + uuidv4();
        const meetLink = `https://meet.ffmuc.net/${roomName}`;

        res.json({ meetLink });
    } catch (error) {
        console.error('Error creating meeting link:', error);
        res.status(500).json({ error: 'Failed to create meeting link' });
    }
});


// ── STRIPE INTEGRATION (Phase 8) ──────────────────────────

// 1. Create Checkout Session
app.post('/api/create-checkout-session', async (req, res) => {
    const { priceId, userId, successUrl, cancelUrl } = req.body;

    if (!userId || !priceId) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            client_reference_id: userId, // extremely important to link back to Firestore User
            success_url: successUrl || `${process.env.FRONTEND_URL}/hirer/billing?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/hirer/billing`,
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error("Stripe Checkout Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// 2. Stripe Webhook (needs raw body, see middleware bypass above)
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            const userId = session.client_reference_id;
            const subscriptionId = session.subscription;
            // TODO: In a full app, you would use Firebase Admin SDK here to 
            // update the 'subscriptions' collection in Firestore for this userId
            console.log(`[Stripe Webhook] User ${userId} subscribed with sub ID: ${subscriptionId}`);
            break;
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
            const subscription = event.data.object;
            // TODO: Update Firestore subscription status based on subscription.status
            console.log(`[Stripe Webhook] Subscription ${subscription.id} status is now ${subscription.status}`);
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
});


// Socket.IO Setup for Real-time Signaling
const connectedUsers = new Map(); // Map socketId -> userId or vice-versa

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // When a user connects and identifies themselves
    socket.on('register-user', (userId) => {
        connectedUsers.set(userId, socket.id);
        console.log(`User ${userId} registered with socket ${socket.id}`);
    });

    // When User A wants to call User B
    socket.on('call-user', (data) => {
        console.log(`Call initiated from ${data.fromUserId} to ${data.targetUserId}`);
        const targetSocketId = connectedUsers.get(data.targetUserId);

        if (targetSocketId) {
            // Emit the incoming call to the specific user's socket
            io.to(targetSocketId).emit('incoming-call', {
                fromUserId: data.fromUserId,
                fromUserName: data.fromUserName,
                meetLink: data.meetLink,
                callId: data.callId // Add a unique ID for the call
            });
        } else {
            // Target user is offline
            console.log(`Target user ${data.targetUserId} is not online.`);
            // Could optionally emit a 'user-offline' back to sender
            socket.emit('call-failed', { reason: 'User is offline' });
        }
    });

    // When User B declines or accepts to let User A know
    socket.on('call-status', (data) => {
        const callerSocketId = connectedUsers.get(data.callerUserId);
        if (callerSocketId) {
            io.to(callerSocketId).emit('call-status-update', {
                targetUserId: data.targetUserId,
                status: data.status, // "accepted" or "declined"
                callId: data.callId
            });
        }
    });

    // ── NATIVE WEBRTC SIGNALING (Simple-Peer) ──
    socket.on('webrtc-signal', (data) => {
        const targetSocketId = connectedUsers.get(data.targetUserId);
        if (targetSocketId) {
            io.to(targetSocketId).emit('webrtc-signal', {
                fromUserId: data.fromUserId,
                signal: data.signal
            });
        }
    });

    socket.on('end-call', (data) => {
        const targetSocketId = connectedUsers.get(data.targetUserId);
        if (targetSocketId) {
            io.to(targetSocketId).emit('call-ended');
        }
    });

    socket.on('control-event', (data) => {
        const targetSocketId = connectedUsers.get(data.targetUserId);
        if (targetSocketId) {
            io.to(targetSocketId).emit('control-event', data.eventData);
        }
    });

    socket.on('chat-message', (data) => {
        const targetSocketId = connectedUsers.get(data.targetUserId);
        if (targetSocketId) {
            io.to(targetSocketId).emit('chat-message', {
                fromUserName: data.fromUserName,
                message: data.message,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Find and remove the user from the map
        for (let [userId, sId] of connectedUsers.entries()) {
            if (sId === socket.id) {
                connectedUsers.delete(userId);
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 5000;

// ── AI RECRUITMENT PLATFORM (Feature 1: Resume Parser) ──
app.post('/api/parse-resume', upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No PDF file provided" });
        }

        const data = await pdfParse(req.file.buffer);
        const text = data.text;

        const groq = getGroqClient();
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "Extract the following information from the resume and return ONLY valid JSON: fullName (string), email (string), phone (string), location (string), totalYearsExperience (number), currentTitle (string), skills (array of strings), languages (array of strings), education (array of objects with: degree, institution, year), workHistory (array of objects with: company, title, startDate, endDate, description), certifications (array of strings), summary (string, 2-3 sentence AI-generated summary of the candidate)."
                },
                {
                    role: "user",
                    content: `Here is the text extracted from the resume:\n\n${text}`
                }
            ],
            model: "llama3-70b-8192",
            temperature: 0.1,
            max_tokens: 2000,
        });

        const jsonString = completion.choices[0]?.message?.content;
        let parsedJSON;
        try {
            // Try to extract JSON if there's any markdown wrapper
            const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
            parsedJSON = JSON.parse(jsonMatch ? jsonMatch[0] : jsonString);
        } catch (err) {
            console.error("Failed to parse AI output as JSON:", jsonString);
            return res.status(500).json({ error: "AI failed to return valid JSON" });
        }

        res.json(parsedJSON);
    } catch (error) {
        console.error("Error parsing resume:", error.message || error);
        
        if (error.message.includes("not configured")) {
            return res.status(500).json({ error: "The AI service is not properly configured on the server. Please check your Render environment variables." });
        }
        
        if (error.status === 401 || error.message.includes("401")) {
            return res.status(401).json({ error: "Your Groq API key is invalid or revoked. Please update your Render environment variables with a new key." });
        }
        
        res.status(500).json({ error: `AI Error: ${error.message || "Failed to parse resume"}` });
    }
});

// ── AI RECRUITMENT PLATFORM (Feature 2: Job Matching) ──
app.post('/api/match-candidates', async (req, res) => {
    try {
        const { jobTitle, jobDescription, requiredSkills, minExperience, location } = req.body;

        if (!process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT) {
            return res.status(500).json({ error: "Firebase Admin not configured. Cannot fetch candidates." });
        }

        const db = admin.firestore();
        const candidatesSnapshot = await db.collection("candidates").get();
        const candidates = [];
        candidatesSnapshot.forEach(doc => {
            candidates.push({ id: doc.id, ...doc.data() });
        });

        const matchedCandidates = [];
        const groq = getGroqClient();

        // Process in batches of 5 to avoid rate limits
        const batchSize = 5;
        for (let i = 0; i < candidates.length; i += batchSize) {
            const batch = candidates.slice(i, i + batchSize);
            const batchPromises = batch.map(async (candidate) => {
                const completion = await groq.chat.completions.create({
                    messages: [
                        {
                            role: "system",
                            content: `You are an AI recruiter. Given the job requirements and candidate profile, return ONLY a JSON object with: score (number 0-100), matchedSkills (array of strings), missingSkills (array of strings), reasoning (string, 1 sentence explaining the score), experienceMatch (boolean), locationMatch (boolean).`
                        },
                        {
                            role: "user",
                            content: `Job Requirements: Title: ${jobTitle}, Description: ${jobDescription}, Skills: ${requiredSkills.join(", ")}, Min Experience: ${minExperience}, Location: ${location || 'Any'}\n\nCandidate Profile: ${JSON.stringify(candidate)}`
                        }
                    ],
                    model: "llama3-70b-8192",
                    temperature: 0.1,
                });

                const jsonString = completion.choices[0]?.message?.content;
                let parsedResult;
                try {
                    const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
                    parsedResult = JSON.parse(jsonMatch ? jsonMatch[0] : jsonString);
                } catch (e) {
                    parsedResult = { score: 0, reasoning: "Failed to parse AI response" };
                }

                return {
                    ...candidate,
                    candidateId: candidate.id,
                    score: parsedResult.score || 0,
                    matchedSkills: parsedResult.matchedSkills || [],
                    missingSkills: parsedResult.missingSkills || [],
                    reasoning: parsedResult.reasoning || "",
                    experienceMatch: parsedResult.experienceMatch || false,
                    locationMatch: parsedResult.locationMatch || false,
                };
            });

            const batchResults = await Promise.all(batchPromises);
            matchedCandidates.push(...batchResults);

            if (i + batchSize < candidates.length) {
                await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
            }
        }

        matchedCandidates.sort((a, b) => b.score - a.score);
        res.json(matchedCandidates);

    } catch (error) {
        console.error("Error matching candidates:", error.message || error);
        
        if (error.message.includes("not configured")) {
            return res.status(500).json({ error: "The AI service is not properly configured on the server. Please check your Render environment variables." });
        }
        
        if (error.status === 401 || error.message.includes("401")) {
            return res.status(401).json({ error: "Your Groq API key is invalid or revoked. Please update your Render environment variables with a new key." });
        }

        res.status(500).json({ error: `AI Error: ${error.message || "Failed to match candidates"}` });
    }
});

// ── AI Interview Questions Generator ──────────────────
app.post('/api/generate-interview-questions', async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) return res.status(400).json({ error: "Prompt is required" });

        const groq = getGroqClient();
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are an expert HR interviewer. Generate clear, concise interview questions based on the given prompt. Format each question on its own line, numbered."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "llama3-70b-8192",
            temperature: 0.7,
        });

        const questions = completion.choices[0]?.message?.content || "Could not generate questions.";
        res.json({ questions });
    } catch (error) {
        console.error("Error generating questions:", error.message || error);
        
        // Detailed error messages based on common failures
        if (error.message.includes("not configured")) {
            return res.status(500).json({ error: "The AI service is not properly configured on the server. Please check your Render environment variables." });
        }
        
        if (error.status === 401 || error.message.includes("401")) {
            return res.status(401).json({ error: "Your Groq API key is invalid or revoked. Please update your Render environment variables with a new key." });
        }
        
        if (error.status === 429 || error.message.includes("429")) {
            return res.status(429).json({ error: "Rate limit reached. Please try again in a few moments." });
        }

        res.status(500).json({ error: `AI Error: ${error.message || "Failed to generate questions"}` });
    }
});

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
