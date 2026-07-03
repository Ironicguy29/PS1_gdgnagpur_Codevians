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
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggerSimulation = exports.toggleEmergency = exports.updateTelemetry = exports.getRoutes = exports.getAssets = exports.getCampus = void 0;
const digitalTwinService_1 = require("../services/digitalTwinService");
const getCampus = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield digitalTwinService_1.digitalTwinService.getCampusData();
        res.status(200).json(Object.assign({ success: true }, data));
    }
    catch (error) {
        next(error);
    }
});
exports.getCampus = getCampus;
const getAssets = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const assets = yield digitalTwinService_1.digitalTwinService.getLiveAssets();
        res.status(200).json({ success: true, assets });
    }
    catch (error) {
        next(error);
    }
});
exports.getAssets = getAssets;
const getRoutes = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const routes = yield digitalTwinService_1.digitalTwinService.getNavigationRoutes();
        res.status(200).json({ success: true, routes });
    }
    catch (error) {
        next(error);
    }
});
exports.getRoutes = getRoutes;
const updateTelemetry = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { assetId } = req.params;
        const asset = yield digitalTwinService_1.digitalTwinService.updateAssetTelemetry(assetId, req.body);
        res.status(200).json({ success: true, asset });
    }
    catch (error) {
        next(error);
    }
});
exports.updateTelemetry = updateTelemetry;
const toggleEmergency = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { routeId } = req.params;
        const { isEmergency, isBlocked } = req.body;
        const route = yield digitalTwinService_1.digitalTwinService.toggleEmergencyRoute(routeId, isEmergency, isBlocked);
        res.status(200).json({ success: true, route });
    }
    catch (error) {
        next(error);
    }
});
exports.toggleEmergency = toggleEmergency;
// Simulation trigger (handy for testing or starting intervals from admin desk)
const triggerSimulation = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield digitalTwinService_1.digitalTwinService.simulateStep();
        res.status(200).json({ success: true, message: 'Simulation step complete' });
    }
    catch (error) {
        next(error);
    }
});
exports.triggerSimulation = triggerSimulation;
