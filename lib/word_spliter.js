const xml = require('xml');
const zip = require('zip');

class WordSpliter {
    constructor(opts) {
    }

    split(docx_data) {
        var docx = zip.open(docx_data);
        const xmldoc = xml.parse(docx.read("word/document.xml"));

        var nodes = xmldoc.documentElement.childNodes;
        if (nodes.length == 1)
            nodes = nodes[0].childNodes;

        const ret = [];
        for (var i = 0; i < nodes.length; i++) {
            var text = nodes[i].textContent.replace(/[ \r\n]+$/g, '');
            text = text.replace(/[\r\n]+/g, '\n');
            text = text.trim();
            if (text.length > 0)
                ret.push(text);
        }
        return ret;
    }
}

module.exports = WordSpliter;