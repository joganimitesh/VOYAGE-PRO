import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/helpers';

const Modal = ({ isOpen, onClose, title, children, className }) => {
    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
                    />
                    <div className="fixed inset-0 flex items-center justify-center z-[70] pointer-events-none p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className={cn(
                                "bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto overflow-hidden border border-slate-100 dark:border-slate-700",
                                className
                            )}
                        >
                            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800">
                                <h3 className="font-bold text-xl text-slate-800 dark:text-slate-100">{title}</h3>
                                <button
                                    onClick={onClose}
                                    className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6">
                                {children}
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default Modal;
