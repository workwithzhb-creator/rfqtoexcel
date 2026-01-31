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
      setProgress((p) => (p >= 90 ? p : p + 10));
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

      const extractedItems = res.data.items || [];
      if (!extractedItems.length) {
        setErrorMsg("This PDF appears to be scanned or image-based.");
      } else {
        setItems(extractedItems.map((i) => ({ ...i, include: true })));
      }
    } catch {
      setErrorMsg("Failed to process PDF.");
    }

    setProgress(100);
    setTimeout(() => setLoading(false), 300);
  };

  const downloadExcel = async () => {
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/download`,
        { items },
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "materials.xlsx";
      a.click();
    } catch {
      alert("Failed to download Excel");
    }
  };

  return (
    <div>
      <header style={header}>RFQ to Excel Converter</header>

      <section style={hero}>
        <h1 style={title}>RFQ to Excel Converter</h1>
        <p style={tagline}>
          Turn messy construction RFQs into clean, supplier-ready Excel — instantly
        </p>

        <label style={uploadBtn}>
          Upload RFQ / PR PDF
          <input type="file" accept="application/pdf" hidden onChange={uploadPDF} />
        </label>

        {loading && (
          <div style={{ width: 320, marginTop: 20 }}>
            <div style={progressBg}>
              <div style={{ ...progressFill, width: `${progress}%` }} />
            </div>
          </div>
        )}

        {errorMsg && <p style={{ color: "#dc2626", marginTop: 20 }}>{errorMsg}</p>}
      </section>

      <section style={how}>
        <h2>How it works</h2>
        <div style={steps}>
          <Step n="1" t="Upload RFQ PDF" d="Any construction RFQ or PR" />
          <Step n="2" t="Review Items" d="Description, size, qty & UOM" />
          <Step n="3" t="Download Excel" d="Clean supplier-ready sheet" />
        </div>
      </section>

      {items.length > 0 && (
        <div style={tool}>
          <button style={downloadBtn} onClick={downloadExcel}>
            Download Excel
          </button>
        </div>
      )}
    </div>
  );
}

const Step = ({ n, t, d }) => (
  <div style={step}>
    <div style={circle}>{n}</div>
    <div>
      <strong>{t}</strong>
      <p>{d}</p>
    </div>
  </div>
);

/* ---------- STYLES ---------- */

const header = {
  padding: "16px 32px",
  fontWeight: 600,
  background: "#fff",
  borderBottom: "1px solid #e5e7eb"
};

const hero = {
  textAlign: "center",
  padding: "80px 20px"
};

const title = { fontSize: 42, marginBottom: 12 };
const tagline = { color: "#4b5563", fontSize: 18, marginBottom: 32 };

const uploadBtn = {
  background: "#2563eb",
  color: "#fff",
  padding: "16px 36px",
  borderRadius: 10,
  cursor: "pointer",
  fontSize: 18,
  fontWeight: 500
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
  transition: "width 0.3s"
};

const how = {
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

const step = {
  display: "flex",
  gap: 16,
  background: "#f9fafb",
  padding: 24,
  borderRadius: 12,
  width: 280,
  textAlign: "left"
};

const circle = {
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

const tool = {
  display: "flex",
  justifyContent: "center",
  padding: 40
};

const downloadBtn = {
  background: "#16a34a",
  color: "#fff",
  padding: "16px 40px",
  borderRadius: 10,
  border: "none",
  fontSize: 18,
  cursor: "pointer"
};

export default App;
