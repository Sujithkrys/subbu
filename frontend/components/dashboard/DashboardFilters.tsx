"use client";

import { useState } from "react";

interface DashboardFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  langFilter: string;
  onLangChange: (lang: string) => void;
  favoritesOnly: boolean;
  onFavoritesToggle: () => void;
  sortField: string;
  onSortChange: (field: string) => void;
  sortOrder: "asc" | "desc";
  onSortOrderChange: () => void;
}

export default function DashboardFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  langFilter,
  onLangChange,
  favoritesOnly,
  onFavoritesToggle,
  sortField,
  onSortChange,
  sortOrder,
  onSortOrderChange,
}: DashboardFiltersProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: "200px" }}>
          <input
            type="text"
            className="input"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{ width: "100%", padding: "10px 14px" }}
          />
        </div>

        {/* Status */}
        <select
          className="input"
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          style={{ width: "auto", cursor: "pointer", appearance: "auto" }}
        >
          <option value="all">All Statuses</option>
          <option value="ready">Ready</option>
          <option value="processing">Processing</option>
          <option value="failed">Failed</option>
        </select>

        {/* Language */}
        <select
          className="input"
          value={langFilter}
          onChange={(e) => onLangChange(e.target.value)}
          style={{ width: "auto", cursor: "pointer", appearance: "auto" }}
        >
          <option value="all">All Languages</option>
          <option value="en">English</option>
          <option value="hi">Hindi</option>
          <option value="te">Telugu</option>
          <option value="ta">Tamil</option>
          {/* add more if needed */}
        </select>

        {/* Sort Field */}
        <select
          className="input"
          value={sortField}
          onChange={(e) => onSortChange(e.target.value)}
          style={{ width: "auto", cursor: "pointer", appearance: "auto" }}
        >
          <option value="created_at">Date</option>
          <option value="title">Name</option>
          <option value="duration_seconds">Duration</option>
        </select>

        {/* Sort Order Toggle */}
        <button
          className="btn-secondary"
          style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: "4px" }}
          onClick={onSortOrderChange}
          title="Toggle sort order"
        >
          {sortOrder === "desc" ? "↓" : "↑"}
        </button>

        {/* Favorites Only Toggle */}
        <button
          className={`btn-secondary ${favoritesOnly ? "active" : ""}`}
          style={{ padding: "10px 14px", background: favoritesOnly ? "rgba(245, 158, 11, 0.2)" : "", borderColor: favoritesOnly ? "#F59E0B" : "" }}
          onClick={onFavoritesToggle}
        >
          ★ Favorites
        </button>
      </div>
    </div>
  );
}
