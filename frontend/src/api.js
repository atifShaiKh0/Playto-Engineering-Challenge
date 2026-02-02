import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api/',
});

// Add a request interceptor to attach token if we have one (for later auth integration)
// For now, Playto challenge didn't strictly require full Auth flow UI, but backend expects Auth or ReadOnly.
// We will just allow anonymous read, but we need Auth for Posting/Liking.
// Let's assume we might hardcode a token or simple login later. 
// For now, public access.

export default api;
