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

function normal_table(node) {
    const trs = node.getElementsByTagName('TR');
    if (trs.length == 0)
        return null;

    var titles = [];
    var items = [];

    for (var i = 0; i < trs.length; i++) {
        var tds = trs[i].getElementsByTagName('TD');
        if (tds.length == 0)
            continue;
        if (titles.length == 0) {
            for (var j = 0; j < tds.length; j++) {
                titles.push(clean_content(tds[j].textContent));
            }
        } else if (tds.length != titles.length)
            return null;
        else {
            var item = "";
            for (var j = 0; j < tds.length; j++) {
                item += titles[j] + ": " + clean_content(tds[j].textContent);
                if (j < tds.length - 1)
                    item += "；";
                else
                    item += "。";
            }
            items.push(item);
        }
    }

    console.log(items);
    return items;
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

        var ret = [];
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            if (node.tagName === 'TABLE') {
                var items = normal_table(node);
                if (items)
                    ret = ret.concat(items);
                else
                    ret.push(clean_content(NodeHtmlMarkdown.translate(node.toString())));
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