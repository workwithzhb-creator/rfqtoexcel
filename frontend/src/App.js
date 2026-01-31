import { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

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

      if (extracted.length === 0) {
        setErrorMsg(
          "This PDF appears to be scanned or image-based. Please upload a text-based RFQ or PR PDF."
        );
      } else {
        setItems(extracted.map((i) => ({ ...i, include: true })));
      }
    } catch {
      setErrorMsg("Error while processing PDF. Please try again.");
    }

    setProgress(100);
    setTimeout(() => setLoading(false), 300);
  };

  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const downloadExcel = async () => {
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/download`,
        { items },
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(
        new Blob([res.data], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        })
      );

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "materials.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
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
          <input type="file" accept="application/pdf" onChange={uploadPDF} hidden />
        </label>

        {loading && (
          <div style={{ margin: "20px auto", width: 320 }}>
            <p style={{ fontSize: 14, color: "#6b7280" }}>
              Reading and understanding document…
            </p>
            <div style={progressBg}>
              <div style={{ ...progressFill, width: `${progress}%` }} />
            </div>
          </div>
        )}

        {errorMsg && (
          <p style={{ color: "#dc2626", marginTop: 16, textAlign: "center" }}>
            {errorMsg}
          </p>
        )}
      </div>

      <div style={howItWorks}>
        <h2>How it works</h2>
        <div style={steps}>
          <Step n="1" t="Upload RFQ PDF" d="Any construction RFQ or PR" />
          <Step n="2" t="Review Items" d="Description, size, qty & UOM" />
          <Step n="3" t="Download Excel" d="Clean, supplier-ready sheet" />
        </div>
      </div>

      {items.length > 0 && (
        <div style={toolCard}>
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
              {items.map((i, idx) => (
                <tr key={idx}>
                  <td>
                    <input
                      type="checkbox"
                      checked={i.include}
                      onChange={(e) =>
                        updateItem(idx, "include", e.target.checked)
                      }
                    />
                  </td>
                  <td><input value={i.description_raw || ""} onChange={(e) => updateItem(idx, "description_raw", e.target.value)} /></td>
                  <td><input value={i.size_raw || ""} onChange={(e) => updateItem(idx, "size_raw", e.target.value)} /></td>
                  <td><input value={i.quantity_raw || ""} onChange={(e) => updateItem(idx, "quantity_raw", e.target.value)} /></td>
                  <td><input value={i.uom_raw || ""} onChange={(e) => updateItem(idx, "uom_raw", e.target.value)} /></td>
                </tr>
              ))}
            </tbody>
          </table>

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
    <div style={stepNum}>{n}</div>
    <div>
      <strong>{t}</strong>
      <p>{d}</p>
    </div>
  </div>
);

/* STYLES */
const header = { padding: 16, background: "#fff", fontWeight: 600 };
const hero = { textAlign: "center", padding: 60 };
const title = { fontSize: 36 };
const tagline = { fontSize: 18, color: "#555" };
const uploadBtn = { padding: 16, background: "#2563eb", color: "#fff", borderRadius: 8, cursor: "pointer" };
const progressBg = { height: 8, background: "#e5e7eb", borderRadius: 4 };
const progressFill = { height: "100%", background: "#2563eb" };
const howItWorks = { background: "#fff", padding: 40, textAlign: "center" };
const steps = { display: "flex", justifyContent: "center", gap: 24 };
const stepCard = { background: "#f9fafb", padding: 20, borderRadius: 8, display: "flex", gap: 12 };
const stepNum = { width: 32, height: 32, background: "#2563eb", color: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" };
const toolCard = { maxWidth: 1100, margin: "40px auto", background: "#fff", padding: 32 };
const table = { width: "100%", borderCollapse: "collapse" };
const downloadBtn = { padding: 14, background: "#16a34a", color: "#fff", borderRadius: 8, cursor: "pointer" };

export default App;
