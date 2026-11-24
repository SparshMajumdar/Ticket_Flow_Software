
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
    "frontend/js/state.js",
    "frontend/js/main.js",
    "Dockerfile",
    "docker-compose.yml",
    "nginx.conf",
    ".github/workflows/ci-cd.yml"
];

const missingFiles = requiredFiles.filter((file) =>
    !fs.existsSync(path.resolve(process.cwd(), file))
);

const emptyFiles = requiredFiles.filter((file) => {
    const fullPath = path.resolve(process.cwd(), file);
    return fs.existsSync(fullPath) && fs.statSync(fullPath).size === 0;
});

if (missingFiles.length > 0 || emptyFiles.length > 0) {
    if (missingFiles.length > 0) {
        console.error("Build check failed. Missing files:");
        missingFiles.forEach((file) => console.error(`- ${file}`));
    }
    if (emptyFiles.length > 0) {
        console.error("Build check failed. Empty files:");
        emptyFiles.forEach((file) => console.error(`- ${file}`));
    }
    process.exit(1);
}

console.log(`Build check passed: all ${requiredFiles.length} required application and deployment files exist and are populated.`);
