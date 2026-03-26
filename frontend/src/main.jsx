import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GedeonOnboarding } from './GedeonOnboarding'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GedeonOnboarding />
  </StrictMode>
)
