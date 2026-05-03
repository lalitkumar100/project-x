import ReactMarkdown from "react-markdown"

export function AITextRenderer({ content }) {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-code:text-foreground">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}

