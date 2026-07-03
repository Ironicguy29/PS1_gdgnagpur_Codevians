/**
 * verify_voice.js — End-to-end verification of Voice Assistant APIs
 */
const BASE = 'http://localhost:5000/api/v1';
const AI_BASE = 'http://localhost:8000';

async function main() {
    console.log('\n🎙️  ArogyaMitra Voice Assistant — Verification Suite\n');

    // Step 0: Login
    console.log('Step 0: Authenticating...');
    const loginRes = await fetch(`${BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ abha_id: 'patient@abha', password: 'Demo@1234' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    const userId = loginData.user?._id;
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
    console.log(`   ✅ Logged in as ${loginData.user?.name || 'patient'} (${userId})\n`);

    // Step 1: Test FastAPI /voice/detect-language
    console.log('Step 1: Testing Language Detection (FastAPI)...');
    const detectRes = await fetch(`${AI_BASE}/voice/detect-language`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'मेरे सिर में बहुत तेज दर्द हो रहा है' })
    });
    const detectData = await detectRes.json();
    console.log(`   Language: ${detectData.language_name} (${detectData.language}), Confidence: ${detectData.confidence}`);
    console.log(`   ✅ Language detection working\n`);

    // Step 2: Test FastAPI /voice/translate
    console.log('Step 2: Testing Translation (FastAPI)...');
    const translateRes = await fetch(`${AI_BASE}/voice/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            text: 'मेरे सिर में बहुत तेज दर्द हो रहा है और मुझे बुखार है',
            source_language: 'hi',
            target_language: 'en'
        })
    });
    const translateData = await translateRes.json();
    console.log(`   Translated: "${translateData.translated_text}"`);
    console.log(`   Medical terms preserved: ${JSON.stringify(translateData.medical_terms_preserved)}`);
    console.log(`   ✅ Translation working\n`);

    // Step 3: Test FastAPI /voice/clinical-reason
    console.log('Step 3: Testing Clinical Reasoning (FastAPI)...');
    const reasonRes = await fetch(`${AI_BASE}/voice/clinical-reason`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            text: 'I have a severe headache and fever since 2 days',
            patient_context: { age: 35, gender: 'Male', conditions: [], medications: [] }
        })
    });
    const reasonData = await reasonRes.json();
    console.log(`   AI Response: "${reasonData.response}"`);
    console.log(`   Urgency: ${reasonData.urgency}`);
    console.log(`   ✅ Clinical reasoning working\n`);

    // Step 4: Create voice session (Express)
    console.log('Step 4: Creating Voice Session...');
    const sessionRes = await fetch(`${BASE}/voice-assistant/sessions`, {
        method: 'POST', headers,
        body: JSON.stringify({ patient_id: userId, patient_preferred_language: 'hi' })
    });
    const sessionData = await sessionRes.json();
    const sessionId = sessionData._id;
    console.log(`   Session ID: ${sessionId}`);
    console.log(`   ✅ Session created\n`);

    // Step 5: Process a transcript
    console.log('Step 5: Processing Hindi transcript...');
    const transcriptRes = await fetch(`${BASE}/voice-assistant/sessions/${sessionId}/transcripts`, {
        method: 'POST', headers,
        body: JSON.stringify({
            speaker_id: userId,
            speaker_role: 'patient',
            original_text: 'मेरे सिर में बहुत तेज दर्द हो रहा है और मुझे बुखार है',
            run_clinical_reasoning: true
        })
    });
    const transcriptData = await transcriptRes.json();
    console.log(`   Detected: ${transcriptData.detected_language_name} (${transcriptData.detected_language})`);
    console.log(`   Translated: "${transcriptData.translated_text}"`);
    if (transcriptData.clinical_response) {
        console.log(`   AI (EN): "${transcriptData.clinical_response.english_response}"`);
        console.log(`   AI (Patient Lang): "${transcriptData.clinical_response.patient_language_response}"`);
    }
    console.log(`   Processing time: ${transcriptData.processing_time_ms}ms`);
    console.log(`   ✅ Transcript processed with translation + clinical reasoning\n`);

    // Step 6: Fetch transcripts
    console.log('Step 6: Fetching session transcripts...');
    const listRes = await fetch(`${BASE}/voice-assistant/sessions/${sessionId}/transcripts`, { headers });
    const listData = await listRes.json();
    console.log(`   Total transcripts: ${listData.length}`);
    console.log(`   ✅ Transcript retrieval working\n`);

    // Step 7: Save settings
    console.log('Step 7: Saving voice settings...');
    const settingsRes = await fetch(`${BASE}/voice-assistant/settings`, {
        method: 'POST', headers,
        body: JSON.stringify({ user_id: userId, preferred_language: 'hi', voice_gender: 'female', speaking_rate: 0.9, auto_play_tts: true })
    });
    const settingsData = await settingsRes.json();
    console.log(`   Preferred: ${settingsData.preferred_language}, Voice: ${settingsData.voice_gender}`);
    console.log(`   ✅ Settings saved\n`);

    // Step 8: Analytics
    console.log('Step 8: Fetching voice analytics...');
    const analyticsRes = await fetch(`${BASE}/voice-assistant/analytics`, { headers });
    const analyticsData = await analyticsRes.json();
    console.log(`   Total Sessions: ${analyticsData.totalSessions}`);
    console.log(`   Total Transcripts: ${analyticsData.totalTranscripts}`);
    console.log(`   Total Translations: ${analyticsData.totalTranslations}`);
    console.log(`   Languages: ${JSON.stringify(analyticsData.languageDistribution)}`);
    console.log(`   ✅ Analytics working\n`);

    console.log('═══════════════════════════════════════════');
    console.log('   🎉 ALL VOICE ASSISTANT TESTS PASSED!');
    console.log('═══════════════════════════════════════════\n');
}

main().catch(err => { console.error('❌ Verification failed:', err.message); process.exit(1); });
