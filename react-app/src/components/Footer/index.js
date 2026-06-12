import React, { useEffect, useState } from 'react';
import './Footer.css';
import {
    fetchSupportState,
    getLocalSupportState,
    normalizeSupportState,
    persistSupportState,
} from '../../utils/neuroSupport';

const comfortOptions = [
    { key: 'calm', label: 'Calm', ariaLabel: 'Calm colors' },
    { key: 'highContrast', label: 'Contrast', ariaLabel: 'Higher contrast' },
    { key: 'reducedMotion', label: 'Motion', ariaLabel: 'Reduced motion' },
    { key: 'darkMode', label: 'Dark', ariaLabel: 'Dark mode' },
];

export default function Footer() {
    const [support, setSupport] = useState(getLocalSupportState);
    const comfort = support.comfort;

    useEffect(() => {
        let isMounted = true;

        fetchSupportState().then((nextSupport) => {
            if (isMounted) setSupport(nextSupport);
        });

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        document.body.classList.toggle('theme-calm', comfort.calm);
        document.body.classList.toggle('theme-contrast', comfort.highContrast);
        document.body.classList.toggle('reduce-motion', comfort.reducedMotion);
        document.body.classList.toggle('theme-dark', comfort.darkMode);
    }, [comfort]);

    const toggleComfort = (key) => {
        setSupport((current) => {
            const nextSupport = normalizeSupportState({
                ...current,
                comfort: {
                    ...current.comfort,
                    [key]: !current.comfort[key],
                },
            });
            persistSupportState(nextSupport);
            return nextSupport;
        });
    };

    return (
        <footer className='footer'>
            <nav aria-label='Sensory-friendly settings' className='footerControls'>
                <span className='footerControlLabel'>Sensory</span>
                <div className='footerToggleGroup'>
                    {comfortOptions.map((option) => (
                        <button
                            aria-label={option.ariaLabel}
                            aria-pressed={comfort[option.key]}
                            className={`footerToggle${comfort[option.key] ? ' footerToggleActive' : ''}`}
                            key={option.key}
                            onClick={() => toggleComfort(option.key)}
                            title={option.ariaLabel}
                            type='button'
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </nav>
            <div className='footerMeta'>
                <div className='footer-text'>
                    Built by: Alexander H. Hertel
                </div>
                <div className='footer-element'>
                    <a className='footerIcon' href='https://www.linkedin.com/in/ahertel2287/'><i className='fab fa-linkedin'></i> LinkedIn</a>
                </div>
                <div className='footer-element'>
                    <a className='footerIcon' href='https://www.github.com/alexhertel87'>
                        <i className='fab fa-github'></i>
                        <span>GitHub</span>
                    </a>
                </div>
            </div>

        </footer>
    )
}
