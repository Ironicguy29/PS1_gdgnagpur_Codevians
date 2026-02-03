import mongoose, { Schema, Document } from 'mongoose';

export interface IDepartment extends Document {
    name: string;
    code: string;
    floor: string;
    is_active: boolean;
}

const DepartmentSchema: Schema = new Schema({
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    floor: { type: String, required: true },
    is_active: { type: Boolean, default: true }
});

export default mongoose.model<IDepartment>('Department', DepartmentSchema);
