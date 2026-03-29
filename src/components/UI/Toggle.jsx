/**
 * Toggle — a clean native toggle switch.
 * Drop-in replacement for PrimeReact InputSwitch.
 *
 * Props:
 *   checked  : boolean
 *   onChange : (newValue: boolean) => void
 *   disabled : boolean (optional)
 *   size     : 'sm' | 'md' (default 'md')
 */
export default function Toggle({ checked, onChange, disabled = false, size = 'md' }) {
    const isSmall = size === 'sm';

    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => !disabled && onChange(!checked)}
            className={[
                'relative inline-flex items-center flex-shrink-0 rounded-full transition-colors duration-200 ease-in-out focus:outline-none',
                isSmall ? 'w-10 h-6' : 'w-12 h-7',
                checked ? 'bg-emerald-600' : 'bg-gray-300',
                disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
            ].join(' ')}
        >
            <span
                className={[
                    'inline-block rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out',
                    isSmall ? 'w-4 h-4' : 'w-5 h-5',
                    checked
                        ? isSmall ? 'translate-x-5' : 'translate-x-6'
                        : 'translate-x-1',
                ].join(' ')}
            />
        </button>
    );
}
