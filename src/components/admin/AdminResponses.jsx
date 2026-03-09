// src/components/admin/AdminResponses.jsx

import React, { useState, useEffect, useMemo } from "react";
import { Send, Eye, Search, Trash2, Filter } from "lucide-react";
import apiClient from "../../api/apiClient";
import { cn } from "../../utils/helpers";
import Button from "../ui/Button";

// --- ResponseModal ---
const ResponseModal = ({ message, onClose, onRespond, isViewing = false }) => {
  const [responseText, setResponseText] = useState(
    isViewing
      ? message.responseText || ""
      : `Hi ${message.name},\n\nThank you for reaching out to Voyage!\n\n[Your response here]\n\nBest regards,\nThe Voyage Team`
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onRespond(message._id, message.email, responseText);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
      >
        <div className="p-6 overflow-y-auto">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100 mb-2">
            {isViewing ? "View Response" : "Respond to Message"}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            To: {message.name} ({message.email})
          </p>

          <h4 className="font-semibold text-slate-800 dark:text-slate-200 mt-4 mb-1">
            Original Message:
          </h4>
          <p className="text-sm text-slate-700 dark:text-slate-300 font-semibold mb-1">
            Subject: {message.subject}
          </p>
          <div className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 p-3 rounded-md mb-4 border dark:border-slate-600 max-h-32 overflow-y-auto">
            {message.message}
          </div>

          <h4 className="font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-1">
            {isViewing ? "Your Response:" : "Write Response:"}
          </h4>
          <textarea
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            rows="8"
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand dark:bg-slate-900 dark:border-slate-600 dark:text-slate-200"
            required
            readOnly={isViewing}
          />
          {isViewing && message.respondedAt && (
            <p className="text-xs text-slate-400 mt-2">
              Responded on: {new Date(message.respondedAt).toLocaleString()}
            </p>
          )}
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 flex justify-end gap-4 rounded-b-lg border-t dark:border-slate-700">
          <Button type="button" variant="secondary" onClick={onClose}>
            {isViewing ? "Close" : "Cancel"}
          </Button>
          {!isViewing && (
            <Button type="submit">
              <Send size={16} className="mr-2" /> Send Response
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

// --- AdminResponses Component ---
const AdminResponses = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isViewing, setIsViewing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [entriesToShow, setEntriesToShow] = useState(10);

  const fetchMessages = async () => {
    try {
      const { data } = await apiClient.get("/admin/contact");
      setMessages(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error("❌ Failed to fetch messages:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleRespond = async (messageId, userEmail, responseText) => {
    try {
      const { data } = await apiClient.post(
        `/admin/contact/respond/${messageId}`,
        { responseText, userEmail }
      );

      if (data?.data) {
        setMessages((prev) =>
          prev.map((msg) => (msg._id === messageId ? data.data : msg))
        );
      }
      closeModal();
    } catch (error) {
      console.error("❌ Failed to send response:", error);
      alert("Failed to send response.");
    }
  };

  const handleDelete = async (messageId) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;
    setActionLoading(messageId);
    try {
      await apiClient.delete(`/admin/contact/${messageId}`);
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    } catch (error) {
      console.error("❌ Failed to delete message:", error);
      alert("Failed to delete message.");
    } finally {
      setActionLoading(null);
    }
  };

  const openModal = (message, viewMode = false) => {
    setSelectedMessage(message);
    setIsViewing(viewMode);
  };

  const closeModal = () => {
    setSelectedMessage(null);
    setIsViewing(false);
  };

  const filteredMessages = useMemo(() => {
    return messages.filter((msg) => {
      if (statusFilter !== "All" && msg.status !== statusFilter) return false;

      const search = searchTerm.toLowerCase();
      if (!search) return true;

      return (
        (msg.name || "").toLowerCase().includes(search) ||
        (msg.email || "").toLowerCase().includes(search) ||
        (msg.subject || "").toLowerCase().includes(search) ||
        (msg.message || "").toLowerCase().includes(search)
      );
    });
  }, [messages, searchTerm, statusFilter]);

  const totalFiltered = filteredMessages.length;
  const displayCount =
    entriesToShow === -1
      ? totalFiltered
      : Math.min(entriesToShow, totalFiltered);

  if (loading)
    return (
      <div className="text-center py-10 text-slate-600">
        Loading messages...
      </div>
    );

  return (
    <div className="p-4 md:p-8 bg-slate-50 dark:bg-slate-900 min-h-screen">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
        {selectedMessage && (
          <ResponseModal
            message={selectedMessage}
            onClose={closeModal}
            onRespond={handleRespond}
            isViewing={isViewing}
          />
        )}

        {/* --- Filter Bar --- */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-4 items-center">
          {/* Search */}
          <div className="relative w-full sm:w-1/2 md:w-1/3">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search by name, email, or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand bg-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="relative w-full sm:w-auto">
            <Filter
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={20}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand bg-transparent"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Responded">Responded</option>
            </select>
          </div>

          {/* Show Entries */}
          <div className="flex items-center gap-2 sm:ml-auto">
            <label
              htmlFor="entries-res"
              className="text-sm text-slate-500 dark:text-slate-400 flex-shrink-0"
            >
              Show:
            </label>
            <select
              id="entries-res"
              value={entriesToShow}
              onChange={(e) => setEntriesToShow(Number(e.target.value))}
              className="border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand bg-transparent py-2 pl-3 pr-8"
            >
              <option value={10}>10 Entries</option>
              <option value={25}>25 Entries</option>
              <option value={50}>50 Entries</option>
              <option value={-1}>All Entries</option>
            </select>
          </div>
        </div>

        {/* Count */}
        <div className="p-4 pt-2 text-sm text-slate-500 dark:text-slate-400">
          Showing {displayCount} of {totalFiltered} total messages.
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="p-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase">
                  From
                </th>
                <th className="p-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase">
                  Subject & Message
                </th>
                <th className="p-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase">
                  Status
                </th>
                <th className="p-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredMessages.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="text-center p-6 text-slate-500 dark:text-slate-400"
                  >
                    No contact messages found.
                  </td>
                </tr>
              ) : (
                filteredMessages
                  .slice(0, entriesToShow === -1 ? undefined : entriesToShow)
                  .map((msg) => (
                    <tr key={msg._id}>
                      <td className="p-4 whitespace-nowrap">
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {msg.name}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {msg.email}
                        </div>
                      </td>

                      <td className="p-4">
                        <p className="font-semibold dark:text-slate-200">
                          {msg.subject}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 truncate max-w-sm">
                          {msg.message}
                        </p>
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <span
                          className={cn(
                            "px-3 py-1 text-xs font-semibold rounded-full",
                            msg.status === "Responded"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                          )}
                        >
                          {msg.status || "Pending"}
                        </span>
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          {msg.status === "Pending" ? (
                            <Button
                              onClick={() => openModal(msg, false)}
                              size="sm"
                              className="px-3 py-1.5 text-sm"
                            >
                              <Send size={16} className="mr-2" /> Respond
                            </Button>
                          ) : (
                            <Button
                              onClick={() => openModal(msg, true)}
                              size="sm"
                              variant="secondary"
                              className="px-3 py-1.5 text-sm"
                            >
                              <Eye size={16} className="mr-2" /> View
                            </Button>
                          )}

                          <Button
                            onClick={() => handleDelete(msg._id)}
                            variant="danger-ghost"
                            size="sm"
                            className="px-3 py-1.5 text-sm"
                            disabled={actionLoading === msg._id}
                            disableHoverLift={true}
                          >
                            {actionLoading === msg._id ? "..." : (
                              <Trash2 size={16} />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminResponses;
