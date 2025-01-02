import { useSnackbar } from 'notistack';

export const useNotification = () => {
  const { enqueueSnackbar } = useSnackbar();

  const showNotification = (message, options = {}) => {
    enqueueSnackbar(message, {
      variant: 'info',
      autoHideDuration: 3000,
      ...options,
    });
  };

  const showSuccess = (message) => {
    showNotification(message, { variant: 'success' });
  };

  const showError = (message) => {
    showNotification(message, { variant: 'error' });
  };

  const showWarning = (message) => {
    showNotification(message, { variant: 'warning' });
  };

  const showInfo = (message) => {
    showNotification(message, { variant: 'info' });
  };

  return {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}; 