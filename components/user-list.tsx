"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, ShieldCheck, User, Clock } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { format } from "date-fns"

interface TeamMember {
  id: string
  name: string
  email?: string | null
  avatar_url?: string | null
  role: string
  notes?: string | null
  checkedInAt?: string | null
}

interface UserListProps {
  teamMembers: TeamMember[]
  onClose: () => void
  showTime?: boolean
}

export function UserList({ teamMembers, onClose, showTime }: UserListProps) {
  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-primary text-primary-foreground'
      case 'owner':
        return 'bg-destructive text-destructive-foreground'
      default:
        return 'bg-secondary text-secondary-foreground'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
      case 'owner':
        return <ShieldCheck className="h-3 w-3 mr-1" />
      default:
        return <User className="h-3 w-3 mr-1" />
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>{showTime ? "Checked-in Members" : "Team Members"}</CardTitle>
          <CardDescription>
            {teamMembers.length} {teamMembers.length === 1 ? "member" : "members"} {showTime ? "checked in" : "in the team"}
          </CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {teamMembers.map((member) => (
            <div key={member.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted">
              <Avatar>
                <AvatarFallback>
                  {member.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-grow">
                <div className="font-medium">{member.name}</div>
                {member.email && <div className="text-sm text-muted-foreground">{member.email}</div>}
                {member.notes && <div className="text-sm italic mt-1">{member.notes}</div>}
              </div>
              <div className="flex flex-col items-end gap-2">
                {member.role && (
                  <Badge variant="secondary" className={`flex items-center ${getRoleColor(member.role)}`}>
                    {getRoleIcon(member.role)}
                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                  </Badge>
                )}
                {showTime && member.checkedInAt && (
                  <Badge variant="outline" className="flex items-center text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {format(new Date(member.checkedInAt), "h:mm a")}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

