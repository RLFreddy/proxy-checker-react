import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoon, faSun  } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState } from 'react';

export default function useSwitch({ className }: { className?: string }) {

    //dark mode default
    const [ isDarkMode, setDarkMode  ] = useState<Boolean>(true);
    
    const toogle = () => {
        if(localStorage.getItem('darkMode') === JSON.stringify(true)) {
            setDarkMode(false);
            localStorage.setItem('darkMode', JSON.stringify(false));
            document.documentElement.classList.remove('darkMode');
        } else {
            setDarkMode(true);
            localStorage.setItem('darkMode', JSON.stringify(true));
            document.documentElement.classList.add('darkMode');
        }
    }

    useEffect(() => {
        
        const isDarkModeSet = localStorage.getItem('darkMode');
        if(isDarkModeSet) {
            setDarkMode(JSON.parse(isDarkModeSet));
            if(JSON.parse(isDarkModeSet) === true) {
                document.documentElement.classList.add('darkMode');
            }
        } else {
            //default dark theme
            setDarkMode(true);
            localStorage.setItem('darkMode', JSON.stringify(true));
            document.documentElement.classList.add('darkMode');
        }
        
    }, [ ])

    return (
        <button
        onClick={ toogle }
        className={
            `
            ${className? className: className}
            flex
            rounded-[1000px] cursor-pointer
            ${
                isDarkMode
                ?
                'bg-[black] after:left-[0] after:right-[unset]'
                :
                'bg-[orange] after:left-[unset] after:right-[0]'
            }
            after:[content:''] after:w-[30px] after:h-[30px] after:absolute after:bg-white
            after:top-0 after:rounded-[100px] after:[box-shadow:0px_0px_2px_2px_rgba(0,0,0,.2)]
            `
        }>
            <span className='w-[30px] h-[30px] leading-[30px] text-white'>
                <FontAwesomeIcon icon={faSun}/>
            </span>
            <span className='w-[30px] h-[30px] leading-[30px] text-white'>
                <FontAwesomeIcon icon={faMoon}/>
            </span>
        </button>
    )

};