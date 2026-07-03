"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluatePrescriptionSafety = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const axios_1 = __importDefault(require("axios"));
const MedicalProfile_1 = __importDefault(require("../models/MedicalProfile"));
const Patient_1 = __importDefault(require("../models/Patient"));
const Medicine_1 = __importDefault(require("../models/Medicine"));
const MedicineInteraction_1 = __importDefault(require("../models/MedicineInteraction"));
const AuditLog_1 = __importDefault(require("../models/AuditLog"));
// Map common brand names to standard generics for external API compatibility
const brandToGenericMap = {
    'dolo': 'acetaminophen',
    'crocin': 'acetaminophen',
    'calpol': 'acetaminophen',
    'combiflam': 'ibuprofen',
    'aspirin': 'aspirin',
    'advil': 'ibuprofen',
    'motrin': 'ibuprofen',
    'claritin': 'loratadine',
    'augmentin': 'amoxicillin',
    'metformin': 'metformin',
    'glynase': 'glyburide',
    'lipitor': 'atorvastatin',
    'zocor': 'simvastatin',
    'norvasc': 'amlodipine',
    'lasix': 'furosemide',
    'prinivil': 'lisinopril',
    'zestril': 'lisinopril',
    'cozaar': 'losartan'
};
// Local lookup for common teratogens (Pregnancy risk Category D/X)
const pregnancyContraindications = [
    'lisinopril', 'losartan', 'enalapril', 'ramipril', 'valsartan',
    'warfarin', 'isotretinoin', 'thalidomide', 'valproic acid', 'valproate',
    'phenytoin', 'carbamazepine', 'methotrexate', 'misoprostol', 'atorvastatin',
    'simvastatin', 'pravastatin', 'rosuvastatin', 'ibuprofen'
];
// Local lookup for pediatric contraindications (Age < 12)
const pediatricContraindications = [
    'aspirin', 'tetracycline', 'doxycycline', 'ciprofloxacin', 'levofloxacin',
    'codeine', 'tramadol'
];
// Local lookup for geriatric risks (Age > 65)
const geriatricContraindications = [
    'diazepam', 'alprazolam', 'lorazepam', 'amitriptyline', 'imipramine',
    'digoxin', 'spironolactone', 'ketorolac', 'indomethacin'
];
// Local lookup for kidney disease contraindications/warnings
const renalContraindications = [
    'metformin', 'ibuprofen', 'naproxen', 'ketorolac', 'spironolactone',
    'gadolinium', 'amphotericin b', 'cisplatin'
];
// Local lookup for liver disease contraindications/warnings
const hepaticContraindications = [
    'acetaminophen', 'paracetamol', 'methotrexate', 'amiodarone', 'valproate',
    'ketoconazole', 'isoniazid'
];
/**
 * Resolves a medicine name to a generic name using DB catalog, brand map, or fallback
 */
const resolveGenericName = (name) => __awaiter(void 0, void 0, void 0, function* () {
    const cleanName = name.trim().toLowerCase();
    // Check local brand map first
    if (brandToGenericMap[cleanName]) {
        return brandToGenericMap[cleanName];
    }
    // Search DB Medicine catalog
    const catalogMed = yield Medicine_1.default.findOne({
        $or: [
            { name: { $regex: new RegExp(`^${cleanName}$`, 'i') } },
            { generic_name: { $regex: new RegExp(`^${cleanName}$`, 'i') } }
        ]
    });
    if (catalogMed && catalogMed.generic_name) {
        return catalogMed.generic_name.toLowerCase();
    }
    return cleanName;
});
/**
 * Resolves a drug name/generic to an RxNorm CUI (RxCUI) using the NIH RxNorm API
 */
