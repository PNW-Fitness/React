import { useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './components/common/Navbar'
import Footer from './components/common/Footer'
import Hero from './components/sections/Hero'
import About from './components/sections/About'
import Programs from './components/sections/Programs'
import Coaches from './components/sections/Coaches'
import Pricing from './components/sections/Pricing'
import Testimonials from './components/sections/Testimonials'
import FAQ from './components/sections/FAQ'
import Booking from './components/sections/Booking'
import JoinModal from './components/common/JoinModal'
import TourModal from './components/common/TourModal'
import ClassesPage from './pages/Classes'
import CoachesPage from './pages/CoachesPage'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function HomePage({ onJoinClick, onTourClick }) {
  return (
    <>
      <Hero onJoinClick={onJoinClick} onTourClick={onTourClick} />
      <About />
      <Programs />
      <Coaches />
      <Pricing onJoinClick={onJoinClick} />
      <Testimonials />
      <FAQ />
      <Booking />
    </>
  )
}

export default function App() {
  const [modalOpen, setModalOpen] = useState(false)
  const [tourOpen, setTourOpen] = useState(false)
  const openModal = () => setModalOpen(true)
  const openTour  = () => setTourOpen(true)

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      <ScrollToTop />
      <Navbar onJoinClick={openModal} onTourClick={openTour} />
      <Routes>
        <Route path="/" element={<HomePage onJoinClick={openModal} onTourClick={openTour} />} />
        <Route path="/classes" element={<ClassesPage />} />
        <Route path="/coaches" element={<CoachesPage onJoinClick={openModal} />} />
      </Routes>
      <Footer />
      {modalOpen && <JoinModal onClose={() => setModalOpen(false)} />}
      {tourOpen  && <TourModal onClose={() => setTourOpen(false)} />}
    </div>
  )
}
