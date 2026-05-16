/**
 * securityCheck.js
 * 
 * Performance an audit of the current environment variables.
 * Designed to detect potentially compromised, missing, or weak secrets.
 */

const auditEnvironment = () => {
    console.log("\n🛡️  [SECURITY AUDIT] Starting Environment Check...");
    
    const criticalKeys = [
        "FIREBASE_ADMIN_SERVICE_ACCOUNT",
        "STRIPE_SECRET_KEY",
        "GROQ_API_KEY",
        "STRIPE_WEBHOOK_SECRET",
        "GOOGLE_CLIENT_SECRET"
    ];

    const results = {
        passed: [],
        warnings: [],
        critical: []
    };

    criticalKeys.forEach(key => {
        const val = process.env[key];
        
        if (!val || val.includes("placeholder") || val.length < 10) {
            results.critical.push(`${key}: MISSING or INVALID`);
        } else if (val.startsWith("sk_test") || val.includes("test")) {
            results.warnings.push(`${key}: Running on TEST/DEVELOPMENT key`);
        } else {
            results.passed.push(key);
        }
    });

    // Special check for Firebase Admin JSON structure
    if (process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT) {
        try {
            const parsed = JSON.parse(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT);
            if (!parsed.project_id || !parsed.private_key) {
                results.critical.push("FIREBASE_ADMIN_SERVICE_ACCOUNT: Malformed JSON");
            }
        } catch (e) {
            results.critical.push("FIREBASE_ADMIN_SERVICE_ACCOUNT: Invalid JSON syntax");
        }
    }

    // Display Results
    console.log(`✅ [Passed]: ${results.passed.length} keys verified.`);
    
    if (results.warnings.length > 0) {
        console.warn(`⚠️  [Warnings]:\n  - ${results.warnings.join("\n  - ")}`);
    }

    if (results.critical.length > 0) {
        console.error(`❌ [CRITICAL ERRORS]:\n  - ${results.critical.join("\n  - ")}`);
        console.log("🛑 Security audit failed. Resolve critical errors to ensure platform safety.");
        return false;
    }

    console.log("✨ Environment security check completed successfully.\n");
    return true;
};

module.exports = { auditEnvironment };
