async function verifyClinicalSystem() {
    try {
        console.log("=========================================");
        console.log("ArogyaMitra AI Clinical System Validation");
        console.log("=========================================");

        // 1. Patient Login
        console.log("\n[1] Logging in as Patient...");
        const patientLoginRes = await fetch('http://localhost:5000/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                abha_id: 'patient@abha',
                password: 'Demo@1234'
            })
        });
        const patientLoginData = await patientLoginRes.json();
        if (!patientLoginRes.ok) {
            throw new Error(`Patient login failed: ${JSON.stringify(patientLoginData)}`);
        }
        
        const patientToken = patientLoginData.token;
        const patientId = patientLoginData.user?.patient_id || patientLoginData.user?._id;
        console.log("✓ Patient logged in successfully. Token length:", patientToken.length);
        console.log("✓ Patient ID resolved:", patientId);

        // 2. Perform Symptom Check
        console.log("\n[2] Performing AI Symptom Check (Chest Pain, Shortness of Breath)...");
        const symptomCheckRes = await fetch('http://localhost:5000/api/v1/ai-clinical/check-symptoms', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${patientToken}`
            },
            body: JSON.stringify({
                symptoms: ["Chest Pain", "Shortness of Breath"],
                description: "Crushing chest pain radiating to left arm, started 10 minutes ago, sweating heavily.",
                patientId: patientId
            })
        });
        const symptomCheckData = await symptomCheckRes.json();
        if (!symptomCheckRes.ok) {
            throw new Error(`Symptom check failed: ${JSON.stringify(symptomCheckData)}`);
        }
        
        console.log("✓ Symptom Check Status:", symptomCheckRes.status);
        console.log("✓ Triage Level Detected:", symptomCheckData.triage_level);
        console.log("✓ Recommended Department:", symptomCheckData.recommended_department);
        console.log("✓ Potential Conditions matched:", symptomCheckData.potential_conditions?.map(c => `${c.condition || c.condition_name} (${c.probability > 1 ? c.probability : Math.round(c.probability * 100)}%)`).join(', '));
        console.log("✓ Suggested Next Steps:", symptomCheckData.suggested_next_steps?.join(' -> '));

        // 3. Perform Health Score Risk Calculation
        console.log("\n[3] Calculating Chronic Disease Health Risk Index from EMR Vitals...");
        const healthScoreRes = await fetch('http://localhost:5000/api/v1/ai-clinical/calculate-health-score', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${patientToken}`
            },
            body: JSON.stringify({ patientId: patientId })
        });
        const healthScoreData = await healthScoreRes.json();
        if (!healthScoreRes.ok) {
            throw new Error(`Health risk calculation failed: ${JSON.stringify(healthScoreData)}`);
        }
        
        console.log("✓ Health Risk Status:", healthScoreRes.status);
        console.log("✓ Wellness Score:", healthScoreData.wellness_score);
        console.log("✓ Cardiovascular Risk:", healthScoreData.cardiovascular_risk + "%");
        console.log("✓ Diabetes Risk:", healthScoreData.diabetes_risk + "%");
        console.log("✓ Key Factors Identifed:", healthScoreData.factors?.join(', '));
        console.log("✓ Wellness Recommendations:", healthScoreData.recommendations?.join(', '));

        // 4. Admin Login
        console.log("\n[4] Logging in as Admin...");
        const adminLoginRes = await fetch('http://localhost:5000/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@hospital.gov',
                password: 'Demo@1234'
            })
        });
        const adminLoginData = await adminLoginRes.json();
        if (!adminLoginRes.ok) {
            throw new Error(`Admin login failed: ${JSON.stringify(adminLoginData)}`);
        }
        const adminToken = adminLoginData.token;
        console.log("✓ Admin logged in successfully. Token length:", adminToken.length);

        // 5. Get AI Clinical Analytics Stats
        console.log("\n[5] Retrieving Admin AI Telemetry & Triage Stats...");
        const adminStatsRes = await fetch('http://localhost:5000/api/v1/ai-clinical/admin-stats', {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            }
        });
        const adminStatsData = await adminStatsRes.json();
        if (!adminStatsRes.ok) {
            throw new Error(`Admin stats fetch failed: ${JSON.stringify(adminStatsData)}`);
        }

        console.log("✓ Admin Stats Status:", adminStatsRes.status);
        console.log("✓ Average Risk Telemetry:", JSON.stringify(adminStatsData.riskMetrics));
        console.log("✓ Triage Stats Cohorts:", JSON.stringify(adminStatsData.triageStats));
        console.log("✓ Department Referrals:", JSON.stringify(adminStatsData.deptStats));
        console.log("✓ Recent Audit Trail count:", adminStatsData.recentAudits?.length);
        if (adminStatsData.recentAudits?.length > 0) {
            console.log("✓ Sample Audit Trail Log:", JSON.stringify(adminStatsData.recentAudits[0]));
        }

        console.log("\n=========================================");
        console.log("✓ ALL CLINICAL AI INTEGRATION TESTS PASSED!");
        console.log("=========================================");

    } catch (error) {
        console.error("✗ Validation Error:", error.message);
    }
}

verifyClinicalSystem();
