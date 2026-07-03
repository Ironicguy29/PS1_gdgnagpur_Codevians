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
exports.digitalTwinService = exports.DigitalTwinService = void 0;
const Building_1 = __importDefault(require("../models/Building"));
const Floor_1 = __importDefault(require("../models/Floor"));
const Room_1 = __importDefault(require("../models/Room"));
const LiveAsset_1 = __importDefault(require("../models/LiveAsset"));
const NavigationRoute_1 = __importDefault(require("../models/NavigationRoute"));
const Parking_1 = __importDefault(require("../models/Parking"));
const socket_1 = require("../utils/socket");
class DigitalTwinService {
    /**
     * Get all campus elements (buildings, floors, rooms, parking slots)
     */
    getCampusData() {
        return __awaiter(this, void 0, void 0, function* () {
            const buildings = yield Building_1.default.find({});
            const floors = yield Floor_1.default.find({});
            const rooms = yield Room_1.default.find({});
            const parkingSlots = yield Parking_1.default.find({});
            return { buildings, floors, rooms, parkingSlots };
        });
    }
    /**
     * Get all live assets
     */
    getLiveAssets() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield LiveAsset_1.default.find({});
        });
    }
    /**
     * Get all navigation routes
     */
    getNavigationRoutes() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield NavigationRoute_1.default.find({});
        });
    }
    /**
     * Update asset position and notify clients via WebSockets
     */
    updateAssetTelemetry(assetId, telemetry) {
        return __awaiter(this, void 0, void 0, function* () {
            const asset = yield LiveAsset_1.default.findById(assetId);
            if (!asset) {
                throw new Error('Asset not found');
            }
            asset.latitude = telemetry.latitude;
            asset.longitude = telemetry.longitude;
            if (telemetry.room_id) {
                asset.room_id = telemetry.room_id;
            }
            if (typeof telemetry.battery_level === 'number') {
                asset.battery_level = telemetry.battery_level;
            }
            if (telemetry.status) {
                asset.status = telemetry.status;
            }
            yield asset.save();
            const io = (0, socket_1.getIo)();
            if (io) {
                io.emit('digitaltwin.asset.telemetry', {
                    assetId: asset._id,
                    name: asset.name,
                    type: asset.type,
                    status: asset.status,
                    latitude: asset.latitude,
                    longitude: asset.longitude,
                    battery_level: asset.battery_level,
                    room_id: asset.room_id
                });
            }
            return asset;
        });
    }
    /**
     * Set Emergency Mode on specific navigation route / block paths
     */
    toggleEmergencyRoute(routeId, isEmergency, isBlocked) {
        return __awaiter(this, void 0, void 0, function* () {
            const route = yield NavigationRoute_1.default.findById(routeId);
            if (!route) {
                throw new Error('Route not found');
            }
            route.is_emergency = isEmergency;
            route.is_blocked = isBlocked;
            yield route.save();
            const io = (0, socket_1.getIo)();
            if (io) {
                io.emit('digitaltwin.route.update', route);
            }
            return route;
        });
    }
    /**
     * Run a simulation step to slightly move active assets (for hackathon demo)
     */
    simulateStep() {
        return __awaiter(this, void 0, void 0, function* () {
            const assets = yield LiveAsset_1.default.find({ status: 'Active' });
            const io = (0, socket_1.getIo)();
            for (const asset of assets) {
                // Jitter coordinate by a small random value (e.g. simulating moving around)
                const latOffset = (Math.random() - 0.5) * 0.0001;
                const lngOffset = (Math.random() - 0.5) * 0.0001;
                asset.latitude += latOffset;
                asset.longitude += lngOffset;
                // Reduce battery level slightly
                if (asset.battery_level > 5) {
                    asset.battery_level -= Math.random() > 0.7 ? 1 : 0;
                }
                else {
                    asset.battery_level = 100; // recharge simulation
                }
                yield asset.save();
                if (io) {
                    io.emit('digitaltwin.asset.telemetry', {
                        assetId: asset._id,
                        name: asset.name,
                        type: asset.type,
                        status: asset.status,
                        latitude: asset.latitude,
                        longitude: asset.longitude,
                        battery_level: asset.battery_level,
                        room_id: asset.room_id
                    });
                }
            }
        });
    }
}
exports.DigitalTwinService = DigitalTwinService;
exports.digitalTwinService = new DigitalTwinService();
