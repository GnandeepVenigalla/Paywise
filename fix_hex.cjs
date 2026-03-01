const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir('/Users/nirvana/Desktop/Paywise/Paywise_Frontend/src', function (filePath) {
    if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let original = content;

        // Replace all hex instances with proper tailwind classes so dark mode works.
        content = content.replace(/text-\[\#0f172a\]/g, 'text-slate-900');
        content = content.replace(/bg-\[\#0f172a\]/g, 'bg-slate-900');
        content = content.replace(/border-\[\#0f172a\]/g, 'border-slate-900');
        content = content.replace(/bg-\[\#020617\]/g, 'bg-slate-950');
        content = content.replace(/text-\[\#e11d48\]/g, 'text-rose-600');
        content = content.replace(/bg-\[\#f1f5f9\]/g, 'bg-slate-50');
        content = content.replace(/bg-\[\#e2e8f0\]/g, 'bg-slate-200');
        content = content.replace(/decoration-\[\#0f172a\]\/40/g, 'decoration-slate-900/40');

        // Balances: Let's also enforce 'you lent' or positive owes to use emerald.
        // We'll search for pattern where amountColor is assigned text-slate-900 or text-[#0f172a] 
        // and replace it with emerald to match the main net balance.
        content = content.replace(/amountColor = [^>]+> 0 \? "text-(slate-900|\[#0f172a\])"/g, 'amountColor = splitAmt > 0 ? "text-emerald-500"');
        content = content.replace(/amountColor = [^>]+> 0 \? 'text-(slate-900|\[#0f172a\])'/g, "amountColor = splitAmt > 0 ? 'text-emerald-500'");
        content = content.replace(/amountColor =([^>]+)> 0 \? "text-slate-900"/g, 'amountColor =$1> 0 ? "text-emerald-500"');

        // Let's specifically handle GroupDetails amountColor line
        content = content.replace(/amountColor = splitAmt > 0 \? "text-slate-900" : "text-gray-500";/g, 'amountColor = splitAmt > 0 ? "text-emerald-500" : "text-gray-500";');
        content = content.replace(/amountColor = item.balance > 0 \? "text-slate-900"/g, 'amountColor = item.balance > 0 ? "text-emerald-500"');

        // In Group details:
        content = content.replace(/detail\.debtor\._id === member\._id \? 'text-rose-600' : 'text-slate-900'/g, "detail.debtor._id === member._id ? 'text-rose-600' : 'text-emerald-500'");

        // Also the "gets back" text
        content = content.replace(/'text-slate-900'\}`}>\n(\s*)gets back/g, "'text-emerald-500'}`}>\n$1gets back");

        // The exact literal strings where "owes you" is:
        content = content.replace(/row.iOwe \? 'text-rose-600' : 'text-slate-900'/g, "row.iOwe ? 'text-rose-600' : 'text-emerald-500'");

        if (content !== original) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Updated ${filePath}`);
        }
    }
});
