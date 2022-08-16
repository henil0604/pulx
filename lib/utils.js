const axios = require('axios')
const child_process = require("child_process");
const TMP = require("./tmp");

module.exports.fetch = async (url) => {
    try {
        const response = await axios.get(url)
        return response.data;
    } catch (e) {
        console.error(`Failed to fetch ${url}`)
        process.exit(1)
    }
}

module.exports.prettyJSON = (value) => {
    return JSON.stringify(value, null, 4)
}

module.exports.generateTarball = async (package) => {
    const packageDetail = await module.exports.fetch(`https://registry.npmjs.org/${package}/latest`)

    let tarballUrl = null;

    tarballUrl = packageDetail.dist.tarball;

    if (tarballUrl === null) {
        throw new Error(`Failed to fetch npm package: ${package}`)
    }

    const tarball = TMP.create(`tarball-${package}`, ".tgz");

    await tarball.downloadFrom(tarballUrl.trim());

    return tarball;
}