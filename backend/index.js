const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const OpenAI = require("openai");
const ExcelJS = require("exceljs");
const rateLimit = require("express-rate-limit");

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));

/* ===================== RATE LIMIT (3 PDFs / DAY / IP) ===================== */
const uploadLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3,
  message: {
    error: "Daily upload limit reached (3 PDFs/day). Please try again tomorrow."
  }
});

/* ===================== MULTER (PDF SIZE + TYPE PROTECTION) ===================== */
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      cb(new Error("Only PDF files are allowed"), false);
    } else {
      cb(null, true);
    }
  }
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* ===================== PDF UPLOAD ===================== */
app.post(
  "/upload",
  uploadLimiter,
  upload.single("pdf"),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ items: [] });

      const buffer = fs.readFileSync(req.file.path);
      const pdfData = await pdfParse(buffer);
      const text = pdfData.text || "";

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

      // Remove unsafe control characters (Arabic-safe)
      rawContent = rawContent.replace(
        /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,
        ""
      );

      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return res.json({ items: [] });

      let parsed;
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        return res.json({ items: [] });
      }

      res.json({ items: parsed.items || [] });
    } catch (err) {
      console.error("UPLOAD ERROR:", err);
      res.status(500).json({ items: [] });
    }
  }
);

/* ===================== EXCEL DOWNLOAD ===================== */
app.post("/download", async (req, res) => {
  try {
    const items = req.body.items || [];

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Materials");

    sheet.columns = [
      { header: "Sl. No", key: "slno", width: 8 },
      { header: "Description", key: "description", width: 50 },
      { header: "Size", key: "size", width: 15 },
      { header: "Quantity", key: "quantity", width: 12 },
      { header: "UOM", key: "uom", width: 10 },
      { header: "Unit Price", key: "unit_price", width: 15 },
      { header: "Total Price", key: "total_price", width: 18 }
    ];

    const startDataRow = 2;
    let rowNumber = 1;

    items.filter(i => i.include).forEach(i => {
      const excelRow = startDataRow + rowNumber - 1;

      sheet.addRow({
        slno: rowNumber,
        description: i.description_raw,
        size: i.size_raw,
        quantity: Number(i.quantity_raw) || 0,
        uom: i.uom_raw,
        unit_price: "",
        total_price: {
          formula: `IF(F${excelRow}="","",F${excelRow}*D${excelRow})`
        }
      });

      rowNumber++;
    });

    const lastDataRow = startDataRow + rowNumber - 2;

    const totalRow = sheet.addRow({
      slno: "",
      description: "GRAND TOTAL",
      total_price: {
        formula: `SUM(G${startDataRow}:G${lastDataRow})`
      }
    });

    totalRow.font = { bold: true };

    sheet.getColumn(4).alignment = { horizontal: "center", vertical: "middle" };
    sheet.getColumn(5).alignment = { horizontal: "center", vertical: "middle" };
    sheet.getColumn(6).alignment = { horizontal: "center", vertical: "middle" };
    sheet.getColumn(7).alignment = { horizontal: "center", vertical: "middle" };

    sheet.eachRow(row => {
      row.eachCell(cell => {
        cell.alignment = {
          ...cell.alignment,
          wrapText: true,
          vertical: "middle"
        };
      });
    });

    const headerRow = sheet.getRow(1);
    headerRow.eachCell(cell => {
      cell.font = { bold: true, size: 18 };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" }
      };
    });

    sheet.eachRow((row, rowNum) => {
      if (rowNum > 1) {
        row.eachCell(cell => {
          cell.font = { size: 14 };
          cell.border = {
            top: { style: "dotted" },
            left: { style: "dotted" },
            bottom: { style: "dotted" },
            right: { style: "dotted" }
          };
        });
      }
    });

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

/* ===================== SERVER ===================== */
app.listen(4000, () => {
  console.log("Backend running on http://localhost:4000");
});
