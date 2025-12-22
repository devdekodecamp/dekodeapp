"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { CheckCircle, XCircle, Eye, User, Calendar } from "lucide-react";

export default function VerifyProofs() {
  const { loading } = useAuth("admin");
  const [selectedProof, setSelectedProof] = useState(null);
  const [proofs, setProofs] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading) return;

    const loadProofs = async () => {
      try {
        const res = await fetch("/api/admin/proofs");
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to load proofs");
          return;
        }

        setProofs(data || []);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error loading proofs:", err);
        setError("Unexpected error while loading proofs");
      }
    };

    loadProofs();
  }, [loading]);

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (selectedProof) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedProof]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 font-sans">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const handleVerify = async (proofId, approved) => {
    try {
      const res = await fetch("/api/admin/verify-proof", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ proofId, approved }),
      });

      const data = await res.json();

      if (!res.ok) {
        // eslint-disable-next-line no-alert
        alert(data.error || "Failed to update proof status");
        return;
      }

      // Optimistically update local state so UI reflects the change
      updateLocalProofStatus(proofId, approved ? "verified" : "rejected");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      // eslint-disable-next-line no-alert
      alert("Unexpected error while updating proof");
    }
  };

  const updateLocalProofStatus = (proofId, status) => {
    setProofs((prev) =>
      prev.map((p) =>
        p.id === proofId
          ? {
              ...p,
              status,
            }
          : p
      )
    );
  };

  const getStatusBadge = (status) => {
    if (status === "verified") {
      return (
        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
          Verified
        </span>
      );
    }
    if (status === "rejected") {
      return (
        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
          Rejected
        </span>
      );
    }
    return (
      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
        Pending
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar role="admin" />
      <div className="lg:pl-64">
        <Header userName="Admin User" role="admin" />
        <main className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Verify Proofs
            </h1>
            <p className="text-gray-600">
              Review and verify user-submitted proofs for completed modules
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Proofs List */}
            <div className="lg:col-span-2 space-y-4">
              {proofs.map((proof) => (
                <div
                  key={proof.id}
                  className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-[#e01414] via-[#760da3] to-[#008cff] rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {proof.userName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {proof.userEmail}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(proof.status)}
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">
                        Week {proof.week}
                      </span>
                    </div>
                    <p className="text-gray-900 font-medium">
                      {proof.moduleTitle}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Submitted:{" "}
                      {new Date(proof.submittedAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="mb-4">
                    <div className="bg-gray-100 rounded-lg p-4 mb-4">
                      <img
                        src={proof.proofUrl}
                        alt="Proof submission"
                        className="w-full h-auto rounded-lg cursor-pointer"
                        onClick={() => setSelectedProof(proof)}
                        onError={(e) => {
                          e.target.src =
                            'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="20" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EProof Screenshot%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    </div>
                    <button
                      onClick={() => setSelectedProof(proof)}
                      className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        View Full Size
                      </span>
                    </button>
                  </div>

                  {proof.status === "pending" && (
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleVerify(proof.id, true)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
                      >
                        <CheckCircle className="w-5 h-5" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleVerify(proof.id, false)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
                      >
                        <XCircle className="w-5 h-5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {proofs.length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                  <p className="text-gray-500">No pending proofs to verify</p>
                </div>
              )}
            </div>

            {/* Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 sticky top-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Summary
                </h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">
                      Pending Verifications
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {proofs.filter((p) => p.status === "pending").length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Verified</p>
                    <p className="text-2xl font-bold text-green-600">
                      {proofs.filter((p) => p.status === "verified").length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Rejected</p>
                    <p className="text-2xl font-bold text-red-600">
                      {proofs.filter((p) => p.status === "rejected").length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Submissions</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {proofs.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modal for viewing proof */}
          {selectedProof && (
            <div
              className="fixed inset-0 bg-gray-950/70 flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedProof(null)}
            >
              <div
                className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {selectedProof.userName} - Week {selectedProof.week}
                    </h3>
                    <button
                      onClick={() => setSelectedProof(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>
                  <img
                    src={selectedProof.proofUrl}
                    alt="Proof submission"
                    className="w-full h-auto rounded-lg"
                    onError={(e) => {
                      e.target.src =
                        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600"%3E%3Crect fill="%23ddd" width="800" height="600"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="24" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EProof Screenshot%3C/text%3E%3C/svg%3E';
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
