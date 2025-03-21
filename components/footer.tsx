import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t py-4 mt-auto">
      <Link
        href="https://maravian.com"
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium hover:text-primary decoration-none"
      >
        <div className="container flex justify-center items-center">
          <p className="text-sm text-muted-foreground">
            Maravian © {currentYear}
          </p>
        </div>
      </Link>
    </footer>
  );
}
