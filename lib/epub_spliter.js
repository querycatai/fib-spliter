const xml = require('xml');
const zip = require('zip');

class EPubSpliter {
    constructor(opts) {
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

        const ret = [];

        for (var i = 0; i < itemrefs.length; i++) {
            var itemref = itemrefs[i];
            var idref = itemref.getAttribute("idref");

            var htmldoc = xml.parse(epub.read(item_map[idref]), "text/html");
            var nodes = htmldoc.body.childNodes;

            for (var j = 0; j < nodes.length; j++) {
                var text = nodes[j].textContent.replace(/[ \r\n]+$/g, '');
                text = text.replace(/[\r\n]+/g, '\n');
                text = text.trim();
                if (text.length > 0)
                    ret.push(text);
            }
        }

        return ret;
    }
}

module.exports = EPubSpliter;