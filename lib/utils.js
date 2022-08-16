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
