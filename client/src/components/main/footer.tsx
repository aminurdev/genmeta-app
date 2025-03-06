export default function Footer() {
  return (
    <footer className="border-t py-6">
      <div className="container mx-auto px-4">
        <div className="text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Image SEO Generator. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

