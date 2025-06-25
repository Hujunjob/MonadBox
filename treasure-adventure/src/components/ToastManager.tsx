import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from './Toast';

interface ToastData {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info', duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success', duration = 3000) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: ToastData = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 2000 }}>
        {toasts.map((toast, index) => (
          <div 
            key={toast.id} 
            style={{ 
              marginTop: index * 10 + (index > 0 ? 10 : 0)
            }}
          >
            <Toast
              message={toast.message}
              show={true}
              onClose={() => removeToast(toast.id)}
              duration={toast.duration}
              type={toast.type}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};