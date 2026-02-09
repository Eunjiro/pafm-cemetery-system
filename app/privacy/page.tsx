export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-4">Last updated: February 9, 2026</p>
            
            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Information We Collect</h2>
              <p className="text-gray-700 mb-3">
                We collect information that you provide directly to us when registering for services, 
                including your name, email address, phone number, and other personal information 
                necessary for municipal service delivery.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">How We Use Your Information</h2>
              <p className="text-gray-700 mb-3">
                Your information is used to process service requests, communicate updates, 
                and improve our municipal services. We do not sell or share your personal 
                information with third parties except as required by law.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Data Security</h2>
              <p className="text-gray-700 mb-3">
                We implement appropriate security measures to protect your personal information 
                from unauthorized access, alteration, disclosure, or destruction.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Contact Us</h2>
              <p className="text-gray-700">
                If you have questions about this Privacy Policy, please contact us at 
                info@goserveph.gov or call (02) 8888-0000.
              </p>
            </section>
          </div>

          <div className="mt-8">
            <a href="/services" className="text-green-600 hover:text-green-700 font-semibold">
              ← Back to Services
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
