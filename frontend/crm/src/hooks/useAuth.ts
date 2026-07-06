import { useAuth as useCtxAuth } from '../context/AuthContext';

export const useAuth = () => {
  return useCtxAuth();
};
