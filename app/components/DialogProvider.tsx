"use client"

import React, { createContext, useContext, useState, useCallback, useRef } from "react"

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────
type DialogType = "confirm" | "success" | "error" | "warning" | "info"

interface DialogOptions {
  title?: string
  message: string
  type?: DialogType
  confirmText?: string
  cancelText?: string
  /** For confirm dialogs — color of the confirm button */
  confirmColor?: "red" | "green" | "purple" | "blue" | "orange"
}

interface DialogState extends DialogOptions {
  open: boolean
  resolve?: (value: boolean) => void
}

interface DialogContextType {
  /** Show a confirmation dialog. Returns a promise that resolves true/false. */
  confirm: (opts: DialogOptions | string) => Promise<boolean>
  /** Show a success notification dialog. */
  success: (message: string, title?: string) => Promise<boolean>
  /** Show an error notification dialog. */
  error: (message: string, title?: string) => Promise<boolean>
  /** Show a warning notification dialog. */
  warning: (message: string, title?: string) => Promise<boolean>
  /** Show an info notification dialog. */
  info: (message: string, title?: string) => Promise<boolean>
}

const DialogContext = createContext<DialogContextType | null>(null)

export function useDialog(): DialogContextType {
  const ctx = useContext(DialogContext)
  if (!ctx) throw new Error("useDialog must be used within <DialogProvider>")
  return ctx
}

// ──────────────────────────────────────────────────────────────
// Icon components
// ──────────────────────────────────────────────────────────────
function ConfirmIcon() {
  return (
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
      <svg className="h-7 w-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    </div>
  )
}

function SuccessIcon() {
  return (
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
      <svg className="h-7 w-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    </div>
  )
}

function ErrorIcon() {
  return (
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
      <svg className="h-7 w-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>
  )
}

function WarningIcon() {
  return (
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-100">
      <svg className="h-7 w-7 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    </div>
  )
}

function InfoIcon() {
  return (
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
      <svg className="h-7 w-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  )
}

const iconMap: Record<DialogType, React.FC> = {
  confirm: ConfirmIcon,
  success: SuccessIcon,
  error: ErrorIcon,
  warning: WarningIcon,
  info: InfoIcon,
}

const defaultTitles: Record<DialogType, string> = {
  confirm: "Confirm Action",
  success: "Success",
  error: "Error",
  warning: "Warning",
  info: "Information",
}

const confirmBtnColors: Record<string, string> = {
  red: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
  green: "bg-green-600 hover:bg-green-700 focus:ring-green-500",
  purple: "bg-purple-600 hover:bg-purple-700 focus:ring-purple-500",
  blue: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
  orange: "bg-orange-600 hover:bg-orange-700 focus:ring-orange-500",
}

// ──────────────────────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────────────────────
export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<DialogState>({ open: false, message: "" })
  const backdropRef = useRef<HTMLDivElement>(null)

  const showDialog = useCallback((opts: DialogOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setDialog({ ...opts, open: true, resolve })
    })
  }, [])

  const close = useCallback((result: boolean) => {
    dialog.resolve?.(result)
    setDialog((prev) => ({ ...prev, open: false }))
  }, [dialog])

  const contextValue: DialogContextType = {
    confirm: useCallback(
      (optsOrMsg: DialogOptions | string) => {
        const opts: DialogOptions =
          typeof optsOrMsg === "string"
            ? { message: optsOrMsg, type: "confirm" }
            : { type: "confirm", ...optsOrMsg }
        return showDialog(opts)
      },
      [showDialog]
    ),
    success: useCallback(
      (message: string, title?: string) =>
        showDialog({ message, title, type: "success" }),
      [showDialog]
    ),
    error: useCallback(
      (message: string, title?: string) =>
        showDialog({ message, title, type: "error" }),
      [showDialog]
    ),
    warning: useCallback(
      (message: string, title?: string) =>
        showDialog({ message, title, type: "warning" }),
      [showDialog]
    ),
    info: useCallback(
      (message: string, title?: string) =>
        showDialog({ message, title, type: "info" }),
      [showDialog]
    ),
  }

  const dialogType = dialog.type || "info"
  const isConfirm = dialogType === "confirm"
  const IconComponent = iconMap[dialogType]
  const title = dialog.title || defaultTitles[dialogType]
  const confirmColor = dialog.confirmColor || (dialogType === "confirm" ? "red" : dialogType === "success" ? "green" : dialogType === "error" ? "red" : "purple")

  return (
    <DialogContext.Provider value={contextValue}>
      {children}

      {/* Dialog overlay */}
      {dialog.open && (
        <div
          ref={backdropRef}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === backdropRef.current) close(false) }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              {/* Icon */}
              <IconComponent />

              {/* Title */}
              <h3 className="mt-4 text-lg font-bold text-gray-900">{title}</h3>

              {/* Message */}
              <p className="mt-2 text-sm text-gray-600 leading-relaxed whitespace-pre-line">{dialog.message}</p>
            </div>

            {/* Actions */}
            <div className={`px-6 pb-6 ${isConfirm ? "flex gap-3" : "flex justify-center"}`}>
              {isConfirm ? (
                <>
                  <button
                    onClick={() => close(false)}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
                  >
                    {dialog.cancelText || "Cancel"}
                  </button>
                  <button
                    onClick={() => close(true)}
                    className={`flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${confirmBtnColors[confirmColor]}`}
                  >
                    {dialog.confirmText || "Confirm"}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => close(true)}
                  className={`px-8 py-2.5 text-sm font-medium text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${confirmBtnColors[confirmColor]}`}
                >
                  {dialog.confirmText || "OK"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  )
}
