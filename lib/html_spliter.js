const xml = require('xml');
const { Readability } = require('@mozilla/readability');
const { compile } = require('html-to-text');

const convert = compile({
    wordwrap: false
});

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
        if (tds.length == 0 && titles.length == 0)
            tds = trs[i].getElementsByTagName('TH');

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
                item += (titles[j] ? titles[j] + ": " : "") + clean_content(tds[j].textContent);
                if (j < tds.length - 1)
                    item += "；";
                else if (item.substr(-1) != "。")
                    item += "。";
            }
            items.push(item);
        }
    }

    return items;
}

function remove_tag(html, tag) {
    const nodes = html.body.getElementsByTagName(tag);
    for (var i = 0; i < nodes.length; i++)
        nodes[i].parentNode.removeChild(nodes[i]);
}

class HtmlSpliter {
    constructor(opts) {
        this.opts = {
            ...opts
        }
    }

    split(html) {
        html = html instanceof xml.Document ? html : xml.parse(html, "text/html");
        if (!this.opts.skip_readability) {
            const reader = new Readability(html);
            const article = reader.parse();
            if (article === null) {
                console.log("article is null");
                return [];
            }

            html = xml.parse(article.content, "text/html");
        }

        if (this.opts.before_split)
            article.content = this.opts.before_split(html);

        remove_tag(html, 'IMG');
        if (this.opts.ignore_tags)
            this.opts.ignore_tags.forEach(function (tag) {
                remove_tag(html, tag);
            });

        const tables = html.body.getElementsByTagName('TABLE');
        for (var i = 0; i < tables.length; i++) {
            var table = tables[i];
            var items = normal_table(table);
            if (items) {
                var parentNode = table.parentNode;
                var div = html.createElement('div');
                div.innerHTML = items.join('<br>\n');
                parentNode.replaceChild(div, table);
            }
        }

        var text = convert(html.toString());
        return text.split(/[\r\n]+/g).map(line => line.trim()).filter(line => line.length > 0);
    }
}

module.exports = HtmlSpliter;