"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ModuleDetailPage() {
  const { weekId } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth("user");
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("User");

  useEffect(() => {
    if (authLoading) return;

    const loadUserName = async () => {
      if (user) {
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", user.id)
            .maybeSingle();

          if (profile?.name) {
            setUserName(profile.name);
          } else if (user.user_metadata?.name) {
            setUserName(user.user_metadata.name);
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error("Error loading user name:", err);
        }
      }
    };

    const loadModule = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/admin/weeks");
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to load module");
          setLoading(false);
          return;
        }

        const weekData = data.find(
          (w) => w.week_number === Number(weekId) && w.is_published
        );

        if (!weekData) {
          setError("Module not found");
          setLoading(false);
          return;
        }

        setModule({
          id: weekData.week_number,
          title: weekData.title,
          primaryText: weekData.primary_text,
          secondaryText: weekData.secondary_text,
          moduleLink: weekData.module_link,
          thumbnailUrl: weekData.thumbnail_url,
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
        setError("Unexpected error while loading module");
      } finally {
        setLoading(false);
      }
    };

    loadUserName();
    loadModule();
  }, [authLoading, user, weekId]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 font-sans">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error || !module) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar role="user" />
        <div className="lg:pl-64">
          <Header userName={userName} role="user" />
          <main className="p-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <p className="text-red-600">{error || "Module not found"}</p>
              <button
                onClick={() => router.push("/user/dashboard")}
                className="mt-4 text-indigo-600 hover:text-indigo-700"
              >
                ← Back to Dashboard
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Parse secondary text into bullet points if it exists
  const bulletPoints = module.secondaryText
    ? module.secondaryText
        .split("\n")
        .filter((line) => line.trim().length > 0)
        .map((line) => line.trim())
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar role="user" />
      <div className="lg:pl-64">
        <Header userName={userName} role="user" />
        <main className="p-6">
          <button
            onClick={() => router.push("/user/dashboard")}
            className="mb-6 flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to My Modules</span>
          </button>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {module.thumbnailUrl && (
              <div className="w-full h-64 bg-gray-100 overflow-hidden">
                <img
                  src={module.thumbnailUrl}
                  alt={`Thumbnail for ${module.title}`}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {module.title}
              </h1>
              <p className="text-sm text-gray-500 mb-6">Week {module.id}</p>

              {module.primaryText && (
                <div className="mb-8">
                  <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-line">
                    {module.primaryText}
                  </p>
                </div>
              )}

              {bulletPoints.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Key Points:
                  </h2>
                  <ul className="space-y-2">
                    {bulletPoints.map((point, index) => (
                      <li
                        key={index}
                        className="flex items-start space-x-3 text-gray-700"
                      >
                        <span className="text-indigo-600 mt-1">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {module.moduleLink && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <a
                    href={module.moduleLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#e01414] via-[#760da3] to-[#008cff] hover:opacity-90 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-5 h-5" />
                    <span>Open Module Link</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

