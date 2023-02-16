#!/usr/bin/env node

import path from 'path';
import fs from 'fs';
import events from 'events';
import readlinePromises from 'readline/promises';
import { Command, Option } from 'commander/esm.mjs';

const program = new Command();

program
    .option('-t, --top <k>', 'Show Top-K', 10)
    .addOption(new Option('-a, --algo <algorithm>', 'Exact, Cutoff, or Approximate solution').default('exact').choices(['approx', 'cutoff', 'exact']))
    .addOption(new Option('-f, --format <type>', 'Output file type').default('csv').choices(['json', 'csv']))
    .addOption(new Option('-o, --out <filename>', 'Output file name').default('stdout'));
program.parse();
const options = program.opts();
//console.log(options);
const inDir = await fs.promises.readdir('./', {
    withFileTypes: true,
});

const tweetFiles = inDir
    .filter((dirent) => {
        return dirent.isFile() && dirent.name.endsWith('.tweets');
    })
    .map((dirent) => {
        return path.join(process.cwd(), dirent.name);
    });
//console.log(tweetFiles);

const startFromFile = async (file, stats, n) => {
    const intStats = {};
    const input = fs.createReadStream(file);
    const readerP = readlinePromises.createInterface({
        input: input,
        crlfDelay: Infinity,
        escapeCodeTimeout: 1000,
    });
    readerP.on('line', async (line) => {
        const json = JSON.parse(line);
        json.entities.hashtags.forEach((hashtag) => {
            if (options.algo == 'exact' || options.algo == 'cutoff') {
                if (stats.hasOwnProperty(hashtag.text)) {
                    stats[hashtag.text]++;
                    max = Math.max(max, stats[hashtag.text]);
                } else {
                    stats[hashtag.text] = 1;
                    max = Math.max(max, stats[hashtag.text]);
                }
            } else {
                //approx.
                n++;
                if (stats.hasOwnProperty(hashtag.text)) {
                    stats[hashtag.text].n++;
                    stats[hashtag.text].idx++;
                } else if (Object.keys(stats).length < options.top * 25 - 1) {
                    stats[hashtag.text] = {
                        n: 1,
                        idx: 1,
                    };
                } else {
                    for (let hashtag in stats) {
                        stats[hashtag].idx--;
                        if (stats[hashtag].idx == 0) {
                            delete stats[hashtag];
                        }
                    }
                }
            }
        });
    });
    await events.once(readerP, 'close');
    //console.log('done');
    return stats;
};

const stats = {};
let n = 0;
let max = 0;

const nAllFiles = tweetFiles.length;
let nDoneFiles = 0;
for (const file of tweetFiles) {
    console.log("#", nDoneFiles + 1, 'of', nAllFiles + ' files', file);
    await startFromFile(file, stats, n);
    if (options.algo == 'cutoff') {
        for (const hashtag in stats) {
            if (stats[hashtag] < max / 1000) {
                delete stats[hashtag];
            }
        }
    }
    nDoneFiles++;
}
for (const hashtag in stats) {
    if (stats[hashtag].hasOwnProperty('n')) {
        stats[hashtag] = stats[hashtag].n;
    }
}
var statsPairs = Object.entries(stats);
statsPairs.sort((p1, p2) => {
    var p1Val = p1[1],
        p2Val = p2[1];
    return p2Val - p1Val;
});
let fd;
if (options.out != 'stdout') {
    fd = await fs.promises.open(options.out, 'a');
} else {
    fd = process.stdout;
}
if (options.format == 'json') {
    await fd.write('[\n');
}
for (let i = 0; i < Math.min(options.top, statsPairs.length); i++) {
    if (options.format == 'csv') {
        await fd.write(statsPairs[i][0] + ',' + statsPairs[i][1] + '\n');
    } else {
        await fd.write(statsPairs[i] + ',\n');
    }
}
if (options.format == 'json') {
    await fd.write(']');
}
if (options.out != 'stdout') {
    await fd.close();
}
