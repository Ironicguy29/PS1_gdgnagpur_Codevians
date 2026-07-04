import mongoose, { Schema, Document } from 'mongoose';

export interface IInventory extends Document {
    medicine_id: mongoose.Types.ObjectId;
    current_stock: number;
    reserved_stock: number;
    available_stock: number;
    min_stock: number;
    max_stock: number;
    low_stock_alert: boolean;
}

const InventorySchema: Schema = new Schema({
    medicine_id: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true, unique: true },
    current_stock: { type: Number, default: 0, min: 0 },
    reserved_stock: { type: Number, default: 0, min: 0 },
    available_stock: { type: Number, default: 0 },
    min_stock: { type: Number, default: 20 },
    max_stock: { type: Number, default: 500 },
    low_stock_alert: { type: Boolean, default: false }
}, { timestamps: true });

// Pre-save hook to calculate available_stock and set low_stock_alert flag
InventorySchema.pre('save', function (this: any, next: any) {
    this.available_stock = this.current_stock - this.reserved_stock;
    this.low_stock_alert = this.available_stock <= this.min_stock;
    next();
});

export default mongoose.model<IInventory>('Inventory', InventorySchema);

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
