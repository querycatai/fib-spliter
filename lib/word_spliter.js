const xml = require('xml');
const path = require('path').posix;
const zip = require('zip');
const HtmlSpliter = require('./html_spliter');

class WordSpliter {
    constructor(opts) {
        this.opts = {
            ...opts
        }
    }

    split(docx_data) {
        function convertToHtml(xml_data) {
            function converNode(xml_node, html_node, tagName) {
                if (tagName) {
                    const new_node = htmldoc.createElement(tagName);
                    html_node.appendChild(new_node);
                    html_node = new_node;
                }

                const nodes = xml_node.childNodes;
                for (var i = 0; i < nodes.length; i++) {
                    var node = nodes[i];
                    const tagName = node.nodeName;

                    switch (tagName) {
                        case 'w:body':
                            converNode(node, html_node, "body");
                            break;
                        case 'w:p':
                            converNode(node, html_node, "p");
                            break;
                        case 'w:r':
                            converNode(node, html_node);
                            break;
                        case 'w:t':
                            html_node.appendChild(htmldoc.createTextNode(node.textContent));
                            break;
                        case 'w:br':
                            html_node.appendChild(htmldoc.createElement("br"));
                            break;
                        case 'w:hyperlink':
                            var href = node.getAttribute("w:anchor");
                            if (href) {
                                var a = htmldoc.createElement("a");
                                a.setAttribute("href", href);
                                converNode(node, a);
                                html_node.appendChild(a);
                            }
                            break;
                        case 'w:tbl':
                            converNode(node, html_node, "table");
                            break;
                        case 'w:tr':
                            converNode(node, html_node, "tr");
                            break;
                        case 'w:tc':
                            converNode(node, html_node, "td");
                            break;
                        case 'w:gridSpan':
                            var span = node.getAttribute("w:val");
                            if (span) {
                                html_node.setAttribute("colspan", span);
                            }
                            break;
                        case 'w:sz':
                            var size = node.getAttribute("w:val");
                            if (size) {
                                html_node.setAttribute("style", "font-size:" + size + "pt");
                            }
                            break;
                        case 'w:jc':
                            var align = node.getAttribute("w:val");
                            if (align) {
                                html_node.setAttribute("align", align);
                            }
                            break;
                        case 'a:blip':
                            var embed = node.getAttribute("r:embed");
                            if (embed) {
                                embed = refs[embed];
                                var img = htmldoc.createElement("img");
                                var ext = path.extname(embed).substring(1);
                                var png = docx.read(embed);
                                img.setAttribute("src", `data:image/${ext};base64,` + png.base64());
                                html_node.appendChild(img);
                            }
                            break;
                        default:
                            converNode(node, html_node);
                    }
                }
            }

            const xmldoc = xml.parse(xml_data);
            const htmldoc = new xml.Document('text/html');
            htmldoc.appendChild(htmldoc.createElement("html"));

            converNode(xmldoc.documentElement, htmldoc.documentElement);

            return htmldoc;
        }

        function get_refs() {
            const xmldoc = xml.parse(docx.read("word/_rels/document.xml.rels"), 'text/xml');
            var refs = xmldoc.documentElement.childNodes;

            const ret = {};
            for (var i = 0; i < refs.length; i++) {
                var ref = refs[i];
                var id = ref.getAttribute("Id");
                var target = ref.getAttribute("Target");
                ret[id] = path.join("word", target);
            }

            return ret;
        }

        var docx = zip.open(docx_data);

        const refs = get_refs();
        const spliter = new HtmlSpliter(this.opts);
        return spliter.split(convertToHtml(docx.read("word/document.xml")));
    }
}

module.exports = WordSpliter;