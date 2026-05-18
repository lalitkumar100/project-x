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
import { User, Store } from "lucide-react"

export default function PageBreadcrumb({
  items = [],
  showSidebarTrigger = true,
}) {
  const navigate = useNavigate()

  const businessName = localStorage.getItem("business_name")

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
      <div className="flex items-center gap-3">
        {businessName && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-linear-to-br from-cyan-500/10 to-teal-500/10 border border-cyan-500/20 text-cyan-800 font-semibold text-xs shadow-xs animate-fade-in">
            {/* The present icon representing the business profile */}
            <Store className="h-4 w-4 text-cyan-600 animate-pulse" />
            <span>{businessName}</span>
          </div>
        )}
        
      </div>
    </header>
  )
}
