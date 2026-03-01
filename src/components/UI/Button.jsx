import React from 'react';

const Button = ({
    children,
    onClick,
    variant = 'primary',
    className = '',
    disabled = false,
    type = 'button',
    icon: Icon = null,
    fullWidth = false,
    ...props
}) => {
    const baseStyles = 'flex items-center justify-center gap-2 py-3 px-6 rounded-2xl font-bold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:active:scale-100 shadow-sm';

    const variants = {
        primary: 'bg-slate-950 text-white hover:bg-slate-900 shadow-slate-900/10',
        secondary: 'bg-white text-slate-900 border border-gray-200 hover:bg-gray-50',
        ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 shadow-none',
        danger: 'bg-rose-500 text-white hover:bg-rose-600 shadow-rose-500/10',
        outline: 'bg-transparent text-slate-950 border-2 border-slate-950 hover:bg-slate-50',
    };

    const widthStyle = fullWidth ? 'w-full' : '';

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyles} ${variants[variant]} ${widthStyle} ${className}`}
            {...props}
        >
            {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
            {children}
        </button>
    );
};

export default Button;
