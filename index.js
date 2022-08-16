#! /usr/bin/env node
const { program } = require('commander');

const install = require('./lib/install');

const installCommand = program
    .command('install [pulxJsonUrl] [name]')

installCommand.action(install.action)

program.parse();
