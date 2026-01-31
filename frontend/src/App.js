import { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  // Progress simulation
  useEffect(() => {
    if (!loading) return;

    setProgress(10);
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 90 ? prev : prev + 10));
    }, 400);

    return () => clearInterval(interval);
  }, [loading]);

  const uploadPDF = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Google Analytics event
    if (window.gtag) {
      window.gtag("event", "pdf_uploaded");
    }

    setItems([]);
    setErrorMsg("");
    setLoading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("pdf", file);

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/upload`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const extracted = res.data.items || [];

      if (!extracted.length) {
        setErrorMsg(
          "This PDF appears to be scanned or image-based. Please upload a text-based RFQ or PR."
        );
      } else {
        setItems(extracted.map((i) => ({ ...i, include: true })));
      }
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        "Error while processing PDF. Please try again.";
      setErrorMsg(msg);
    }

    setProgress(100);
    setTimeout(() => setLoading(false), 400);
  };

  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const downloadExcel = async () => {
    if (window.gtag) {
      window.gtag("event", "excel_downloaded");
    }

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/download`,
        { items },
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = "materials.xlsx";
      link.click();
    } catch {
      alert("Failed to download Excel");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f6f7fb" }}>
      <div style={header}>RFQ to Excel Converter</div>

      <div style={hero}>
        <h1 style={title}>RFQ to Excel Converter</h1>
        <p style={tagline}>
          Turn messy construction RFQs into clean, supplier-ready Excel — instantly
        </p>

        <label style={uploadBtn}>
          Upload RFQ / PR PDF
          <input
            type="file"
            accept="application/pdf"
            onChange={uploadPDF}
            hidden
          />
        </label>

        {loading && (
          <div style={progressWrapper}>
            <p style={progressText}>Reading and analyzing document…</p>
            <div style={progressBg}>
              <div style={{ ...progressFill, width: `${progress}%` }} />
            </div>
          </div>
        )}

        {errorMsg && <p style={error}>{errorMsg}</p>}
      </div>

      <div style={howItWorks}>
        <h2>How it works</h2>
        <div style={steps}>
          <Step n="1" t="Upload RFQ PDF" d="Any construction RFQ or PR" />
          <Step n="2" t="Review Items" d="Description, size, qty & UOM" />
          <Step n="3" t="Download Excel" d="Clean supplier-ready sheet" />
        </div>
      </div>

      {items.length > 0 && (
        <div style={toolCard}>
          <div style={{ overflowX: "auto" }}>
            <table style={table}>
              <thead>
                <tr>
                  <th>Include</th>
                  <th>Description</th>
                  <th>Size</th>
                  <th>Qty</th>
                  <th>UOM</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i}>
                    <td style={{ textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={item.include}
                        onChange={(e) =>
                          updateItem(i, "include", e.target.checked)
                        }
                      />
                    </td>
                    <td>
                      <input
                        style={input}
                        value={item.description_raw || ""}
                        onChange={(e) =>
                          updateItem(i, "description_raw", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        style={input}
                        value={item.size_raw || ""}
                        onChange={(e) =>
                          updateItem(i, "size_raw", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        style={input}
                        value={item.quantity_raw || ""}
                        onChange={(e) =>
                          updateItem(i, "quantity_raw", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        style={input}
                        value={item.uom_raw || ""}
                        onChange={(e) =>
                          updateItem(i, "uom_raw", e.target.value)
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button style={downloadBtn} onClick={downloadExcel}>
            Download Excel
          </button>
        </div>
      )}
    </div>
  );
}

const Step = ({ n, t, d }) => (
  <div style={stepCard}>
    <div style={stepNumber}>{n}</div>
    <div>
      <strong>{t}</strong>
      <p>{d}</p>
    </div>
  </div>
);

/* styles unchanged */
export default App;
