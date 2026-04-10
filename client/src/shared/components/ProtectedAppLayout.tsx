import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../app/context/AuthContext';
import { Layout } from './Layout';

export function ProtectedAppLayout() {
    const { isAuthenticated } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/signin" replace state={{ from: location }} />;
    }

    return <Layout />;
}