const getRxCui = (drugName) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const response = yield axios_1.default.get('https://rxnav.nlm.nih.gov/REST/rxcui.json', {
            params: { name: drugName },
            timeout: 3000
        });
        const rxnormId = (_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.idGroup) === null || _b === void 0 ? void 0 : _b.rxnormId;
        if (rxnormId && rxnormId.length > 0) {
            return rxnormId[0];
        }
        return null;
    }
    catch (error) {
        console.error(`RxNorm lookup failed for ${drugName}:`, error.message);
        return null;
    }
});
/**
 * Fetches interactions among a list of RxCUIs from the RxNorm API
 */
const checkRxNormInteractions = (cuis) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g;
    if (cuis.length < 2)
        return [];
    const warnings = [];
    try {
        const rxCuiQuery = cuis.join('+');
        const response = yield axios_1.default.get('https://rxnav.nlm.nih.gov/REST/interaction/list.json', {
            params: { rxcuis: rxCuiQuery },
            timeout: 5000
        });
        const interactionGroups = (_a = response.data) === null || _a === void 0 ? void 0 : _a.fullInteractionTypeGroup;
        if (interactionGroups) {
            for (const group of interactionGroups) {
                const types = group.fullInteractionType;
                if (types) {
                    for (const type of types) {
                        const description = ((_c = (_b = type.interactionPair) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.description) || 'No description available.';
                        const severityRaw = ((_e = (_d = type.interactionPair) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.severity) || 'high';
                        const severity = severityRaw.toLowerCase() === 'high' ? 'Critical' :
                            severityRaw.toLowerCase() === 'medium' ? 'Warning' : 'Info';
                        const conceptA = ((_f = type.minConcept[0]) === null || _f === void 0 ? void 0 : _f.name) || '';
                        const conceptB = ((_g = type.minConcept[1]) === null || _g === void 0 ? void 0 : _g.name) || '';
                        warnings.push({
                            type: 'Interaction',
                            severity,
                            message: `Drug Interaction detected between ${conceptA} and ${conceptB}.`,
                            detail: description
                        });
                    }
                }
            }
        }
    }
    catch (error) {
        console.error('RxNorm interaction API failed:', error.message);
    }
    return warnings;
});
/**
 * Searches OpenFDA for specific warnings, food, or alcohol warnings for a drug
 */
const getFDAWarnings = (genericName) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const localWarnings = [];
    try {
        // Query OpenFDA API
        const response = yield axios_1.default.get('https://api.fda.gov/drug/label.json', {
            params: {
                search: `openfda.generic_name:"${genericName}"`,
                limit: 1
            },
            timeout: 4000
        });
        const results = (_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.results) === null || _b === void 0 ? void 0 : _b[0];
        if (results) {
            // Food & Alcohol Warning Check
            const fieldsToCheck = [
                results.warnings,
                results.warnings_and_cautions,
                results.drug_interactions,
                results.precautions,
                results.general_precautions
            ].flat().filter(Boolean);
            const joinedText = fieldsToCheck.join(' ').toLowerCase();
            if (joinedText.includes('alcohol') || joinedText.includes('ethanol')) {
                localWarnings.push({
                    type: 'FoodAlcohol',
                    severity: 'Warning',
                    message: `Alcohol Warning for ${genericName}: Do not consume alcohol while taking this medication.`,
                    detail: 'Co-administration with alcohol may increase drowsiness, gastrointestinal irritation, or hepatotoxicity.'
                });
            }
            if (joinedText.includes('grapefruit')) {
                localWarnings.push({
                    type: 'FoodAlcohol',
                    severity: 'Warning',
                    message: `Food Warning for ${genericName}: Avoid grapefruit juice.`,
                    detail: 'Grapefruit juice inhibits CYP3A4 metabolism, significantly increasing drug blood levels and risk of toxicity.'
                });
            }
            if (joinedText.includes('milk') || joinedText.includes('dairy') || joinedText.includes('calcium-rich')) {
                localWarnings.push({
                    type: 'FoodAlcohol',
                    severity: 'Info',
                    message: `Food Warning for ${genericName}: Absorption warning with dairy/calcium.`,
                    detail: 'Do not take this medicine with milk or dairy products as calcium binds to the drug and reduces bioavailability.'
                });
            }
        }
    }
    catch (error) {
        console.warn(`OpenFDA warning fetch failed for ${genericName}:`, error.message);
    }
    return localWarnings;
});
/**
 * Performs full clinical safety evaluation on a list of medicines for a patient
 */
