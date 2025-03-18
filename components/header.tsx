import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="font-semibold">
          Maravian CheckList
        </Link>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/guide">
              <HelpCircle className="h-4 w-4 mr-2" />
              How to Use
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
