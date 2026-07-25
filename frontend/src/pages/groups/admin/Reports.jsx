import React from 'react';
import Card from '../../../components/ui/Card';
import { Download, FileText } from 'lucide-react';
import { exportToPDF, exportToExcel } from '../../../utils/ReportExport';
import Swal from 'sweetalert2';

const Reports = ({ group, records }) => {
    
    const handlePDFExport = () => {
        if (!records || records.length === 0) {
            return Swal.fire('No Data', 'There are no work records to export.', 'info');
        }
        exportToPDF(records, group.name);
    };

    const handleExcelExport = () => {
        if (!records || records.length === 0) {
            return Swal.fire('No Data', 'There are no work records to export.', 'info');
        }
        exportToExcel(records, group.name);
    };

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Group Reports</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Work History (PDF)</h4>
                            <p className="text-sm text-slate-500 mb-4">
                                Download a formatted PDF document containing all work records and member attendance. Suitable for printing.
                            </p>
                            <button 
                                onClick={handlePDFExport}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold rounded-lg flex items-center gap-2 transition-colors"
                            >
                                <Download className="w-4 h-4" /> Export PDF
                            </button>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Detailed Data (Excel)</h4>
                            <p className="text-sm text-slate-500 mb-4">
                                Download raw data in Excel format for advanced calculations, pivots, and custom filtering.
                            </p>
                            <button 
                                onClick={handleExcelExport}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold rounded-lg flex items-center gap-2 transition-colors"
                            >
                                <Download className="w-4 h-4" /> Export Excel
                            </button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Reports;
