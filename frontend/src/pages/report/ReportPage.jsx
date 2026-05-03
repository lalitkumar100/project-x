import React from "react";
import AnimatedReportCard from "@/components/AnimatedReportCard";
import SectionHeader from "@/components/SectionHeader";
import { Factory, ArrowLeftRight, ArrowRightLeft } from "lucide-react";

export default function ReportPage() {
  return (
    <>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <SectionHeader
          title="Reports Overview"
          description="Access reports to gain insights into your business operations."
        />

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">

          <AnimatedReportCard
            title="Wholesaler Reports"
            subtitle="Supplier Insights"
            description="Track purchases by wholesaler"
            icon={Factory}
            navigateTo="/report/wholesaler"
            hoverBg="hover:bg-cyan-100"
            textColor="text-cyan-600"
            iconColor="text-cyan-600"
          />

          <AnimatedReportCard
            title="TCG Transactions"
            subtitle="Network Invoices"
            description="View sent & received TCG transactions"
            icon={ArrowLeftRight}
            navigateTo="/report/transaction"
            hoverBg="hover:bg-indigo-100"
            textColor="text-indigo-600"
            iconColor="text-indigo-600"
          />

          <AnimatedReportCard
            title="TCG Requests"
            subtitle="Trade Requests"
            description="View sent & received TCG trade requests"
            icon={ArrowRightLeft}
            navigateTo="/report/request"
            hoverBg="hover:bg-violet-100"
            textColor="text-violet-600"
            iconColor="text-violet-600"
          />

        </div>
      </div>
    </>
  );
}