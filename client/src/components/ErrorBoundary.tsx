import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
    componentName?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        const componentName = this.props.componentName || 'Unknown Component';

        // Detailed logging
        console.group(`🔴 Error Boundary Caught Error in: ${componentName}`);
        console.error('Error:', error);
        console.error('Error Message:', error.message);
        console.error('Error Stack:', error.stack);
        console.error('Component Stack:', errorInfo.componentStack);

        // Check if it's a React error by error code
        if (error.message.includes('Minified React error')) {
            const match = error.message.match(/#(\d+)/);
            if (match) {
                console.error(`⚠️  This is React Error #${match[1]}`);
                console.error(`📖 Visit: https://react.dev/errors/${match[1]}`);
            }
        }

        console.groupEnd();

        this.setState({ errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            const isDev = import.meta.env.DEV;

            return (
                <div className="p-4 bg-red-50 text-red-800 rounded-lg border border-red-200 m-4">
                    <h3 className="font-bold text-sm mb-2">
                        {this.props.componentName ? `Error in ${this.props.componentName}` : 'Editor Error'}
                    </h3>
                    <p className="text-xs font-mono break-all mb-2">{this.state.error?.message}</p>

                    {isDev && this.state.errorInfo && (
                        <details className="text-xs mt-2">
                            <summary className="cursor-pointer font-semibold">Component Stack</summary>
                            <pre className="mt-2 p-2 bg-red-100 rounded overflow-auto max-h-40">
                                {this.state.errorInfo.componentStack}
                            </pre>
                        </details>
                    )}

                    <button
                        className="mt-3 px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-xs font-medium transition"
                        onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                    >
                        Reset Editor
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
