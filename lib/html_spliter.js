const xml = require('xml');
const { Readability } = require('@mozilla/readability');
const { NodeHtmlMarkdown, NodeHtmlMarkdownOptions } = require('node-html-markdown');

function clean_content(content) {
    content = content.replace(/[ ]+/g, ' ');
    content = content.replace(/[\r\n]+$/g, '');
    content = content.replace(/[\r\n]+/g, '\n');
    content = content.trim();
    return content;
}

class HtmlSpliter {
    constructor(opts) {
        this.opts = {
            ...opts
        }
    }

    split(html) {
        const reader = new Readability(html instanceof xml.Document ? html : xml.parse(html, "text/html"));
        const article = reader.parse();
        if (article === null) {
            console.log("article is null");
            return [];
        }

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
            var node = nodes[i];
            if (node.tagName === 'TABLE') {
                var text = clean_content(NodeHtmlMarkdown.translate(node.toString()));
                ret.push(text);
            } else {
                var text = clean_content(node.textContent);
                if (text.length > 0)
                    ret.push(text);
            }
        }
        return ret;
    }
}

module.exports = HtmlSpliter;