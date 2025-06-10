import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import React from "react";
import { Id } from "../../convex/_generated/dataModel";
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';

interface Channel {
  _id: Id<"channels">;
  name: string;
  type: "direct" | "group" | "broadcast";
  members: Id<"users">[];
  createdAt: number;
}

interface Message {
  _id: Id<"messages">;
  channelId: Id<"channels">;
  senderId: Id<"users">;
  content: string;
  type: "text" | "notification";
  createdAt: number;
}

function useMessaging() {
  // State
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [chatType, setChatType] = useState<"direct" | "group" | "broadcast">("direct");
  const [chatName, setChatName] = useState("");
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Queries - Always call these hooks unconditionally
  const channelsQuery = useQuery(api.messages.listChannels);
  const usersQuery = useQuery(api.users.getAllUsers);
  const messagesQuery = useQuery(
    api.messages.listMessages,
    selectedChannel ? { channelId: selectedChannel._id } : "skip"
  );

  // Mutations
  const createChannel = useMutation(api.messages.createChannel);
  const sendMessage = useMutation(api.messages.sendMessage);
  const addToChannel = useMutation(api.messages.addToChannel);

  // Memoized values
  const channels = useMemo(() => channelsQuery || [], [channelsQuery]);
  const users = useMemo(() => usersQuery || [], [usersQuery]);
  const messages = useMemo(() => {
    if (!messagesQuery) return [];
    // Map messages to match the expected schema
    return messagesQuery.map(msg => ({
      _id: msg._id,
      channelId: msg.channelId,
      content: msg.content,
      createdAt: msg.createdAt,
      senderId: msg.senderId,
      type: msg.type
    }));
  }, [messagesQuery]);

  // Effects
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Handlers
  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChannel || !newMessage.trim()) return;
    setLoading(true);
    setError("");
    try {
      await sendMessage({
        channelId: selectedChannel._id,
        content: newMessage,
        type: "text",
      });
      setNewMessage("");
    } catch (err) {
      setError("Failed to send message");
    } finally {
      setLoading(false);
    }
  }, [selectedChannel, newMessage, sendMessage]);

  const handleCreateChannel = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const memberIds = chatType === "direct" 
        ? [selectedMember as Id<"users">]
        : selectedMembers.map((id) => id as Id<"users">);
      
      const res = await createChannel({
        name: chatName || (chatType === "direct" && memberIds.length === 1 
          ? users.find((u: any) => u.userId === memberIds[0])?.firstName || "Direct Chat" 
          : "Group Chat"),
        type: chatType,
        members: memberIds,
      });
      setShowNewChat(false);
      setChatName("");
      setSelectedMember("");
      setSelectedMembers([]);
      setChatType("direct");
      // Select the new channel
      if (res?.channelId) {
        setSelectedChannel({
          _id: res.channelId,
          name: chatName,
          type: chatType,
          members: memberIds,
          createdAt: Date.now(),
        });
      }
    } catch (err) {
      setError("Failed to create chat");
    } finally {
      setLoading(false);
    }
  }, [chatType, selectedMember, selectedMembers, chatName, users, createChannel]);

  const handleMemberChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    if (chatType === "direct") {
      setSelectedMember(e.target.value);
    } else {
      const options = Array.from(e.target.selectedOptions).map(opt => opt.value);
      setSelectedMembers(options);
    }
  }, [chatType]);

  const handleChatTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as "direct" | "group" | "broadcast";
    setChatType(newType);
    if (newType === "direct") {
      setSelectedMembers([]);
    } else {
      setSelectedMember("");
    }
  }, []);

  return {
    // State
    selectedChannel,
    setSelectedChannel,
    newMessage,
    setNewMessage,
    showNewChat,
    setShowNewChat,
    chatType,
    chatName,
    setChatName,
    selectedMember,
    selectedMembers,
    loading,
    error,
    messagesEndRef,
    channels,
    users,
    messages,
    // Handlers
    handleSendMessage,
    handleCreateChannel,
    handleMemberChange,
    handleChatTypeChange,
  };
}

