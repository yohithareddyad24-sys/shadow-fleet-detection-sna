import React from 'react';
import { Ship, ShieldAlert, Radio, AlertTriangle } from 'lucide-react';
import DemoBadge from '../common/DemoBadge';
import KpiGlowCard from '../effects/KpiGlowCard';
import CountingNumber from '../effects/CountingNumber';
import Sparkline from '../effects/Sparkline';

export default function KpiSummaryCards({ stats, isDemo = false }) {
  const cards = [
    {
      title: "MONITORED FLEET",
      value: stats?.total_vessels || 12,
      subtitle: "Across 10 flag jurisdictions",
      icon: Ship,
      color: "text-accent-cyan",
      accentColor: "#20D5E8",
      sparklineData: [9, 10, 11, 11, 12, 12, 12],
    },
    {
      title: "ELEVATED / CRITICAL",
      value: (stats?.critical_count || 0) + (stats?.elevated_count || 3),
      subtitle: "Anomalous behavioural index",
      icon: ShieldAlert,
      color: "text-risk-warning",
      accentColor: "#F5B942",
      sparklineData: [2, 3, 3, 4, 3, 4, 5],
    },
    {
      title: "DARK AIS TRANSMISSION GAPS",
      value: stats?.total_dark_gaps_reported || 61,
      subtitle: "Blackout events in transit choke points",
      icon: Radio,
      color: "text-risk-alert",
      accentColor: "#FF5C65",
      sparklineData: [38, 42, 45, 50, 56, 59, 61],
    },
    {
      title: "SPOOFING DISCREPANCIES",
      value: stats?.total_spoofing_incidents || 22,
      subtitle: "Kinematic broadcast mismatches",
      icon: AlertTriangle,
      color: "text-accent-blue",
      accentColor: "#4285F4",
      sparklineData: [12, 14, 15, 17, 19, 21, 22],
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <KpiGlowCard
            key={idx}
            accentColor={card.accentColor}
            className="font-mono"
          >
            <div className="flex items-center justify-between text-[10px] text-text-secondary uppercase">
              <span>{card.title}</span>
              <Icon className={`w-3.5 h-3.5 ${card.color}`} />
            </div>
            <div className="my-2 flex items-baseline justify-between">
              <CountingNumber
                value={card.value}
                className={`text-3xl font-bold ${card.color}`}
              />
              <Sparkline 
                data={card.sparklineData} 
                color={card.accentColor} 
                width={65} 
                height={18} 
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-text-secondary">
              <span className="truncate">{card.subtitle}</span>
              {isDemo && <DemoBadge />}
            </div>
          </KpiGlowCard>
        );
      })}
    </div>
  );
}
