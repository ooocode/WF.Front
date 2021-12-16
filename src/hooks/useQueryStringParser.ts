import { useLocation } from '@reach/router';
import { useRef } from 'react';
export const useQueryStringParser = () => {
    const location = useLocation();
    return new URLSearchParams(location.search);
}