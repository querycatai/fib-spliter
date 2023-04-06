const xml = require('xml');
const { Readability } = require('@mozilla/readability');

class HtmlSpliter {
    constructor(opts) {
        this.opts = {
            ...opts
        }
    }

    split(html) {
        const reader = new Readability(xml.parse(html, "text/html"));
        const article = reader.parse();

        if (this.opts.before_split)
            article.content = this.opts.before_split(article.content);

        const htmldoc = xml.parse(article.content, "text/html");

        if (this.opts.ignore_tags)
            this.opts.ignore_tags.forEach(function (tag) {
                const nodes = htmldoc.body.getElementsByTagName(tag);
                for (var i = 0; i < nodes.length; i++)
                    nodes[i].parentNode.removeChild(nodes[i]);
            });

        var nodes = htmldoc.body.childNodes;
        if (nodes.length == 1)
            nodes = nodes[0].childNodes;
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

module.exports = HtmlSpliter;