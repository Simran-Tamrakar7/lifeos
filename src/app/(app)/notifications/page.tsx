"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useLifeOSStore } from "@/stores/use-lifeos-store";
import { formatRelative } from "@/lib/utils";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

export default function NotificationsPage() {
  const notifications = useLifeOSStore((s) => s.notifications);
  const markNotificationRead = useLifeOSStore((s) => s.markNotificationRead);
  const markAllNotificationsRead = useLifeOSStore((s) => s.markAllNotificationsRead);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const list = unreadOnly ? notifications.filter((n) => !n.read) : notifications;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Reminders, streaks, and system pings."
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant={unreadOnly ? "default" : "secondary"} onClick={() => setUnreadOnly((v) => !v)}>
              Unread only
            </Button>
            <Button size="sm" variant="secondary" onClick={markAllNotificationsRead}>
              Mark all read
            </Button>
          </div>
        }
      />

      {list.length === 0 ? (
        <EmptyState icon={Bell} title="You're all caught up" description="No notifications in this filter." />
      ) : (
        <div className="space-y-2">
          {list.map((n) => {
            const inner = (
              <Card
                className={`glass transition hover:border-[var(--accent)]/30 ${n.read ? "opacity-70" : ""}`}
                onClick={() => markNotificationRead(n.id)}
              >
                <CardContent className="flex items-start gap-3 p-4">
                  <div className={`mt-1 h-2 w-2 rounded-full ${n.read ? "bg-[var(--surface-3)]" : "bg-[var(--accent)]"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{n.title}</p>
                      <Badge variant={n.type === "warning" ? "warning" : n.type === "success" ? "success" : "secondary"}>
                        {n.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-[var(--fg-muted)]">{n.body}</p>
                    <p className="mt-1 text-xs text-[var(--fg-muted)]">{formatRelative(n.createdAt)}</p>
                  </div>
                </CardContent>
              </Card>
            );
            return n.href ? (
              <Link key={n.id} href={n.href} className="block">
                {inner}
              </Link>
            ) : (
              <div key={n.id}>{inner}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
