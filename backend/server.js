const express = require('express');
const session = require('express-session');
const passport = require('passport');
const { google } = require('googleapis');
const crypto = require('crypto');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_fallback_key');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const Groq = require('groq-sdk');
const admin = require("firebase-admin");
const { auditEnvironment } = require('./utils/securityCheck');
const { setUserStatus, deleteUser: deleteAdminUser, moderateJob } = require('./services/adminService');
const { logEvent } = require('./services/auditService');

// ── SECURITY AUDIT (Rotation Protection) ──────────────────────────
const isEnvSecure = auditEnvironment();
if (!isEnvSecure) {
    console.error("⚠️  SERVER STARTING IN INSECURE MODE. Check critical errors above.");
}

// ── AI TASK QUEUE & RATE LIMITING (P2 Improvement) ─────────────────
const aiTaskQueue = [];
let isProcessingQueue = false;

const processAiQueue = async () => {
    if (isProcessingQueue || aiTaskQueue.length === 0) return;

    isProcessingQueue = true;
    const task = aiTaskQueue.shift();
    if (task) {
        const { type, payload, resolve, reject } = task;
        try {
            let result;
            const groq = getGroqClient();
            const AI_MODEL = "llama-3.3-70b-versatile"; // Best free model

            switch (type) {
                case "parse-resume":
                    const data = await pdfParse(payload.fileBuffer);
                    const resumeText = data.text;
                    const parseCompletion = await groq.chat.completions.create({
                        messages: [
                            {
                                role: "system",
                                content: "Extract the following information from the resume and return ONLY valid JSON: fullName (string), email (string), phone (string), location (string), totalYearsExperience (number), currentTitle (string), skills (array of strings), languages (array of strings), education (array of objects with: degree, institution, year), workHistory (array of objects with: company, title, startDate, endDate, description), certifications (array of strings), summary (string, 2-3 sentence AI-generated summary)."
                            },
                            {
                                role: "user",
                                content: `Extract information from this resume:\n\n${resumeText}`,
                            }
                        ],
                        model: AI_MODEL,
                        temperature: 0.1,
                        response_format: { type: "json_object" },
                    });
                    result = JSON.parse(parseCompletion.choices[0]?.message?.content || "{}");
                    break;

                case "match-candidates":
                    const { jobDescription, candidateProfiles } = payload;
                    const matchCompletion = await groq.chat.completions.create({
                        messages: [
                            {
                                role: "system",
                                content: "You are an AI recruiter. Match candidates to the job description. Respond only with a JSON object where keys are candidate IDs and values are objects with: score (number 0-100), matchedSkills (array), missingSkills (array), reasoning (string), experienceMatch (boolean), locationMatch (boolean)."
                            },
                            {
                                role: "user",
                                content: `Job: ${jobDescription}\n\nCandidates: ${JSON.stringify(candidateProfiles)}`,
                            }
                        ],
                        model: AI_MODEL,
                        temperature: 0.1,
                        response_format: { type: "json_object" },
                    });
                    result = JSON.parse(matchCompletion.choices[0]?.message?.content || "{}");
                    break;

                case "generate-interview-questions":
                    const { jobTitle, experienceLevel, skills } = payload;
                    const questionsCompletion = await groq.chat.completions.create({
                        messages: [
                            {
                                role: "system",
                                content: "You are an expert HR interviewer. Generate 5-7 clear, concise interview questions. Respond only with a JSON object containing a 'questions' array of strings."
                            },
                            {
                                role: "user",
                                content: `Role: ${jobTitle}\nLevel: ${experienceLevel}\nSkills: ${skills.join(", ")}`,
                            }
                        ],
                        model: AI_MODEL,
                        temperature: 0.7,
                        response_format: { type: "json_object" },
                    });
                    result = JSON.parse(questionsCompletion.choices[0]?.message?.content || "{}");
                    break;
            }
            resolve(result);
        } catch (error) {
            console.error(`AI Task Error (${type}):`, error.message || error);
            reject(error);
        } finally {
            isProcessingQueue = false;
            setTimeout(processAiQueue, 2000); // 2-second rate limit safety
        }
    }
};

// ── FIREBASE ADMIN INITIALIZATION (P1 Improvement) ─────────────────
try {
    if (process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT) {
        admin.initializeApp({
            credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT))
        });
        console.log("Firebase Admin Initialized Successfully.");
    } else {
        throw new Error("FIREBASE_ADMIN_SERVICE_ACCOUNT is not set. Critical security features will fail.");
    }
} catch (e) {
    console.error("Firebase Admin Init Error:", e.message);
}

const getGroqClient = () => {
    const key = process.env.GROQ_API_KEY;
    if (!key || key === 'placeholder_key') throw new Error("GROQ_API_KEY not configured.");
    return new Groq({ apiKey: key });
};

const upload = multer({ storage: multer.memoryStorage() });
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: { origin: process.env.FRONTEND_URL || "http://localhost:3000", methods: ["GET", "POST"], credentials: true }
});

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000", credentials: true }));
app.use((req, res, next) => {
    if (req.originalUrl === '/api/webhook') next();
    else express.json()(req, res, next);
});
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));
app.use(passport.initialize());
app.use(passport.session());

