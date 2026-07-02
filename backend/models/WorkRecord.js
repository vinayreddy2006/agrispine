import mongoose from 'mongoose';

const WorkRecordSchema = new mongoose.Schema({
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WorkGroup',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    landOwnerName: {
        type: String,
        required: true
    },
    crop: {
        type: String,
        required: true
    },
    activityType: {
        type: String,
        required: true
    },
    acres: {
        type: Number,
        required: true
    },
    ratePerAcre: {
        type: Number,
        required: true
    },
    additionalCharges: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        required: true // Usually (acres * ratePerAcre) + additionalCharges
    },
    attendance: [{
        type: mongoose.Schema.Types.ObjectId, // Stores the unique _id of the member subdocument inside WorkGroup
        required: true
    }],
    wagePerPerson: {
        type: Number,
        required: true // totalAmount / attendance.length
    },
    settledMembers: [{
        type: mongoose.Schema.Types.ObjectId // IDs of members who have been paid for this record
    }],
    paymentStatus: {
        type: String,
        enum: ['PENDING', 'PARTIAL', 'SETTLED'],
        default: 'PENDING'
    },
    recordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

export default mongoose.model('WorkRecord', WorkRecordSchema);
