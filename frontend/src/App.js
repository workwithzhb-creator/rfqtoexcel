import { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  // Fake progress bar logic
  useEffect(() => {
    if (!loading) return;

    setProgress(10);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
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

      if (extractedItems.length === 0) {
        setErrorMsg(
          "This PDF appears to be scanned or image-based. Please upload a text-based RFQ or PR PDF."
        );
      } else {
        const withFlags = extractedItems.map((item) => ({
          ...item,
          include: true
        }));
        setItems(withFlags);
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
    } catch (err) {
      console.error(err);
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
            style={{ display: "none" }}
          />
        </label>

        {loading && (
          <div style={{ margin: "20px auto 0", width: 320 }}>
            <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 8 }}>
              Reading and understanding document…
            </p>
            <div style={progressBarBg}>
              <div
                style={{
                  ...progressBarFill,
                  width: `${progress}%`
                }}
              />
            </div>
          </div>
        )}

        {errorMsg && (
          <p
            style={{
              margin: "20px auto 0",
              color: "#dc2626",
              maxWidth: 420,
              textAlign: "center",
              fontSize: 14
            }}
          >
            {errorMsg}
          </p>
        )}
      </div>

      {/* HOW IT WORKS */}
      <div style={howItWorks}>
        <h2 style={{ marginBottom: 24 }}>How it works</h2>

        <div style={steps}>
          <div style={stepCard}>
            <div style={stepNumber}>1</div>
            <div>
              <strong>Upload RFQ PDF</strong>
              <p>Upload any construction RFQ or PR</p>
            </div>
          </div>

          <div style={stepCard}>
            <div style={stepNumber}>2</div>
            <div>
              <strong>Review extracted items</strong>
              <p>Check description, size, quantity & UOM</p>
            </div>
          </div>

          <div style={stepCard}>
            <div style={stepNumber}>3</div>
            <div>
              <strong>Download Excel</strong>
              <p>Get a clean, supplier-ready Excel</p>
            </div>
          </div>
        </div>
      </div>

      {/* TOOL */}
      {items.length > 0 && (
        <div style={toolCard}>
          <div style={{ overflowX: "auto" }}>
            <table style={table}>
              <thead>
                <tr style={{ background: "#f3f4f6" }}>
                  <th style={th}>Include</th>
                  <th style={th}>Description</th>
                  <th style={th}>Size</th>
                  <th style={th}>Qty</th>
                  <th style={th}>UOM</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i}>
                    <td style={tdCenter}>
                      <input
                        type="checkbox"
                        checked={item.include}
                        onChange={(e) =>
                          updateItem(i, "include", e.target.checked)
                        }
                      />
                    </td>
                    <td style={td}>
                      <input
                        style={input}
                        value={item.description_raw || ""}
                        onChange={(e) =>
                          updateItem(i, "description_raw", e.target.value)
                        }
                      />
                    </td>
                    <td style={td}>
                      <input
                        style={input}
                        value={item.size_raw || ""}
                        onChange={(e) =>
                          updateItem(i, "size_raw", e.target.value)
                        }
                      />
                    </td>
                    <td style={td}>
                      <input
                        style={input}
                        value={item.quantity_raw || ""}
                        onChange={(e) =>
                          updateItem(i, "quantity_raw", e.target.value)
                        }
                      />
                    </td>
                    <td style={td}>
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

/* ---------- STYLES ---------- */

const header = {
  padding: "16px 32px",
  fontSize: 18,
  fontWeight: 600,
  background: "#ffffff",
  borderBottom: "1px solid #e5e7eb"
};

const hero = {
  textAlign: "center",
  padding: "60px 20px"
};

const title = {
  fontSize: 36,
  marginBottom: 12
};

const tagline = {
  fontSize: 18,
  color: "#4b5563",
  marginBottom: 30
};

const uploadBtn = {
  display: "inline-block",
  padding: "16px 32px",
  background: "#2563eb",
  color: "#fff",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 18,
  fontWeight: 500
};

const progressBarBg = {
  width: "100%",
  height: 8,
  background: "#e5e7eb",
  borderRadius: 4,
  overflow: "hidden"
};

const progressBarFill = {
  height: "100%",
  background: "#2563eb",
  transition: "width 0.3s ease"
};

const howItWorks = {
  background: "#ffffff",
  padding: "50px 20px",
  textAlign: "center"
};

const steps = {
  display: "flex",
  justifyContent: "center",
  gap: 24,
  flexWrap: "wrap"
};

const stepCard = {
  display: "flex",
  gap: 16,
  padding: 20,
  background: "#f9fafb",
  borderRadius: 8,
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
  background: "#ffffff",
  padding: 32,
  borderRadius: 8,
  boxShadow: "0 10px 25px rgba(0,0,0,0.06)"
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
  marginBottom: 24
};

const th = {
  padding: 10,
  borderBottom: "1px solid #e5e7eb",
  textAlign: "left"
};

const td = {
  padding: 8,
  borderBottom: "1px solid #e5e7eb"
};

const tdCenter = {
  ...td,
  textAlign: "center"
};

const input = {
  width: "100%",
  padding: "6px 8px",
  border: "1px solid #d1d5db",
  borderRadius: 4
};

const downloadBtn = {
  padding: "14px 28px",
  background: "#16a34a",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  fontSize: 16,
  cursor: "pointer",
  fontWeight: 500
};

export default App;
