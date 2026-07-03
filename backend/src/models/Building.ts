import mongoose, { Schema, Document } from 'mongoose';

export interface IBuilding extends Document {
    name: string;
    code: string;
    latitude: number;
    longitude: number;
    polygon_coordinates: number[][]; // [lat, lng][] footprint for map boundary
    floors_count: number;
    description?: string;
}

const BuildingSchema: Schema = new Schema({
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    polygon_coordinates: { type: [[Number]], required: true },
    floors_count: { type: Number, required: true, default: 1 },
    description: { type: String }
}, { timestamps: true });

export default mongoose.model<IBuilding>('Building', BuildingSchema);
