import { createRoot } from 'react-dom/client'
import '@fontsource-variable/dm-sans'
import '@fontsource-variable/fraunces'
import './styles.css'
import App from './App'
import { ToastProvider } from './components/Toast'

createRoot(document.getElementById('root')!).render(
  <ToastProvider>
    <App />
  </ToastProvider>,
)
