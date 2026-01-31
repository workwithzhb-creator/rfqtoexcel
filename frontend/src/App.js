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
      if (extractedItems.length === 0) {
        setErrorMsg(
          "This PDF appears to be scanned or image-based. Please upload a text-based RFQ or PR PDF."
        );
      } else {
        setItems(extractedItems.map((i) => ({ ...i, include: true })));
      }
    } catch {
      setErrorMsg("Error while processing PDF.");
    }

    setProgress(100);
    setTimeout(() => setLoading(false), 300);
  };

  const downloadExcel = async () => {
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/download`,
        { items },
        {
          responseType: "blob",
          headers: {
            "Content-Type": "application/json",
            Accept:
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          }
        }
      );

      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "materials.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("DOWNLOAD ERROR:", err);
      alert("Failed to download Excel");
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>RFQ to Excel Converter</h2>

      <input type="file" accept="application/pdf" onChange={uploadPDF} />

      {loading && <p>Processing… {progress}%</p>}
      {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}

      {items.length > 0 && (
        <>
          <table border="1" cellPadding="6" style={{ marginTop: 20 }}>
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
                      onChange={(e) => {
                        const copy = [...items];
                        copy[idx].include = e.target.checked;
                        setItems(copy);
                      }}
                    />
                  </td>
                  <td>{i.description_raw}</td>
                  <td>{i.size_raw}</td>
                  <td>{i.quantity_raw}</td>
                  <td>{i.uom_raw}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <button onClick={downloadExcel} style={{ marginTop: 20 }}>
            Download Excel
          </button>
        </>
      )}
    </div>
  );
}

export default App;
