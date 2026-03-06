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
        // Fix: Use uuid to prevent members-only errors
        const roomName = 'worqit-' + uuidv4();
        const meetLink = `https://8x8.vc/${roomName}`;

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
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
