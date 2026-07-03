import mongoose, { Schema, Document } from 'mongoose';

export interface IPurchaseOrderItem {
    medicine_name: string;
    quantity: number;
    unit_cost: number;
}

export interface IPurchaseOrder extends Document {
    supplier_id: mongoose.Types.ObjectId;
    order_date: Date;
    delivery_date?: Date;
    items: IPurchaseOrderItem[];
    total_cost: number;
    status: 'Ordered' | 'Delivered' | 'Cancelled';
    payment_status: 'Unpaid' | 'Paid';
}

const PurchaseOrderSchema: Schema = new Schema({
    supplier_id: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
    order_date: { type: Date, default: Date.now },
    delivery_date: { type: Date },
    items: [{
        medicine_name: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        unit_cost: { type: Number, required: true }
    }],
    total_cost: { type: Number, required: true },
    status: { type: String, enum: ['Ordered', 'Delivered', 'Cancelled'], default: 'Ordered' },
    payment_status: { type: String, enum: ['Unpaid', 'Paid'], default: 'Unpaid' }
}, { timestamps: true });

export default mongoose.model<IPurchaseOrder>('PurchaseOrder', PurchaseOrderSchema);
