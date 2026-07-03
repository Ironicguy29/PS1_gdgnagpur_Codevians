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
exports.generatePolicyReport = exports.getPolicyEvaluation = exports.coordinateResponseTeam = exports.getOutbreakTracking = exports.updateResourceInventory = exports.getResourceMapping = exports.flagRegistry = exports.getRegistryVerification = void 0;
const Registry_1 = __importDefault(require("../models/Registry"));
const ResourceInventory_1 = __importDefault(require("../models/ResourceInventory"));
const DiagnosticLog_1 = __importDefault(require("../models/DiagnosticLog"));
const PolicyMetrics_1 = __importDefault(require("../models/PolicyMetrics"));
const socket_1 = require("../utils/socket");
// Registry verification functions
const getRegistryVerification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { entity_type, state, status } = req.query;
        const stateAdmin = req.user;
        const query = {};
        if (entity_type)
            query.entity_type = entity_type;
        if (state)
            query.state = state;
        if (status)
            query.accreditation_status = status;
        const registries = yield Registry_1.default.find(query).lean();
        const summary = {
            total: registries.length,
            active: registries.filter((r) => r.accreditation_status === 'active').length,
            expired: registries.filter((r) => r.accreditation_status === 'expired').length,
            suspended: registries.filter((r) => r.accreditation_status === 'suspended').length,
            cancelled: registries.filter((r) => r.accreditation_status === 'cancelled').length,
            flagged: registries.filter((r) => r.flags.flagged).length,
            avg_compliance_score: Math.round(registries.reduce((sum, r) => sum + r.compliance_score, 0) / (registries.length || 1))
        };
        // Separate by entity type
        const hospitals = registries.filter((r) => r.entity_type === 'hospital');
        const doctors = registries.filter((r) => r.entity_type === 'doctor');
        res.json({
            success: true,
            summary,
            by_type: {
                hospitals: hospitals.length,
                doctors: doctors.length
            },
            registries: registries.slice(0, 50),
            timestamp: new Date()
        });
    }
    catch (error) {
        console.error('Registry verification error:', error);
        res.status(500).json({ success: false, message: 'Error fetching registry data' });
    }
});
exports.getRegistryVerification = getRegistryVerification;
const flagRegistry = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { registryId, reason, severity } = req.body;
        const registry = yield Registry_1.default.findByIdAndUpdate(registryId, {
            'flags.flagged': true,
            'flags.flag_reason': reason,
            'flags.severity': severity,
            'flags.flag_date': new Date()
        }, { new: true });
        // Broadcast flag update
        (0, socket_1.emitQueueUpdate)('state.registry.flagged', {
            registryId,
            entity_type: registry === null || registry === void 0 ? void 0 : registry.entity_type,
            severity,
            timestamp: new Date()
        });
        res.json({
            success: true,
            message: 'Registry flagged successfully',
            registry
        });
    }
    catch (error) {
        console.error('Flag registry error:', error);
        res.status(500).json({ success: false, message: 'Error flagging registry' });
    }
});
exports.flagRegistry = flagRegistry;
// Resource mapping functions
const getResourceMapping = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { state, district } = req.query;
        const stateAdmin = req.user;
        const query = {};
        if (state)
            query.state = state;
        if (district)
            query.district = district;
        const inventories = yield ResourceInventory_1.default.find(query).lean();
        // Analyze resource distribution
        const analysis = {
            total_hospitals: inventories.length,
            oxygen_capacity: inventories.reduce((sum, i) => sum + i.resources.oxygen_plants.total_capacity, 0),
            total_ventilators: inventories.reduce((sum, i) => sum + i.resources.ventilators.count, 0),
            operational_ventilators: inventories.reduce((sum, i) => sum + i.resources.ventilators.operational, 0),
            total_specialists: 0,
            specialists_by_type: {
                cardiologists: 0,
                pulmonologists: 0,
                neurologists: 0,
                intensivists: 0
            },
            shortage_alerts: inventories.flatMap((i) => i.shortage_alerts || []).length,
            critical_alerts: 0
        };
        inventories.forEach((inv) => {
            analysis.total_specialists += Object.values(inv.resources.specialist_staff).reduce((a, b) => a + b, 0);
            analysis.specialists_by_type.cardiologists += inv.resources.specialist_staff.cardiologists;
            analysis.specialists_by_type.pulmonologists += inv.resources.specialist_staff.pulmonologists;
            analysis.specialists_by_type.neurologists += inv.resources.specialist_staff.neurologists;
            analysis.specialists_by_type.intensivists += inv.resources.specialist_staff.intensivists;
            const criticalAlerts = (inv.shortage_alerts || []).filter((a) => a.alert_level === 'critical').length;
            analysis.critical_alerts += criticalAlerts;
        });
        // Identify shortage areas
        const shortages = inventories
            .filter((i) => i.shortage_alerts && i.shortage_alerts.length > 0)
            .slice(0, 20);
        res.json({
            success: true,
            analysis,
            shortage_hospitals: shortages,
            timestamp: new Date()
        });
    }
    catch (error) {
        console.error('Resource mapping error:', error);
        res.status(500).json({ success: false, message: 'Error fetching resource data' });
    }
});
exports.getResourceMapping = getResourceMapping;
const updateResourceInventory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { hospitalId, resources } = req.body;
        const inventory = yield ResourceInventory_1.default.findOneAndUpdate({ hospital_id: hospitalId }, { resources, last_updated: new Date() }, { new: true });
        // Check for new shortages
        const newShortages = [];
        if (resources.oxygen_plants.utilization_rate > 80) {
            newShortages.push({
                resource_type: 'oxygen',
                alert_level: 'high',
                message: 'Oxygen utilization above 80%'
            });
        }
        if (resources.ventilators.operational < resources.ventilators.count * 0.5) {
            newShortages.push({
                resource_type: 'ventilators',
                alert_level: 'critical',
                message: 'Less than 50% ventilators operational'
            });
        }
        res.json({
            success: true,
            message: 'Resource inventory updated',
            new_alerts: newShortages,
            inventory
        });
    }
    catch (error) {
        console.error('Update resource error:', error);
        res.status(500).json({ success: false, message: 'Error updating resource inventory' });
    }
});
exports.updateResourceInventory = updateResourceInventory;
// Outbreak tracking functions
const getOutbreakTracking = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { state, days = 30 } = req.query;
        const stateAdmin = req.user;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));
        const query = { date: { $gte: startDate } };
        if (state)
            query.state = state;
        const diagnostics = yield DiagnosticLog_1.default.find(query).lean();
        // Analyze trends
        const diseaseStats = new Map();
        const anomalies = diagnostics.filter((d) => d.is_anomaly);
        diagnostics.forEach((diag) => {
            const key = diag.disease_name;
            if (!diseaseStats.has(key)) {
                diseaseStats.set(key, {
                    disease: key,
                    total_cases: 0,
                    severe_cases: 0,
                    deaths: 0,
                    hospitalized: 0,
                    anomaly_count: 0
                });
            }
            const stats = diseaseStats.get(key);
            stats.total_cases += diag.patient_count;
            if (diag.severity === 'severe' || diag.severity === 'critical') {
                stats.severe_cases += diag.patient_count;
            }
            if (diag.outcome === 'deceased')
                stats.deaths += 1;
            if (diag.outcome === 'hospitalized')
                stats.hospitalized += diag.patient_count;
            if (diag.is_anomaly)
                stats.anomaly_count += 1;
        });
        const summary = {
            total_cases: diagnostics.reduce((sum, d) => sum + d.patient_count, 0),
            total_anomalies: anomalies.length,
            anomaly_percentage: Math.round((anomalies.length / (diagnostics.length || 1)) * 100),
            critical_alerts: anomalies.filter((a) => a.severity === 'critical').length,
            diseases_monitored: diseaseStats.size
        };
        res.json({
            success: true,
            summary,
            disease_stats: Array.from(diseaseStats.values()).sort((a, b) => b.total_cases - a.total_cases),
            recent_anomalies: anomalies.slice(0, 20),
            timestamp: new Date()
        });
    }
    catch (error) {
        console.error('Outbreak tracking error:', error);
        res.status(500).json({ success: false, message: 'Error fetching outbreak data' });
    }
});
exports.getOutbreakTracking = getOutbreakTracking;
const coordinateResponseTeam = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { anomalyIds, response_type, assigned_team } = req.body;
        // Update diagnostic logs with response status
        yield DiagnosticLog_1.default.updateMany({ _id: { $in: anomalyIds } }, { response_status: 'response_initiated' });
        // Broadcast response coordination
        (0, socket_1.emitQueueUpdate)('state.outbreak.response', {
            anomalyCount: anomalyIds.length,
            responseType: response_type,
            assignedTeam: assigned_team,
            timestamp: new Date()
        });
        res.json({
            success: true,
            message: 'Response team coordination initiated',
            updated_count: anomalyIds.length
        });
    }
    catch (error) {
        console.error('Coordinate response error:', error);
        res.status(500).json({ success: false, message: 'Error coordinating response' });
    }
});
exports.coordinateResponseTeam = coordinateResponseTeam;
// Policy evaluation functions
const getPolicyEvaluation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { state, month } = req.query;
        const stateAdmin = req.user;
        const query = {};
        if (state)
            query.state = state;
        if (month) {
            const date = new Date(month);
            query.month = {
                $gte: new Date(date.getFullYear(), date.getMonth(), 1),
                $lt: new Date(date.getFullYear(), date.getMonth() + 1, 1)
            };
        }
        const metrics = yield PolicyMetrics_1.default.find(query).lean();
        // Calculate aggregate metrics
        const aggregates = {
            avg_wait_time: Math.round(metrics.reduce((sum, m) => sum + m.kpi_metrics.avg_wait_time_minutes, 0) / (metrics.length || 1)),
            avg_satisfaction: Math.round(metrics.reduce((sum, m) => sum + m.kpi_metrics.patient_satisfaction_score, 0) / (metrics.length || 1)),
            avg_discharge_rate: Math.round(metrics.reduce((sum, m) => sum + m.kpi_metrics.discharge_rate_percentage, 0) / (metrics.length || 1)),
            avg_mortality_rate: Math.round(metrics.reduce((sum, m) => sum + m.kpi_metrics.mortality_rate_percentage, 0) / (metrics.length || 1)),
            avg_compliance: Math.round(metrics.reduce((sum, m) => sum + m.policy_compliance.ab_pmjay_compliance, 0) / (metrics.length || 1))
        };
        // Hospital rankings
        const rankings = metrics
            .sort((a, b) => { var _a, _b; return (((_a = b.comparative_metrics) === null || _a === void 0 ? void 0 : _a.percentile_rank) || 0) - (((_b = a.comparative_metrics) === null || _b === void 0 ? void 0 : _b.percentile_rank) || 0); })
            .slice(0, 20);
        // Identify issues
        const allIssues = metrics.flatMap((m) => m.flagged_issues || []);
        res.json({
            success: true,
            aggregates,
            hospital_count: metrics.length,
            rankings,
            flagged_issues: allIssues.slice(0, 15),
            timestamp: new Date()
        });
    }
    catch (error) {
        console.error('Policy evaluation error:', error);
        res.status(500).json({ success: false, message: 'Error fetching policy metrics' });
    }
});
exports.getPolicyEvaluation = getPolicyEvaluation;
const generatePolicyReport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { state, start_month, end_month } = req.body;
        const query = { state };
        if (start_month && end_month) {
            query.month = {
                $gte: new Date(start_month),
                $lte: new Date(end_month)
            };
        }
        const metrics = yield PolicyMetrics_1.default.find(query).lean();
        // Generate trend analysis
        const report = {
            state,
            period: `${start_month} to ${end_month}`,
            hospitals_analyzed: metrics.length,
            key_findings: {
                best_performers: metrics
                    .filter((m) => m.comparative_metrics.percentile_rank >= 80)
                    .map((m) => ({ hospital: m.hospital_name, rank: m.comparative_metrics.percentile_rank }))
                    .slice(0, 5),
                areas_of_concern: metrics
                    .filter((m) => { var _a; return ((_a = m.flagged_issues) === null || _a === void 0 ? void 0 : _a.length) > 0; })
                    .map((m) => ({ hospital: m.hospital_name, issue_count: m.flagged_issues.length }))
                    .slice(0, 5),
                improvement_metrics: {
                    avg_wait_time_improvement: 'N/A',
                    satisfaction_improvement: 'N/A',
                    safety_improvement: 'N/A'
                }
            },
            recommendations: [
                'Implement queue optimization in high wait-time facilities',
                'Increase specialist staffing in underserved districts',
                'Strengthen AB-PMJAY compliance audits',
                'Improve infection control protocols across network'
            ]
        };
        res.json({
            success: true,
            report,
            timestamp: new Date()
        });
    }
    catch (error) {
        console.error('Generate report error:', error);
        res.status(500).json({ success: false, message: 'Error generating policy report' });
    }
});
exports.generatePolicyReport = generatePolicyReport;