export default function MessagingTab() {
  const {
    selectedChannel,
    setSelectedChannel,
    newMessage,
    setNewMessage,
    showNewChat,
    setShowNewChat,
    chatType,
    chatName,
    setChatName,
    selectedMember,
    selectedMembers,
    loading,
    error,
    messagesEndRef,
    channels,
    users,
    messages,
    handleSendMessage,
    handleCreateChannel,
    handleMemberChange,
    handleChatTypeChange,
  } = useMessaging();

  return (
    <div className="flex h-[70vh] bg-black rounded-xl border border-gray-800 overflow-hidden">
      {/* Channel List */}
      <div className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">💬 Messaging</h2>
          <button
            className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-3 py-1 rounded-xl font-semibold shadow hover:scale-105 transition"
            onClick={() => setShowNewChat(true)}
          >
            + New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {channels.map((channel) => (
            <div
              key={channel._id}
              className={`p-4 cursor-pointer border-b border-gray-800 hover:bg-gray-800 transition ${selectedChannel?._id === channel._id ? "bg-gray-800" : ""}`}
              onClick={() => setSelectedChannel(channel)}
            >
              <div className="font-semibold text-white">{channel.name}</div>
              <div className="text-xs text-gray-400 capitalize">{channel.type}</div>
            </div>
          ))}
          {channels.length === 0 && (
            <div className="text-gray-500 p-4">No conversations yet.</div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChannel ? (
          <>
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-white text-lg">{selectedChannel.name}</div>
                <div className="text-xs text-gray-400 capitalize">{selectedChannel.type}</div>
              </div>
              <button
                className="text-gray-400 hover:text-red-400"
                onClick={() => setSelectedChannel(null)}
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-black">
              {messages.map((msg) => (
                <div key={msg._id} className={`flex ${msg.type === "notification" ? "justify-center" : ""}`}>
                  <div
                    className={`rounded-xl px-4 py-2 max-w-xl shadow text-sm ${msg.type === "notification" ? "bg-yellow-900 text-yellow-200" : "bg-gray-800 text-white"}`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-800 flex gap-2 bg-gray-900">
              <input
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                className="flex-1 p-2 rounded bg-gray-800 text-white"
                placeholder="Type a message..."
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !newMessage.trim()}
                className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-4 py-2 rounded-xl font-semibold shadow hover:scale-105 transition"
              >
                Send
              </button>
            </form>
            {error && <div className="text-red-400 text-sm p-2">{error}</div>}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <div className="text-6xl mb-4">💬</div>
            <div className="text-lg font-semibold">Select a conversation or start a new chat</div>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <form
            onSubmit={handleCreateChannel}
            className="bg-gray-900 rounded-xl p-8 w-full max-w-md space-y-4 border border-gray-700 shadow-xl animate-fadeIn"
          >
            <h3 className="text-xl font-bold text-white mb-2">Start New Chat</h3>
            {error && <div className="text-red-400 text-sm mb-2">{error}</div>}
            <div>
              <label className="block text-gray-300 mb-1">Chat Type</label>
              <select 
                value={chatType} 
                onChange={handleChatTypeChange}
                className="w-full p-2 rounded bg-gray-800 text-white"
              >
                <option value="direct">1-1</option>
                <option value="group">Group</option>
                <option value="broadcast">Broadcast</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-300 mb-1">Chat Name</label>
              <input 
                value={chatName} 
                onChange={e => setChatName(e.target.value)} 
                className="w-full p-2 rounded bg-gray-800 text-white" 
                placeholder="(optional for direct)" 
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-1">Members</label>
              <select
                multiple={chatType !== "direct"}
                value={chatType === "direct" ? selectedMember : selectedMembers}
                onChange={handleMemberChange}
                className="w-full p-2 rounded bg-gray-800 text-white"
              >
                {users.map((user: any) => (
                  <option key={user.userId} value={user.userId}>
                    {user.firstName} {user.lastName} ({user.role})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                type="submit"
                disabled={loading || (chatType === "direct" && !selectedMember)}
                className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-4 py-2 rounded-xl font-semibold shadow hover:scale-105 transition flex-1"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowNewChat(false)}
                className="bg-gray-700 text-white px-4 py-2 rounded-xl font-semibold flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
} 