export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-4">Last updated: February 9, 2026</p>
            
            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Acceptance of Terms</h2>
              <p className="text-gray-700 mb-3">
                By accessing and using the GoServePH municipal services platform, you accept 
                and agree to be bound by the terms and provisions of this agreement.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">User Responsibilities</h2>
              <p className="text-gray-700 mb-3">
                Users are responsible for maintaining the confidentiality of their account 
                credentials and for all activities that occur under their account. You must 
                provide accurate and complete information when submitting service requests.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Service Availability</h2>
              <p className="text-gray-700 mb-3">
                We strive to provide uninterrupted access to our services but do not guarantee 
                that services will be available at all times. Scheduled maintenance and updates 
                may temporarily affect service availability.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Limitation of Liability</h2>
              <p className="text-gray-700 mb-3">
                The municipality shall not be liable for any indirect, incidental, special, 
                consequential, or punitive damages resulting from your use or inability to 
                use the service.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Contact Information</h2>
              <p className="text-gray-700">
                For questions regarding these Terms of Service, please contact us at 
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
