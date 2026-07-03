import mongoose, { Schema, Document } from 'mongoose';

export interface IDispensingItem {
    medicine_id: mongoose.Types.ObjectId;
    batch_id: mongoose.Types.ObjectId;
    quantity_requested: number;
    quantity_dispensed: number;
    unit_price: number;
    gst_rate: number;
}

export interface IDispensing extends Document {
    prescription_id: mongoose.Types.ObjectId;
    patient_id: mongoose.Types.ObjectId;
    pharmacist_id?: mongoose.Types.ObjectId;
    dispensed_items: IDispensingItem[];
    dispensed_date: Date;
    invoice_id?: mongoose.Types.ObjectId;
    status: 'Completed' | 'Partially_Dispensed' | 'Cancelled';
}

const DispensingSchema: Schema = new Schema({
    prescription_id: { type: Schema.Types.ObjectId, ref: 'Prescription', required: true },
    patient_id: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    pharmacist_id: { type: Schema.Types.ObjectId, ref: 'User' },
    dispensed_items: [{
        medicine_id: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true },
        batch_id: { type: Schema.Types.ObjectId, ref: 'Batch', required: true },
        quantity_requested: { type: Number, required: true },
        quantity_dispensed: { type: Number, required: true },
        unit_price: { type: Number, required: true },
        gst_rate: { type: Number, default: 12 }
    }],
    dispensed_date: { type: Date, default: Date.now },
    invoice_id: { type: Schema.Types.ObjectId, ref: 'Invoice' },
    status: { type: String, enum: ['Completed', 'Partially_Dispensed', 'Cancelled'], default: 'Completed' }
}, { timestamps: true });

export default mongoose.model<IDispensing>('Dispensing', DispensingSchema);
