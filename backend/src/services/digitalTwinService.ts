import Building from '../models/Building';
import Floor from '../models/Floor';
import Room from '../models/Room';
import LiveAsset from '../models/LiveAsset';
import Occupancy from '../models/Occupancy';
import NavigationRoute from '../models/NavigationRoute';
import Parking from '../models/Parking';
import { getIo } from '../utils/socket';

export class DigitalTwinService {
    /**
     * Get all campus elements (buildings, floors, rooms, parking slots)
     */
    async getCampusData() {
        const buildings = await Building.find({});
        const floors = await Floor.find({});
        const rooms = await Room.find({});
        const parkingSlots = await Parking.find({});
        return { buildings, floors, rooms, parkingSlots };
    }

    /**
     * Get all live assets
     */
    async getLiveAssets() {
        return await LiveAsset.find({});
    }

    /**
     * Get all navigation routes
     */
    async getNavigationRoutes() {
        return await NavigationRoute.find({});
    }

    /**
     * Update asset position and notify clients via WebSockets
     */
    async updateAssetTelemetry(assetId: string, telemetry: { latitude: number; longitude: number; room_id?: string; battery_level?: number; status?: 'Active' | 'Maintenance' | 'Idle' }) {
        const asset = await LiveAsset.findById(assetId);
        if (!asset) {
            throw new Error('Asset not found');
        }

        asset.latitude = telemetry.latitude;
        asset.longitude = telemetry.longitude;
        if (telemetry.room_id) {
            asset.room_id = telemetry.room_id as any;
        }
        if (typeof telemetry.battery_level === 'number') {
            asset.battery_level = telemetry.battery_level;
        }
        if (telemetry.status) {
            asset.status = telemetry.status;
        }

        await asset.save();

        const io = getIo();
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
    }

    /**
     * Set Emergency Mode on specific navigation route / block paths
     */
    async toggleEmergencyRoute(routeId: string, isEmergency: boolean, isBlocked: boolean) {
        const route = await NavigationRoute.findById(routeId);
        if (!route) {
            throw new Error('Route not found');
        }

        route.is_emergency = isEmergency;
        route.is_blocked = isBlocked;
        await route.save();

        const io = getIo();
        if (io) {
            io.emit('digitaltwin.route.update', route);
        }

        return route;
    }

    /**
     * Run a simulation step to slightly move active assets (for hackathon demo)
     */
    async simulateStep() {
        const assets = await LiveAsset.find({ status: 'Active' });
        const io = getIo();

        for (const asset of assets) {
            // Jitter coordinate by a small random value (e.g. simulating moving around)
            const latOffset = (Math.random() - 0.5) * 0.0001;
            const lngOffset = (Math.random() - 0.5) * 0.0001;
            asset.latitude += latOffset;
            asset.longitude += lngOffset;

            // Reduce battery level slightly
            if (asset.battery_level > 5) {
                asset.battery_level -= Math.random() > 0.7 ? 1 : 0;
            } else {
                asset.battery_level = 100; // recharge simulation
            }

            await asset.save();

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
    }
}

export const digitalTwinService = new DigitalTwinService();
