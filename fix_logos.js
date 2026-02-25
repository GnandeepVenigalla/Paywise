const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src', 'pages');

const logoFiles = ['Dashboard.jsx', 'Activity.jsx', 'Friends.jsx', 'GroupDetails.jsx', 'FriendDetails.jsx'];
logoFiles.forEach(file => {
    let content = fs.readFileSync(path.join(srcDir, file), 'utf8');
    if (!content.includes("import logo from '../assets/logo.png';")) {
        content = content.replace(/(import .*;\n)+/, match => match + "import logo from '../assets/logo.png';\n");
    }
    content = content.replace(/"\/Paywise logo\.PNG"/g, "{logo}");
    fs.writeFileSync(path.join(srcDir, file), content);
});

const fullLogoFiles = ['Register.jsx', 'Login.jsx', 'ForgotPassword.jsx', 'ResetPassword.jsx'];
fullLogoFiles.forEach(file => {
    let content = fs.readFileSync(path.join(srcDir, file), 'utf8');
    if (!content.includes("import logoFull from '../assets/logo_full.png';")) {
        content = content.replace(/(import .*;\n)+/, match => match + "import logoFull from '../assets/logo_full.png';\n");
    }
    content = content.replace(/"\/Paywise\.PNG"/g, "{logoFull}");
    fs.writeFileSync(path.join(srcDir, file), content);
});

const indexHtmlPath = path.join(__dirname, 'index.html');
let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
indexHtml = indexHtml.replace('href="/Paywise logo.PNG"', 'href="/logo.png"');
fs.writeFileSync(indexHtmlPath, indexHtml);

