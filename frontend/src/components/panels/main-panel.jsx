
import axios from "axios"
import { useEffect, useState, useRef } from "react"
import { X, Send, Upload, Loader2, Maximize2, FileText, Database, RefreshCw, ChevronDown, ChevronUp, Shell, ArrowDown, Image } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useIsMobile } from "@/hooks/use-mobile"
import { CanvasPanel } from "./canvas-panel"
import { AITextRenderer } from "./ai-text-renderer"
import { SmallTableRenderer } from "./small-table-renderer"
import { ChatMenu } from "./chat-menu"

import {
  Brain,
  Search,
  Globe,
  Loader,
  BarChart3,
  Sparkles,
  Layers,
  Zap,
  CheckCircle
} from "lucide-react"


// Task 1: Table size rule helper
const isLargeTable = (tableObj) => {
  if (!tableObj) return false
  return tableObj.rows > 10 || tableObj.columns > 5
}

export function MainPanel({ isOpen, onClose }) {

  const BaseURL = import.meta.env.VITE_BACKEND_URL;
  const isMobile = useIsMobile()
  const chatContainerRef = useRef(null)
  const [showScrollButton, setShowScrollButton] = useState(true)
  
  const [query, setQuery] = useState("")
  const [file, setFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  const [chatHistory, setChatHistory] = useState([])
  const [chatId, setChatId] = useState(null)
  const [chatTitle, setChatTitle] = useState("+ New Chat")
  const [memory, setMemory] = useState("")

  const [isLoading, setIsLoading] = useState(false)
  const [isOpeningChat, setIsOpeningChat] = useState(false)
  const [loadingTimer, setLoadingTimer] = useState(0)
  const [openingChatTitle, setOpeningChatTitle] = useState("")
  const [loadingIconIndex, setLoadingIconIndex] = useState(0)

  // Task 2: Central canvas state
  const [canvasState, setCanvasState] = useState(null)
  const [isCanvasOpen, setIsCanvasOpen] = useState(false)

  const [isWaitingResponse, setIsWaitingResponse] = useState(false)
  const [thinkingSeconds, setThinkingSeconds] = useState(0)
  const [thinkingStageIndex, setThinkingStageIndex] = useState(0)
  const [thinkingMessageId, setThinkingMessageId] = useState(null)
  const [isNewChat, setIsNewChat] = useState(false)

  // Thinking expansion state
  const [expandedThinkingId, setExpandedThinkingId] = useState(null)

  const THINKING_STAGES = [
    { label: "Thinking", icon: Brain, color: "bg-blue-500 text-blue-500 shadow-blue-500/50" },
    { label: "Searching", icon: Search, color: "bg-blue-600 text-blue-600 shadow-blue-600/50" },
    { label: "Browsing", icon: Globe, color: "bg-cyan-500 text-cyan-500 shadow-cyan-500/50" },
    { label: "Processing", icon: Loader, color: "bg-blue-400 text-blue-400 shadow-blue-400/50" },
    { label: "Analyzing", icon: BarChart3, color: "bg-blue-700 text-blue-700 shadow-blue-700/50" },
    { label: "Reasoning", icon: Brain, color: "bg-indigo-500 text-indigo-500 shadow-indigo-500/50" },
    { label: "Creating", icon: Sparkles, color: "bg-blue-500 text-blue-500 shadow-blue-500/50" },
    { label: "Structuring", icon: Layers, color: "bg-blue-600 text-blue-600 shadow-blue-600/50" },
    { label: "Optimizing", icon: Zap, color: "bg-cyan-500 text-cyan-500 shadow-cyan-500/50" },
    { label: "Finalizing", icon: CheckCircle, color: "bg-blue-600 text-blue-600 shadow-blue-600/50" },
  ]

  const LOADING_ICONS = [
    { icon: Database, bg: "bg-blue-600", label: "Database" },
    { icon: RefreshCw, bg: "bg-blue-500", label: "Sync" }
  ]

  // Scroll detection
  useEffect(() => {
    const container = chatContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
      setShowScrollButton(!isAtBottom)
    }

    container.addEventListener('scroll', handleScroll)
    handleScroll()

    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // Auto-scroll logic
  useEffect(() => {
    if (chatHistory.length > 0) {
      scrollToBottom()
    }
  }, [chatHistory, isWaitingResponse])

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }

  // Thinking Timer & Stages
  useEffect(() => {
    if (!isWaitingResponse) return
    const secTimer = setInterval(() => setThinkingSeconds((s) => s + 1), 1000)
    const stageTimer = setInterval(() => {
      setThinkingStageIndex((i) => (i + 1) % THINKING_STAGES.length)
    }, 1500)

    return () => {
      clearInterval(secTimer)
      clearInterval(stageTimer)
    }
  }, [isWaitingResponse])

  /* ---------- TIMER (4 MIN) ---------- */
  useEffect(() => {
    if (!isOpeningChat) return
    const i = setInterval(() => {
      setLoadingTimer((t) => {
        if (t >= 240) {
          setIsOpeningChat(false)
          alert("Sorry due to issue chat is not open")
          return 0
        }
        return t + 1
      })
    }, 1000)
    return () => clearInterval(i)
  }, [isOpeningChat])

  /* ---------- LOADING ICON ROTATION ---------- */
  useEffect(() => {
    if (!isOpeningChat) return
    const iconTimer = setInterval(() => {
      setLoadingIconIndex((i) => (i + 1) % LOADING_ICONS.length)
    }, 4000)
    return () => clearInterval(iconTimer)
  }, [isOpeningChat])

  /* ---------- FILE PREVIEW HANDLING ---------- */
  useEffect(() => {
    if (!file) {
      setFilePreview(null)
      return
    }

    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFilePreview({ type: 'image', url: reader.result, name: file.name })
      }
      reader.readAsDataURL(file)
    }

    return () => {
      if (filePreview?.type === 'image') {
        URL.revokeObjectURL(filePreview.url)
      }
    }
  }, [file])

  // Fetches an existing chat history from the DB
  const fetchOldChatData = async (chatId) => {
    try {
      const response = await axios.get(`${BaseURL}/ai/openChat/${chatId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching old chat:', error)
      throw error
    }
  }

  // Sends user query with optional image to backend
  const getAIResponse = async (currentQuery, imageFile = null) => {
    try {
      const formData = new FormData()
      formData.append('prompt', currentQuery)
      formData.append('next_gen_summary', memory)
      formData.append('new_chat', isNewChat)
      
      if (imageFile) {
        formData.append('image', imageFile)
      }

      const response = await axios.post(`${BaseURL}/ai/pipeline/${chatId}`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data
    } catch (error) {
      console.error('Error getting AI response:', error.response?.data || error.message)
      throw error
    }
  }

  /* ---------- CHAT HANDLERS ---------- */

  const handleNewChat = () => {
    setChatId(null)
    setChatHistory([])
    setChatTitle("+ New Chat")
    setMemory("")
    setIsNewChat(true)
    setIsCanvasOpen(false)
    setCanvasState(null)
    setExpandedThinkingId(null)
  }

  const handleOpenChat = async (chat) => {
    setIsOpeningChat(true)
    setLoadingTimer(0)
    setLoadingIconIndex(0)
    setOpeningChatTitle(chat.title || "Loading Chat...")

    try {
      const realChatData = await fetchOldChatData(chat.id)

      setChatId(chat.id)
      setChatTitle(realChatData.title || chat.title)
      setChatHistory(realChatData.messages || [])
      setIsNewChat(false)

      if (realChatData.messages?.length > 0) {
        const lastMsg = realChatData.messages[realChatData.messages.length - 1]
        setMemory(lastMsg.response?.next_gen_summary || "")
      }
    } catch (err) {
      alert("Failed to open chat. Please check your connection.")
    } finally {
      setIsOpeningChat(false)
    }
  }

  const handleSend = async () => {
    if (!query.trim() && !file) return

    const messageId = Date.now().toString()
    const currentQuery = query
    const currentFile = file
    const currentFilePreview = filePreview
    const wasNewChat = isNewChat

    // UI Optimism: Show user message with image thumbnail
    setIsWaitingResponse(true)
    setThinkingMessageId(messageId)
    setThinkingSeconds(0)
    setChatHistory((p) => [...p, { 
      id: messageId, 
      userQuery: currentQuery || "Image uploaded",
      imagePreview: currentFilePreview,
      response: null 
    }])
    setQuery("")
    setFile(null)
    setFilePreview(null)

    try {
      const realResponse = await getAIResponse(currentQuery, currentFile)

      if (wasNewChat) {
        if (realResponse.title) setChatTitle(realResponse.title)
        if (realResponse.chatId) setChatId(realResponse.chatId)
        setIsNewChat(false)
      }

      setMemory(realResponse.next_gen_summary || "")

      const responseMessage = {
        id: messageId,
        userQuery: currentQuery || "Image uploaded",
        imagePreview: currentFilePreview,
        response: realResponse,
      }

      setChatHistory((prev) =>
        prev.map((msg) => (msg.id === messageId ? responseMessage : msg))
      )
    } catch (error) {
      console.error("Failed to get response:", error)
    } finally {
      setIsWaitingResponse(false)
      setThinkingMessageId(null)
    }
  }

  // Toggle thinking expansion
  const toggleThinking = (messageId) => {
    setExpandedThinkingId(prev => prev === messageId ? null : messageId)
  }

  // Task 6: Canvas content resolution
  const activeMessage = canvasState 
    ? chatHistory.find((m) => m.id === canvasState.messageId)
    : null

  let canvasContent = null
  let canvasContentType = "text"

  if (activeMessage && canvasState) {
    if (canvasState.type === "text") {
      canvasContent = activeMessage.response.ai_text?.to_canvas
      canvasContentType = "text"
    } else if (canvasState.type === "table") {
      canvasContent = canvasState.tables
      canvasContentType = "table"
    }
  }

  if (!isOpen) return null

  const currentStage = THINKING_STAGES[thinkingStageIndex]
  const CurrentStageIcon = currentStage.icon
  const currentLoadingIcon = LOADING_ICONS[loadingIconIndex]
  const CurrentLoadingIcon = currentLoadingIcon.icon

  return (
    <>
      <div 
        className={`fixed top-0 right-0 h-screen bg-card border-l border-blue-600/20 flex flex-col z-50 ${
          isMobile ? 'w-full' : 'w-[25%] min-w-[400px]'
        } ${isCanvasOpen && isMobile ? 'pointer-events-none' : ''}`}
      >
        {/* HEADER */}
        <div className="p-4 border-b border-blue-600/20 flex justify-between items-center shrink-0 pointer-events-auto bg-gradient-to-r from-blue-600/5 to-transparent">
          <div className="flex items-center gap-2 flex-1 min-w-0">
             <Shell className="w-7 h-7 text-blue-600"/>
            <h2 className="font-semibold truncate text-blue-600">{chatTitle}</h2>
          </div>
          <div className="flex gap-2 shrink-0">
            <ChatMenu onNewChat={handleNewChat} onOpenChat={handleOpenChat} />
            <Button size="icon" variant="ghost" onClick={onClose} className="hover:bg-blue-600/10">
              <X className="text-blue-600" />
            </Button>
          </div>
        </div>

        {/* BODY */}
        <div 
          ref={chatContainerRef}
          className={`flex-1 p-4 overflow-y-auto pointer-events-auto relative ${isOpeningChat ? 'overflow-hidden' : ''}`}
        >
          {/* CENTER LOADING OVERLAY */}
          {isOpeningChat && (
            <div className="absolute inset-0 backdrop-blur-md bg-background/50 flex items-center justify-center z-50 pointer-events-none">
              <div className="flex flex-col items-center gap-4">
                <div className={`w-20 h-20 rounded-full ${currentLoadingIcon.bg} flex items-center justify-center shadow-lg shadow-blue-600/50 transition-all duration-500`}>
                  <CurrentLoadingIcon className="w-10 h-10 text-white animate-pulse" />
                </div>
                <p className="text-lg font-medium text-blue-600">
                  Your chat is loading {openingChatTitle}
                </p>
                <p className="text-sm text-muted-foreground">
                  {loadingTimer}s
                </p>
              </div>
            </div>
          )}

          {/* CHAT MESSAGES */}
          <div className={isOpeningChat ? 'blur-sm pointer-events-none' : ''}>
            {chatHistory.map((m) => {
              const hasIntroMessage = m.response?.ai_text?.intro_message
              const hasOutroMessage = m.response?.ai_text?.outro_message
              const hasTextCanvas = m.response?.ai_text?.to_canvas
              const hasIntent = m.response?.intent_explanation
              
              const fromDatabase = m.response?.from_database || []
              const smallTables = fromDatabase.filter(table => !isLargeTable(table))
              const largeTables = fromDatabase.filter(table => isLargeTable(table))
              
              const showThinkingLoader = isWaitingResponse && thinkingMessageId === m.id && !m.response
              const isThinkingExpanded = expandedThinkingId === m.id

              return (
                <div key={m.id} className="mb-6 space-y-3">
                  {/* USER QUERY WITH IMAGE THUMBNAIL */}
                  <div className="text-sm font-medium bg-blue-600/5 border border-blue-600/10 p-3 rounded-lg space-y-2">
                    {m.imagePreview && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="relative w-16 h-16 rounded-md overflow-hidden border-2 border-blue-600/20 shadow-sm">
                          <img 
                            src={m.imagePreview.url} 
                            alt="Uploaded" 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-blue-600/5"></div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-1 text-xs text-blue-600">
                            <Image className="w-3 h-3" />
                            <span className="truncate">{m.imagePreview.name}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <p className="text-foreground">{m.userQuery}</p>
                  </div>

                  {/* INLINE THINKING LOADER */}
                  {showThinkingLoader && (
                    <div className="flex items-center gap-3 py-2 px-3 bg-blue-600/5 rounded-lg border border-blue-600/10">
                      <div className={`w-8 h-8 rounded-full ${currentStage.color.split(' ')[0]} flex items-center justify-center shadow-lg animate-pulse`}>
                        <CurrentStageIcon className="w-4 h-4 text-white" />
                      </div>
                      <span className={`text-sm font-medium ${currentStage.color.split(' ')[1]}`}>
                        {currentStage.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {thinkingSeconds}s
                      </span>
                    </div>
                  )}

                  {/* THINKING TOGGLE */}
                  {m.response && hasIntent && (
                    <button
                      onClick={() => toggleThinking(m.id)}
                      className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <span>Thinking</span>
                      {isThinkingExpanded ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>
                  )}

                  {/* INTENT EXPLANATION */}
                  {isThinkingExpanded && hasIntent && (
                    <div className="text-xs text-muted-foreground bg-blue-600/5 p-3 rounded border-l-2 border-blue-600">
                      {m.response.intent_explanation}
                    </div>
                  )}

                  {/* RESPONSE CONTENT */}
                  {m.response && (
                    <>
                      {hasIntroMessage && (
                        <AITextRenderer content={m.response.ai_text.intro_message} />
                      )}

                      {(hasTextCanvas || largeTables.length > 0) && (
                        <div className="flex gap-2 flex-wrap">
                          {hasTextCanvas && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setCanvasState({ messageId: m.id, type: "text" })
                                setIsCanvasOpen(true)
                              }}
                              className="border-blue-600/20 text-blue-600 hover:bg-blue-600/10"
                            >
                              <Maximize2 className="w-4 h-4 mr-2" />
                              View Explanation
                            </Button>
                          )}
                          {largeTables.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setCanvasState({ 
                                  messageId: m.id, 
                                  type: "table",
                                  tables: largeTables
                                })
                                setIsCanvasOpen(true)
                              }}
                              className="border-blue-600/20 text-blue-600 hover:bg-blue-600/10"
                            >
                              <Maximize2 className="w-4 h-4 mr-2" />
                              View Full Table
                            </Button>
                          )}
                        </div>
                      )}

                      {smallTables.map((table, idx) => (
                        <SmallTableRenderer 
                          key={idx} 
                          data={table.data} 
                          label={table.label}
                        />
                      ))}

                      {hasOutroMessage && (
                        <AITextRenderer content={m.response.ai_text.outro_message} />
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>

          {/* SCROLL TO BOTTOM BUTTON */}
          {showScrollButton && (
            <button
              onClick={scrollToBottom}
              className="fixed bottom-40 w-10 h-10 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/50 hover:shadow-xl transition-all duration-200 flex items-center justify-center z-10 hover:scale-110"
              style={{
                left: isMobile ? '50%' : 'calc(100% - 200px)',
                transform: 'translateX(-50%)'
              }}
            >
              <ArrowDown className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* INPUT - Fixed at bottom */}
        <div className={`p-4 border-t border-blue-600/20 space-y-2 shrink-0 pointer-events-auto bg-gradient-to-t from-blue-600/5 to-transparent ${isOpeningChat ? 'blur-sm pointer-events-none' : ''}`}>
          {/* File preview */}
          {filePreview && (
            <div className="flex items-center gap-2 p-2 bg-blue-600/10 border border-blue-600/20 rounded-lg">
              <div className="relative w-12 h-12 rounded overflow-hidden border border-blue-600/30">
                <img 
                  src={filePreview.url} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-sm truncate flex-1 text-blue-600">{filePreview.name}</span>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 hover:bg-blue-600/20"
                onClick={() => {
                  setFile(null)
                  setFilePreview(null)
                }}
              >
                <X className="w-4 h-4 text-blue-600" />
              </Button>
            </div>
          )}

          <Textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask something or upload an image…"
            className="max-h-[6rem] resize-none overflow-y-auto border-blue-600/20 focus:border-blue-600 focus:ring-blue-600"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => document.getElementById("file")?.click()}
              className="border-blue-600/20 text-blue-600 hover:bg-blue-600/10"
            >
              <Upload className="w-4 h-4" />
            </Button>
            <input
              id="file"
              type="file"
              hidden
              accept="image/*"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0]
                if (selectedFile) setFile(selectedFile)
              }}
            />
            <Button 
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30" 
              onClick={handleSend} 
              disabled={isLoading || (!query.trim() && !file)}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Send
            </Button>
          </div>
        </div>
      </div>

      {/* CANVAS PANEL */}
      {isCanvasOpen && canvasContent && isMobile !== null && (
        <CanvasPanel
          isOpen
          content={canvasContent}
          contentType={canvasContentType}
          isMobile={isMobile}
          onClose={() => {
            setIsCanvasOpen(false)
            setCanvasState(null)
          }}
        />
      )}
    </>
  )
}