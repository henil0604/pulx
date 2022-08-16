const { fetch, prettyJSON } = require('./utils')
const Filic = require("filic");
const urlJoin = require("urljoin");
const Path = require("path");
const isURL = require('is-url');
const TMP = require('./tmp');
const log = require("@helper-modules/log");
const { PluginManager } = require("live-plugin-manager");

const manager = new PluginManager({
    pluginsPath: "node_modules"
})

const fs = Filic.create(process.cwd());

const pulxJson = fs.open("file:pulx.json");


function postinstall() {
    log(`Running Post install`);
    const packageJson = fs.open("file:package.json", { autoCreate: false });

    if (packageJson.exists === false) {
        return false;
    }

    packageJson.update(content => {
        let json = content.json();
        if (!json.scripts) {
            json.scripts = {};
        }

        if (typeof json.scripts.postinstall === 'string' && json.scripts.postinstall.indexOf('pulx install') > -1) {
            return prettyJSON(json)
        }

        if (!json.scripts.postinstall) {
            json.scripts.postinstall = `pulx install`
        } else {
            json.scripts.postinstall += ` && pulx install`
        }

        return prettyJSON(json);
    })

}

async function install() {
    const dependencies = pulxJson.content.json().dependencies || {};

    for (const name in dependencies) {
        const dependency = dependencies[name];

        if (dependency.npm) {
            await addNpm(`${dependency.name}@${dependency.version || 'latest'}`)
        } else {
            await add(dependency.remote, dependency.name);
        }
    }

    log(`Installation Complete`)

}

async function add(pulxJsonUrl, name, updatePulxJson = true) {
    log(`Installing from {${pulxJsonUrl}}`)
    pulxJsonUrl = new URL(pulxJsonUrl);

    const remote = {};
    const local = {};

    if (Path.basename(pulxJsonUrl.href) !== 'pulx.json') {
        throw new Error("url must lead to pulx.json file");
    }

    log(`Fetching {pulx.json}`)
    remote.pulxJson = await fetch(pulxJsonUrl.href);
    local.pulxJson = pulxJson;

    if (!remote.pulxJson.name && !name) {
        throw new Error(`pulx.json does not contain "name" property by default.`);
    }

    if (typeof remote.pulxJson.name === 'string' && typeof name === 'string') {
        log(`Using name {${remote.pulxJson.name}} instead of {${name}} because it is provided in pulx.json`, 'warn')
        local.name = remote.pulxJson.name;
    }

    if (!remote.pulxJson.name && typeof name === 'string') {
        local.name = name;
    }

    log(`Gathering Files`);
    remote.files = [
        {
            filePath: './pulx.json',
            url: pulxJsonUrl.href,
            content: remote.pulxJson
        }
    ];

    for (const filePath of remote.pulxJson.include) {
        const url = urlJoin(Path.dirname(pulxJsonUrl.href), filePath)
        log(`Fetching File: {${filePath}}`);
        const content = await fetch(url);

        remote.files.push({
            filePath,
            url,
            content
        })

    }

    const node_module = fs.open("dir:node_modules");
    const module = node_module.open(`dir:${local.name}`, { autoCreate: false });

    if (
        module.exists &&
        module.open("file:pulx.json", { autoCreate: false }).exists === false
    ) {
        throw new Error(`non pulx module "${local.name}" already exists.`);
    }

    log(`Writing Files to {node_modules/${local.name}}`)
    local.files = [];

    for (const file of remote.files) {
        const f = module.open(`file:${file.filePath}`)
        log(`Writing File: {node_modules/${local.name}/${file.filePath}}`)
        if (f.filename.endsWith('.json')) {
            f.write(JSON.stringify(file.content, null, 4))
        } else {
            f.write(file.content)
        }
        local.files.push(f);
    }

    log(`Updating {pulx.json}`)
    // Populating local pulx.json
    if (updatePulxJson) {
        local.pulxJson.update(content => {
            let json = content.json();

            if (!json.dependencies)
                json.dependencies = {};

            json.dependencies[local.name] = {
                remote: pulxJsonUrl.href,
                name: local.name,
            }

            return prettyJSON(json);
        })
    }

    log(`Checking for Dependencies`);
    if (remote.pulxJson.dependencies) {

        for (const name in remote.pulxJson.dependencies) {
            const dependency = remote.pulxJson.dependencies[name];

            if (dependency.npm) {
                await addNpm(`${dependency.name}@${dependency.version}`, false);
                continue;
            }

            await add(dependency.remote, name, false)
            continue;
        }

    }

}

async function addNpm(packageName, updatePulxJson = true) {
    log(`Installing {${packageName}}`)

    let versionGroup = packageName.match(/@latest|(@[~^]?([\dvx*]+(?:[-.](?:[\dx*]+|alpha|beta))*))/g);
    let version = packageName.match(/latest|([\dvx*]+(?:[-.](?:[\dx*]+|alpha|beta))*)/g);

    version = version !== null ? version[0] : 'latest';
    packageName = versionGroup !== null ? packageName.replace(`${versionGroup[0]}`, '') : packageName;

    log(`Fetching Package Details`)
    const packageDetail = await fetch(`https://registry.npmjs.org/${packageName}/${version}`)

    await manager.installFromNpm(packageName, version);

    let dependencies = packageDetail.dependencies;

    log(`Installing Dependencies`)
    for (const name in dependencies) {
        await addNpm(`${name}@${dependencies[name]}`, false);
    }

    if (updatePulxJson) {
        log(`Updating pulx.json`)
        pulxJson.update(content => {
            let json = content.json();

            if (!json.dependencies)
                json.dependencies = {};

            json.dependencies[packageName] = {
                npm: true,
                name: packageName,
                version: version
            }

            return prettyJSON(json);
        })
    }

}

module.exports.action = async (pulxJsonUrl, name, options) => {
    if (pulxJson.exists === false || pulxJson.content === "") {
        pulxJson.create();
        pulxJson.write(prettyJSON({}))
    }
    if (!pulxJsonUrl && !name) {
        await install();
        postinstall();
        return;
    }

    if (isURL(pulxJsonUrl) === false) {
        await addNpm(pulxJsonUrl, true);
        postinstall();
        return;
    }

    if (isURL(pulxJsonUrl) === true) {
        await add(pulxJsonUrl, name);
        postinstall();
        return;
    }

}

module.exports.add = add;