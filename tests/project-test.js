
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");

test("customer and staff portal pages exist", () => {
    const pages = [
        "frontend/index.html",
        "frontend/login.html",
        "frontend/signup.html",
        "frontend/staff-login.html"
    ];

    for (const page of pages) {
        assert.equal(
            fs.existsSync(path.join(projectRoot, page)),
            true,
            `Expected page to exist: ${page}`
        );
    }
});

test("frontend JavaScript and CSS files exist", () => {
    const assets = [
        "frontend/css/style.css",
        "frontend/js/app.js",
        "frontend/js/api.js",
        "frontend/js/customer.js",
        "frontend/js/admin.js",
        "frontend/js/notifications.js",
        "frontend/js/state.js"
    ];

    for (const asset of assets) {
        assert.equal(
            fs.existsSync(path.join(projectRoot, asset)),
            true,
            `Expected asset to exist: ${asset}`
        );
    }
});

test("HTML pages contain a document declaration", () => {
    const pages = [
        "frontend/index.html",
        "frontend/login.html",
        "frontend/signup.html",
        "frontend/staff-login.html"
    ];

    for (const page of pages) {
        const content = fs.readFileSync(
            path.join(projectRoot, page),
            "utf8"
        );

        assert.match(
            content,
            /<!doctype html>/i,
            `${page} should declare an HTML document`
        );
    }
});
