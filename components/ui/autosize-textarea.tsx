import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { }

export type AutosizeTextareaHandle = {
    focus: () => void
    getElement: () => HTMLTextAreaElement | null
    setValue?: (value: string) => void
}

const AutosizeTextarea = React.forwardRef<AutosizeTextareaHandle, TextareaProps>(
    ({ className, onChange, ...props }, ref) => {
        const textareaRef = React.useRef<HTMLTextAreaElement | null>(null)

        // Expose a small, safe imperative handle instead of the raw DOM node
        React.useImperativeHandle(ref, () => ({
            focus: () => textareaRef.current?.focus(),
            getElement: () => textareaRef.current,
            setValue: (value: string) => {
                if (textareaRef.current) {
                    textareaRef.current.value = value
                    // adjust height after programmatic value change
                    textareaRef.current.style.height = "auto"
                    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
                }
            },
        }), [textareaRef.current])

        const adjustHeight = () => {
            const textarea = textareaRef.current
            if (textarea) {
                textarea.style.height = "auto"
                textarea.style.height = `${textarea.scrollHeight}px`
            }
        }

        React.useEffect(() => {
            adjustHeight()
        }, [props.value])

        return (
            <textarea
                {...props}
                ref={textareaRef}
                onChange={(e) => {
                    adjustHeight()
                    onChange?.(e)
                }}
                className={cn(
                    "flex min-h-[80px] w-full resize-none overflow-hidden rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
            />
        )
    }
)
AutosizeTextarea.displayName = "AutosizeTextarea"

export { AutosizeTextarea }
