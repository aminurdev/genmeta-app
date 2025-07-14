import { Separator } from "@/components/ui/separator"
import { AppearanceForm } from "./appearance-form"

export const metadata = {
  title: "Appearance",
  description: "Customize the appearance of the application.",
}

export default function AppearancePage() {
  return (
    <div className="space-y-6 p-4 pt-0">
      <div>
        <h3 className="text-lg font-medium">Appearance</h3>
        <p className="text-sm text-muted-foreground">
          Customize the appearance of the application. Choose between light and dark mode.
        </p>
      </div>
      <Separator />
      <AppearanceForm />
    </div>
  )
}
