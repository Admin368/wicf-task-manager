"use client"

import * as React from "react"
import {
  BarChart,
  Bar as RechartsBar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { cn } from "@/lib/utils"

interface DataItem {
  name: string
  value: number
  [key: string]: any
}

interface SimpleBarChartProps {
  data: DataItem[]
  xField?: string
  yField?: string
  className?: string
  tooltip?: string
  colors?: string | ((data: DataItem) => string)
}

export function Bar({
  data,
  xField = "name",
  yField = "value",
  className,
  tooltip = "{value}",
  colors = "var(--primary)",
}: SimpleBarChartProps) {
  const formatTooltip = (value: number, entry: any) => {
    if (!tooltip) return value;
    return tooltip.replace(/{(\w+)}/g, (match, key) => {
      return entry?.payload?.[key] !== undefined 
        ? entry.payload[key] 
        : match;
    });
  };

  // Function to get bar color - either static string or from function
  const barFill = typeof colors === 'function' 
    ? colors 
    : () => colors as string;

  return (
    <div className={cn("w-full h-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 5,
            left: 5,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey={xField} 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            cursor={{ fill: 'var(--muted)' }}
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-md">
                    <div className="text-sm font-medium">{label}</div>
                    <div className="text-sm">
                      {formatTooltip(payload[0].value as number, payload[0])}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <RechartsBar 
            dataKey={yField}
            fill={colors as string}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
} 