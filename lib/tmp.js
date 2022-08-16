const Filic = require("filic");
const fs = Filic.create(process.cwd());
const random = require("@helper-modules/random");

const FILES = {};

const TMP = fs.open("dir:.tmp");

function create(key, extension = "") {
    let id = random(32);
    FILES[key] = `${id}${extension}`;
    return TMP.open(`file:${id}${extension}`)
}

function get(key) {
    let id = FILES[key];
    if (!id) return null;
    return TMP.open(`file:${id}`);
}

function destroy(key) {
    let id = FILES[key];
    if (!id) {
        return null;
    }
    return TMP.open(`file:${id}`);
}

process.on('exit', () => {
    TMP.clear();
    TMP.deleteItSelf();
})

module.exports = {
    create,
    destroy,
    get
}
