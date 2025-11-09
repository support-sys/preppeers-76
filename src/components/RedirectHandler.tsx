import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const RedirectHandler = () => {
  const { shouldRedirectToBook, shouldRedirectToMain, clearRedirectFlag, clearMainRedirectFlag } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (shouldRedirectToBook) {
      // Clear flag immediately and navigate without delay
      clearRedirectFlag();
      const storedRedirect = sessionStorage.getItem('postAuthRedirect');
      if (storedRedirect) {
        sessionStorage.removeItem('postAuthRedirect');
        navigate(storedRedirect, { replace: true });
      } else {
        navigate('/book', { replace: true }); // Use replace to prevent back button issues
      }
    }
  }, [shouldRedirectToBook, clearRedirectFlag, navigate]);

  useEffect(() => {
    if (shouldRedirectToMain) {
      // Clear flag immediately and navigate without delay
      clearMainRedirectFlag();
      navigate('/become-interviewer', { replace: true }); // Redirect interviewers to become-interviewer page
    }
  }, [shouldRedirectToMain, clearMainRedirectFlag, navigate]);

  return null; // This component doesn't render anything
};

export default RedirectHandler;
