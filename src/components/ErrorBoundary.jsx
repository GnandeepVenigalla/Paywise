import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Paywise Error Boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 bg-rose-500/20 rounded-3xl flex items-center justify-center mb-6 border border-rose-500/20">
                <span className="text-4xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-black text-white mb-2">Something went wrong</h1>
            <p className="text-slate-400 max-w-xs mb-8">
                The application encountered an unexpected error. Don't worry, your data is safe.
            </p>
            <button 
                onClick={() => window.location.href = '/#/dashboard'}
                className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
            >
                Back to Safety
            </button>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
