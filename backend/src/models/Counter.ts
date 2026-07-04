import mongoose, { Schema, Document } from 'mongoose';

export interface ICounter extends Document {
    name: string;
    seq: number;
}

const CounterSchema: Schema = new Schema({
    name: { type: String, required: true, unique: true },
    seq: { type: Number, default: 0 }
});

export default mongoose.model<ICounter>('Counter', CounterSchema);

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
