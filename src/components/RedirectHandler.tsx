import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const RedirectHandler = () => {
  const { shouldRedirectToBook, clearRedirectFlag } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (shouldRedirectToBook) {
      // Clear flag immediately and navigate without delay
      clearRedirectFlag();
      navigate('/book', { replace: true }); // Use replace to prevent back button issues
    }
  }, [shouldRedirectToBook, clearRedirectFlag, navigate]);

  return null; // This component doesn't render anything
};

export default RedirectHandler;
