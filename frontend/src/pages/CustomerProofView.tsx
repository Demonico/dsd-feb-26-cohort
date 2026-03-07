import { useState } from "react";
import http from "../api/http";

const CustomerProofView = () => {
  const [jobId, setJobId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleFetchProof = async () => {
    if (!jobId) {
      setError("Please enter a job ID");
      return;
    }

    setLoading(true);
    setError(null);
    setImageUrl(null);

    try {
      const response = await http.get(`/uploads/job/${jobId}/proof`);
      setImageUrl(response.data.url);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load image");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">View Proof of Service</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Job ID</label>
          <input
            type="number"
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            placeholder="Enter job ID"
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
            {error}
          </div>
        )}

        <button
          onClick={handleFetchProof}
          disabled={!jobId || loading}
          className="w-full bg-[#005B17] text-white py-2 px-4 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed mb-4"
        >
          {loading ? "Loading..." : "View Proof"}
        </button>

        {imageUrl && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Proof of Service Photo</h2>
            <img
              src={imageUrl}
              alt="Proof of service"
              className="w-full rounded-lg shadow"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerProofView;
