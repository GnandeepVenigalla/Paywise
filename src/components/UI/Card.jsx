import React from 'react';

const Card = ({
    children,
    title,
    subtitle,
    icon: Icon,
    className = '',
    onClick,
    variant = 'default', // 'default' | 'outline' | 'ghost' | 'glass'
    padding = 'p-5'
}) => {
    const baseStyles = 'rounded-3xl shadow-sm border transition-all duration-200 overflow-hidden';

    const variants = {
        default: 'bg-white border-gray-100 hover:shadow-md active:scale-[0.98]',
        outline: 'bg-transparent border-gray-200 border-2 hover:border-slate-900',
        ghost: 'bg-slate-50 border-transparent hover:bg-slate-100',
        glass: 'bg-white/70 backdrop-blur-md border-white/20 shadow-xl'
    };

    const Content = (
        <>
            {(title || Icon) && (
                <div className="flex items-center gap-4 mb-4">
                    {Icon && (
                        <div className="w-12 h-12 bg-slate-950 text-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-slate-950/10">
                            <Icon className="w-6 h-6" />
                        </div>
                    )}
                    <div className="min-w-0">
                        {title && <h3 className="text-lg font-black text-gray-900 truncate leading-tight">{title}</h3>}
                        {subtitle && <p className="text-sm text-gray-500 truncate leading-snug">{subtitle}</p>}
                    </div>
                </div>
            )}
            {children}
        </>
    );

    if (onClick) {
        return (
            <button
                onClick={onClick}
                className={`${baseStyles} ${variants[variant]} ${padding} ${className} w-full text-left flex flex-col`}
            >
                {Content}
            </button>
        );
    }

    return (
        <div className={`${baseStyles} ${variants[variant]} ${padding} ${className}`}>
            {Content}
        </div>
    );
};

export default Card;
