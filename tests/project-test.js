
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

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
        "frontend/js/state.js",
        "frontend/js/main.js"
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

test("JavaScript files contain valid syntax", () => {
    const scripts = [
        "frontend/js/state.js",
        "frontend/js/api.js",
        "frontend/js/customer.js",
        "frontend/js/admin.js",
        "frontend/js/notifications.js",
        "frontend/js/app.js",
        "frontend/js/main.js",
        "scripts/build-check.js"
    ];

    for (const script of scripts) {
        const fullPath = path.join(projectRoot, script);
        assert.equal(fs.existsSync(fullPath), true, `File missing: ${script}`);
        const code = fs.readFileSync(fullPath, "utf8");
        assert.doesNotThrow(() => {
            new vm.Script(code, { filename: script });
        }, `Syntax error in ${script}`);
    }
});

test("HTML pages reference valid local assets", () => {
    const pages = [
        "frontend/index.html",
        "frontend/login.html",
        "frontend/signup.html",
        "frontend/staff-login.html"
    ];

    for (const page of pages) {
        const html = fs.readFileSync(path.join(projectRoot, page), "utf8");
        const scriptMatches = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)];
        for (const match of scriptMatches) {
            const src = match[1];
            if (!src.startsWith("http://") && !src.startsWith("https://") && !src.startsWith("//")) {
                const resolved = path.join(projectRoot, "frontend", src);
                assert.equal(
                    fs.existsSync(resolved),
                    true,
                    `${page} references missing script: ${src}`
                );
            }
        }

        const linkMatches = [...html.matchAll(/<link[^>]+href=["']([^"']+)["']/gi)];
        for (const match of linkMatches) {
            const href = match[1];
            if (
                !href.startsWith("http://") &&
                !href.startsWith("https://") &&
                !href.startsWith("//") &&
                !href.startsWith("data:")
            ) {
                const resolved = path.join(projectRoot, "frontend", href);
                assert.equal(
                    fs.existsSync(resolved),
                    true,
                    `${page} references missing stylesheet/icon: ${href}`
                );
            }
        }
    }
});

test("seed state data contains valid initial tickets and users", () => {
    const stateCode = fs.readFileSync(path.join(projectRoot, "frontend/js/state.js"), "utf8");
    const sandbox = {};
    vm.createContext(sandbox);
    vm.runInContext(stateCode + "\nthis.INITIAL_USERS = INITIAL_USERS;\nthis.INITIAL_TICKETS = INITIAL_TICKETS;", sandbox);

    assert.ok(sandbox.INITIAL_USERS, "INITIAL_USERS should be defined");
    assert.ok(sandbox.INITIAL_USERS.customer, "INITIAL_USERS.customer should exist");
    assert.ok(Array.isArray(sandbox.INITIAL_USERS.staff), "INITIAL_USERS.staff should be an array");
    assert.ok(Array.isArray(sandbox.INITIAL_TICKETS), "INITIAL_TICKETS should be an array");
    assert.ok(sandbox.INITIAL_TICKETS.length > 0, "INITIAL_TICKETS should not be empty");

    for (const ticket of sandbox.INITIAL_TICKETS) {
        assert.ok(ticket.id, "Ticket must have an id");
        assert.ok(ticket.subject, `Ticket ${ticket.id} must have a subject`);
        assert.ok(ticket.priority, `Ticket ${ticket.id} must have a priority`);
        assert.ok(ticket.status, `Ticket ${ticket.id} must have a status`);
        assert.ok(ticket.sla, `Ticket ${ticket.id} must have an SLA configuration`);
    }
});

test("Docker configuration files exist and contain valid directives", () => {
    const dockerfilePath = path.join(projectRoot, "Dockerfile");
    const composePath = path.join(projectRoot, "docker-compose.yml");

    assert.equal(fs.existsSync(dockerfilePath), true, "Dockerfile should exist");
    assert.equal(fs.existsSync(composePath), true, "docker-compose.yml should exist");

    const dockerfileContent = fs.readFileSync(dockerfilePath, "utf8");
    assert.match(dockerfileContent, /^FROM /m, "Dockerfile must define a base image");
    assert.match(dockerfileContent, /^EXPOSE /m, "Dockerfile must expose a port");
    assert.match(dockerfileContent, /^HEALTHCHECK /m, "Dockerfile must include a healthcheck");

    const composeContent = fs.readFileSync(composePath, "utf8");
    assert.match(composeContent, /services:/, "docker-compose.yml must define services");
});

test("CI/CD GitHub Actions workflow exists and contains required stages", () => {
    const workflowPath = path.join(projectRoot, ".github/workflows/ci-cd.yml");
    assert.equal(fs.existsSync(workflowPath), true, "ci-cd.yml should exist");

    const workflowContent = fs.readFileSync(workflowPath, "utf8");
    assert.match(workflowContent, /name:\s*SupportFlow CI\/CD Pipeline/, "Workflow must be named");
    assert.match(workflowContent, /feature\/\*\*/, "Must trigger on feature branches");
    assert.match(workflowContent, /pull_request:/, "Must trigger on pull requests");
    assert.match(workflowContent, /deploy-pages:/, "Must have deployment stage");
    assert.match(workflowContent, /docker-validation:/, "Must have Docker validation stage");
});

test("index.html and app.js enforce authentication redirect to login.html", () => {
    const indexHtml = fs.readFileSync(path.join(projectRoot, "frontend/index.html"), "utf8");
    assert.match(indexHtml, /localStorage\.getItem\(['"]supportflow_session_v1['"]\)/, "index.html must check session");
    assert.match(indexHtml, /window\.location\.replace\(['"]login\.html['"]\)/, "index.html must redirect to login.html when no session");

    const appJs = fs.readFileSync(path.join(projectRoot, "frontend/js/app.js"), "utf8");
    assert.match(appJs, /Api\.getSession\(\)/, "app.js must verify active session");
    assert.match(appJs, /window\.location\.replace\(['"]login\.html['"]\)/, "app.js must redirect to login.html if unauthenticated");
});

test("Nginx production configuration exists and contains gzip and security headers", () => {
    const nginxPath = path.join(projectRoot, "nginx.conf");
    assert.equal(fs.existsSync(nginxPath), true, "nginx.conf should exist");

    const nginxContent = fs.readFileSync(nginxPath, "utf8");
    assert.match(nginxContent, /gzip on;/, "Nginx must enable gzip compression");
    assert.match(nginxContent, /X-Content-Type-Options/, "Nginx must set security headers");
    assert.match(nginxContent, /location = \/healthz/, "Nginx must define /healthz endpoint");
});

test("SupportFlow utilities provide security escaping and debounce", () => {
    const mainJsPath = path.join(projectRoot, "frontend/js/main.js");
    const code = fs.readFileSync(mainJsPath, "utf8");
    const sandbox = { module: { exports: {} } };
    vm.createContext(sandbox);
    vm.runInContext(code, sandbox);

    const sf = sandbox.module.exports;
    assert.ok(sf, "SupportFlow module must be exported");
    assert.equal(typeof sf.escapeHtml, "function", "escapeHtml must be a function");
    assert.equal(sf.escapeHtml("<script>'test'&\""), "&lt;script&gt;&#39;test&#39;&amp;&quot;");
    assert.equal(typeof sf.debounce, "function", "debounce must be a function");
});
