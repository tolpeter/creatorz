"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      // Szebb, jól látható értesítések, amelyek NEM lógnak rá a felső menüsorra
      // (a sticky fejléc kb. 56px magas, ezért 80px-rel lejjebb kezdődnek),
      // és kézzel is bezárhatók (X gomb).
      position="top-center"
      offset={80}
      mobileOffset={{ top: 72, left: 12, right: 12 }}
      richColors
      closeButton
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "cn-toast group rounded-2xl border px-4 py-3.5 gap-3 shadow-[0_12px_40px_rgba(0,0,0,0.16)] backdrop-blur",
          title: "text-sm font-semibold",
          description: "text-sm opacity-90",
          icon: "mt-0.5",
          closeButton:
            "!left-auto !right-2 !top-2 !flex !h-6 !w-6 !items-center !justify-center !rounded-full !border !bg-white/80 !p-0 !text-foreground/70 hover:!bg-white hover:!text-foreground [&>svg]:!m-0",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
