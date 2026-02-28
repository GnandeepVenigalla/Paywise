import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Reusable export utility function
export const exportExpenses = (expenses, format, entityName, currentUser) => {
    // 1. Prepare Data
    if (!expenses || expenses.length === 0) {
        alert("No expenses to export.");
        return;
    }

    const rows = [];
    const headers = ["Date", "Description", "Cost", "Paid By", "Your Share"];

    expenses.forEach(exp => {
        // Skip simplified payment pseudo-expenses if desired or include them. We include them but format nicely.
        const dateObj = new Date(exp.date);
        const formattedDate = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        const payerName = (exp.paidBy._id === currentUser.id || exp.paidBy._id === currentUser._id) ? "You" : (exp.paidBy.username || "Someone");

        let userShare = 0;
        const yourSplit = exp.splits.find(s => (s.user._id || s.user) === currentUser.id || (s.user._id || s.user) === currentUser._id);
        if (yourSplit) {
            userShare = yourSplit.amount;
        }

        rows.push([
            formattedDate,
            exp.description || 'Payment',
            `$${exp.amount.toFixed(2)}`,
            payerName,
            yourSplit ? `$${userShare.toFixed(2)}` : '$0.00'
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

        doc.autoTable({
            startY: 40,
            head: [headers],
            body: rows,
            theme: 'striped',
            headStyles: { fillColor: [16, 140, 115] }, // matches the brand green
        });

        doc.save(`${fileName}.pdf`);
    }
};
