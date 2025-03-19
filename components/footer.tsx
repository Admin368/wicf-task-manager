import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t py-4 mt-auto">
      <div className="container flex justify-center items-center">
        <p className="text-sm text-muted-foreground">
          <Link
            href="https://maravian.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-4 hover:text-primary decoration-none"
          >
            Maravian
          </Link>{" "}
          © {currentYear}
        </p>
      </div>
    </footer>
  );
}
