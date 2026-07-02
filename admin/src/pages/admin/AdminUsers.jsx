import React from "react";
import { Users } from "lucide-react";

const AdminUsers = () => {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                <Users className="w-8 h-8 text-green-600" />
                User Management
            </h1>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
                User management functionality coming soon.
            </div>
        </div>
    );
};

export default AdminUsers;
