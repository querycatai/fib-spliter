const fs = require('fs');
const path = require('path');

const HtmlSpliter = require('./html_spliter');
const MarkdownSpliter = require('./md_spliter');
const WordSpliter = require('./word_spliter');
const EPubSpliter = require('./epub_spliter');
const TestSpliter = require('./test_spliter');

const ext_spliter = {
    '.html': HtmlSpliter,
    '.md': MarkdownSpliter,
    '.docx': WordSpliter,
    '.epub': EPubSpliter,
    '.js': TestSpliter,
};

module.exports = function (folders, opts) {
    opts = opts || {};
    var files_nodes = [];

    folders.forEach(function (folder) {
        var dir = fs.readdir(folder);
        dir.forEach(function (entry) {
            var curr_file = { file_name: entry, nodes: [] };
            var filename = path.join(folder, entry);
            console.log(`splitting ${filename} ...`);
            if (!fs.stat(filename).isDirectory()) {
                var ext = path.extname(filename);
                var Spliter = ext_spliter[ext];
                if (Spliter) {
                    var spliter = new Spliter(opts[ext]);
                    var nodes = spliter.split(fs.readFile(filename));
                    curr_file.nodes = nodes;
                }
            }
            files_nodes.push(curr_file);
        });
    });

    return files_nodes;
}