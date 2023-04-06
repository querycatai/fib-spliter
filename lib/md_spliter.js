const xml = require('xml');
const marked = require('marked');

class MarkdownSpliter {
    constructor(opts) {
        this.opts = {
            ...opts
        }
    }

    split(md) {
        const html = marked.parse(md);
        const xmldoc = xml.parse(html, "text/html");
        
        if (this.opts.ignore_tags)
            this.opts.ignore_tags.forEach(function (tag) {
                const nodes = xmldoc.body.getElementsByTagName(tag);
                for (var i = 0; i < nodes.length; i++)
                    nodes[i].parentNode.removeChild(nodes[i]);
            });

        var nodes = xmldoc.body.childNodes;

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

module.exports = MarkdownSpliter;