const evaluatePrescriptionSafety = (patientId, medicinesList, doctorId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const warnings = [];
    // Ignore empty inputs
    const validMeds = medicinesList.filter(m => m.name && m.name.trim() !== '');
    if (validMeds.length === 0)
        return [];
    const medNames = validMeds.map(m => m.name.trim());
    const genericNames = yield Promise.all(medNames.map(resolveGenericName));
    // 1. Fetch Patient and Medical Profile
    const patient = yield Patient_1.default.findById(patientId);
    const profile = yield MedicalProfile_1.default.findOne({ patient_id: patientId });
    const age = (patient === null || patient === void 0 ? void 0 : patient.age) || 35;
    const gender = (patient === null || patient === void 0 ? void 0 : patient.gender) || 'Male';
    const isPregnant = gender.toLowerCase() === 'female' &&
        (((_b = (_a = profile === null || profile === void 0 ? void 0 : profile.lifestyle) === null || _a === void 0 ? void 0 : _a.pregnancy_status) === null || _b === void 0 ? void 0 : _b.toLowerCase()) === 'pregnant' ||
            ((_d = (_c = profile === null || profile === void 0 ? void 0 : profile.lifestyle) === null || _c === void 0 ? void 0 : _c.pregnancy_status) === null || _d === void 0 ? void 0 : _d.toLowerCase()) === 'yes');
    const allergies = (profile === null || profile === void 0 ? void 0 : profile.allergies) || [];
    const currentMeds = (profile === null || profile === void 0 ? void 0 : profile.current_medications) || [];
    const diseases = ((profile === null || profile === void 0 ? void 0 : profile.existing_diseases) || []).map(d => d.toLowerCase());
    // 2. Allergy Check
    for (let i = 0; i < validMeds.length; i++) {
        const medName = medNames[i].toLowerCase();
        const genName = genericNames[i].toLowerCase();
        for (const allergy of allergies) {
            const cleanAllergy = allergy.trim().toLowerCase();
            if (medName.includes(cleanAllergy) || genName.includes(cleanAllergy) || cleanAllergy.includes(genName)) {
                warnings.push({
                    type: 'Allergy',
                    severity: 'Critical',
                    message: `Severe Allergy Warning: Patient is allergic to ${allergy}.`,
                    detail: `Prescribed medication ${validMeds[i].name} contains or is class-related to allergen ${allergy}.`
                });
            }
        }
    }
    // 3. Duplicate Drug Check
    const processedGenerics = new Set();
    for (let i = 0; i < validMeds.length; i++) {
        const medName = medNames[i].toLowerCase();
        const genName = genericNames[i].toLowerCase();
        // Check duplicate within the new list
        if (processedGenerics.has(genName)) {
            warnings.push({
                type: 'Duplicate',
                severity: 'Warning',
                message: `Duplicate Drug Alert: ${validMeds[i].name} has duplicate therapy in this prescription.`,
                detail: `Multiple medicines share the same active ingredient: ${genName}.`
            });
        }
        processedGenerics.add(genName);
        // Check against current active medications
        for (const currentMed of currentMeds) {
            const cleanCurrent = currentMed.trim().toLowerCase();
            const currentGen = yield resolveGenericName(cleanCurrent);
            if (medName === cleanCurrent || genName === currentGen) {
                warnings.push({
                    type: 'Duplicate',
                    severity: 'Warning',
                    message: `Therapeutic Duplicate: ${validMeds[i].name} is already in patient's active medications.`,
                    detail: `Active medication list contains ${currentMed} (${currentGen}).`
                });
            }
        }
    }
    // 4. Pregnancy Contraindications
    if (isPregnant) {
        for (let i = 0; i < validMeds.length; i++) {
            const genName = genericNames[i].toLowerCase();
            if (pregnancyContraindications.includes(genName)) {
                warnings.push({
                    type: 'Pregnancy',
                    severity: 'Critical',
                    message: `Pregnancy Contraindication: Avoid ${validMeds[i].name} in pregnant patients.`,
                    detail: `${genName} belongs to high-risk FDA Category D/X pregnancy teratogens. High risk of fetal malformation.`
                });
            }
        }
    }
    // 5. Age-Specific Contraindications
    if (age < 12) {
        for (let i = 0; i < validMeds.length; i++) {
            const genName = genericNames[i].toLowerCase();
            if (pediatricContraindications.includes(genName)) {
                warnings.push({
                    type: 'Age',
                    severity: 'Critical',
                    message: `Pediatric Contraindication: ${validMeds[i].name} is not recommended for children under 12.`,
                    detail: `${genName} poses risk of severe adverse events in children (e.g., Reye's syndrome with aspirin, enamel discoloration with tetracycline).`
                });
            }
        }
    }
    else if (age > 65) {
        for (let i = 0; i < validMeds.length; i++) {
            const genName = genericNames[i].toLowerCase();
            if (geriatricContraindications.includes(genName)) {
                warnings.push({
                    type: 'Age',
                    severity: 'Warning',
                    message: `Geriatric Precaution: Use ${validMeds[i].name} with caution in elderly patient (>65 yrs).`,
                    detail: `${genName} is flagged under Beers Criteria for potentially inappropriate medication use in older adults due to risk of falls, cognitive decline, or clearance delay.`
                });
            }
        }
    }
    // 6. Kidney & Liver Disease Warnings
    const hasRenalDisease = diseases.some(d => d.includes('renal') || d.includes('kidney') || d.includes('nephro') || d.includes('ckd'));
    const hasHepaticDisease = diseases.some(d => d.includes('hepatic') || d.includes('liver') || d.includes('hepatitis') || d.includes('cirrhosis'));
    if (hasRenalDisease) {
        for (let i = 0; i < validMeds.length; i++) {
            const genName = genericNames[i].toLowerCase();
            if (renalContraindications.includes(genName)) {
                warnings.push({
                    type: 'KidneyLiver',
                    severity: 'Critical',
                    message: `Renal Impairment Warning: Avoid or adjust ${validMeds[i].name} dose.`,
                    detail: `Patient profile shows chronic kidney disease. ${genName} can cause nephrotoxicity or drug accumulation due to impaired renal clearance.`
                });
            }
        }
    }
    if (hasHepaticDisease) {
        for (let i = 0; i < validMeds.length; i++) {
            const genName = genericNames[i].toLowerCase();
            if (hepaticContraindications.includes(genName)) {
                warnings.push({
                    type: 'KidneyLiver',
                    severity: 'Warning',
                    message: `Hepatic Impairment Alert: Monitor liver function or avoid ${validMeds[i].name}.`,
                    detail: `Patient has liver disease history. ${genName} is hepatotoxic or heavily metabolized by cytochrome systems.`
                });
            }
        }
    }
    // 7. Maximum Dose Checks (e.g. Paracetamol/Acetaminophen dose checking)
    for (let i = 0; i < validMeds.length; i++) {
        const medName = medNames[i].toLowerCase();
        const genName = genericNames[i].toLowerCase();
        const strengthStr = (validMeds[i].strength || '').toLowerCase();
        if (genName === 'paracetamol' || genName === 'acetaminophen') {
            // Check strength (e.g. 1000mg)
            const numericStrength = parseInt(strengthStr.replace(/[^0-9]/g, ''));
            if (numericStrength > 1000) {
                warnings.push({
                    type: 'DoseLimit',
                    severity: 'Critical',
                    message: `Maximum Dose Exceeded: Paracetamol single dose should not exceed 1000mg.`,
                    detail: 'High dose Acetaminophen increases risk of acute liver failure.'
                });
            }
        }
    }
    // 8. Drug-Drug Interactions (NIH RxNorm API & Local DB cache fallback)
    const cuis = [];
    const resolvedNamesMap = {}; // rxCui -> medName
    for (let i = 0; i < validMeds.length; i++) {
        const genName = genericNames[i];
        const cui = yield getRxCui(genName);
        if (cui) {
            cuis.push(cui);
            resolvedNamesMap[cui] = validMeds[i].name;
        }
    }
    // Check NIH RxNorm API
    const rxNormWarnings = yield checkRxNormInteractions(cuis);
    warnings.push(...rxNormWarnings);
    // Fallback/Supplement with Local DB Cached Interactions
    if (validMeds.length >= 2) {
        for (let i = 0; i < validMeds.length; i++) {
            for (let j = i + 1; j < validMeds.length; j++) {
                const medA = medNames[i];
                const medB = medNames[j];
                const genA = genericNames[i];
                const genB = genericNames[j];
                const match = yield MedicineInteraction_1.default.findOne({
                    $or: [
                        { medicine_a: { $regex: new RegExp(`^${medA}$`, 'i') }, medicine_b: { $regex: new RegExp(`^${medB}$`, 'i') } },
                        { medicine_a: { $regex: new RegExp(`^${medB}$`, 'i') }, medicine_b: { $regex: new RegExp(`^${medA}$`, 'i') } },
                        { medicine_a: { $regex: new RegExp(`^${genA}$`, 'i') }, medicine_b: { $regex: new RegExp(`^${genB}$`, 'i') } },
                        { medicine_a: { $regex: new RegExp(`^${genB}$`, 'i') }, medicine_b: { $regex: new RegExp(`^${genA}$`, 'i') } }
                    ]
                });
                if (match) {
                    // Check if duplicate alert exists
                    const exists = warnings.some(w => w.type === 'Interaction' &&
                        (w.message.includes(medA) && w.message.includes(medB)));
                    if (!exists) {
                        warnings.push({
                            type: 'Interaction',
                            severity: match.severity === 'High' ? 'Critical' : match.severity === 'Medium' ? 'Warning' : 'Info',
                            message: `Drug Interaction: ${medA} and ${medB} can interact.`,
                            detail: match.description
                        });
                    }
                }
            }
        }
    }
    // 9. Food & Alcohol Warnings (OpenFDA API)
    for (const genName of genericNames) {
        const fdaWarnings = yield getFDAWarnings(genName);
        for (const fdaW of fdaWarnings) {
            const exists = warnings.some(w => w.type === fdaW.type && w.message === fdaW.message);
            if (!exists && fdaW.type && fdaW.severity && fdaW.message) {
                warnings.push({
                    type: fdaW.type,
                    severity: fdaW.severity,
                    message: fdaW.message,
                    detail: fdaW.detail
                });
            }
        }
        // Local fallback food/alcohol warnings
        const cleanGen = genName.toLowerCase();
        if (cleanGen === 'metronidazole') {
            warnings.push({
                type: 'FoodAlcohol',
                severity: 'Critical',
                message: `Alcohol Warning for Metronidazole: Severe disulfiram-like reaction.`,
                detail: 'Combining Metronidazole and alcohol causes severe nausea, vomiting, flushing, tachycardia, and headache.'
            });
        }
    }
    // 10. Audit Logging
    if (warnings.length > 0) {
        try {
            yield AuditLog_1.default.create({
                user_id: new mongoose_1.default.Types.ObjectId(doctorId),
                user_type: 'Doctor',
                action: 'PRESCRIPTION_SAFETY_CHECK',
                patient_id: new mongoose_1.default.Types.ObjectId(patientId),
                details: `Prescription safety evaluation completed with ${warnings.length} warnings: ${warnings.map(w => `[${w.type}: ${w.severity}] ${w.message}`).join(', ')}`
            });
        }
        catch (auditErr) {
            console.error('Failed to write safety check audit log:', auditErr);
        }
    }
    return warnings;
});
exports.evaluatePrescriptionSafety = evaluatePrescriptionSafety;
