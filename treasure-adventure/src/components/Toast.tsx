import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  show: boolean;
  onClose: () => void;
  duration?: number;
  type?: 'success' | 'error' | 'info';
}

const Toast: React.FC<ToastProps> = ({ 
  message, 
  show, 
  onClose, 
  duration = 3000,
  type = 'success' 
}) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  if (!show) return null;

  return (
    <div className={`toast toast-${type} ${show ? 'toast-show' : ''}`}>
      <span>{message}</span>
    </div>
  );
};

export default Toast;