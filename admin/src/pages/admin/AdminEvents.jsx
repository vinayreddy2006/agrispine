import React from "react";
import { Calendar } from "lucide-react";

const AdminEvents = () => {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                <Calendar className="w-8 h-8 text-green-600" />
                Events Management
            </h1>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
                Events management functionality coming soon.
            </div>
        </div>
    );
};

export default AdminEvents;
