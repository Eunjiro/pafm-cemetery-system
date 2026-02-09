export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Help Center</h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-6">Find answers to common questions about using GoServePH services.</p>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">How do I create an account?</h3>
                  <p className="text-gray-700">
                    Click "Register" on the homepage and fill in the required information. You can also 
                    sign up using your Google account for faster registration.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">How do I submit a death registration?</h3>
                  <p className="text-gray-700">
                    Navigate to Cemetery & Burial services, select "Death Registration," and follow 
                    the step-by-step process. You'll need to upload required documents and provide 
                    information about the deceased.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">How can I track my application status?</h3>
                  <p className="text-gray-700">
                    After logging in, check the notifications bell icon in the top right corner. 
                    You'll see status updates for all your submitted applications.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">What payment methods are accepted?</h3>
                  <p className="text-gray-700">
                    We accept online payments through our payment gateway, as well as over-the-counter 
                    payments at designated municipal offices.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">I forgot my password. What should I do?</h3>
                  <p className="text-gray-700">
                    Click "Forgot Password" on the login page and enter your email address. 
                    You'll receive instructions to reset your password.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-6 bg-green-50 border-l-4 border-green-600 p-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Need More Help?</h2>
              <p className="text-gray-700 mb-3">
                Our support team is here to assist you with any questions or concerns.
              </p>
              <ul className="space-y-2 text-gray-700">
                <li><strong>Email:</strong> info@goserveph.gov</li>
                <li><strong>Phone:</strong> (02) 8888-0000</li>
                <li><strong>Office Hours:</strong> Monday - Friday, 8:00 AM - 5:00 PM</li>
              </ul>
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
