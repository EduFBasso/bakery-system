import ReactDOM from 'react-dom/client';
import App from './App';
import './global/styles/index.css';
import { installAuthExpiryHandler } from './services/authExpiry';

installAuthExpiryHandler();

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
