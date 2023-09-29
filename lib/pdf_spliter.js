const util = require('util');
const PDFExtract = require('pdf.js-extract').PDFExtract;

const pdfExtract = new PDFExtract();
pdfExtract.extractBufferSync = util.sync(pdfExtract.extractBuffer, true);

class PdfSpliter {
    constructor() {
    }

    split(data) {
        function clean_empty_node(data) {
            data.pages.forEach(page => {
                for (var i = 0; i < page.content.length; i++) {
                    var node = page.content[i];
                    if (node.width == 0) {
                        page.content.splice(i, 1);
                        i--;
                        continue;
                    }
                }
            });
        }

        function concat_node(data) {
            data.pages.forEach(page => {
                for (var i = 0; i < page.content.length; i++) {
                    var fontNames = {};

                    var node = page.content[i];
                    fontNames[node.fontName] = node.width;

                    while (i < page.content.length - 1) {
                        var node1 = page.content[i + 1];

                        if (Math.abs((node.y - node.height) - (node1.y - node1.height)) < 2
                            && node1.x >= node.x
                            && node1.x < node.x + node.width + node.height) {
                            if (fontNames[node1.fontName] == null)
                                fontNames[node1.fontName] = node1.width;
                            else
                                fontNames[node1.fontName] += node1.width;

                            node.width = node1.x + node1.width - node.x;
                            node.str += node1.str;
                            page.content.splice(i + 1, 1);
                        } else
                            break;
                    }

                    var fonts = Object.keys(fontNames);
                    if (fonts.length > 1) {
                        var f = fonts[0];
                        for (var i = 1; i < fonts.length; i++)
                            if (fontNames[fonts[i]] > fontNames[f])
                                f = fonts[i];
                        node.fontName = f;
                    }
                }
            });
        }

        var numStr = /^[0-9]+$/g;
        function clean_number(data) {
            var cleaned = false;

            data.pages.forEach(page => {
                if (page.content.length > 0 && numStr.test(page.content[0].str)) {
                    page.content.splice(0, 1);
                    cleaned = true;
                }
                if (page.content.length > 0 && numStr.test(page.content[page.content.length - 1].str)) {
                    page.content.splice(page.content.length - 1, 1);
                    cleaned = true;
                }
            });

            return cleaned;
        }

        function clean_header(data) {
            var cleaned = false;
            var test_str = {};

            data.pages.forEach(page => {
                if (page.content.length > 0) {
                    var str = page.content[0].str;
                    if (test_str[str] == null)
                        test_str[str] = 1;
                    else
                        test_str[str]++;
                }
            });

            data.pages.forEach(page => {
                if (page.content.length > 0) {
                    var str = page.content[0].str;
                    if (test_str[str] > 2) {
                        page.content.splice(0, 1);
                        cleaned = true;
                    }
                }
            });

            return cleaned;
        }

        function clean_footer(data) {
            var cleaned = false;
            var test_str = {};

            data.pages.forEach(page => {
                if (page.content.length > 0) {
                    var str = page.content[page.content.length - 1].str;
                    if (test_str[str] == null)
                        test_str[str] = 1;
                    else
                        test_str[str]++;
                }
            });

            data.pages.forEach(page => {
                if (page.content.length > 0) {
                    var str = page.content[page.content.length - 1].str;
                    if (test_str[str] > 2) {
                        page.content.splice(page.content.length - 1, 1);
                        cleaned = true;
                    }
                }
            });

            return cleaned;
        }

        function concat_line(data) {
            const end = '.!?:;。！？：；';
            var lines = [];
            var last_node;

            data.pages.forEach(page => {
                if (last_node)
                    last_node.y = -1;

                page.content.forEach(node => {
                    if (!last_node) {
                        var str = node.str;
                        var ch = str.substr(str.length - 1);

                        if (end.indexOf(ch) >= 0)
                            lines.push(str);
                        else
                            last_node = node;
                    } else {
                        if (node.y < last_node.y ||
                            (last_node.fontName != node.fontName && Math.abs(last_node.height - node.height) > 1)) {
                            lines.push(last_node.str);
                            last_node = node;
                        } else {
                            var str = node.str;
                            var ch = str.substr(str.length - 1);

                            if (end.indexOf(ch) >= 0) {
                                lines.push(last_node.str + str);
                                last_node = null;
                            } else {
                                last_node.y = node.y;
                                last_node.str += str;
                            }
                        }
                    }
                });
            });

            if (last_node)
                lines.push(last_node.str);

            return lines;
        }

        data = pdfExtract.extractBufferSync(data);

        clean_empty_node(data);
        concat_node(data);
        while (clean_number(data) || clean_header(data) || clean_footer(data));
        return concat_line(data);
    }
}

module.exports = PdfSpliter;