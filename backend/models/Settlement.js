import mongoose from 'mongoose';

const DistributionSchema = new mongoose.Schema({
    memberId: {
        type: mongoose.Schema.Types.ObjectId, // ID of the member subdocument
        required: true
    },
    amountPaid: {
        type: Number,
        required: true
    }
});

const SettlementSchema = new mongoose.Schema({
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WorkGroup',
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    settlementType: {
        type: String,
        enum: ['GROUP_WIDE', 'SELECTED_MEMBERS', 'NET_SETTLEMENT'],
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    workRecordsIncluded: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WorkRecord'
    }],
    distributions: [DistributionSchema],
    notes: {
        type: String
    },
    paymentMode: {
        type: String,
        enum: ['CASH', 'UPI', 'BANK_TRANSFER', 'OTHER'],
        default: 'CASH'
    },
    remarks: {
        type: String
    },
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

export default mongoose.model('Settlement', SettlementSchema);
