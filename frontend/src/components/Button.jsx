"use client"

export default function Button({ children, className = "", onClick, ...props }) {
  return (
    <button onClick={onClick} className={`px-4 py-2 rounded transition-all ${className}`} {...props}>
      {children}
    </button>
  )
}
