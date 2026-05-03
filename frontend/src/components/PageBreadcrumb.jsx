import React from "react"
import { useNavigate } from "react-router-dom"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { User } from "lucide-react"

export default function PageBreadcrumb({
  items = [],
  showSidebarTrigger = true,
}) {
  const navigate = useNavigate()

  return (
    <header className="flex w-full h-16 items-center justify-between px-4 transition-[width,height] ease-linear group-has-[data-collapsible=icon]/sidebar-wrapper:h-12">
      
      {/* LEFT */}
      <div className="flex items-center gap-2">
        {showSidebarTrigger && <SidebarTrigger className="-ml-1" />}
        <Separator orientation="vertical" className="h-4" />

        <Breadcrumb>
          <BreadcrumbList>
            {items.map((item, index) => {
              const isLast = index === items.length - 1

              return (
                <React.Fragment key={index}>
                  <BreadcrumbItem>
                    {isLast || !item.href ? (
                      <BreadcrumbPage>{item.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={item.href}>
                        {item.label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>

                  {!isLast && <BreadcrumbSeparator />}
                </React.Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* RIGHT */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate("/profile")}
        className="rounded-full h-10 w-10 bg-linear-to-br from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white"
        aria-label="Go to profile"
      >
        <User className="h-5 w-5" />
      </Button>
    </header>
  )
}
