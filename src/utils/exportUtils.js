import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CURRENCY_SYMBOLS, convertAmount } from './formatters';

// Reusable export utility function
export const exportExpenses = (expenses, format, entityName, currentUser, targetCurrency = 'USD') => {
    // 1. Prepare Data
    if (!expenses || expenses.length === 0) {
        alert("No expenses to export.");
        return;
    }

    const symbol = CURRENCY_SYMBOLS[targetCurrency.toUpperCase()] || '$';
    const rows = [];
    const headers = ["Date", "Description", `Cost (${targetCurrency})`, "Paid By", `Your Share (${targetCurrency})` ];

    expenses.forEach(exp => {
        const dateObj = new Date(exp.date);
        const formattedDate = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        const payerName = (exp.paidBy._id === currentUser.id || exp.paidBy._id === currentUser._id) ? "You" : (exp.paidBy.username || "Someone");

        const sourceCurr = exp.currency || 'USD';
        const convertedTotal = convertAmount(exp.amount, sourceCurr, targetCurrency);

        let userShare = 0;
        const yourSplit = exp.splits.find(s => (s.user._id || s.user) === currentUser.id || (s.user._id || s.user) === currentUser._id);
        if (yourSplit) {
            userShare = convertAmount(yourSplit.amount, sourceCurr, targetCurrency);
        }

        rows.push([
            formattedDate,
            exp.description || 'Payment',
            `${symbol}${convertedTotal.toFixed(2)}`,
            payerName,
            `${symbol}${userShare.toFixed(2)}`
        ]);
    });

    const fileName = `${entityName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_expenses`;

    // 2. Export based on format
    if (format === 'csv') {
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${fileName}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    else if (format === 'pdf') {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text(`Expenses for ${entityName}`, 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);

        doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30);

        autoTable(doc, {
            startY: 40,
            head: [headers],
            body: rows,
            theme: 'striped',
            headStyles: { fillColor: [16, 140, 115] }, // matches the brand green
        });

        doc.save(`${fileName}.pdf`);
    }
};
