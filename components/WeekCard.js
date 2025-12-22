"use client";

import { useState, useEffect } from "react";
import {
  Play,
  ExternalLink,
  Upload,
  CheckCircle,
  Clock,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function WeekCard({ week }) {
  const [showProofModal, setShowProofModal] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProofFile(file);
      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setProofPreview(reader.result);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSubmitProof = async () => {
    if (!proofFile) return;

    setUploading(true);

    try {
      // Get the session token
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        // eslint-disable-next-line no-alert
        alert("Please log in to submit proof");
        setUploading(false);
        return;
      }

      // Create form data
      const formData = new FormData();
      formData.append("file", proofFile);
      formData.append("weekNumber", week.id.toString());
      formData.append("weekTitle", week.title);

      // Submit proof to API
      const res = await fetch("/api/user/submit-proof", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        // eslint-disable-next-line no-alert
        alert(data.error || "Failed to submit proof");
        setUploading(false);
        return;
      }

      // Success - close modal and reset
      setShowProofModal(false);
      setProofFile(null);
      setProofPreview(null);

      // Show success message
      // eslint-disable-next-line no-alert
      alert("Proof submitted successfully! It will be reviewed by an admin.");

      // Optionally refresh the page or update state to show the new submission
      window.location.reload();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error submitting proof:", err);
      // eslint-disable-next-line no-alert
      alert("Unexpected error while submitting proof");
      setUploading(false);
    }
  };

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (showProofModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showProofModal]);

  const getStatusBadge = () => {
    if (week.verified) {
      return (
        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 items-center space-x-1">
          <CheckCircle className="w-3 h-3" />
          <span>Verified</span>
        </span>
      );
    }
    if (week.completed) {
      return (
        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>Pending Review</span>
        </span>
      );
    }
    return (
      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
        Not Started
      </span>
    );
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
        {week.thumbnailUrl && (
          <div className="w-full h-40 bg-gray-100 overflow-hidden">
            <img
              src={week.thumbnailUrl}
              alt={`Thumbnail for ${week.title}`}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {week.title}
              </h3>
              <p className="text-sm text-gray-500">
                Week {week.id}
                {week.startDate && (
                  <>
                    {" "}
                    · Starts{" "}
                    {new Date(week.startDate).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </>
                )}
              </p>
            </div>
            {getStatusBadge()}
          </div>

          <div className="space-y-3 mb-4">
            {week.videoUrl && (
              <a
                href={week.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                <Play className="w-5 h-5" />
                <span className="font-medium">Watch Video</span>
              </a>
            )}

            {week.moduleLink && (
              <a
                href={`/user/module/${week.id}`}
                className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                <ExternalLink className="w-5 h-5" />
                <span className="font-medium">View Module</span>
              </a>
            )}
          </div>

          {!week.verified && (
            <button
              onClick={() => setShowProofModal(true)}
              className={`w-full py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                week.completed
                  ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                  : "bg-gradient-to-r from-[#e01414] via-[#760da3] to-[#008cff] text-white hover:opacity-90"
              }`}
            >
              <Upload className="w-5 h-5" />
              <span>{week.completed ? "Update Proof" : "Submit Proof"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Proof Upload Modal */}
      {showProofModal && (
        <div
          className="fixed inset-0 bg-gray-950/70 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowProofModal(false);
            setProofFile(null);
            setProofPreview(null);
          }}
        >
          <div
            className="bg-white rounded-xl max-w-2xl w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                Submit Proof - {week.title}
              </h3>
              <button
                onClick={() => {
                  setShowProofModal(false);
                  setProofFile(null);
                  setProofPreview(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-4">
                Upload a screenshot or proof that you have completed this
                module. The admin will review and verify your submission.
              </p>

              <label className="block mb-2 text-sm font-medium text-gray-700">
                Upload Proof (Image or Screenshot)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="proof-upload"
                />
                <label
                  htmlFor="proof-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="w-12 h-12 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    Click to upload or drag and drop
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    PNG, JPG, GIF up to 10MB
                  </span>
                </label>
              </div>

              {proofPreview && (
                <div className="mt-4 max-h-96 overflow-auto border border-gray-200 rounded-lg bg-gray-50 flex flex-col items-center justify-center">
                  <p className="text-sm font-medium text-gray-700 mb-2 w-full px-3 pt-3">
                    Preview:
                  </p>
                  <img
                    src={proofPreview}
                    alt="Proof preview"
                    className="max-h-80 w-auto object-contain rounded-lg border border-gray-300 block mx-auto px-3 pb-3"
                  />
                </div>
              )}

              {proofFile && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    Selected:{" "}
                    <span className="font-medium">{proofFile.name}</span>
                  </p>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowProofModal(false);
                  setProofFile(null);
                  setProofPreview(null);
                }}
                className="flex-1 bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitProof}
                disabled={!proofFile || uploading}
                className="flex-1 bg-gradient-to-r from-[#e01414] via-[#760da3] to-[#008cff] hover:opacity-90 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {uploading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span>Submit Proof</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
