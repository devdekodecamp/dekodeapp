"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import ProgressBar from "@/components/ProgressBar";
import WeekCard from "@/components/WeekCard";
import { CheckCircle, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function UserDashboard() {
  const { user, loading: authLoading } = useAuth("user");
  const [weeks, setWeeks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("User");

  useEffect(() => {
    // Only load data after auth is confirmed
    if (authLoading) return;

    // Load user name from profile
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

    const loadWeeks = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/admin/weeks");
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to load weeks");
          setLoading(false);
          return;
        }

        // Default weeks
        let mapped = data
          .filter((w) => w.is_published)
          .sort((a, b) => a.week_number - b.week_number)
          .map((w) => ({
            id: w.week_number,
            title: w.title,
            videoUrl: w.video_url,
            moduleLink: w.module_link,
            thumbnailUrl: w.thumbnail_url,
            completed: false,
            verified: false,
          }));

        // Enhance with proof status for this user
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session) {
            const proofsRes = await fetch("/api/user/proofs", {
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
            });

            if (proofsRes.ok) {
              const proofs = await proofsRes.json();

              mapped = mapped.map((week) => {
                const weekProofs = proofs.filter(
                  (p) => p.weekNumber === week.id
                );
                const hasVerified = weekProofs.some(
                  (p) => p.status === "verified"
                );
                const hasPending = weekProofs.some(
                  (p) => p.status === "pending"
                );

                return {
                  ...week,
                  completed: hasPending || hasVerified,
                  verified: hasVerified,
                };
              });
            }
          }
        } catch (proofErr) {
          // eslint-disable-next-line no-console
          console.error("Error loading proof status:", proofErr);
        }

        setWeeks(mapped);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
        setError("Unexpected error while loading weeks");
      } finally {
        setLoading(false);
      }
    };

    loadUserName();
    loadWeeks();
  }, [authLoading, user]);

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 font-sans">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const completedWeeks = weeks.filter((w) => w.verified).length;
  const totalWeeks = weeks.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar role="user" />
      <div className="lg:pl-64">
        <Header userName={userName} role="user" />
        <main className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              My Modules
            </h1>
            <p className="text-gray-600">
              Complete all 6 weeks to finish the course
            </p>
          </div>

          {/* Progress Overview */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Your Progress
              </h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">
                    {completedWeeks} Completed
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-yellow-600">
                  <Clock className="w-5 h-5" />
                  <span className="font-medium">
                    {totalWeeks - completedWeeks} Remaining
                  </span>
                </div>
              </div>
            </div>
            <ProgressBar progress={completedWeeks} total={totalWeeks} />
          </div>

          {/* Weeks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {weeks.map((week) => (
              <WeekCard key={week.id} week={week} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
