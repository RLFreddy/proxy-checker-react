import axios from 'axios';
import { useEffect, useState } from 'react';

export default function useFooter() {
    
    const [ author, setAuthor ] = useState('loading...');

    useEffect(() => {
        axios.get(import.meta.env.VITE_BACKEND_PROXY_CHECKER_AUTHOR)
        .then(({ data }) => setTimeout(() => setAuthor(data.author), 500))
        .catch(err => {
            console.warn(err.message);
            setAuthor('unhandled error');
        });
    }, [ ])

    const capitalizeFirstLetter = (string: string) => string.charAt(0).toUpperCase() + string.slice(1);

    return (
        <div className="
        flex justify-center w-full
        mt-32 mb-8 py-4
        text-black dark:text-white
        border-2 border-black dark:border-white rounded
        ">
            <h1>Power by <b>{ capitalizeFirstLetter(author) }</b></h1>
        </div>
    );
};