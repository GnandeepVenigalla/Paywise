import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    maxWidth = 'max-w-md',
    showClose = true,
    animate = 'slide-up' // 'slide-up' | 'zoom' | 'fade'
}) => {
    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    const animations = {
        'slide-up': 'animate-in slide-in-from-bottom-10 duration-300 ease-out',
        'zoom': 'animate-in zoom-in-95 duration-200 ease-out',
        'fade': 'animate-in fade-in duration-200'
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-300">
            {/* Backdrop click to close */}
            <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

            <div
                className={`bg-white w-full ${maxWidth} rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl relative z-[151] flex flex-col max-h-[92dvh] overflow-hidden ${animations[animate]}`}
            >
                {/* Header */}
                {(title || showClose) && (
                    <div className="flex items-center justify-between px-8 py-6 border-b border-gray-50 flex-shrink-0">
                        {title ? <h3 className="text-xl font-black text-gray-900 leading-tight">{title}</h3> : <div />}
                        {showClose && (
                            <button
                                onClick={onClose}
                                className="p-2.5 bg-gray-50 rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition shadow-sm"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="p-8 border-t border-gray-50 bg-gray-50/30 flex-shrink-0">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;
