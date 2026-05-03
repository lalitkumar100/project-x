"use client"

import { useEffect, useState } from "react"
import axios from "axios" // Import axios
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MessageSquare, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"

const PAGE_SIZE = 5

export function ChatMenu({ onNewChat, onOpenChat }) {
  const BaseUrl = import.meta.env.VITE_BACKEND_URL; // Ensure this matches your server port
  const [allChats, setAllChats] = useState([])
  const [offset, setOffset] = useState(0)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  /* ---------- API CALL: FETCH REAL MENU ---------- */
  const fetchMenu = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Get the token from wherever you store it (localStorage is common)
      const token = localStorage.getItem("token"); 

      const response = await axios.get(`${BaseUrl}/ai/chatMenu`, {
        headers: {
          Authorization: `Bearer ${token}`, // Pass JWT for the protect middleware
        },
      });

      // Response data is already formatted by your TO_CHAR SQL as [{id, title, date}, ...]
      setAllChats(response.data);
    } catch (err) {
      console.error("Fetch Menu Error:", err);
      const msg = err.response?.data?.message || "Internal server error, try again";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }

  const visibleChats = allChats.slice(offset, offset + PAGE_SIZE)

  const formatDate = (dateString) => {
    if(!dateString) return "";
    // dateString is "YYYY-MM-DD" from PostgreSQL TO_CHAR
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  }

  return (
    <DropdownMenu onOpenChange={(open) => open && fetchMenu()}>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className="gap-2 bg-blue-600 text-white hover:bg-blue-700">
          <MessageSquare className="w-4 h-4" />
          Chat
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <div className="p-2">
          <Button 
            onClick={() => {
              onNewChat();
              setOffset(0); // Reset pagination on new chat
            }} 
            className="w-full bg-blue-600 text-white hover:bg-blue-700"
          >
            New Chat
          </Button>
        </div>

        <DropdownMenuSeparator />

        {isLoading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <p className="p-3 text-sm text-red-500 font-medium">{error}</p>
        ) : allChats.length === 0 ? (
          <p className="p-3 text-sm text-muted-foreground text-center">No recent chats</p>
        ) : (
          visibleChats.map((chat) => (
            <DropdownMenuItem
              key={chat.id}
              onClick={() => onOpenChat(chat)}
              className="flex flex-col items-start gap-1 p-3 cursor-pointer focus:bg-slate-100"
            >
              <span className="text-[14px] font-semibold text-slate-800 truncate w-full">
                {chat.title || "Untitled Chat"}
              </span>
              <span className="text-[11px] italic text-slate-500">
                {formatDate(chat.date)}
              </span>
            </DropdownMenuItem>
          ))
        )}

        <DropdownMenuSeparator />

        <div className="flex justify-between items-center p-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs"
            disabled={offset === 0 || isLoading}
            onClick={(e) => {
              e.stopPropagation();
              setOffset((p) => Math.max(p - PAGE_SIZE, 0));
            }}
          >
            <ChevronLeft className="w-3 h-3 mr-1" /> Prev
          </Button>

          <span className="text-[10px] text-muted-foreground">
            {allChats.length > 0 ? `${Math.floor(offset/PAGE_SIZE) + 1} / ${Math.ceil(allChats.length/PAGE_SIZE)}` : "0/0"}
          </span>

          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs"
            disabled={offset + PAGE_SIZE >= allChats.length || isLoading}
            onClick={(e) => {
              e.stopPropagation();
              setOffset((p) => p + PAGE_SIZE);
            }}
          >
            Next <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}