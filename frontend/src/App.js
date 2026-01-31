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

    // GA event
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
      {/* HEADER */}
      <div style={header}>RFQ to Excel Converter</div>

      {/* HERO */}
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

        {/* PROGRESS (CENTERED, FIXED WIDTH) */}
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

      {/* HOW IT WORKS */}
      <div style={howItWorks}>
        <h2>How it works</h2>
        <div style={steps}>
          <Step n="1" t="Upload RFQ PDF" d="Any construction RFQ or PR" />
          <Step n="2" t="Review Items" d="Description, size, qty & UOM" />
          <Step n="3" t="Download Excel" d="Clean supplier-ready sheet" />
        </div>
      </div>

      {/* REVIEW TABLE */}
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

/* ---------- SMALL COMPONENT ---------- */
const Step = ({ n, t, d }) => (
  <div style={stepCard}>
    <div style={stepNumber}>{n}</div>
    <div>
      <strong>{t}</strong>
      <p>{d}</p>
    </div>
  </div>
);

/* ---------- STYLES (ORIGINAL RESTORED) ---------- */

const header = {
  padding: "16px 32px",
  background: "#fff",
  borderBottom: "1px solid #e5e7eb",
  fontWeight: 600
};

const hero = {
  textAlign: "center",
  padding: "80px 20px"
};

const title = { fontSize: 40, marginBottom: 12 };
const tagline = { fontSize: 18, color: "#4b5563", marginBottom: 32 };

const uploadBtn = {
  padding: "16px 36px",
  background: "#2563eb",
  color: "#fff",
  borderRadius: 10,
  cursor: "pointer",
  fontSize: 18
};

const progressWrapper = {
  marginTop: 24,
  width: 320,
  marginLeft: "auto",
  marginRight: "auto"
};

const progressText = {
  fontSize: 14,
  color: "#6b7280",
  marginBottom: 8,
  textAlign: "center"
};

const progressBg = {
  height: 8,
  background: "#e5e7eb",
  borderRadius: 6,
  overflow: "hidden"
};

const progressFill = {
  height: "100%",
  background: "#2563eb",
  transition: "width 0.3s ease"
};

const error = {
  color: "#dc2626",
  marginTop: 20,
  textAlign: "center"
};

const howItWorks = {
  background: "#fff",
  padding: "60px 20px",
  textAlign: "center"
};

const steps = {
  display: "flex",
  justifyContent: "center",
  gap: 24,
  marginTop: 32,
  flexWrap: "wrap"
};

const stepCard = {
  display: "flex",
  gap: 16,
  background: "#f9fafb",
  padding: 24,
  borderRadius: 12,
  width: 280,
  textAlign: "left"
};

const stepNumber = {
  width: 32,
  height: 32,
  borderRadius: "50%",
  background: "#2563eb",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 600
};

const toolCard = {
  maxWidth: 1200,
  margin: "40px auto",
  background: "#fff",
  padding: 32,
  borderRadius: 12,
  boxShadow: "0 10px 25px rgba(0,0,0,0.06)"
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
  marginBottom: 24
};

const input = {
  width: "100%",
  padding: "6px 8px",
  border: "1px solid #d1d5db",
  borderRadius: 6
};

const downloadBtn = {
  padding: "16px 40px",
  background: "#16a34a",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  fontSize: 18,
  cursor: "pointer"
};

export default App;
