const XLSX = require("xlsx");

class ExcelSpliter {
    constructor(opts) {
        this.opts = {
            ...opts
        }
    }

    split(xlsx_data) {
        var workbook = XLSX.read(xlsx_data);
        var lines = [];

        for (var sheetName in workbook.Sheets) {
            XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]).forEach(function (row) {
                var txts = [];
                for (var key in row)
                    txts.push(`${key}: ${row[key]}`);
                lines.push(txts.join("；") + "。");
            });
        }

        return lines;
    }
};


module.exports = ExcelSpliter;