import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const exportToPDF = (records, groupName) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(`${groupName} - Work History Report`, 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

    const tableColumn = ["Date", "Land Owner", "Activity", "Crop", "Acres", "Total Amount", "Status"];
    const tableRows = [];

    records.forEach(record => {
        const rowData = [
            new Date(record.date).toLocaleDateString(),
            record.landOwnerName,
            record.activityType,
            record.crop,
            record.acres,
            `Rs. ${record.totalAmount}`,
            record.paymentStatus
        ];
        tableRows.push(rowData);
    });

    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        theme: 'grid',
        headStyles: { fillColor: [22, 163, 74] } // Green-600
    });

    doc.save(`${groupName}_Report.pdf`);
};

export const exportToExcel = (records, groupName) => {
    const data = records.map(record => ({
        Date: new Date(record.date).toLocaleDateString(),
        'Land Owner': record.landOwnerName,
        Activity: record.activityType,
        Crop: record.crop,
        Acres: record.acres,
        'Rate/Acre': record.ratePerAcre,
        'Additional': record.additionalCharges,
        'Total Amount': record.totalAmount,
        'Workers': record.attendance.length,
        'Wage/Person': record.wagePerPerson,
        Status: record.paymentStatus
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Work History");

    XLSX.writeFile(workbook, `${groupName}_Report.xlsx`);
};
