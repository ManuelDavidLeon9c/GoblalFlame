import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ViewRoute } from './types';

const pageAttr = document.body.getAttribute('data-page') as ViewRoute | null;
const initialView: ViewRoute =
  pageAttr && ['home', 'catalog', 'detail', 'news', 'profile'].includes(pageAttr)
    ? pageAttr
    : 'home';

createRoot(document.getElementById('root')!).render(<App initialView={initialView} />);
