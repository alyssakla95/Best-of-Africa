import React from 'react';
import { renderToString } from 'react-dom/server';
import { Sidebar } from '../src/components/Sidebar';
import { StaticRouter } from 'react-router-dom/server';

// Mock language context
jest.mock('../src/context/LanguageContext', () => ({
    useLanguage: () => ({ t: (key, fallback) => fallback })
}));

const html = renderToString(
    <StaticRouter>
        <Sidebar />
    </StaticRouter>
);

console.log(html);
