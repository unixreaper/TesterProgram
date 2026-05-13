/* eslint-disable react/prop-types */
import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"

export function Tooltip({ children, content }) {
  const [open, setOpen] = React.useState(false)

  return (
    <div 
      className="relative flex items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {children}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute left-full ml-2 px-2 py-1 bg-[#252526] border border-[#454545] rounded shadow-xl z-50 pointer-events-none whitespace-nowrap"
          >
            <div className="text-[10px] font-medium text-[#e0e0e0]">{content}</div>
            <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-[#252526] border-l border-b border-[#454545] rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
