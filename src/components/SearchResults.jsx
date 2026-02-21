import { useLocation } from 'react-router-dom';

export default function SearchResults() {
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const query = params.get('query') || '';

    return (
        <div style={{ paddingTop: '80px', padding: '1rem' }}>
            <h2>Search Results</h2>
            {query ? <p>Showing results for: <strong>{query}</strong></p> : <p>No search query entered.</p>}
        </div>
    );
}