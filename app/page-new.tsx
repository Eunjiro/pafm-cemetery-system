import Navbar from "./components/Navbar"
import ServiceCard from "./components/ServiceCard"

export default function Home() {
  const services = [
    {
      title: "Cemetery and Burial Management",
      description: "Manage cemetery plots, burial records, and memorial services efficiently.",
      icon: "🪦",
      href: "/services/cemetery"
    },
    {
      title: "Water Supply and Drainage Requests",
      description: "Submit and track water supply connections and drainage system requests.",
      icon: "💧",
      href: "/services/water"
    },
    {
      title: "Assets Inventory Tracker",
      description: "Track and manage municipal assets, equipment, and infrastructure inventory.",
      icon: "📦",
      href: "/services/inventory"
    },
    {
      title: "Parks and Recreation Scheduling",
      description: "Book and schedule public parks, sports facilities, and recreation activities.",
      icon: "🌳",
      href: "/services/parks"
    },
    {
      title: "Facility Management",
      description: "Manage public facilities, maintenance requests, and resource allocation.",
      icon: "🏢",
      href: "/services/facilities"
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <section className="bg-gradient-to-br from-green-600 to-green-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Public Assets & Facilities Management
          </h1>
          <p className="text-xl text-green-100 max-w-3xl mx-auto">
            Streamline your municipal services with our comprehensive management system. 
            Access all essential services in one integrated platform.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Services</h2>
            <p className="text-lg text-gray-600">
              Choose from our range of municipal services designed to serve you better
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <ServiceCard
                key={index}
                title={service.title}
                description={service.description}
                icon={service.icon}
                href={service.href}
              />
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-gray-800 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            © 2026 Public Assets & Facilities Management. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
