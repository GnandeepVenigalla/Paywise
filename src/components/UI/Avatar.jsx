import React from 'react';

const Avatar = ({
    src,
    name,
    size = 'md',
    className = '',
    variant = 'split' // 'split' | 'solid' | 'gradient'
}) => {
    const sizes = {
        sm: 'w-8 h-8 text-[12px] rounded-lg',
        md: 'w-12 h-12 text-[16px] rounded-xl',
        lg: 'w-16 h-16 text-[22px] rounded-2xl',
        xl: 'w-24 h-24 text-[32px] rounded-3xl'
    };

    const baseStyles = 'relative shrink-0 overflow-hidden flex items-center justify-center font-black uppercase text-white shadow-sm transition-transform hover:scale-105';

    const colors = [
        { p: 'bg-[#02182B]', s: 'bg-[#04345C]', t: 'bg-[#124B75]', q: 'bg-[#6B9AB7]' },
        { p: 'bg-[#1E293B]', s: 'bg-[#334155]', t: 'bg-[#475569]', q: 'bg-[#64748B]' },
        { p: 'bg-emerald-800', s: 'bg-emerald-700', t: 'bg-emerald-600', q: 'bg-emerald-500' },
        { p: 'bg-indigo-800', s: 'bg-indigo-700', t: 'bg-indigo-600', q: 'bg-indigo-500' }
    ];

    const colorIndex = name ? name.length % colors.length : 0;
    const set = colors[colorIndex];

    if (src) {
        return (
            <img
                src={src}
                alt={name}
                className={`${sizes[size]} ${baseStyles} ${className} object-cover`}
            />
        );
    }

    return (
        <div className={`${sizes[size]} ${baseStyles} ${className}`}>
            {variant === 'split' ? (
                <div className="w-full h-full flex flex-wrap">
                    <div className={`w-1/2 h-1/2 ${set.p}`} />
                    <div className={`w-1/2 h-1/2 ${set.s}`} />
                    <div className={`w-1/2 h-1/2 ${set.t}`} />
                    <div className={`w-1/2 h-1/2 ${set.q}`} />
                    <div className="absolute inset-0 flex items-center justify-center z-10 drop-shadow-md">
                        {name?.charAt(0)}
                    </div>
                </div>
            ) : (
                <div className={`w-full h-full ${set.p} flex items-center justify-center`}>
                    {name?.charAt(0)}
                </div>
            )}
        </div>
    );
};

export default Avatar;
