// src/scripts/seedData.js
// ═══════════════════════════════════════════════════════
//  Run ONCE to populate Worqit with realistic dummy data.
//  Usage: node src/scripts/seedData.js
//
//  Requires: serviceAccountKey.json in project root
//  Creates:
//    - 5 hirer companies (1 per industry)
//    - 8 candidate profiles
//    - 10 job postings across all 5 industries
//    - Sample applications
// ═══════════════════════════════════════════════════════

const admin = require("firebase-admin");

let serviceAccount;
try {
  serviceAccount = require("../../serviceAccountKey.json");
} catch {
  console.error("❌ serviceAccountKey.json not found in project root.");
  console.error("   Download it from Firebase Console → Project Settings → Service Accounts");
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db   = admin.firestore();
const auth = admin.auth();
const ts   = admin.firestore.FieldValue.serverTimestamp();

// ── HIRERS ───────────────────────────────────────────────
const HIRERS = [
  {
    email: "hr@nexatech.ae", password: "Seed@1234", name: "Sara Al Mansoori",
    companyName: "NexaTech Solutions", industry: "Tech / Software",
    companySize: "51–200", location: "Dubai, UAE",
    companyBio: "We build enterprise SaaS tools for the MENA region. Fast-paced, remote-friendly, and obsessed with product quality.",
    website: "https://nexatech.ae", linkedin: "https://linkedin.com/company/nexatech",
  },
  {
    email: "talent@emiratesretail.ae", password: "Seed@1234", name: "Khalid Al Rashidi",
    companyName: "Emirates Retail Group", industry: "Retail / E-commerce",
    companySize: "201–500", location: "Abu Dhabi, UAE",
    companyBio: "One of the UAE's fastest growing omnichannel retailers with 80+ stores and a growing digital presence.",
    website: "https://emiratesretail.ae", linkedin: "https://linkedin.com/company/emiratesretail",
  },
  {
    email: "jobs@pulsecreative.ae", password: "Seed@1234", name: "Rania Karimi",
    companyName: "Pulse Creative Agency", industry: "Marketing / Creative",
    companySize: "11–50", location: "Dubai, UAE",
    companyBio: "Award-winning creative agency working with Fortune 500 brands across the Gulf. We live and breathe brand storytelling.",
    website: "https://pulsecreative.ae", linkedin: "https://linkedin.com/company/pulsecreative",
  },
  {
    email: "careers@gulfhealth.ae", password: "Seed@1234", name: "Dr. Fatima Al Zaabi",
    companyName: "Gulf Health Network", industry: "Healthcare",
    companySize: "501–1000", location: "Dubai Healthcare City, UAE",
    companyBio: "A network of 12 hospitals and 40+ clinics across the UAE, committed to world-class patient care and digital health innovation.",
    website: "https://gulfhealth.ae", linkedin: "https://linkedin.com/company/gulfhealth",
  },
  {
    email: "hiring@almasfin.ae", password: "Seed@1234", name: "Omar Al Farsi",
    companyName: "Al Mas Financial Services", industry: "Finance / Banking",
    companySize: "201–500", location: "DIFC, Dubai, UAE",
    companyBio: "Regulated financial services firm specialising in wealth management, Islamic finance, and fintech partnerships.",
    website: "https://almasfin.ae", linkedin: "https://linkedin.com/company/almasfin",
  },
];

// ── CANDIDATES ──────────────────────────────────────────
const CANDIDATES = [
  {
    email: "ahmed.rashidi@gmail.com", password: "Seed@1234",
    name: "Ahmed Al Rashidi", headline: "Senior Software Engineer · 7 Years Experience",
    bio: "Full-stack engineer with deep expertise in React, Node.js and cloud architecture. Built platforms serving 2M+ users. Looking for a senior IC or lead role in a product-driven company.",
    location: "Dubai, UAE", skills: ["React","Node.js","TypeScript","AWS","PostgreSQL","Docker"],
    experience: "7 years. Previously at Careem (backend), then Tabby (full-stack). Currently freelancing.",
    education: "BSc Computer Engineering, American University of Sharjah, 2017",
    linkedin: "https://linkedin.com/in/ahmedalrashidi",
  },
  {
    email: "priya.sharma@gmail.com", password: "Seed@1234",
    name: "Priya Sharma", headline: "Product Manager · Fintech & Payments",
    bio: "Product leader with 6 years building payments and lending products. Comfortable with data, agile, and stakeholder management across APAC and MENA.",
    location: "Relocating to Dubai", skills: ["Product Strategy","SQL","Jira","User Research","A/B Testing","Roadmapping"],
    experience: "6 years. PayU (2 years), Razorpay (3 years), now seeking MENA opportunity.",
    education: "MBA, Indian School of Business, 2018 · BEng Information Technology, VIT, 2015",
    linkedin: "https://linkedin.com/in/priyasharmapm",
  },
  {
    email: "marcus.chen@gmail.com", password: "Seed@1234",
    name: "Marcus Chen", headline: "Data Scientist · ML & Analytics",
    bio: "Data scientist specialising in recommendation systems and churn prediction. Comfortable with Python, SQL, and deploying models to production. Open to relocation.",
    location: "London, UK · Available Immediately",
    skills: ["Python","Machine Learning","SQL","TensorFlow","Spark","Tableau"],
    experience: "5 years. Amazon (DS intern), Monzo (2 years), Deliveroo (2 years).",
    education: "MSc Data Science, UCL, 2019 · BSc Statistics, Durham, 2018",
  },
  {
    email: "lina.hassan@gmail.com", password: "Seed@1234",
    name: "Lina Hassan", headline: "UX/UI Designer · Mobile & Web",
    bio: "Product designer who cares deeply about research-led design. Built design systems for 3 startups from scratch. Figma power user, comfortable presenting to C-suite.",
    location: "Dubai, UAE", skills: ["Figma","Design Systems","User Research","Prototyping","Framer","Adobe XD"],
    experience: "5 years. Souq/Amazon (18 months), Kitopi (2 years), freelance (current).",
    education: "BA Graphic Design, American University in Dubai, 2019",
    linkedin: "https://linkedin.com/in/linahassan",
    portfolio: "https://linahassan.design",
  },
  {
    email: "james.okoro@gmail.com", password: "Seed@1234",
    name: "James Okoro", headline: "Digital Marketing Manager · Growth & Performance",
    bio: "Performance marketer with proven track record in paid social, SEO, and email automation. Managed $2M+ ad spend. ROAS-obsessed and data-first.",
    location: "Abu Dhabi, UAE", skills: ["Google Ads","Meta Ads","SEO","Email Marketing","GA4","HubSpot"],
    experience: "6 years. Jumia (2 years), noon (3 years), freelance (current).",
    education: "BSc Business Administration, University of Lagos, 2017",
  },
  {
    email: "sara.williams@gmail.com", password: "Seed@1234",
    name: "Sara Williams", headline: "Finance Analyst · CFA Level 2",
    bio: "Finance professional with expertise in financial modelling, valuations and FP&A. CFA Level 2 candidate. Seeking a role in investment banking or corporate finance in DIFC.",
    location: "Dubai, UAE", skills: ["Financial Modelling","Valuation","Excel","Bloomberg","FP&A","CFA"],
    experience: "4 years. KPMG UAE (2 years audit), then Majid Al Futtaim (2 years FP&A).",
    education: "BSc Finance, University of Manchester, 2020",
    linkedin: "https://linkedin.com/in/sarawilliams",
  },
  {
    email: "noor.ahmed@gmail.com", password: "Seed@1234",
    name: "Noor Ahmed", headline: "Registered Nurse · ICU Specialist",
    bio: "ICU nurse with 5 years clinical experience in high-dependency units. DHA licensed. Fluent in Arabic and English. Seeking a senior nursing role in Dubai.",
    location: "Dubai, UAE", skills: ["ICU Care","Patient Assessment","DHA Licensed","Arabic","English","Clinical Documentation"],
    experience: "5 years. Mediclinic City Hospital (3 years ICU), Cleveland Clinic Abu Dhabi (2 years).",
    education: "BSc Nursing, Ain Shams University, 2019",
  },
  {
    email: "raj.patel@gmail.com", password: "Seed@1234",
    name: "Raj Patel", headline: "E-commerce Manager · Marketplace & Operations",
    bio: "E-commerce professional with end-to-end marketplace experience — from cataloguing and pricing to logistics and seller onboarding. Led a team of 12 at noon.",
    location: "Dubai, UAE", skills: ["E-commerce Operations","Seller Management","SQL","Tableau","Amazon Seller Central","noon"],
    experience: "7 years. Flipkart (2 years), noon.com (4 years marketplace ops), freelance.",
    education: "BCom, University of Mumbai, 2016",
  },
];

// ── JOBS ─────────────────────────────────────────────────
const JOBS = (hirerIds) => [
  // Tech
  {
    hirerId: hirerIds[0], title: "Senior Full-Stack Engineer", company: "NexaTech Solutions",
    location: "Dubai, UAE (Hybrid)", salary: "AED 22,000 – 30,000/month", type: "Full-time",
    description: "We are looking for a senior engineer to lead development of our core SaaS platform. You will own end-to-end features, mentor junior developers, and work directly with the CTO.\n\nRequirements:\n• 5+ years full-stack experience\n• Strong in React and Node.js\n• Experience with cloud infrastructure (AWS/GCP)\n• Excellent communication skills",
    skills: ["React","Node.js","TypeScript","AWS","PostgreSQL"], status: "open",
  },
  {
    hirerId: hirerIds[0], title: "Product Manager – Enterprise", company: "NexaTech Solutions",
    location: "Dubai, UAE", salary: "AED 20,000 – 26,000/month", type: "Full-time",
    description: "Own the roadmap for our enterprise product line. Work cross-functionally with engineering, design, and sales to ship features that delight our customers.\n\nYou will define requirements, run discovery sessions, and measure success with data.",
    skills: ["Product Strategy","Roadmapping","SQL","Agile","Jira"], status: "open",
  },
  // Retail
  {
    hirerId: hirerIds[1], title: "E-commerce Operations Manager", company: "Emirates Retail Group",
    location: "Abu Dhabi, UAE", salary: "AED 18,000 – 24,000/month", type: "Full-time",
    description: "Lead our online marketplace operations team of 8. You will be responsible for seller performance, fulfilment SLAs, and driving online GMV growth across all categories.",
    skills: ["E-commerce Operations","Seller Management","SQL","Logistics","Tableau"], status: "open",
  },
  {
    hirerId: hirerIds[1], title: "Digital Marketing Specialist", company: "Emirates Retail Group",
    location: "Abu Dhabi, UAE (Hybrid)", salary: "AED 12,000 – 16,000/month", type: "Full-time",
    description: "Drive performance marketing campaigns across Google, Meta, and TikTok. Manage a monthly ad budget of AED 500,000+. Report directly to the CMO.",
    skills: ["Google Ads","Meta Ads","TikTok Ads","GA4","Email Marketing"], status: "open",
  },
  // Creative
  {
    hirerId: hirerIds[2], title: "Senior UX/UI Designer", company: "Pulse Creative Agency",
    location: "Dubai, UAE", salary: "AED 14,000 – 19,000/month", type: "Full-time",
    description: "Join our design team working on landmark brand projects across hospitality, retail, and government sectors. You will lead design sprints, present concepts, and build design systems.",
    skills: ["Figma","Design Systems","User Research","Prototyping","Branding"], status: "open",
  },
  {
    hirerId: hirerIds[2], title: "Content Strategist & Copywriter", company: "Pulse Creative Agency",
    location: "Dubai, UAE (Remote option)", salary: "AED 10,000 – 14,000/month", type: "Full-time",
    description: "Craft compelling brand narratives and content strategies for our clients. You will write across formats — web, social, video scripts, and pitch decks.",
    skills: ["Copywriting","Content Strategy","Brand Voice","SEO","Social Media"], status: "open",
  },
  // Healthcare
  {
    hirerId: hirerIds[3], title: "ICU Registered Nurse", company: "Gulf Health Network",
    location: "Dubai Healthcare City, UAE", salary: "AED 9,000 – 13,000/month", type: "Full-time",
    description: "Provide high-quality nursing care in our 30-bed ICU. DHA license required. We offer full relocation support, housing allowance, and annual flights for international hires.",
    skills: ["ICU Care","DHA Licensed","Patient Assessment","Critical Care","Arabic"], status: "open",
  },
  {
    hirerId: hirerIds[3], title: "Health Data Analyst", company: "Gulf Health Network",
    location: "Dubai, UAE", salary: "AED 14,000 – 18,000/month", type: "Full-time",
    description: "Support our digital health initiatives with data analysis across our hospital network. Work with clinical teams to improve patient outcomes using data.",
    skills: ["Python","SQL","Tableau","Healthcare Analytics","Power BI"], status: "open",
  },
  // Finance
  {
    hirerId: hirerIds[4], title: "Investment Analyst – Wealth Management", company: "Al Mas Financial Services",
    location: "DIFC, Dubai, UAE", salary: "AED 18,000 – 24,000/month", type: "Full-time",
    description: "Analyse investment opportunities across equities, fixed income, and alternatives for our HNWI client base. CFA candidate preferred. Exposure to GCC markets a strong plus.",
    skills: ["Financial Modelling","CFA","Bloomberg","Portfolio Analysis","Excel"], status: "open",
  },
  {
    hirerId: hirerIds[4], title: "Fintech Product Analyst", company: "Al Mas Financial Services",
    location: "DIFC, Dubai, UAE (Hybrid)", salary: "AED 14,000 – 18,000/month", type: "Full-time",
    description: "Bridge the gap between our technology and finance teams. Define requirements for our digital banking features, analyse user flows, and ensure regulatory compliance.",
    skills: ["Product Analysis","SQL","Regulatory Compliance","Fintech","API Documentation"], status: "open",
  },
];

// ── MAIN SEED FUNCTION ──────────────────────────────────
async function seed() {
  console.log("\n🌱 Worqit Seed Data — Starting\n");
  console.log("Creating 5 hirer accounts…");

  const hirerIds = [];
  for (const h of HIRERS) {
    try {
      let uid;
      try {
        const u = await auth.createUser({ email: h.email, password: h.password, displayName: h.name });
        uid = u.uid;
      } catch (e) {
        if (e.code === "auth/email-already-exists") {
          const u = await auth.getUserByEmail(h.email);
          uid = u.uid;
          console.log(`  ↩  ${h.companyName} — already exists, reusing`);
        } else throw e;
      }
      await db.collection("users").doc(uid).set({
        email: h.email, name: h.name, userType: "hirer",
        companyName: h.companyName, industry: h.industry,
        companySize: h.companySize, location: h.location,
        companyBio: h.companyBio, website: h.website, linkedin: h.linkedin,
        platform: "worqit", profileComplete: true, createdAt: ts,
      }, { merge: true });
      hirerIds.push(uid);
      console.log(`  ✅ ${h.companyName} (${h.industry})`);
    } catch (e) { console.error(`  ❌ ${h.companyName}:`, e.message); hirerIds.push(null); }
  }

  console.log("\nCreating 8 candidate accounts…");
  const candidateIds = [];
  for (const c of CANDIDATES) {
    try {
      let uid;
      try {
        const u = await auth.createUser({ email: c.email, password: c.password, displayName: c.name });
        uid = u.uid;
      } catch (e) {
        if (e.code === "auth/email-already-exists") {
          const u = await auth.getUserByEmail(c.email);
          uid = u.uid;
          console.log(`  ↩  ${c.name} — already exists, reusing`);
        } else throw e;
      }
      await db.collection("users").doc(uid).set({
        email: c.email, name: c.name, userType: "candidate",
        headline: c.headline, bio: c.bio, location: c.location,
        skills: c.skills, experience: c.experience, education: c.education,
        linkedin: c.linkedin || "", portfolio: c.portfolio || "",
        platform: "worqit", profileComplete: true, createdAt: ts,
      }, { merge: true });
      candidateIds.push(uid);
      console.log(`  ✅ ${c.name} — ${c.headline}`);
    } catch (e) { console.error(`  ❌ ${c.name}:`, e.message); candidateIds.push(null); }
  }

  console.log("\nCreating 10 job postings…");
  const jobDocs = [];
  const jobs = JOBS(hirerIds);
  for (const j of jobs) {
    if (!j.hirerId) { console.log(`  ⚠️  Skipping — hirer not created`); continue; }
    try {
      const ref = await db.collection("jobs").add({ ...j, applicantCount: 0, createdAt: ts });
      jobDocs.push({ id: ref.id, ...j });
      console.log(`  ✅ ${j.title} @ ${j.company}`);
    } catch (e) { console.error(`  ❌ ${j.title}:`, e.message); }
  }

  // Create a few applications
  console.log("\nCreating sample applications…");
  const appPairs = [
    [0, 0], [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 8], [6, 6], [7, 7], [1, 9],
  ];
  for (const [cIdx, jIdx] of appPairs) {
    const cId = candidateIds[cIdx];
    const job = jobDocs[jIdx];
    if (!cId || !job) continue;
    try {
      await db.collection("applications").add({
        jobId: job.id, hirerId: job.hirerId, candidateId: cId,
        status: ["pending","viewed","pending","accepted","pending","viewed","pending","pending","pending","pending"][jIdx] || "pending",
        appliedAt: ts,
      });
    } catch {}
  }
  console.log("  ✅ Sample applications created");

  console.log("\n✅ Seed complete!\n");
  console.log("Hirer login credentials (all passwords: Seed@1234):");
  HIRERS.forEach(h => console.log(`  ${h.email}  →  ${h.companyName}`));
  console.log("\nCandidate login credentials (all passwords: Seed@1234):");
  CANDIDATES.forEach(c => console.log(`  ${c.email}  →  ${c.name}`));
  console.log("\nOpen the app and log in with any of the above to see real data.\n");
  process.exit(0);
}

seed().catch(e => { console.error("\n❌ Seed failed:", e); process.exit(1); });
