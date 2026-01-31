const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const OpenAI = require("openai");
const ExcelJS = require("exceljs");

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));

const upload = multer({ dest: "uploads/" });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ---------------- PDF UPLOAD & AI EXTRACTION ----------------
app.post("/upload", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF uploaded" });
    }

    const buffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(buffer);
    const text = pdfData.text;

    const systemPrompt = fs.readFileSync("./ai/system_prompt.txt", "utf8");
    const extractionPromptTemplate = fs.readFileSync(
      "./ai/item_extraction_prompt.txt",
      "utf8"
    );

    const extractionPrompt = extractionPromptTemplate.replace(
      "<<<PDF_TEXT_HERE>>>",
      text
    );

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: extractionPrompt }
      ],
      temperature: 0
    });

    let rawContent = response.choices[0].message.content;

// Remove control characters that break JSON
// Remove only truly dangerous control characters, keep Unicode (Arabic-safe)
rawContent = rawContent.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");

// Try to extract JSON block only
const jsonMatch = rawContent.match(/\{[\s\S]*\}/);

if (!jsonMatch) {
  console.error("AI response did not contain JSON:", rawContent);
  return res.json({ items: [] });
}

let parsed;
try {
  parsed = JSON.parse(jsonMatch[0]);
} catch (err) {
  console.error("JSON PARSE FAILED:", jsonMatch[0]);
  return res.json({ items: [] });
}

res.json({ items: parsed.items || [] });


  } catch (err) {
    console.error("BACKEND ERROR:", err);
    res.status(500).json({ error: "Backend processing failed" });
  }
});

// ---------------- EXCEL DOWNLOAD ----------------
app.post("/download", async (req, res) => {
  try {
    const items = req.body.items || [];

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Materials");

    // -------- COLUMNS --------
    sheet.columns = [
      { header: "Sl. No", key: "slno", width: 8 },
      { header: "Description", key: "description", width: 50 },
      { header: "Size", key: "size", width: 15 },
      { header: "Quantity", key: "quantity", width: 12 },
      { header: "UOM", key: "uom", width: 10 },
      { header: "Unit Price", key: "unit_price", width: 15 },
      { header: "Total Price", key: "total_price", width: 18 }
    ];

    let rowNumber = 1;
    const startDataRow = 2;

    // -------- DATA ROWS --------
    items
      .filter((i) => i.include)
      .forEach((i) => {
        const excelRowNumber = startDataRow + rowNumber - 1;

        sheet.addRow({
          slno: rowNumber,
          description: i.description_raw,
          size: i.size_raw,
          quantity: Number(i.quantity_raw) || 0,
          uom: i.uom_raw,
          unit_price: null,
          total_price: {
            formula: `IF(F${excelRowNumber}="","",F${excelRowNumber}*D${excelRowNumber})`
          }
        });

        rowNumber++;
      });

    // -------- GRAND TOTAL --------
    const lastDataRow = startDataRow + rowNumber - 2;

    const totalRow = sheet.addRow({
      slno: "",
      description: "GRAND TOTAL",
      size: "",
      quantity: "",
      uom: "",
      unit_price: "",
      total_price: {
        formula: `SUM(G${startDataRow}:G${lastDataRow})`
      }
    });

    totalRow.font = { bold: true };

    // -------- CENTER ALIGN ALL CELLS --------
    sheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.alignment = {
          horizontal: "center",
          vertical: "middle",
          wrapText: true
        };
      });
    });

    // -------- AUTO COLUMN WIDTH --------
    sheet.columns.forEach((column) => {
      let maxLength = 10;

      column.eachCell({ includeEmpty: true }, (cell) => {
        const value = cell.value ? cell.value.toString() : "";
        maxLength = Math.max(maxLength, value.length);
      });

      column.width = maxLength + 4;
    });

    // -------- HEADER FONT --------
    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = {
        bold: true,
        size: 18
      };
    });

    // -------- DATA FONT --------
    sheet.eachRow((row, rowNum) => {
      if (rowNum !== 1) {
        row.eachCell((cell) => {
          cell.font = {
            size: 14,
            bold: cell.font?.bold || false
          };
        });
      }
    });
    // -------- FORCE UNIT PRICE FONT SIZE (COLUMN F) --------
sheet.getColumn("F").eachCell({ includeEmpty: true }, (cell, rowNumber) => {
    if (rowNumber !== 1) {
      cell.font = {
        size: 14,
        bold: false
      };
    }
  });  

    // -------- HEADER BORDER (SOLID) --------
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" }
      };
    });

    // -------- DATA + TOTAL BORDER (DOTTED) --------
    sheet.eachRow((row, rowNum) => {
      if (rowNum > 1) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "dotted" },
            left: { style: "dotted" },
            bottom: { style: "dotted" },
            right: { style: "dotted" }
          };
        });
      }
    });

    // -------- SEND FILE --------
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=materials.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error("EXCEL ERROR:", err);
    res.status(500).json({ error: "Excel export failed" });
  }
});

app.listen(4000, () => {
  console.log("Backend running on http://localhost:4000");
});
