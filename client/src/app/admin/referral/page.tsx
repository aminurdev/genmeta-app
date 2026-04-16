"use client";

import { useEffect, useState, useCallback } from "react";
import { getAllReferral } from "@/services/admin-dashboard";
import { AdminReferralDashboard } from "./admin-referral";
import type { AllReferralsResponse } from "@/types/admin";
import { ReferralSkeleton } from "./referral-skeleton";

const AdminReferralPage = () => {
  const [data, setData] = useState<AllReferralsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getAllReferral({ page, limit, search });

      if (!result.success) {
        setError(result.message || "Failed to load data");
        return;
      }

      setData(result.data ?? null);
    } catch (err) {
      console.error("Failed to load referral data:", err);
      setError("Failed to connect to the server");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleSearchChange = (searchTerm: string) => {
    setSearch(searchTerm);
    setPage(1); // Reset to first page on search
  };

  if (loading) {
    return <ReferralSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">
            Error Loading Data
          </h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <AdminReferralDashboard
      referralData={data.referrals}
      pagination={{
        currentPage: data.page,
        totalPages: data.totalPages,
        total: data.total,
        limit: data.limit,
      }}
      onPageChange={handlePageChange}
      onSearchChange={handleSearchChange}
      searchTerm={search}
    />
  );
};

export default AdminReferralPage;
