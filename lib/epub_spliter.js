const xml = require('xml');
const zip = require('zip');
const HtmlSpliter = require('./html_spliter');

class EPubSpliter {
    constructor(opts) {
        this.opts = {
            ...opts
        }
    }

    split(epub_data) {
        var epub = zip.open(epub_data);
        var files = epub.namelist();
        var opf_file;

        for (var i = 0; i < files.length; i++) {
            opf_file = files[i];
            if (opf_file.substr(-4) == ".opf")
                break;
        }

        const opfdoc = xml.parse(epub.read(opf_file));

        const items = opfdoc.getElementsByTagName("manifest")[0].getElementsByTagName("item");
        const itemrefs = opfdoc.getElementsByTagName("spine")[0].getElementsByTagName("itemref");

        const item_map = {};

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var id = item.getAttribute("id");
            var href = item.getAttribute("href");
            item_map[id] = href;
        }

        const spliter = new HtmlSpliter(this.opts);

        var ret = [];
        for (var i = 0; i < itemrefs.length; i++) {
            var itemref = itemrefs[i];
            var idref = itemref.getAttribute("idref");

            ret = ret.concat(spliter.split(epub.read(item_map[idref])));
        }

        return ret;
    }
}

module.exports = EPubSpliter;