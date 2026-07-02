import mongoose from 'mongoose';

const MemberSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null // Null means offline member
    },
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        default: ''
    },
    isOffline: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        enum: ['member', 'admin', 'owner'],
        default: 'member'
    },
    status: {
        type: String,
        enum: ['active', 'removed'],
        default: 'active'
    },
    village: {
        type: String,
        default: ''
    },
    notes: {
        type: String,
        default: ''
    },
    joinedAt: {
        type: Date,
        default: Date.now
    }
});

const WorkGroupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    village: {
        type: String,
        trim: true
    },
    admins: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    members: [MemberSchema],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'closed'],
        default: 'active'
    }
}, { timestamps: true });

export default mongoose.model('WorkGroup', WorkGroupSchema);