// Google OAuth
const GoogleStrategy = require('passport-google-oauth20').Strategy;
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
}, (at, rt, profile, done) => {
    profile.accessToken = at;
    return done(null, profile);
}));
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// ── STRIPE WEBHOOK FULFILLMENT (P1/P2 Improvement) ─────────────────
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            const userId = session.client_reference_id;
            if (userId) {
                await admin.firestore().collection('users').doc(userId).update({
                    subscriptionPlan: 'pro',
                    stripeSubscriptionId: session.subscription,
                    stripeCustomerId: session.customer,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                console.log(`[Stripe] User ${userId} upgraded to Pro.`);
            }
            break;
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
            const sub = event.data.object;
            const userQuery = await admin.firestore().collection('users').where('stripeCustomerId', '==', sub.customer).limit(1).get();
            if (!userQuery.empty) {
                const plan = (sub.status === 'active' || sub.status === 'trialing') ? 'pro' : 'freemium';
                await userQuery.docs[0].ref.update({
                    subscriptionPlan: plan,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                console.log(`[Stripe] User ${userQuery.docs[0].id} plan updated to ${plan}.`);
            }
            break;
    }
    res.json({ received: true });
});

// Standard Routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'], accessType: 'offline', prompt: 'consent' }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }), (req, res) => res.redirect(`${process.env.FRONTEND_URL}?auth=success`));
app.get('/api/auth/status', (req, res) => res.json({ authenticated: req.isAuthenticated(), user: req.user }));
app.post('/api/create-call', (req, res) => res.json({ meetLink: `https://meet.ffmuc.net/worqit-${uuidv4()}` }));

app.post('/api/create-checkout-session', async (req, res) => {
    try {
        const { priceId, userId, successUrl, cancelUrl } = req.body;
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [{ price: priceId, quantity: 1 }],
            client_reference_id: userId,
            success_url: successUrl || `${process.env.FRONTEND_URL}/hirer/billing?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/hirer/billing`,
        });
        res.json({ url: session.url });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// AI Endpoints (Queued)
app.post("/api/parse-resume", upload.single("resume"), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file." });
    try {
        const result = await new Promise((res, rej) => {
            aiTaskQueue.push({ type: "parse-resume", payload: { fileBuffer: req.file.buffer }, resolve: res, reject: rej });
            processAiQueue();
        });
        await logEvent('system', 'AI_RESUME_PARSED', 'resume_parser', { fileName: req.file.originalname }, req);
        res.json(result);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/match-candidates", async (req, res) => {
    try {
        const result = await new Promise((res, rej) => {
            aiTaskQueue.push({ type: "match-candidates", payload: req.body, resolve: res, reject: rej });
            processAiQueue();
        });
        await logEvent('system', 'AI_CANDIDATE_MATCHED', 'matcher', { jobTitle: req.body.jobDescription?.substring(0, 50) }, req);
        res.json(result);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/generate-interview-questions", async (req, res) => {
    try {
        const result = await new Promise((res, rej) => {
            aiTaskQueue.push({ type: "generate-interview-questions", payload: req.body, resolve: res, reject: rej });
            processAiQueue();
        });
        res.json(result);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Socket Signaling
const connectedUsers = new Map();
io.on('connection', (socket) => {
    socket.on('register-user', (uid) => connectedUsers.set(uid, socket.id));
    socket.on('call-user', (d) => {
        const target = connectedUsers.get(d.targetUserId);
        if (target) io.to(target).emit('incoming-call', d);
        else socket.emit('call-failed', { reason: 'Offline' });
    });
    socket.on('call-status', (d) => {
        const caller = connectedUsers.get(d.callerUserId);
        if (caller) io.to(caller).emit('call-status-update', d);
    });
    socket.on('webrtc-signal', (d) => {
        const target = connectedUsers.get(d.targetUserId);
        if (target) io.to(target).emit('webrtc-signal', d);
    });
    socket.on('disconnect', () => {
        for (let [u, s] of connectedUsers.entries()) if (s === socket.id) connectedUsers.delete(u);
    });
});

// ── ADMIN MIDDLEWARE ──────────────────────────────────────────────
const isAdmin = async (req, res, next) => {
    try {
        const uid = req.headers['x-admin-uid'];
        if (!uid) return res.status(401).json({ error: "Unauthorized" });

        const adminSnap = await admin.firestore().collection('users').doc(uid).get();
        if (!adminSnap.exists() || adminSnap.data().userType !== 'admin') {
            return res.status(403).json({ error: "Forbidden: Admin access only" });
        }
        req.adminUid = uid;
        next();
    } catch (e) { res.status(500).json({ error: e.message }); }
};

// ... (Existing variables and initialization)

// ── ADMIN ROUTES ──────────────────────────────────────────────────
app.get('/api/admin/users', isAdmin, async (req, res) => {
    try {
        const snap = await admin.firestore().collection('users').orderBy('createdAt', 'desc').limit(50).get();
        const users = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
        res.json(users);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/audit-logs', isAdmin, async (req, res) => {
    try {
        const snap = await admin.firestore().collection('auditLogs').orderBy('timestamp', 'desc').limit(100).get();
        const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        res.json(logs);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/admin/users/:uid/status', isAdmin, async (req, res) => {
    try {
        const { status, reason } = req.body;
        const result = await setUserStatus(req.params.uid, req.adminUid, status, reason, req);
        res.json(result);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/moderate-job', isAdmin, async (req, res) => {
    try {
        const { jobId, action, reason } = req.body;
        const result = await moderateJob(jobId, req.adminUid, action, reason, req);
        res.json(result);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
