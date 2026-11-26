
"use client";

import { useCallback, useEffect, useState } from "react";

type UserRole = "STUDENT" | "INSTRUCTOR" | "ADMIN";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
};

export default function AdminUserManagement() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/users");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to retrieve users.");
      }

      setUsers(data.users);
      setCurrentUserId(data.currentUserId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleRoleChange(userId: string, role: UserRole) {
    try {
      setUpdatingUserId(userId);
      setError("");
      setSuccess("");

      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to update user role.");
      }

      setUsers((previousUsers) =>
        previousUsers.map((user) =>
          user.id === userId ? data.user : user
        )
      );

      setSuccess(`${data.user.name}'s role was updated to ${role}.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setUpdatingUserId("");
    }
  }

  return (
    <section className="mt-8 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            User Management
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            View registered users and manage their platform roles.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchUsers}
          disabled={loading}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Refresh Users"}
        </button>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      {success && (
        <p role="status" className="rounded-lg bg-green-50 p-4 text-sm text-green-700">
          {success}
        </p>
      )}

      {loading ? (
        <p className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
          Loading registered users...
        </p>
      ) : users.length === 0 ? (
        <p className="rounded-lg border bg-white p-6 text-gray-500">
          No registered users found.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-4">User</th>
                <th className="px-5 py-4">Role</th>
                <th className="px-5 py-4">Registered</th>
                <th className="px-5 py-4">Manage Role</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {users.map((user) => {
                const isCurrentUser = user.id === currentUserId;

                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">
                        {user.name}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs text-blue-600">
                            (You)
                          </span>
                        )}
                      </p>
                      <p className="mt-1 text-gray-500">{user.email}</p>
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                        {user.role}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-5 py-4">
                      <select
                        value={user.role}
                        disabled={isCurrentUser || updatingUserId === user.id}
                        onChange={(event) =>
                          handleRoleChange(
                            user.id,
                            event.target.value as UserRole
                          )
                        }
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-60"
                        aria-label={`Change role for ${user.name}`}
                      >
                        <option value="STUDENT">Student</option>
                        <option value="INSTRUCTOR">Instructor</option>
                        <option value="ADMIN">Administrator</option>
                      </select>

                      {updatingUserId === user.id && (
                        <p className="mt-1 text-xs text-blue-600">
                          Updating...
                        </p>
                      )}

                      {isCurrentUser && (
                        <p className="mt-1 text-xs text-gray-400">
                          Your own role is protected.
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-sm text-gray-500">
        Total registered users: {users.length}
      </p>
    </section>
  );
}
