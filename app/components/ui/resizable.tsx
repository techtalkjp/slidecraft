import { GripVerticalIcon } from 'lucide-react'
import type * as React from 'react'
import * as ResizablePrimitive from 'react-resizable-panels'

import { cn } from '~/lib/utils'

function ResizablePanelGroup({
  className,
  direction,
  ...props
}: Omit<
  React.ComponentProps<typeof ResizablePrimitive.Group>,
  'orientation'
> & {
  direction?: 'horizontal' | 'vertical'
}) {
  return (
    <ResizablePrimitive.Group
      data-slot="resizable-panel-group"
      orientation={direction}
      className={cn('flex h-full w-full', className)}
      {...props}
    />
  )
}

function ResizablePanel({
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Panel>) {
  return <ResizablePrimitive.Panel data-slot="resizable-panel" {...props} />
}

function ResizableHandle({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Separator> & {
  withHandle?: boolean
}) {
  // Note: In react-resizable-panels v4, the separator's aria-orientation is
  // perpendicular to the group's orientation:
  // - horizontal group → vertical separator (vertical line between panels)
  // - vertical group → horizontal separator (horizontal line between panels)
  // So aria-orientation="horizontal" means it's a horizontal LINE (for vertical groups)
  return (
    <ResizablePrimitive.Separator
      data-slot="resizable-handle"
      className={cn(
        // Default: vertical separator (vertical line for horizontal groups)
        'bg-border relative flex w-px items-center justify-center outline-none after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2',
        // Horizontal separator (horizontal line for vertical groups)
        'aria-[orientation=horizontal]:h-px aria-[orientation=horizontal]:w-full aria-[orientation=horizontal]:after:inset-x-0 aria-[orientation=horizontal]:after:inset-y-auto aria-[orientation=horizontal]:after:left-0 aria-[orientation=horizontal]:after:h-1 aria-[orientation=horizontal]:after:w-full aria-[orientation=horizontal]:after:translate-x-0 aria-[orientation=horizontal]:after:-translate-y-1/2 [&[aria-orientation=horizontal]>div]:rotate-90',
        // Focus indicator on the handle
        '[&:focus-visible>div]:ring-ring [&:focus-visible>div]:ring-2 [&:focus-visible>div]:ring-offset-2',
        className,
      )}
      {...props}
    >
      {withHandle && (
        <div className="bg-border z-10 flex h-4 w-3 items-center justify-center rounded-xs border transition-shadow">
          <GripVerticalIcon className="size-2.5" />
        </div>
      )}
    </ResizablePrimitive.Separator>
  )
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup }
