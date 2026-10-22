
const fs = require("node:fs");
const path = require("node:path");

const requiredFiles = [
    "frontend/index.html",
    "frontend/login.html",
    "frontend/signup.html",
    "frontend/staff-login.html",
    "frontend/css/style.css",
    "frontend/js/app.js",
    "frontend/js/api.js",
    "frontend/js/customer.js",
    "frontend/js/admin.js",
    "frontend/js/notifications.js",
    "frontend/js/state.js"
];

const missingFiles = requiredFiles.filter((file) =>
    !fs.existsSync(path.resolve(process.cwd(), file))
);

if (missingFiles.length > 0) {
    console.error("Build check failed. Missing files:");
    missingFiles.forEach((file) => console.error(`- ${file}`));
    process.exit(1);
}

console.log("Build check passed: required application files exist.");
