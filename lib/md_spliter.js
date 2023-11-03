const xml = require('xml');
const marked = require('marked');
const HtmlSpliter = require('./html_spliter');

class MarkdownSpliter {
    constructor(opts) {
        this.opts = {
            ...opts
        }
    }

    split(md) {
        const spliter = new HtmlSpliter({
            ...this.opts,
            skip_readability: true
        });
        return spliter.split(marked.parse(md.toString()));
    }
}

module.exports = MarkdownSpliter;